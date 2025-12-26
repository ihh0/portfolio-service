import request from "supertest";
import app from "../src/app"; // app는 default export를 권장

describe("Users", () => {
  test("GET /users 200", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.content)).toBe(true);
  });

  test("PATCH /users/:uid unauthorized 401", async () => {
    const res = await request(app).patch("/users/someuid").send({ display_name: "X" });
    expect(res.status).toBe(401);
  });
});