import { z } from 'zod';
import { MODEL_KEYS } from '@/lib/model-config';

export const targetLengthSchema = z
  .number()
  .int('目标字数必须为整数')
  .min(1, '目标字数至少为1字');
export type TargetLength = z.infer<typeof targetLengthSchema>;

export const generateBodySchema = z.object({
  model_key: z.enum(MODEL_KEYS).default('deepseek'),
  target_length: targetLengthSchema,
  content_outline: z.string().min(1, '请填写文章提纲'),
  key_points: z.string().min(1, '请填写核心观点'),
  constraint_conditions: z.string().trim().optional(),
  author_persona: z.string().trim().optional(),
  concrete_cases: z.string().trim().optional(),
  reference_sources: z.string().trim().optional(),
  include_subheadings: z.boolean().optional(),
});
export type GenerateBody = z.infer<typeof generateBodySchema>;

export const generationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});
