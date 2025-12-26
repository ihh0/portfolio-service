import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { errorLogger } from "./logger";

/**
 * ApiError
 * - 서비스/컨트롤러에서 의도적으로 던지는 에러
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(args: { status: number; code: string; message: string; details?: any }) {
    super(args.message);
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
  }
}

/**
 * asyncHandler
 * - async 컨트롤러 에러를 next로 전달한다.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * notFoundHandler
 */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Route not found" }));
}

/**
 * errorHandler
 * - 에러 로그를 남기고 표준 포맷으로 응답한다.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // 1) 서버 로그(스택 포함) — 민감정보는 남기지 않도록 logger.ts에서 제한
  errorLogger(req, err);

  // 2) Zod validation
  if (err instanceof ZodError) {
    return res.status(422).json({
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      status: 422,
      code: "VALIDATION_FAILED",
      message: "Validation failed",
      details: formatZodDetails(err),
    });
  }

  // 3) ApiError
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details ?? undefined,
    });
  }

  // 4) Fallback
  return res.status(500).json({
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
}

function formatZodDetails(e: ZodError) {
  // field별 메시지를 details로 매핑
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = issue.path.join(".") || "_";
    out[key] = issue.message;
  }
  return out;
}
