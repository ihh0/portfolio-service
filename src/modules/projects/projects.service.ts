import { AppDataSource } from "../../config/data-source";
import { ApiError } from "../../middleware/error";
import type { ProjectsListQuery } from "./projects.types";
import type {
  LikeProjectInput,
  UnlikeProjectInput,
  CreateProjectInput,
  GetProjectDetailInput,
  PatchProjectInput,
} from "./projects.types";
import type { AuthUser } from "../../middleware/auth";

import { Project } from "../../entities/Project";
import { User } from "../../entities/User";
import { Skill } from "../../entities/Skill";
import { ProjectLike } from "../../entities/ProjectLike";
import { ProjectSkill } from "../../entities/ProjectSkill";

/**
 * ProjectsService
 * - 프로젝트 목록/상세 및 권한 로직을 처리한다.
 */

export class ProjectsService {
  async listPublicProjects(q: ProjectsListQuery) {
    const projectRepo = AppDataSource.getRepository(Project);

    // 기본: 공개 프로젝트만
    let qb = projectRepo
      .createQueryBuilder("p")
      .innerJoin(User, "u", "u.uid = p.user_uid AND u.deleted_at IS NULL")
      .leftJoin("p.projectSkills", "ps")
      .leftJoin(Skill, "s", "s.id = ps.skill_id AND s.deleted_at IS NULL")
      .where("p.deleted_at IS NULL")
      .andWhere("p.is_public = TRUE");

    // filters
    if (q.title_keyword) {
      qb = qb.andWhere("p.title LIKE :tk", { tk: `%${q.title_keyword}%` });
    }
    if (q.content_keyword) {
      qb = qb.andWhere("(p.content LIKE :ck OR p.summary LIKE :ck)", { ck: `%${q.content_keyword}%` });
    }
    if (q.user_keyword) {
      qb = qb.andWhere("(u.display_name LIKE :uk OR u.login_id LIKE :uk)", { uk: `%${q.user_keyword}%` });
    }
    if (q.skill_id) {
      qb = qb.andWhere("ps.skill_id = :sid", { sid: q.skill_id });
    }

    // select (중복 row 방지: 프로젝트 단위로 group)
    // - MySQL에서 group concat으로 스킬을 가져오는 방식도 있으나,
    //   단순/안전하게: 1차로 프로젝트 id 목록을 페이지네이션 후, 2차로 상세 로드.

    // 1) 페이지 대상 project id 조회
    const orderBy = q.sort === "latest" ? { col: "p.created_at", dir: "DESC" as const } : { col: "p.likes_count", dir: "DESC" as const };

    const idQb = qb
      .clone()
      .select(["p.id AS id", "u.is_featured AS is_featured"]) // featured 보정에 사용
      .orderBy(orderBy.col, orderBy.dir)
      .addOrderBy("p.id", "DESC")
      .offset(q.page * q.size)
      .limit(q.size);

    const total = await qb.clone().select("COUNT(DISTINCT p.id)", "cnt").getRawOne();
    const totalElements = Number(total?.cnt ?? 0);

    const rows = await idQb.getRawMany<{ id: number; is_featured: 0 | 1 }>();
    const ids = rows.map((r) => Number(r.id));

    // 빈 페이지
    if (ids.length === 0) {
      return {
        content: [],
        page: q.page,
        size: q.size,
        totalElements,
        totalPages: Math.ceil(totalElements / q.size),
        sort: q.sort,
      };
    }

    // 2) 상세 조회(스킬 포함)
    const projects = await projectRepo
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.user", "u")
      .leftJoinAndSelect("p.projectSkills", "ps")
      .leftJoinAndSelect("ps.skill", "s")
      .where("p.id IN (:...ids)", { ids })
      .andWhere("p.deleted_at IS NULL")
      .getMany();

    // 3) 원래 페이지 순서를 복원(쿼리 결과는 IN이라 순서 보장 X)
    const map = new Map(projects.map((p) => [p.id, p]));
    let ordered = ids.map((id) => map.get(id)!).filter(Boolean);

    // 4) featured 보정: 페이지 내부에서 featured user 프로젝트만 상단 이동
    // - 안정성: featured 그룹 내부에서는 기존 순서 유지
    const featured: typeof ordered = [];
    const normal: typeof ordered = [];

    for (const p of ordered) {
      if (p.user?.is_featured) featured.push(p);
      else normal.push(p);
    }

    ordered = [...featured, ...normal];

    // 5) 응답 변환
    const content = ordered.map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary ?? null,
      is_public: p.is_public,
      likes_count: p.likes_count,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      user: {
        uid: p.user.uid,
        login_id: p.user.login_id,
        display_name: p.user.display_name,
        is_featured: p.user.is_featured,
      },
      skills: (p.projectSkills ?? [])
        .map((ps) => ps.skill)
        .filter(Boolean)
        .map((s) => ({ id: s.id, name: s.name })),
    }));

    return {
      content,
      page: q.page,
      size: q.size,
      totalElements,
      totalPages: Math.ceil(totalElements / q.size),
      sort: q.sort,
    };
  }

  /**
   * 특정 사용자의 프로젝트 목록
   * - 공개/비공개 범위를 권한에 따라 처리한다.
   */
  async listUserProjects(input: {
    userUid: string;
    page: number;
    size: 10 | 20 | 50;
    sort: "popular" | "latest";
    requester?: AuthUser;
  }) {
    const projectRepo = AppDataSource.getRepository(Project);
    const userRepo = AppDataSource.getRepository(User);

    // 1) user 존재 여부 확인(삭제된 유저는 404)
    const targetUser = await userRepo.findOne({ where: { uid: input.userUid, deleted_at: null as any } });
    if (!targetUser) {
      throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });
    }

    // 2) 공개 범위 판정: admin 또는 본인이면 비공개 프로젝트도 포함
    const isOwner = input.requester?.uid === input.userUid;
    const isAdmin = input.requester?.role === "ROLE_ADMIN";
    const canSeePrivate = isOwner || isAdmin;

    // 3) 프로젝트 쿼리 구성
    let qb = projectRepo
      .createQueryBuilder("p")
      .innerJoin(User, "u", "u.uid = p.user_uid AND u.deleted_at IS NULL")
      .leftJoin("p.projectSkills", "ps")
      .leftJoin(Skill, "s", "s.id = ps.skill_id AND s.deleted_at IS NULL")
      .where("p.deleted_at IS NULL")
      .andWhere("p.user_uid = :userUid", { userUid: input.userUid });

    // 공개 범위 필터: canSeePrivate가 false면 공개 프로젝트만
    if (!canSeePrivate) {
      qb = qb.andWhere("p.is_public = TRUE");
    }

    // 4) 정렬
    // popular: likes_count DESC (동률이면 created_at DESC)
    // latest: created_at DESC
    const orderBy = input.sort === "latest" ? { col: "p.created_at", dir: "DESC" as const } : { col: "p.likes_count", dir: "DESC" as const };

    const idQb = qb
      .clone()
      .select(["p.id AS id", "u.is_featured AS is_featured"])
      .orderBy(orderBy.col, orderBy.dir);
    if (input.sort === "popular") {
      idQb.addOrderBy("p.created_at", "DESC");
    }
    idQb.addOrderBy("p.id", "DESC").offset(input.page * input.size).limit(input.size);

    // 5) 전체 개수 조회
    const total = await qb.clone().select("COUNT(DISTINCT p.id)", "cnt").getRawOne();
    const totalElements = Number(total?.cnt ?? 0);

    const rows = await idQb.getRawMany<{ id: number; is_featured: 0 | 1 }>();
    const ids = rows.map((r) => Number(r.id));

    // 빈 페이지
    if (ids.length === 0) {
      return {
        content: [],
        page: input.page,
        size: input.size,
        totalElements,
        totalPages: Math.ceil(totalElements / input.size),
        sort: input.sort,
      };
    }

    // 6) 상세 조회(스킬 포함)
    const projects = await projectRepo
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.user", "u")
      .leftJoinAndSelect("p.projectSkills", "ps")
      .leftJoinAndSelect("ps.skill", "s")
      .where("p.id IN (:...ids)", { ids })
      .andWhere("p.deleted_at IS NULL")
      .getMany();

    // 7) 원래 페이지 순서를 복원
    const map = new Map(projects.map((p) => [p.id, p]));
    let ordered = ids.map((id) => map.get(id)!).filter(Boolean);

    // 8) featured 보정: 페이지 내부에서 featured user 프로젝트만 상단 이동 (기존 /projects 로직과 동일)
    const featured: typeof ordered = [];
    const normal: typeof ordered = [];

    for (const p of ordered) {
      if (p.user?.is_featured) featured.push(p);
      else normal.push(p);
    }

    ordered = [...featured, ...normal];

    // 9) 응답 변환 (GET /projects와 동일한 포맷)
    // - user 요약: users 서비스의 공개정책 로직과 동일하게 적용
    const content = ordered.map((p) => {
      const userSummary: any = {
        uid: p.user.uid,
        login_id: p.user.login_id,
        display_name: p.user.display_name,
        is_featured: p.user.is_featured,
      };

      // email/phone 공개 정책: 비공개면 필드 제거 (users 서비스 로직 재사용)
      const canSeeUserPrivate = this.canSeeUserPrivate(p.user, input.requester);
      if (p.user.email && (p.user.is_email_public || canSeeUserPrivate)) {
        userSummary.email = p.user.email;
      }
      if (p.user.phone && (p.user.is_phone_public || canSeeUserPrivate)) {
        userSummary.phone = p.user.phone;
      }

      return {
        id: p.id,
        title: p.title,
        summary: p.summary ?? null,
        is_public: p.is_public,
        likes_count: p.likes_count,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
        user: userSummary,
        skills: (p.projectSkills ?? [])
          .map((ps) => ps.skill)
          .filter(Boolean)
          .map((s) => ({ id: s.id, name: s.name })),
      };
    });

    return {
      content,
      page: input.page,
      size: input.size,
      totalElements,
      totalPages: Math.ceil(totalElements / input.size),
      sort: input.sort,
    };
  }

  /**
   * 사용자 email/phone 공개 정책 확인
   * - admin 또는 본인만 private 정보를 확인할 수 있다.
   */
  private canSeeUserPrivate(target: User, requester?: AuthUser): boolean {
    if (!requester) return false;
    if (requester.role === "ROLE_ADMIN") return true;
    return requester.uid === target.uid;
  }

  /** 좋아요 추가(멱등) */
  async likeProject(input: LikeProjectInput) {
    const projectRepo = AppDataSource.getRepository(Project);
    const likeRepo = AppDataSource.getRepository(ProjectLike);

    const p = await projectRepo.findOne({ where: { id: input.projectId, deleted_at: null as any } });
    if (!p) throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Project not found" });

    // private project는 owner/admin만 허용(보수적으로 제한)
    if (!p.is_public) {
      const isOwner = p.user_uid === input.requester.uid;
      const isAdmin = input.requester.role === "ROLE_ADMIN";
      if (!isOwner && !isAdmin) {
        throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
      }
    }

    // 멱등: 이미 존재하면 204
    const exists = await likeRepo.findOne({ where: { project_id: p.id, user_uid: input.requester.uid } as any });
    if (exists) return { created: false };

    await AppDataSource.transaction(async (trx) => {
      await trx.getRepository(ProjectLike).insert({ project_id: p.id, user_uid: input.requester.uid } as any);
      // likes_count는 비정규화: 트랜잭션 내에서 증가
      await trx.getRepository(Project).increment({ id: p.id } as any, "likes_count", 1);
    });

    return { created: true };
  }

  /** 좋아요 제거(멱등) */
  async unlikeProject(input: UnlikeProjectInput) {
    const projectRepo = AppDataSource.getRepository(Project);
    const likeRepo = AppDataSource.getRepository(ProjectLike);

    const p = await projectRepo.findOne({ where: { id: input.projectId, deleted_at: null as any } });
    if (!p) throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Project not found" });

    const exists = await likeRepo.findOne({ where: { project_id: p.id, user_uid: input.requester.uid } as any });
    if (!exists) return { deleted: false };

    await AppDataSource.transaction(async (trx) => {
      await trx.getRepository(ProjectLike).delete({ project_id: p.id, user_uid: input.requester.uid } as any);
      // 0 미만 방지: decrement 후 보정이 필요하면 별도 로직 추가
      await trx.getRepository(Project).decrement({ id: p.id } as any, "likes_count", 1);
    });

    return { deleted: true };
  }

  /** 프로젝트 상세 조회 (optional auth: private는 owner/admin만) */
  async getProjectDetail(input: GetProjectDetailInput) {
    const projectRepo = AppDataSource.getRepository(Project);

    const p = await projectRepo
      .createQueryBuilder("p")
      .innerJoinAndSelect("p.user", "u")
      .leftJoinAndSelect("p.projectSkills", "ps")
      .leftJoinAndSelect("ps.skill", "s")
      .where("p.id = :id", { id: input.id })
      .andWhere("p.deleted_at IS NULL")
      .getOne();

    if (!p) {
      throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Project not found" });
    }

    // private 프로젝트는 owner/admin만 조회 가능
    if (!p.is_public) {
      if (!input.requester) {
        throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
      }
      const isOwner = p.user_uid === input.requester.uid;
      const isAdmin = input.requester.role === "ROLE_ADMIN";
      if (!isOwner && !isAdmin) {
        throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
      }
    }

    return this.toProjectDetail(p);
  }

  /** 프로젝트 생성 */
  async createProject(input: CreateProjectInput) {
    const projectRepo = AppDataSource.getRepository(Project);
    const skillRepo = AppDataSource.getRepository(Skill);

    const p = projectRepo.create({
      user_uid: input.requester.uid,
      title: input.body.title,
      summary: input.body.summary ?? null,
      content: input.body.content ?? null,
      content_format: input.body.content_format ?? "MARKDOWN",
      is_public: input.body.is_public ?? true,
      thumbnail_asset_id: input.body.thumbnail_asset_id ?? null,
      start_date: input.body.start_date ?? null,
      end_date: input.body.end_date ?? null,
      likes_count: 0,
    });

    const saved = await projectRepo.save(p);

    // skill_ids가 있으면 매핑 생성
    if (input.body.skill_ids && input.body.skill_ids.length > 0) {
      // skill 존재 확인
      const skills = await skillRepo
        .createQueryBuilder("s")
        .where("s.id IN (:...ids)", { ids: input.body.skill_ids })
        .andWhere("s.deleted_at IS NULL")
        .getMany();

      if (skills.length !== input.body.skill_ids.length) {
        throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Some skills not found" });
      }

      const projectSkillRepo = AppDataSource.getRepository(ProjectSkill);
      const projectSkills = skills.map((s) => ({
        project_id: saved.id,
        skill_id: s.id,
      }));
      await projectSkillRepo.insert(projectSkills as any);
    }

    // 상세 조회로 반환
    return this.getProjectDetail({ id: saved.id, requester: input.requester });
  }

  /** 프로젝트 수정 (owner/admin) */
  async patchProject(input: PatchProjectInput) {
    const projectRepo = AppDataSource.getRepository(Project);
    const projectSkillRepo = AppDataSource.getRepository(ProjectSkill);

    const p = await projectRepo.findOne({ where: { id: input.id, deleted_at: null as any } });
    if (!p) {
      throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Project not found" });
    }

    // owner/admin 권한 체크
    const isOwner = p.user_uid === input.requester.uid;
    const isAdmin = input.requester.role === "ROLE_ADMIN";
    if (!isOwner && !isAdmin) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
    }

    // 부분 업데이트
    if (typeof input.body.title === "string") p.title = input.body.title;
    if (typeof input.body.summary === "string" || input.body.summary === null) p.summary = input.body.summary ?? null;
    if (typeof input.body.content === "string" || input.body.content === null) p.content = input.body.content ?? null;
    if (input.body.content_format) p.content_format = input.body.content_format;
    if (typeof input.body.is_public === "boolean") p.is_public = input.body.is_public;
    if (typeof input.body.thumbnail_asset_id === "number" || input.body.thumbnail_asset_id === null) {
      p.thumbnail_asset_id = input.body.thumbnail_asset_id ?? null;
    }
    if (typeof input.body.start_date === "string" || input.body.start_date === null) {
      p.start_date = input.body.start_date ?? null;
    }
    if (typeof input.body.end_date === "string" || input.body.end_date === null) {
      p.end_date = input.body.end_date ?? null;
    }

    await projectRepo.save(p);

    // skill_ids가 있으면 전체 교체(set)
    if (input.body.skill_ids !== undefined) {
      const skillRepo = AppDataSource.getRepository(Skill);

      // 기존 매핑 삭제
      await projectSkillRepo.delete({ project_id: p.id } as any);

      // 새로운 매핑 생성
      if (input.body.skill_ids.length > 0) {
        const skills = await skillRepo
          .createQueryBuilder("s")
          .where("s.id IN (:...ids)", { ids: input.body.skill_ids })
          .andWhere("s.deleted_at IS NULL")
          .getMany();

        if (skills.length !== input.body.skill_ids.length) {
          throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Some skills not found" });
        }

        const projectSkills = skills.map((s) => ({
          project_id: p.id,
          skill_id: s.id,
        }));
        await projectSkillRepo.insert(projectSkills as any);
      }
    }

    // 상세 조회로 반환
    return this.getProjectDetail({ id: p.id, requester: input.requester });
  }

  /**
   * 프로젝트 soft delete
   * - owner/admin만 가능하며 멱등이다.
   */
  async deleteProject(input: { id: number; requester: AuthUser }) {
    const projectRepo = AppDataSource.getRepository(Project);

    // 프로젝트 조회 (deleted_at 포함/미포함 고려)
    const p = await projectRepo.findOne({ where: { id: input.id } as any });

    // 존재하지 않으면 404
    if (!p) {
      throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Project not found" });
    }

    // 이미 삭제된 경우는 204 반환 (멱등)
    if (p.deleted_at) {
      return;
    }

    // 권한 체크: admin이면 통과, 아니면 project.user_uid == requester.uid만 통과
    const isAdmin = input.requester.role === "ROLE_ADMIN";
    const isOwner = p.user_uid === input.requester.uid;

    if (!isAdmin && !isOwner) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
    }

    // soft delete: deleted_at 업데이트
    p.deleted_at = new Date();
    await projectRepo.save(p);
  }

  /** 엔티티 → 상세 응답 변환 */
  private toProjectDetail(p: Project) {
    return {
      id: p.id,
      title: p.title,
      summary: p.summary ?? null,
      content: p.content ?? null,
      content_format: p.content_format,
      thumbnail_asset_id: p.thumbnail_asset_id ?? null,
      is_public: p.is_public,
      start_date: p.start_date ?? null,
      end_date: p.end_date ?? null,
      likes_count: p.likes_count,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      user: {
        uid: p.user.uid,
        login_id: p.user.login_id,
        display_name: p.user.display_name,
        is_featured: p.user.is_featured,
      },
      skills: (p.projectSkills ?? [])
        .map((ps) => ps.skill)
        .filter(Boolean)
        .map((s) => ({ id: s.id, name: s.name })),
    };
  }
}
