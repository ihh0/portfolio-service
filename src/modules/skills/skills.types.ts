import type { AuthUser } from "../../middleware/auth";

export interface SkillsListQuery {
  keyword?: string;
}

export interface SkillCreateBody {
  name: string;
}

export interface SkillPatchBody {
  name?: string;
}

export interface SkillSummary {
  id: number;
  name: string;
}

/**
 * GET /skills 응답
 * - pagination 없이 content 전체 반환(상한은 service에서 제어)
 */
export interface SkillsListResponse {
  content: SkillSummary[];
  sort: "name,ASC";
  limit: number; // 안전장치 상한(예: 1000)
}

// Service 입력 타입
export interface ListSkillsInput extends SkillsListQuery {}

export interface CreateSkillInput {
  name: string;
  requester: AuthUser;
}

export interface PatchSkillInput {
  id: number;
  name?: string;
  requester: AuthUser;
}

export interface DeleteSkillInput {
  id: number;
  requester: AuthUser;
}