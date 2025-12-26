import type { NextFunction, Request, Response } from "express";

// 로그 레벨(환경변수로 제어)
const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase();

function shouldLog(level: "debug" | "info" | "warn" | "error") {
  const order = { debug: 10, info: 20, warn: 30, error: 40 } as const;
  const current = (order as any)[LOG_LEVEL] ?? order.info;
  return order[level] >= current;
}

/**
 * requestLogger
 * - 요청 로그는 비활성화한다.
 */
export function requestLogger(_req: Request, _res: Response, next: NextFunction) {
  next();
}

/**
 * errorLogger
 * - 에러 스택과 요청 정보를 로그로 남긴다.
 */
export function errorLogger(req: Request, err: unknown) {
  if (!shouldLog("error")) return;

  const e = err as any;

  const base = {
    msg: "http_error",
    method: req.method,
    path: req.originalUrl,
    user_uid: (req as any).auth?.uid,
    // err 정보
    name: e?.name,
    message: e?.message,
    stack: typeof e?.stack === "string" ? e.stack : undefined,
  };

  // eslint-disable-next-line no-console
  console.error(JSON.stringify(base));
}
