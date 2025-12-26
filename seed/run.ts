import "dotenv/config";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { AppDataSource } from "../src/config/data-source";

import { User } from "../src/entities/User";
import { Skill } from "../src/entities/Skill";
import { Project } from "../src/entities/Project";
import { ProjectSkill } from "../src/entities/ProjectSkill";
import { Experience } from "../src/entities/Experience";

/**
 * seed/run.ts
 * - 최소 200건 이상을 여러 테이블에 분산
 * - 통계/검색/정렬 검증이 가능한 수준의 데이터 생성
 */

async function main() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const skillRepo = AppDataSource.getRepository(Skill);
  const projectRepo = AppDataSource.getRepository(Project);
  const psRepo = AppDataSource.getRepository(ProjectSkill);
  const expRepo = AppDataSource.getRepository(Experience);
  const now = new Date();

  // 1) skills 30개
  const skills: Skill[] = [];
  for (let i = 1; i <= 30; i++) {
    skills.push(skillRepo.create({ name: `skill_${i}`, created_at: now, updated_at: now }));
  }
  await skillRepo.save(skills);

  // 2) users 60명(그 중 5명 featured, 1명 admin)
  const users: User[] = [];
  const pw = await bcrypt.hash("P@ssw0rd!", 10);

  users.push(
    userRepo.create({
      uid: randomUUID(),
      login_id: "admin",
      password_hash: pw,
      display_name: "Admin",
      role: "ROLE_ADMIN",
      is_featured: false,
      is_email_public: true,
      is_phone_public: true,
      created_at: now,
      updated_at: now,
    })
  );

  for (let i = 1; i <= 59; i++) {
    users.push(
      userRepo.create({
        uid: randomUUID(),
        login_id: `user_${i}`,
        password_hash: pw,
        display_name: `User ${i}`,
        role: "ROLE_USER",
        is_featured: i <= 5,
        is_email_public: true,
        is_phone_public: true,
        created_at: now,
        updated_at: now,
      })
    );
  }
  await userRepo.save(users);

  // 3) projects 120개 + project_skill 다대다 매핑
  const projects: Project[] = [];
  for (let i = 1; i <= 120; i++) {
    const owner = users[(i % users.length)];
    projects.push(
      projectRepo.create({
        user_uid: owner.uid,
        title: `Project ${i}`,
        summary: `Summary ${i}`,
        content: `Content ${i}`,
        is_public: i % 4 !== 0, // 일부 비공개
        likes_count: 0,
        created_at: now,
        updated_at: now,
      })
    );
  }
  await projectRepo.save(projects);

  // project_skill: 프로젝트당 1~3개 스킬
  const ps: Array<{ project_id: number; skill_id: number }> = [];
  for (const p of projects) {
    const count = 1 + (p.id % 3);
    for (let j = 0; j < count; j++) {
      const s = skills[(p.id + j) % skills.length];
      ps.push({ project_id: p.id, skill_id: s.id });
    }
  }
  await psRepo.insert(ps as any);

  // 4) experiences 60개 이상
  const exps: Experience[] = [];
  for (let i = 0; i < 80; i++) {
    const u = users[(i % users.length)];
    exps.push(
      expRepo.create({
        user_uid: u.uid,
        company: `Company ${i}`,
        position: `Position ${i}`,
        employment_type: "FULL_TIME",
        start_date: "2023-01-01",
        end_date: null,
        description: "Seed experience",
        created_at: now,
        updated_at: now,
      })
    );
  }
  await expRepo.save(exps);

  // 합계 예시:
  // - skills 30
  // - users 60
  // - projects 120
  // - project_skill 240+ (프로젝트당 1~3개)
  // - experiences 80
  // => 총 530+ rows

  // eslint-disable-next-line no-console
  console.log("[seed] done");

  await AppDataSource.destroy();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
