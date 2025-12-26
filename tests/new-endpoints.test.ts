import request from "supertest";
import app from "../src/app";

/**
 * 새로운 엔드포인트 테스트
 * - DELETE /projects/:id
 * - GET /users/:uid/projects
 * - DELETE /users/:uid
 */

describe("New Endpoints", () => {
  let accessToken: string;
  let userUid: string;
  let projectId: number;

  beforeAll(async () => {
    // 테스트용 사용자 생성 및 로그인
    const registerRes = await request(app).post("/auth/register").send({
      login_id: `test_user_${Date.now()}`,
      password: "P@ssw0rd!",
      display_name: "Test User",
      email: `test_${Date.now()}@example.com`,
    });

    expect(registerRes.status).toBe(201);
    accessToken = registerRes.body.access_token;
    userUid = registerRes.body.user.uid;

    // 테스트용 프로젝트 생성
    const projectRes = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Test Project",
        summary: "Test summary",
        is_public: true,
      });

    expect(projectRes.status).toBe(201);
    projectId = projectRes.body.id;
  });

  describe("DELETE /projects/:id", () => {
    test("401 - 인증 없음", async () => {
      const res = await request(app).delete(`/projects/${projectId}`);
      expect(res.status).toBe(401);
    });

    test("204 - 소유자가 삭제", async () => {
      const res = await request(app)
        .delete(`/projects/${projectId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(204);
    });

    test("204 - 이미 삭제된 프로젝트 (멱등)", async () => {
      const res = await request(app)
        .delete(`/projects/${projectId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(204);
    });

    test("403 - 타인의 프로젝트 삭제 시도", async () => {
      // 다른 사용자 생성
      const otherUserRes = await request(app).post("/auth/register").send({
        login_id: `test_user_other_${Date.now()}`,
        password: "P@ssw0rd!",
        display_name: "Other User",
        email: `other_${Date.now()}@example.com`,
      });

      const otherAccessToken = otherUserRes.body.access_token;

      // 다른 사용자의 프로젝트 생성
      const otherProjectRes = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${otherAccessToken}`)
        .send({
          title: "Other Project",
          summary: "Other summary",
          is_public: true,
        });

      const otherProjectId = otherProjectRes.body.id;

      // 첫 번째 사용자로 다른 사용자의 프로젝트 삭제 시도
      const res = await request(app)
        .delete(`/projects/${otherProjectId}`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /users/:uid/projects", () => {
    test("공개 사용자로 호출 시 비공개 project 제외됨", async () => {
      // 비공개 프로젝트 생성
      const privateProjectRes = await request(app)
        .post("/projects")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Private Project",
          summary: "Private summary",
          is_public: false,
        });

      expect(privateProjectRes.status).toBe(201);

      // 인증 없이 조회 (공개 사용자)
      const res = await request(app).get(`/users/${userUid}/projects`);
      expect(res.status).toBe(200);
      expect(res.body.content).toBeDefined();

      // 비공개 프로젝트가 포함되지 않아야 함
      const privateProjectIds = res.body.content
        .filter((p: any) => !p.is_public)
        .map((p: any) => p.id);
      expect(privateProjectIds).not.toContain(privateProjectRes.body.id);
    });

    test("본인 토큰으로 호출 시 비공개 project 포함됨", async () => {
      // 본인 토큰으로 조회
      const res = await request(app)
        .get(`/users/${userUid}/projects`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.content).toBeDefined();

      // 비공개 프로젝트도 포함되어야 함
      const hasPrivateProject = res.body.content.some((p: any) => !p.is_public);
      expect(hasPrivateProject).toBe(true);
    });
  });

  describe("DELETE /users/:uid", () => {
    // 새로운 테스트 사용자 생성
    let testUserToken: string;
    let testUserUid: string;

    beforeEach(async () => {
      const registerRes = await request(app).post("/auth/register").send({
        login_id: `test_delete_user_${Date.now()}`,
        password: "P@ssw0rd!",
        display_name: "Delete Test User",
        email: `delete_test_${Date.now()}@example.com`,
      });

      expect(registerRes.status).toBe(201);
      testUserToken = registerRes.body.access_token;
      testUserUid = registerRes.body.user.uid;
    });

    test("204 - 본인이 삭제", async () => {
      const res = await request(app)
        .delete(`/users/${testUserUid}`)
        .set("Authorization", `Bearer ${testUserToken}`);
      expect(res.status).toBe(204);
    });

    test("204 - 이미 삭제된 사용자 (멱등)", async () => {
      // 이미 삭제된 사용자 다시 삭제 시도
      const res = await request(app)
        .delete(`/users/${testUserUid}`)
        .set("Authorization", `Bearer ${testUserToken}`);
      expect(res.status).toBe(204);
    });

    test("403 - 타인의 계정 삭제 시도", async () => {
      // 다른 사용자 생성
      const otherUserRes = await request(app).post("/auth/register").send({
        login_id: `test_other_user_${Date.now()}`,
        password: "P@ssw0rd!",
        display_name: "Other User",
        email: `other_${Date.now()}@example.com`,
      });

      const otherUserUid = otherUserRes.body.user.uid;

      // 첫 번째 사용자로 다른 사용자 계정 삭제 시도
      const res = await request(app)
        .delete(`/users/${otherUserUid}`)
        .set("Authorization", `Bearer ${testUserToken}`);
      expect(res.status).toBe(403);
    });
  });
});

