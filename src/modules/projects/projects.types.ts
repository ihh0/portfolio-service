import type { AuthUser } from "../../middleware/auth";

export type ProjectListSort = "popular" | "latest";

export interface ProjectsListQuery {
  page: number;
  size: 10 | 20 | 50;
  sort: ProjectListSort;
  title_keyword?: string;
  content_keyword?: string;
  user_keyword?: string;
  skill_id?: number;
}

export interface ProjectListItem {
  id: number;
  title: string;
  summary: string | null;
  is_public: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user: {
    uid: string;
    login_id: string;
    display_name: string;
    is_featured: boolean;
  };
  skills: { id: number; name: string }[];
}

export interface ProjectsListResponse {
  content: ProjectListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
}

export interface LikeProjectInput {
  projectId: number;
  requester: AuthUser;
}

export interface UnlikeProjectInput {
  projectId: number;
  requester: AuthUser;
}

export interface ProjectCreateBody {
  title: string;
  summary?: string | null;
  content?: string | null;
  content_format?: "MARKDOWN" | "PLAIN_TEXT";
  is_public?: boolean;
  thumbnail_asset_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  skill_ids?: number[];
}

export type ProjectPatchBody = Partial<ProjectCreateBody>;

export interface ProjectDetail {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  content_format: "MARKDOWN" | "PLAIN_TEXT";
  thumbnail_asset_id: number | null;
  is_public: boolean;
  start_date: string | null;
  end_date: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user: {
    uid: string;
    login_id: string;
    display_name: string;
    is_featured: boolean;
  };
  skills: { id: number; name: string }[];
}

export interface CreateProjectInput {
  body: ProjectCreateBody;
  requester: AuthUser;
}

export interface GetProjectDetailInput {
  id: number;
  requester?: AuthUser;
}

export interface PatchProjectInput {
  id: number;
  body: ProjectPatchBody;
  requester: AuthUser;
}
