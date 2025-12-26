import type { AuthUser } from "../../middleware/auth";

export type UsersListSort = "created_at,DESC";

export interface UsersListQuery {
  page: number;
  size: number;
  keyword?: string;
}

/**
 * PATCH /users/:uid 요청
 * - 개인정보 공개 설정: email/phone만
 */
export interface UserPatchBody {
  display_name?: string;
  is_email_public?: boolean;
  is_phone_public?: boolean;
}

export interface UserFeaturedBody {
  is_featured: boolean;
}

/**
 * 사용자 요약 응답
 * - email/phone은 정책에 따라 포함될 수 있으나, 비공개면 필드 자체 제거
 */
export interface UserSummary {
  uid: string;
  login_id: string;
  display_name: string;
  is_featured: boolean;
  email?: string;
  phone?: string;
}

/**
 * 사용자 상세 응답
 * - privacy는 owner/admin에게만 제공(권장)
 */
export interface UserDetail extends UserSummary {
  created_at: string;
  updated_at: string;
  privacy?: {
    is_email_public: boolean;
    is_phone_public: boolean;
  };
}

export interface UsersListResponse {
  content: UserSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: UsersListSort;
}

// Service 입력 타입
export interface ListUsersInput extends UsersListQuery {
  requester?: AuthUser;
}

export interface GetUserProfileInput {
  uid: string;
  requester?: AuthUser;
}

export interface PatchUserInput {
  uid: string;
  body: UserPatchBody;
  requester: AuthUser;
}

export interface SetFeaturedInput {
  uid: string;
  is_featured: boolean;
  requester: AuthUser;
}
