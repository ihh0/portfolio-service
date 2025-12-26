import request from "supertest";
import app from "../src/app";
import { AppDataSource } from "../src/config/data-source";
import { User } from "../src/entities/User";
import { hashPassword } from "../src/utils/password";

/**
 * Admin Stats 테스트
 * - 미인증, 일반 유저, 관리자 케이스 테스트
 */

describe("Admin Stats", () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const userRepo = AppDataSource.getRepository(User);

    // 1. admin 계정 확인 및 생성
    let admin = await userRepo.findOne({ where: { login_id: "admin", deleted_at: null as any } });
    
    if (!admin) {
      // admin 계정이 없으면 생성 (seed에서 생성되지만 테스트 환경에서는 없을 수 있음)
      const adminUid = `admin-${Date.now()}`;
      admin = userRepo.create({
        uid: adminUid,
        login_id: "admin",
        password_hash: await hashPassword("P@ssw0rd!"),
        display_name: "Admin",
        role: "ROLE_ADMIN",
        is_featured: false,
        is_email_public: true,
        is_phone_public: true,
        deleted_at: null,
      });
      await userRepo.save(admin);
    }

    // admin 로그인
    const adminLoginRes = await request(app).post("/auth/login").send({
      login_id: "admin",
      password: "P@ssw0rd!",
    });

    if (adminLoginRes.status === 200) {
      adminToken = adminLoginRes.body.access_token;
    } else {
      throw new Error("Failed to login as admin");
    }

    // 2. 일반 유저 계정 생성 및 로그인
    const userLoginId = `test_user_${Date.now()}`;
    const registerRes = await request(app).post("/auth/register").send({
      login_id: userLoginId,
      password: "P@ssw0rd!",
      display_name: "Test User",
    });

    if (registerRes.status === 201) {
      userToken = registerRes.body.access_token;
    } else {
      // 이미 존재하면 로그인
      const loginRes = await request(app).post("/auth/login").send({
        login_id: userLoginId,
        password: "P@ssw0rd!",
      });
      if (loginRes.status === 200) {
        userToken = loginRes.body.access_token;
      } else {
        throw new Error("Failed to create/login test user");
      }
    }
  });

  test("GET /admin/stats/overview - 미인증 요청 -> 401", async () => {
    const res = await request(app).get("/admin/stats/overview");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  test("GET /admin/stats/overview - 일반 유저 토큰 -> 403", async () => {
    if (!userToken) {
      // userToken이 없으면 테스트 스킵
      console.warn("User token not available, skipping test");
      return;
    }

    const res = await request(app)
      .get("/admin/stats/overview")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  test("GET /admin/stats/overview - 관리자 토큰 -> 200 및 응답 필드 검증", async () => {
    if (!adminToken) {
      throw new Error("Admin token not available");
    }

    const res = await request(app)
      .get("/admin/stats/overview")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(res.body).toHaveProperty("featured_users");
    expect(res.body).toHaveProperty("projects");
    expect(res.body).toHaveProperty("public_projects");
    expect(res.body).toHaveProperty("experiences");
    expect(res.body).toHaveProperty("skills");
    expect(res.body).toHaveProperty("project_skills");
    expect(res.body).toHaveProperty("project_likes");

    // 모든 필드가 number 타입인지 검증
    expect(typeof res.body.users).toBe("number");
    expect(typeof res.body.featured_users).toBe("number");
    expect(typeof res.body.projects).toBe("number");
    expect(typeof res.body.public_projects).toBe("number");
    expect(typeof res.body.experiences).toBe("number");
    expect(typeof res.body.skills).toBe("number");
    expect(typeof res.body.project_skills).toBe("number");
    expect(typeof res.body.project_likes).toBe("number");

    // 모든 값이 0 이상인지 검증
    expect(res.body.users).toBeGreaterThanOrEqual(0);
    expect(res.body.featured_users).toBeGreaterThanOrEqual(0);
    expect(res.body.projects).toBeGreaterThanOrEqual(0);
    expect(res.body.public_projects).toBeGreaterThanOrEqual(0);
    expect(res.body.experiences).toBeGreaterThanOrEqual(0);
    expect(res.body.skills).toBeGreaterThanOrEqual(0);
    expect(res.body.project_skills).toBeGreaterThanOrEqual(0);
    expect(res.body.project_likes).toBeGreaterThanOrEqual(0);
  });
});

