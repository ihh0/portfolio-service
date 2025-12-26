import { AppDataSource } from "../../config/data-source";
import { ApiError } from "../../middleware/error";
import type { AuthUser } from "../../middleware/auth";
import { Skill } from "../../entities/Skill";

/**
 * SkillsService
 * - 스킬 조회/관리 로직
 */

export class SkillsService {
  async listSkills(input: { keyword?: string }) {
    const repo = AppDataSource.getRepository(Skill);

    let qb = repo.createQueryBuilder("s").where("s.deleted_at IS NULL");

    if (input.keyword) {
      qb = qb.andWhere("s.name LIKE :kw", { kw: `%${input.keyword}%` });
    }

    // 스킬은 태그 성격이라 name ASC 고정
    qb = qb.orderBy("s.name", "ASC");

    // 안전장치: 과도한 데이터 증가 시 응답 폭발 방지(필요 시 조정)
    qb = qb.take(1000);

    const rows = await qb.getMany();

    return {
      content: rows.map((s) => ({ id: s.id, name: s.name })),
      sort: "name,ASC",
      limit: 1000,
    };
  }

  async createSkill(input: { name: string; requester: AuthUser }) {
    this.requireAdmin(input.requester);

    const repo = AppDataSource.getRepository(Skill);

    // 중복 체크(soft delete 제외)
    const dup = await repo
      .createQueryBuilder("s")
      .where("s.name = :name", { name: input.name })
      .andWhere("s.deleted_at IS NULL")
      .getOne();

    if (dup) throw new ApiError({ status: 409, code: "DUPLICATE_RESOURCE", message: "Skill already exists" });

    const s = repo.create({ name: input.name });
    const saved = await repo.save(s);

    return { id: saved.id, name: saved.name };
  }

  async patchSkill(input: { id: number; name?: string; requester: AuthUser }) {
    this.requireAdmin(input.requester);

    const repo = AppDataSource.getRepository(Skill);

    const s = await repo.findOne({ where: { id: input.id, deleted_at: null as any } });
    if (!s) throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Skill not found" });

    if (typeof input.name === "string") {
      // 이름 중복 체크
      const dup = await repo
        .createQueryBuilder("x")
        .where("x.name = :name", { name: input.name })
        .andWhere("x.deleted_at IS NULL")
        .andWhere("x.id <> :id", { id: input.id })
        .getOne();

      if (dup) throw new ApiError({ status: 409, code: "DUPLICATE_RESOURCE", message: "Skill already exists" });

      s.name = input.name;
    }

    const saved = await repo.save(s);
    return { id: saved.id, name: saved.name };
  }

  async deleteSkill(input: { id: number; requester: AuthUser }) {
    this.requireAdmin(input.requester);

    const repo = AppDataSource.getRepository(Skill);

    const s = await repo.findOne({ where: { id: input.id, deleted_at: null as any } });
    if (!s) throw new ApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "Skill not found" });

    // soft delete
    s.deleted_at = new Date();
    await repo.save(s);
  }

  private requireAdmin(requester: AuthUser) {
    if (requester.role !== "ROLE_ADMIN") {
      throw new ApiError({ status: 403, code: "FORBIDDEN", message: "Admin only" });
    }
  }
}
