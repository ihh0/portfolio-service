import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from "typeorm";
  import { User } from "./User";
  
  /**
   * Experience
   * - 경력 정보를 저장한다.
   */
  
  @Entity({ name: "experience" })
  export class Experience {
    @PrimaryGeneratedColumn({ type: "int" })
    id!: number;
  
    @Index()
    @Column({ type: "varchar", length: 36 })
    user_uid!: string;
  
    @ManyToOne(() => User, (u) => u.experiences, { eager: false })
    @JoinColumn({ name: "user_uid", referencedColumnName: "uid" })
    user!: User;
  
    @Column({ type: "varchar", length: 100 })
    company!: string;
  
    @Column({ type: "varchar", length: 100 })
    position!: string;
  
    @Column({
      type: "enum",
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "FREELANCE", "OTHER"],
      default: "FULL_TIME",
    })
    employment_type!: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "FREELANCE" | "OTHER";
  
    @Column({ type: "date" })
    start_date!: string;
  
    @Column({ type: "date", nullable: true })
    end_date!: string | null;
  
    @Column({ type: "text", nullable: true })
    description!: string | null;
  
    @CreateDateColumn({ type: "datetime" })
    created_at!: Date;
  
    @UpdateDateColumn({ type: "datetime" })
    updated_at!: Date;
  
    @Index()
    @Column({ type: "datetime", nullable: true })
    deleted_at!: Date | null;
  }
