import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/**
 * AuthIdentity
 * - 소셜 계정과 서비스 사용자 매핑을 저장한다.
 */

@Entity({ name: "auth_identity" })
@Index(["provider", "provider_user_id"], { unique: true })
export class AuthIdentity {
  /**
   * 내부 식별용 단일 PK
   */
  @PrimaryColumn({ type: "varchar", length: 64 })
  id!: string;

  @Column({ type: "varchar", length: 20 })
  provider!: "github" | "firebase";

  @Column({ type: "varchar", length: 100 })
  provider_user_id!: string;

  @Column({ type: "varchar", length: 36 })
  user_uid!: string;

  /**
   * 확인 가능한 이메일
   */
  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  username!: string | null;
}
