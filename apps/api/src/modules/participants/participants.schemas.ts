import { z } from 'zod';

export const createParticipantSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    nickname: z.string().trim().optional().nullable(),
    teamName: z.string().trim().optional().nullable(),
  })
  .strict();

export const updateParticipantSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    nickname: z.string().trim().optional().nullable(),
    teamName: z.string().trim().optional().nullable(),
  })
  .strict();

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
