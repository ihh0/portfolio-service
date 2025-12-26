import request from "supertest";
import app from "../src/app"; // app는 default export를 권장

/**
 * Auth 테스트
 * - 성공/실패 모두 포함
 */

describe("Auth", () => {
  const loginId = `user_test_${Date.now()}`;

  test("register 201", async () => {
    const res = await request(app).post("/auth/register").send({
      login_id: loginId,
      password: "P@ssw0rd!",
      display_name: "User Test",
      email: "user_test_1@example.com",
    });
    expect(res.status).toBe(201);
    expect(res.body.access_token).toBeTruthy();
    expect(res.body.refresh_token).toBeTruthy();
  });

  test("register duplicate 409", async () => {
    const res = await request(app).post("/auth/register").send({
      login_id: loginId,
      password: "P@ssw0rd!",
      display_name: "User Test",
    });
    expect(res.status).toBe(409);
  });

  test("login 200", async () => {
    const res = await request(app).post("/auth/login").send({
      login_id: loginId,
      password: "P@ssw0rd!",
    });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeTruthy();
  });

  test("login invalid 401", async () => {
    const res = await request(app).post("/auth/login").send({
      login_id: loginId,
      password: "WRONGPASS",
    });
    expect(res.status).toBe(401);
  });

  test("refresh 200", async () => {
    const login = await request(app).post("/auth/login").send({
      login_id: loginId,
      password: "P@ssw0rd!",
    });

    const res = await request(app).post("/auth/refresh").send({
      refresh_token: login.body.refresh_token,
    });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeTruthy();
  });

  test("refresh invalid 401", async () => {
    const res = await request(app).post("/auth/refresh").send({
      refresh_token: "invalid.token.here",
    });
    expect(res.status).toBe(401);
  });
});
