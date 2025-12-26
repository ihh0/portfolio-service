import { AppDataSource } from "../../config/data-source";
import { ApiError } from "../../middleware/error";
import type { AuthUser } from "../../middleware/auth";

import { User } from "../../entities/User";

/**
 * UsersService
 * - 사용자 조회/관리 로직을 처리한다.
 */

export class UsersService {
  async listUsers(input: { page: number; size: number; keyword?: string; requester?: AuthUser }) {
    const repo = AppDataSource.getRepository(User);

    let qb = repo.createQueryBuilder("u").where("u.deleted_at IS NULL");

    if (input.keyword) {
      // 요구사항: user_keyword는 LIKE, 대상은 display_name + login_id
      qb = qb.andWhere("(u.display_name LIKE :kw OR u.login_id LIKE :kw)", {
        kw: `%${input.keyword}%`,
      });
    }

    qb = qb
      .orderBy("u.created_at", "DESC")
      .skip(input.page * input.size)
      .take(input.size);

    const [rows, total] = await qb.getManyAndCount();

    return {
      content: rows.map((u) => this.toUserSummary(u, input.requester)),
      page: input.page,
      size: input.size,
      totalElements: total,
      totalPages: Math.ceil(total / input.size),
      sort: "created_at,DESC" as const,
    };
  }

  async getProfile(input: { uid: string; requester?: AuthUser }) {
    const repo = AppDataSource.getRepository(User);

    const u = await repo.findOne({ where: { uid: input.uid, deleted_at: null as any } });
    if (!u) throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });

    const detail = this.toUserDetail(u, input.requester);
    return detail;
  }

  async patchUser(input: { uid: string; body: any; requester: AuthUser }) {
    // owner/admin
    this.assertOwnerOrAdmin(input.requester, input.uid);

    const repo = AppDataSource.getRepository(User);

    const u = await repo.findOne({ where: { uid: input.uid, deleted_at: null as any } });
    if (!u) throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });

    if (typeof input.body.display_name === "string") u.display_name = input.body.display_name;

    if (typeof input.body.is_email_public === "boolean") u.is_email_public = input.body.is_email_public;
    if (typeof input.body.is_phone_public === "boolean") u.is_phone_public = input.body.is_phone_public;

    const saved = await repo.save(u);

    // 수정 응답은 caller에게 유용하도록 detail로 반환
    return this.toUserDetail(saved, input.requester);
  }

  async setFeatured(input: { uid: string; is_featured: boolean; requester: AuthUser }) {
    this.requireAdmin(input.requester);

    const repo = AppDataSource.getRepository(User);

    const u = await repo.findOne({ where: { uid: input.uid, deleted_at: null as any } });
    if (!u) throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });

    u.is_featured = input.is_featured;
    const saved = await repo.save(u);

    return this.toUserDetail(saved, input.requester);
  }

  /**
   * 사용자 계정 soft delete
   * - owner/admin만 가능하며 멱등이다.
   */
  async softDeleteUser(input: { uid: string; requester: AuthUser }) {
    const repo = AppDataSource.getRepository(User);

    // 대상 user 조회 (삭제 포함 여부)
    const u = await repo.findOne({ where: { uid: input.uid } as any });

    // user가 없으면 404
    if (!u) {
      throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });
    }

    // 이미 삭제된 경우는 204 반환 (멱등)
    if (u.deleted_at) {
      return;
    }

    // 권한 체크: admin이면 통과, 아니면 requester.uid == uid만 통과
    const isAdmin = input.requester.role === "ROLE_ADMIN";
    const isOwner = input.requester.uid === input.uid;

    if (!isAdmin && !isOwner) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
    }

    // soft delete 처리: deleted_at 업데이트
    // 참고: 사용자의 프로젝트/경력까지 같이 soft delete 처리하지 않음
    // - 요구사항에 명시되지 않았으므로 사용자 계정만 삭제
    // - 프로젝트/경력은 별도 삭제 API를 통해 관리
    u.deleted_at = new Date();
    await repo.save(u);
  }

  /**
   * 응답 변환: 요약
   * - email/phone은 비공개면 아예 키를 넣지 않는다.
   */
  private toUserSummary(u: User, requester?: AuthUser) {
    const base: any = {
      uid: u.uid,
      login_id: u.login_id,
      display_name: u.display_name,
      is_featured: u.is_featured,
    };

    const canSeePrivate = this.canSeePrivate(u, requester);

    if (u.email && (u.is_email_public || canSeePrivate)) base.email = u.email;
    if (u.phone && (u.is_phone_public || canSeePrivate)) base.phone = u.phone;

    return base;
  }

  /**
   * 응답 변환: 상세
   * - owner/admin이면 privacy 설정을 함께 제공(권장)
   */
  private toUserDetail(u: User, requester?: AuthUser) {
    const base: any = {
      ...this.toUserSummary(u, requester),
      created_at: u.created_at.toISOString(),
      updated_at: u.updated_at.toISOString(),
    };

    if (this.canSeePrivate(u, requester)) {
      base.privacy = {
        is_email_public: u.is_email_public,
        is_phone_public: u.is_phone_public,
      };
    }

    return base;
  }

  private canSeePrivate(target: User, requester?: AuthUser) {
    if (!requester) return false;
    if (requester.role === "ROLE_ADMIN") return true;
    return requester.uid === target.uid;
  }

  private assertOwnerOrAdmin(requester: AuthUser, targetUid: string) {
    const isOwner = requester.uid === targetUid;
    const isAdmin = requester.role === "ROLE_ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Not allowed" });
    }
  }

  private requireAdmin(requester: AuthUser) {
    if (requester.role !== "ROLE_ADMIN") {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Admin only" });
    }
  }
}
