import { ApiError } from "../middleware/error";

/**
 * 필수 환경변수 누락 시, 서버가 즉시 실패하도록 강제합니다.
 * (배포/테스트에서 “조용히 잘못된 설정으로 뜨는 것”을 방지)
 */
function required(name: string): string {
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

/**
 * env 객체는 애플리케이션 전역에서 참조하는 설정 모음입니다.
 * - 문자열/숫자 캐스팅을 여기서 통일하여, 나머지 코드가 단순해집니다.
 */
export const env = {
  app: {
    port: Number(process.env.PORT ?? 8080),
  },

  db: {
    url: required("DATABASE_URL"),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret",
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as string,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "14d") as string,
  },

  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },
};
