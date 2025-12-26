import { createClient } from "redis";

/**
 * Redis는 refresh session/jti 저장에 사용
 */
export const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redis.on("error", (err) => {
  // 민감정보 제외: err 객체 그대로 로그는 상황에 따라 조정
  // eslint-disable-next-line no-console
  console.error("[redis] error", err);
});

redis.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log("[redis] connected");
});

export async function connectRedis() {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[redis] connection failed", error);
    process.exit(1);
  }
}

export async function initRedis() {
  return connectRedis();
}
