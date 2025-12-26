import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

import { AppDataSource } from "../../config/data-source";
import { redis } from "../../config/redis";
import { ApiError } from "../../middleware/error";

import { User } from "../../entities/User";
import { AuthIdentity } from "../../entities/AuthIdentity";

import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  buildGithubAuthorizeUrl,
  exchangeGithubCodeForToken,
  fetchGithubPrimaryEmail,
  fetchGithubUserProfile,
} from "../../utils/github-oauth";
import { verifyFirebaseIdToken } from "../../config/firebase-admin";

type Role = "ROLE_USER" | "ROLE_ADMIN";

const ACCESS_EXPIRES_IN = () => process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_IN = () => process.env.JWT_REFRESH_EXPIRES_IN ?? "14d";

export class AuthService {
  // ===== 로컬 register/login/refresh/logout =====

  /**
   * 로컬 회원가입
   */
  async registerLocal(body: {
    login_id: string;
    password: string;
    display_name: string;
    email?: string;
    phone?: string;
  }) {
    const userRepo = AppDataSource.getRepository(User);

    // login_id 중복 체크
    const existing = await userRepo.findOne({ where: { login_id: body.login_id } as any });
    if (existing) {
      throw new ApiError({ status: 409, code: "CONFLICT", message: "login_id already exists" });
    }

    const uid = randomUUID();
    const password_hash = await hashPassword(body.password);

    const user = userRepo.create({
      uid,
      login_id: body.login_id,
      password_hash,
      display_name: body.display_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      is_email_public: true,
      is_phone_public: true,
      is_featured: false,
      role: "ROLE_USER" as Role,
    });

    const saved = await userRepo.save(user);
    return this.issueTokens(saved);
  }

  /**
   * 로컬 로그인
   */
  async loginLocal(body: { login_id: string; password: string }) {
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({
      where: { login_id: body.login_id, deleted_at: null as any },
    });

    if (!user) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid credentials" });
    }

    const valid = await verifyPassword(body.password, user.password_hash);
    if (!valid) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid credentials" });
    }

    return this.issueTokens(user);
  }

  /**
   * 토큰 갱신
   */
  async refreshTokens(refresh_token: string) {
    const payload = verifyRefreshToken(refresh_token);
    const jti = String(payload.jti ?? "");

    // Redis에서 jti 확인
    const storedUid = await redis.get(`refresh:${jti}`);
    if (!storedUid || storedUid !== payload.uid) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid refresh token" });
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { uid: payload.uid, deleted_at: null as any } });

    if (!user) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "User not found" });
    }

    // 기존 jti 삭제하고 새 토큰 발급
    await redis.del(`refresh:${jti}`);
    return this.issueTokens(user);
  }

  /**
   * 로그아웃
   */
  async logout(input: { uid: string; role: Role }, refresh_token?: string) {
    // (권장) refresh_token을 body로 받아 해당 jti를 폐기한다.
    if (!refresh_token) {
      return { ok: true };
    }

    const payload = verifyRefreshToken(refresh_token);
    const jti = String((payload as any).jti ?? "");
    const uid = String((payload as any).uid ?? "");

    // 다른 사용자 refresh_token으로 로그아웃 호출 방지
    if (!jti || uid !== input.uid) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid refresh token" });
    }

    await redis.del(`refresh:${jti}`);
    return { ok: true };
  }

  /**
   * GitHub OAuth start
   * - state를 Redis에 저장(콜백 위조 방지)
   */
  async githubOauthStart(provider: string) {
    if (provider !== "github") {
      throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "Unsupported provider" });
    }

    const state = randomUUID();

    // 10분 TTL
    await redis.set(`oauth_state:github:${state}`, "1", { EX: 600 });

    const url = buildGithubAuthorizeUrl({ state });
    return { provider: "github", url };
  }

  /**
   * GitHub OAuth callback
   */
  async githubOauthCallback(args: { code: string; state: string }) {
    const provider = "github";

    if (!args.code) {
      throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "Missing code" });
    }

    if (!args.state) {
      throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "Missing state" });
    }

    const stateKey = `oauth_state:${provider}:${args.state}`;
    const ok = await redis.get(stateKey);
    if (!ok) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid state" });
    }
    await redis.del(stateKey);

    const accessToken = await exchangeGithubCodeForToken(args.code);
    const profile = await fetchGithubUserProfile(accessToken);
    const email = await fetchGithubPrimaryEmail(accessToken);

    // GitHub identity upsert → user 연결
    const identityRepo = AppDataSource.getRepository(AuthIdentity);
    const userRepo = AppDataSource.getRepository(User);

    const provider_user_id = profile.id;

    const existingIdentity = await identityRepo.findOne({
      where: { provider, provider_user_id } as any,
    });

    let user: User | null = null;

    if (existingIdentity) {
      user = await userRepo.findOne({ where: { uid: existingIdentity.user_uid, deleted_at: null as any } });
      if (!user) {
        // 매핑은 있는데 user가 없으면 상태 불일치
        throw new ApiError({ status: 409, code: "STATE_CONFLICT", message: "Identity mapping broken" });
      }
    } else {
      // 신규 유저 생성
      const loginIdBase = `gh_${profile.login}`;
      const login_id = await this.allocateUniqueLoginId(loginIdBase);

      const u = userRepo.create({
        uid: randomUUID(),
        login_id,
        // 소셜 계정은 로컬 비밀번호 미사용. 하지만 컬럼이 필수이므로 랜덤 해시로 채움.
        password_hash: await bcrypt.hash(randomUUID(), 10),
        display_name: profile.name ?? profile.login,
        email: email,
        phone: null,
        is_email_public: true,
        is_phone_public: true,
        is_featured: false,
        role: "ROLE_USER" as Role,
      });

      user = await userRepo.save(u);

      const ident = identityRepo.create({
        id: randomUUID(),
        provider: "github",
        provider_user_id,
        user_uid: user.uid,
        email: email,
        username: profile.login,
      });

      await identityRepo.save(ident);
    }

    return this.issueTokens(user);
  }

  /**
   * Firebase login
   * - 클라이언트가 받은 idToken을 서버가 검증
   */
  async firebaseLogin(idToken: string) {
    const decoded = await verifyFirebaseIdToken(idToken);

    const identityRepo = AppDataSource.getRepository(AuthIdentity);
    const userRepo = AppDataSource.getRepository(User);

    const provider_user_id = decoded.firebase_uid;

    const existingIdentity = await identityRepo.findOne({
      where: { provider: "firebase", provider_user_id } as any,
    });

    let user: User | null = null;

    if (existingIdentity) {
      user = await userRepo.findOne({ where: { uid: existingIdentity.user_uid, deleted_at: null as any } });
      if (!user) {
        throw new ApiError({ status: 409, code: "STATE_CONFLICT", message: "Identity mapping broken" });
      }
    } else {
      const loginIdBase = decoded.email ? `g_${decoded.email.split("@")[0]}` : `fb_${provider_user_id.slice(0, 8)}`;
      const login_id = await this.allocateUniqueLoginId(loginIdBase);

      const u = userRepo.create({
        uid: randomUUID(),
        login_id,
        password_hash: await bcrypt.hash(randomUUID(), 10),
        display_name: decoded.name ?? login_id,
        email: decoded.email,
        phone: null,
        is_email_public: true,
        is_phone_public: true,
        is_featured: false,
        role: "ROLE_USER" as Role,
      });

      user = await userRepo.save(u);

      const ident = identityRepo.create({
        id: randomUUID(),
        provider: "firebase",
        provider_user_id,
        user_uid: user.uid,
        email: decoded.email,
        username: null,
      });

      await identityRepo.save(ident);
    }

    return this.issueTokens(user);
  }

  // ===== 기존 refresh/logout/issueTokens는 그대로 사용 가능 =====

  private async issueTokens(u: User) {
    const access_token = signAccessToken({ uid: u.uid, role: u.role as any }, ACCESS_EXPIRES_IN());

    const jti = randomUUID();
    const refresh_token = signRefreshToken({ uid: u.uid, role: u.role as any, jti }, REFRESH_EXPIRES_IN());

    const refreshTtlSeconds = parseDurationToSeconds(REFRESH_EXPIRES_IN());
    await redis.set(`refresh:${jti}`, u.uid, { EX: refreshTtlSeconds });

    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_EXPIRES_IN(),
      user: {
        uid: u.uid,
        login_id: u.login_id,
        display_name: u.display_name,
        is_featured: u.is_featured,
      },
    };
  }

  /**
   * login_id 충돌 방지
   * - base가 이미 있으면 suffix를 붙인다.
   */
  private async allocateUniqueLoginId(base: string) {
    const repo = AppDataSource.getRepository(User);

    // base 정규화(허용 문자만)
    const normalized = base.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40);

    let candidate = normalized;
    for (let i = 0; i < 50; i++) {
      const exists = await repo.findOne({ where: { login_id: candidate } as any });
      if (!exists) return candidate;
      candidate = `${normalized}_${i + 1}`;
      if (candidate.length > 50) candidate = candidate.slice(0, 50);
    }

    throw new ApiError({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Cannot allocate login_id" });
  }
}

function parseDurationToSeconds(v: string): number {
  const m = /^([0-9]+)([smhd])$/.exec(v);
  if (!m) return 14 * 24 * 60 * 60;

  const n = Number(m[1]);
  const unit = m[2];

  if (unit === "s") return n;
  if (unit === "m") return n * 60;
  if (unit === "h") return n * 60 * 60;
  return n * 24 * 60 * 60;
}
