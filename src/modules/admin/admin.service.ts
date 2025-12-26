import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { redis } from "../../config/redis";
import { User } from "../../entities/User";
import { Project } from "../../entities/Project";
import { Experience } from "../../entities/Experience";
import { Skill } from "../../entities/Skill";
import { ProjectSkill } from "../../entities/ProjectSkill";
import { ProjectLike } from "../../entities/ProjectLike";
import type { AdminStatsOverview } from "./admin.types";

const CACHE_KEY = "admin:stats:overview";
const DEFAULT_TTL = 30; // 초

/**
 * 캐시 TTL 가져오기 (환경변수 또는 기본값)
 */
function getCacheTTL(): number {
  const envTTL = process.env.ADMIN_STATS_CACHE_TTL_SECONDS;
  if (envTTL) {
    const parsed = parseInt(envTTL, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_TTL;
}

export class AdminService {
  /**
   * 통계 Overview 조회
   * - Redis 캐시를 먼저 확인하고, 없으면 DB에서 조회 후 캐시에 저장
   */
  async getStatsOverview(): Promise<AdminStatsOverview> {
    // 1. 캐시 확인
    try {
      if (redis.isOpen) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return JSON.parse(cached) as AdminStatsOverview;
        }
      }
    } catch (err) {
      // Redis 오류는 무시하고 DB 조회로 진행
      console.warn("[AdminService] Redis cache read failed, falling back to DB", err);
    }

    // 2. DB에서 통계 조회 (병렬 실행)
    const [
      users,
      featuredUsers,
      projects,
      publicProjects,
      experiences,
      skills,
      projectSkills,
      projectLikes,
    ] = await Promise.all([
      // 전체 사용자 수 (삭제 제외)
      AppDataSource.getRepository(User).count({
        where: { deleted_at: IsNull() },
      }),

      // featured 사용자 수 (삭제 제외)
      AppDataSource.getRepository(User).count({
        where: { deleted_at: IsNull(), is_featured: true },
      }),

      // 전체 프로젝트 수 (삭제 제외, 공개/비공개 모두 포함)
      AppDataSource.getRepository(Project).count({
        where: { deleted_at: IsNull() },
      }),

      // 공개 프로젝트 수 (삭제 제외)
      AppDataSource.getRepository(Project).count({
        where: { deleted_at: IsNull(), is_public: true },
      }),

      // 전체 경력 수 (삭제 제외)
      AppDataSource.getRepository(Experience).count({
        where: { deleted_at: IsNull() },
      }),

      // 전체 스킬 수 (삭제 제외)
      AppDataSource.getRepository(Skill).count({
        where: { deleted_at: IsNull() },
      }),

      // project_skill 매핑 수 (deleted_at 컬럼 없으므로 전체)
      AppDataSource.getRepository(ProjectSkill).count(),

      // project_like 매핑 수 (deleted_at 컬럼 없으므로 전체)
      AppDataSource.getRepository(ProjectLike).count(),
    ]);

    const stats: AdminStatsOverview = {
      users,
      featured_users: featuredUsers,
      projects,
      public_projects: publicProjects,
      experiences,
      skills,
      project_skills: projectSkills,
      project_likes: projectLikes,
    };

    // 3. 캐시에 저장
    try {
      if (redis.isOpen) {
        const ttl = getCacheTTL();
        await redis.setEx(CACHE_KEY, ttl, JSON.stringify(stats));
      }
    } catch (err) {
      // Redis 오류는 무시 (통계는 정상 반환)
      console.warn("[AdminService] Redis cache write failed", err);
    }

    return stats;
  }
}

