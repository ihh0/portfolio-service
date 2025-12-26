import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./Project";
import { Experience } from "./Experience";

/**
 * User
 * - 로그인/권한 정보를 저장한다.
 */

@Entity({ name: "user" })
export class User {
  @PrimaryColumn({ type: "varchar", length: 36 })
  uid!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 50 })
  login_id!: string;

  /**
   * 로컬 로그인용 비밀번호 해시 (소셜만 쓰더라도 과제 요건 충족을 위해 유지)
   */
  @Column({ type: "varchar", length: 100 })
  password_hash!: string;

  @Index()
  @Column({ type: "varchar", length: 50 })
  display_name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "boolean", default: true })
  is_email_public!: boolean;

  @Column({ type: "boolean", default: true })
  is_phone_public!: boolean;

  @Column({ type: "boolean", default: false })
  is_featured!: boolean;

  @Column({ type: "enum", enum: ["ROLE_USER", "ROLE_ADMIN"], default: "ROLE_USER" })
  role!: "ROLE_USER" | "ROLE_ADMIN";

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;

  @Index()
  @Column({ type: "datetime", nullable: true })
  deleted_at!: Date | null;

  /**
   * Relations
   */
  @OneToMany(() => Project, (p) => p.user)
  projects!: Project[];

  @OneToMany(() => Experience, (e) => e.user)
  experiences!: Experience[];
}
