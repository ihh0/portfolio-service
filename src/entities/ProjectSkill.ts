import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Project } from "./Project";
import { Skill } from "./Skill";

/**
 * ProjectSkill
 * - 프로젝트와 스킬의 다대다 매핑을 저장한다.
 */

@Entity({ name: "project_skill" })
export class ProjectSkill {
  @PrimaryColumn({ type: "int" })
  project_id!: number;

  @PrimaryColumn({ type: "int" })
  skill_id!: number;

  @ManyToOne(() => Project, (p) => p.projectSkills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @ManyToOne(() => Skill, { onDelete: "CASCADE" })
  @JoinColumn({ name: "skill_id" })
  skill!: Skill;
}
