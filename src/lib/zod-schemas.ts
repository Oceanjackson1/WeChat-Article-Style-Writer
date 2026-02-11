import { z } from 'zod';

export const targetLengthSchema = z
  .number()
  .int('目标字数必须为整数')
  .min(1, '目标字数至少为1字')
  .max(10000, '请输入10000字以下的目标字数');
export type TargetLength = z.infer<typeof targetLengthSchema>;

export const generateBodySchema = z.object({
  target_length: targetLengthSchema,
  content_outline: z.string().min(1, '请填写文章提纲').max(10000),
  key_points: z.string().min(1, '请填写核心观点').max(5000),
});
export type GenerateBody = z.infer<typeof generateBodySchema>;

export const generationsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
});
