import { AppDataSource } from "../../config/data-source";
import { ApiError } from "../../middleware/error";
import type { AuthUser } from "../../middleware/auth";

import { Experience } from "../../entities/Experience";
import { User } from "../../entities/User";

/**
 * ExperiencesService
 * - 경력 조회/관리 로직을 처리한다.
 */

export class ExperiencesService {
  /**
   * 사용자 경력 목록(공개)
   * - start_date DESC, 사용자 미존재 시 404로 처리한다.
   */
  async listByUser(input: { userUid: string; page: number; size: 10 | 20 | 50 }) {
    const userRepo = AppDataSource.getRepository(User);
    const targetUser = await userRepo.findOne({ where: { uid: input.userUid, deleted_at: null as any } });
    if (!targetUser) {
      throw new ApiError({ status: 404, code: "USER_NOT_FOUND", message: "User not found" });
    }

    const expRepo = AppDataSource.getRepository(Experience);

    const qb = expRepo
      .createQueryBuilder("e")
      .where("e.deleted_at IS NULL")
      .andWhere("e.user_uid = :uid", { uid: input.userUid })
      .orderBy("e.start_date", "DESC")
      .skip(input.page * input.size)
      .take(input.size);

    const [rows, total] = await qb.getManyAndCount();

    return {
      content: rows.map(this.toResponse),
      page: input.page,
      size: input.size,
      totalElements: total,
      totalPages: Math.ceil(total / input.size),
      sort: "start_date,DESC" as const,
    };
  }

  /**
   * 경력 상세(공개)
   */
  async getOne(input: { id: number }) {
    const expRepo = AppDataSource.getRepository(Experience);

    const e = await expRepo.findOne({
      where: { id: input.id, deleted_at: null as any },
    });

    if (!e) {
      throw new ApiError({
        status: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "Experience not found",
      });
    }

    return this.toResponse(e);
  }

  /**
   * 사용자 경력 생성(owner/admin)
   */
  async createForUser(input: {
    userUid: string;
    body: any;
    requester: AuthUser;
  }) {
    await this.assertOwnerOrAdmin(input.requester, input.userUid);

    const userRepo = AppDataSource.getRepository(User);
    const expRepo = AppDataSource.getRepository(Experience);

    // user 존재 확인(soft delete 제외)
    const u = await userRepo.findOne({ where: { uid: input.userUid, deleted_at: null as any } });
    if (!u) {
      throw new ApiError({
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    const e = expRepo.create({
      user_uid: input.userUid,
      company: input.body.company,
      position: input.body.position,
      employment_type: input.body.employment_type,
      start_date: input.body.start_date,
      end_date: input.body.end_date ?? null,
      description: input.body.description ?? null,
    });

    const saved = await expRepo.save(e);
    return this.toResponse(saved);
  }

  /**
   * 경력 수정(owner/admin)
   * - user_uid 기준으로 권한을 검사한다.
   */
  async patch(input: { id: number; body: any; requester: AuthUser }) {
    const expRepo = AppDataSource.getRepository(Experience);

    const e = await expRepo.findOne({
      where: { id: input.id, deleted_at: null as any },
    });

    if (!e) {
      throw new ApiError({
        status: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "Experience not found",
      });
    }

    await this.assertOwnerOrAdmin(input.requester, e.user_uid);

    // 부분 업데이트: 전달된 값만 반영
    if (typeof input.body.company === "string") e.company = input.body.company;
    if (typeof input.body.position === "string") e.position = input.body.position;
    if (typeof input.body.employment_type === "string") e.employment_type = input.body.employment_type;
    if (typeof input.body.start_date === "string") e.start_date = input.body.start_date;

    // nullable 필드는 null도 허용(명시적으로 들어오면 반영)
    if (Object.prototype.hasOwnProperty.call(input.body, "end_date")) {
      e.end_date = input.body.end_date ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input.body, "description")) {
      e.description = input.body.description ?? null;
    }

    const saved = await expRepo.save(e);
    return this.toResponse(saved);
  }

  /**
   * 경력 삭제(owner/admin) — soft delete
   */
  async remove(input: { id: number; requester: AuthUser }) {
    const expRepo = AppDataSource.getRepository(Experience);

    const e = await expRepo.findOne({
      where: { id: input.id, deleted_at: null as any },
    });

    if (!e) {
      throw new ApiError({
        status: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "Experience not found",
      });
    }

    await this.assertOwnerOrAdmin(input.requester, e.user_uid);

    e.deleted_at = new Date();
    await expRepo.save(e);
  }

  /**
   * owner/admin 권한 체크
   * - owner 또는 admin만 허용한다.
   */
  private async assertOwnerOrAdmin(requester: AuthUser, targetUserUid: string) {
    const isOwner = requester.uid === targetUserUid;
    const isAdmin = requester.role === "ROLE_ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ApiError({
        status: 403,
        code: "FORBIDDEN",
        message: "Not allowed",
      });
    }
  }

  /**
   * 엔티티 → 응답 변환
   * - 응답 형태를 서비스에서 고정한다.
   */
  private toResponse(e: Experience) {
    return {
      id: e.id,
      company: e.company,
      position: e.position,
      employment_type: e.employment_type as any,
      start_date: e.start_date,
      end_date: e.end_date ?? null,
      description: e.description ?? null,
      created_at: e.created_at.toISOString(),
      updated_at: e.updated_at.toISOString(),
    };
  }
}
