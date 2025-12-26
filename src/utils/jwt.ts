import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { ApiError } from "../middleware/error";

type Role = "ROLE_USER" | "ROLE_ADMIN";

export interface AccessTokenPayload {
  uid: string;
  role: Role;
  typ: "access";
}

export interface RefreshTokenPayload {
  uid: string;
  role: Role;
  jti: string;
  typ: "refresh";
}

function mustGetEnv(name: string): string {
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

const ACCESS_SECRET = () => mustGetEnv("JWT_ACCESS_SECRET");
const REFRESH_SECRET = () => mustGetEnv("JWT_REFRESH_SECRET");

export function signAccessToken(payload: Omit<AccessTokenPayload, "typ">, expiresIn: string) {
  return jwt.sign({ ...payload, typ: "access" }, ACCESS_SECRET(), { expiresIn } as SignOptions);
}

export function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "typ">,
  expiresIn: string
) {
  return jwt.sign({ ...payload, typ: "refresh" }, REFRESH_SECRET(), { expiresIn } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET()) as JwtPayload;

    // 최소 필드 검증
    if (decoded.typ !== "access" || typeof decoded.uid !== "string" || typeof decoded.role !== "string") {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid token" });
    }

    return {
      uid: decoded.uid,
      role: decoded.role as any,
      typ: "access",
    };
  } catch (e: any) {
    // 만료/위조 처리
    if (e?.name === "TokenExpiredError") {
      throw new ApiError({ status: 401, code: "TOKEN_EXPIRED", message: "Access token expired" });
    }
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid access token" });
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET()) as JwtPayload;

    if (
      decoded.typ !== "refresh" ||
      typeof decoded.uid !== "string" ||
      typeof decoded.role !== "string" ||
      typeof decoded.jti !== "string"
    ) {
      throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid token" });
    }

    return {
      uid: decoded.uid,
      role: decoded.role as any,
      jti: decoded.jti,
      typ: "refresh",
    };
  } catch (e: any) {
    if (e?.name === "TokenExpiredError") {
      throw new ApiError({ status: 401, code: "TOKEN_EXPIRED", message: "Refresh token expired" });
    }
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Invalid refresh token" });
  }
}
