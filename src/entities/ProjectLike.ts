import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Project } from "./Project";
import { User } from "./User";

/**
 * ProjectLike
 * - 사용자와 프로젝트의 좋아요 관계를 저장한다.
 */

@Entity({ name: "project_like" })
export class ProjectLike {
  @PrimaryColumn({ type: "int" })
  project_id!: number;

  @PrimaryColumn({ type: "varchar", length: 36 })
  user_uid!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_uid", referencedColumnName: "uid" })
  user!: User;
}
