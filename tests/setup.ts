import "reflect-metadata";
import { AppDataSource } from "../src/config/data-source";
import { initRedis, redis } from "../src/config/redis";

/**
 * 테스트 전역 setup
 * - DB/Redis 연결
 */

beforeAll(async () => {
  await AppDataSource.initialize();
  await resetDatabase();
  // Redis 초기화 (테스트 중 중복 connect 방지를 위해 플래그 사용)
  if (!(global as any).__redis_inited) {
    try {
      await initRedis();
    } finally {
      (global as any).__redis_inited = true;
    }
  }
});

afterAll(async () => {
  try {
    await resetDatabase();
  } catch (e) {
    // DB가 이미 종료되었거나 연결되지 않은 경우 무시
  }
  try {
    if (redis.isOpen) await redis.quit();
  } catch (e) {
    // Redis가 이미 종료되었거나 연결되지 않은 경우 무시
  }
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
});

async function resetDatabase() {
  if (!AppDataSource.isInitialized) return;

  await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 0");
  await AppDataSource.query("TRUNCATE TABLE project_like");
  await AppDataSource.query("TRUNCATE TABLE project_skill");
  await AppDataSource.query("TRUNCATE TABLE project");
  await AppDataSource.query("TRUNCATE TABLE experience");
  await AppDataSource.query("TRUNCATE TABLE auth_identity");
  await AppDataSource.query("TRUNCATE TABLE skill");
  await AppDataSource.query("TRUNCATE TABLE `user`");
  await AppDataSource.query("SET FOREIGN_KEY_CHECKS = 1");
}
