import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  Index, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn } from "typeorm";

/**
 * Skill
 * - 태그/필터용 스킬을 저장한다.
 */

@Entity({ name: "skill" })
export class Skill {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 50 })
  name!: string;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;

  @Index()
  @Column({ type: "datetime", nullable: true })
  deleted_at!: Date | null;
}
