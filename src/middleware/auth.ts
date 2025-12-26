import { NextFunction, Request, Response } from "express";
import { ApiError } from "./error";
import { verifyAccessToken } from "../utils/jwt";

/**
 * AuthUser
 * - req.auth에 주입되는 인증 사용자 정보
 */
export interface AuthUser {
  uid: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

/**
 * optionalAuth
 * - 토큰이 있으면 검증 후 req.auth에 주입한다.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header) return next();

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid Authorization header" });
  }

  const payload = verifyAccessToken(token);
  req.auth = { uid: payload.uid, role: payload.role };
  return next();
}

/**
 * requireAuth
 * - access token을 필수로 요구한다.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Missing access token" });
  }

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid Authorization header" });
  }

  const payload = verifyAccessToken(token);
  req.auth = { uid: payload.uid, role: payload.role };
  return next();
}

/**
 * requireAdmin
 * - admin-only endpoint에서 사용한다.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Missing access token" });
  }
  if (req.auth.role !== "ROLE_ADMIN") {
    throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Admin only" });
  }
  return next();
}
