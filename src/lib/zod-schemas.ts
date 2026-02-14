import { z } from 'zod';
import { MODEL_KEYS } from '@/lib/model-config';

export const targetLengthSchema = z
  .number()
  .int('目标字数必须为整数')
  .min(1, '目标字数至少为1字')
  .max(10000, '请输入10000字以下的目标字数');
export type TargetLength = z.infer<typeof targetLengthSchema>;

export const generateBodySchema = z.object({
  model_key: z.enum(MODEL_KEYS).default('deepseek'),
  target_length: targetLengthSchema,
  content_outline: z.string().min(1, '请填写文章提纲').max(10000),
  key_points: z.string().min(1, '请填写核心观点').max(5000),
  constraint_conditions: z.string().trim().max(3000, '约束性条件不能超过3000字').optional(),
  author_persona: z.string().trim().max(2000, '作者画像不能超过2000字').optional(),
  concrete_cases: z.string().trim().max(6000, '具体案例不能超过6000字').optional(),
  reference_sources: z.string().trim().max(4000, '参考来源不能超过4000字').optional(),
  include_subheadings: z.boolean().optional(),
});
export type GenerateBody = z.infer<typeof generateBodySchema>;

export const generationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});
