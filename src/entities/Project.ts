import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { ProjectSkill } from "./ProjectSkill";

/**
 * Project
 * - 프로젝트 정보 및 공개 설정을 저장한다.
 */

@Entity({ name: "project" })
export class Project {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Index()
  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  summary!: string | null;

  /**
   * 본문 (블로그형 편집은 별도 위지윅이 필요하므로, 현재는 LONGTEXT로 저장)
   */
  @Column({ type: "longtext", nullable: true })
  content!: string | null;

  @Column({ type: "varchar", length: 20, default: "MARKDOWN" })
  content_format!: "MARKDOWN" | "PLAIN_TEXT";

  @Column({ type: "int", nullable: true })
  thumbnail_asset_id!: number | null;

  @Column({ type: "boolean", default: true })
  is_public!: boolean;

  @Column({ type: "date", nullable: true })
  start_date!: string | null;

  @Column({ type: "date", nullable: true })
  end_date!: string | null;

  @Index()
  @Column({ type: "int", default: 0 })
  likes_count!: number;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;

  @Index()
  @Column({ type: "datetime", nullable: true })
  deleted_at!: Date | null;

  /**
   * 작성자(user.uid) FK
   */
  @Index()
  @Column({ type: "varchar", length: 36 })
  user_uid!: string;

  @ManyToOne(() => User, (u) => u.projects, { eager: false })
  @JoinColumn({ name: "user_uid", referencedColumnName: "uid" })
  user!: User;

  @OneToMany(() => ProjectSkill, (ps) => ps.project)
  projectSkills!: ProjectSkill[];
}
