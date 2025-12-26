import { ApiError } from "../middleware/error";

/**
 * 페이지 번호 파싱 (0부터 시작)
 */
export function parsePage(v: unknown): number {
  const n = Number(v ?? 0);
  if (!Number.isInteger(n) || n < 0) {
    throw new ApiError({ status: 400, code: "INVALID_PAGE", message: "Invalid page" });
  }
  return n;
}

/**
 * 페이지 크기 파싱 (10, 20, 50만 허용)
 */
export function parseSize(v: unknown): 10 | 20 | 50 {
  const n = Number(v ?? 10);
  if (n === 10 || n === 20 || n === 50) return n;
  throw new ApiError({ status: 400, code: "INVALID_SIZE", message: "Invalid size" });
}

/**
 * 정렬 방식 파싱 (popular 또는 latest)
 */
export function parseSort(v: unknown): "popular" | "latest" {
  const s = String(v ?? "popular");
  if (s === "popular" || s === "latest") return s;
  throw new ApiError({ status: 400, code: "INVALID_SORT", message: "Invalid sort" });
}
  
