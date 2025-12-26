import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Skill } from "../entities/Skill";
import { Project } from "../entities/Project";
import { ProjectSkill } from "../entities/ProjectSkill";
import { ProjectLike } from "../entities/ProjectLike";
import { Experience } from "../entities/Experience";
import { AuthIdentity } from "../entities/AuthIdentity";

/**
 * TypeORM DataSource
 * - DB 연결/엔티티 로딩의 기준 객체로 사용한다.
 */
export const AppDataSource = new DataSource({
  type: "mysql",
  url: process.env.DATABASE_URL,
  entities: [User, Skill, Project, ProjectSkill, ProjectLike, Experience, AuthIdentity],
  // migrations 등은 프로젝트 설정에 맞춰 유지
});

/**
 * DB 연결 함수
 * - 서버 시작 시 호출되어 MySQL 연결을 수립
 */
export async function connectDB() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[db] connection failed", error);
    process.exit(1);
  }
}
