import type { AuthUser } from "../../middleware/auth";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "INTERN"
  | "CONTRACT"
  | "FREELANCE"
  | "OTHER";

export interface UserExperiencesListQuery {
  page: number;
  size: 10 | 20 | 50; // 공통 규격을 그대로 사용 (없어도 되지만 과제 요건상 유리)
}

export interface ExperienceCreateBody {
  company: string;
  position: string;
  employment_type: EmploymentType;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  description?: string | null;
}

export type ExperiencePatchBody = Partial<ExperienceCreateBody>;

export interface ExperienceResponse {
  id: number;
  company: string;
  position: string;
  employment_type: EmploymentType;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperiencesListResponse {
  content: ExperienceResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: "start_date,DESC";
}

/** Service 입력 타입 */
export interface ListUserExperiencesInput extends UserExperiencesListQuery {
  userUid: string;
}

export interface GetExperienceInput {
  id: number;
}

export interface CreateUserExperienceInput {
  userUid: string;
  body: ExperienceCreateBody;
  requester: AuthUser;
}

export interface PatchExperienceInput {
  id: number;
  body: ExperiencePatchBody;
  requester: AuthUser;
}

export interface DeleteExperienceInput {
  id: number;
  requester: AuthUser;
}
