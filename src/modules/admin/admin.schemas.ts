import { z } from "zod";

/**
 * 통계 Overview 응답 스키마
 */
export const adminStatsOverviewSchema = z.object({
  users: z.number().int().min(0),
  featured_users: z.number().int().min(0),
  projects: z.number().int().min(0),
  public_projects: z.number().int().min(0),
  experiences: z.number().int().min(0),
  skills: z.number().int().min(0),
  project_skills: z.number().int().min(0),
  project_likes: z.number().int().min(0),
});

