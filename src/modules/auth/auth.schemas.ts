import { z } from "zod";

/**
 * Auth 요청 DTO(Zod)
 * - 입력 검증은 validate 미들웨어에서 처리한다.
 */

export const registerSchema = z.object({
  // 로그인용 ID(시스템 uid와 분리)
  login_id: z.string().min(3).max(50),

  // 평문은 저장 금지(서비스에서 bcrypt hash로만 저장)
  password: z.string().min(8).max(100),

  // 탐색/프로필에서 보여줄 표시명
  display_name: z.string().min(1).max(50),

  // 개인정보는 optional/nullable로 받되, 응답 정책은 Users 모듈에서 제어
  email: z.string().email().max(120).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

export const loginSchema = z.object({
  login_id: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

/**
 * refresh/logout은 refresh_token을 body로 받음
 * - 간단한 클라이언트 호출을 위한 형태다.
 */
export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const logoutSchema = z.object({
  refresh_token: z.string().min(1),
});
