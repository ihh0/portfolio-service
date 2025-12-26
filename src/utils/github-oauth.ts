import { ApiError } from "../middleware/error";

/**
 * GitHub OAuth (Authorization Code)
 * - authorize URL 생성, 토큰 교환, 프로필/이메일 조회를 제공한다.
 */

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new ApiError({
      status: 500,
      code: "MISSING_ENV",
      message: `Missing env: ${name}`,
    });
  }
  return v;
}

const CLIENT_ID = () => mustGetEnv("GITHUB_CLIENT_ID");
const CLIENT_SECRET = () => mustGetEnv("GITHUB_CLIENT_SECRET");
const REDIRECT_URI = () => mustGetEnv("GITHUB_REDIRECT_URI");

export function buildGithubAuthorizeUrl(args: { state: string }) {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", CLIENT_ID());
  u.searchParams.set("redirect_uri", REDIRECT_URI());
  u.searchParams.set("state", args.state);

  // email을 안정적으로 받으려면 user:email scope 필요
  u.searchParams.set("scope", "read:user user:email");
  return u.toString();
}

export async function exchangeGithubCodeForToken(code: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID(),
      client_secret: CLIENT_SECRET(),
      code,
      redirect_uri: REDIRECT_URI(),
    }),
  });

  if (!res.ok) {
    throw new ApiError({ status: 502, code: "BAD_GATEWAY", message: "GitHub token exchange failed" });
  }

  const json = (await res.json()) as any;
  if (!json.access_token) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "GitHub token not issued" });
  }

  return String(json.access_token);
}

export async function fetchGithubUserProfile(accessToken: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-service",
    },
  });

  if (!res.ok) {
    throw new ApiError({ status: 502, code: "BAD_GATEWAY", message: "GitHub profile fetch failed" });
  }

  const u = (await res.json()) as any;
  return {
    id: String(u.id),
    login: String(u.login),
    name: (u.name ? String(u.name) : null) as string | null,
  };
}

export async function fetchGithubPrimaryEmail(accessToken: string) {
  // 공개 email이 없을 수 있어 /user/emails에서 primary/verified를 찾는다.
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-service",
    },
  });

  if (!res.ok) return null;

  const list = (await res.json()) as Array<any>;
  const primary = list.find((e) => e.primary && e.verified);
  return primary?.email ? String(primary.email) : null;
}
