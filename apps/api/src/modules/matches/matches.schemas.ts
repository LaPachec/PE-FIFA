import { z } from 'zod';

export const updateMatchResultSchema = z
  .object({
    homeScore: z
      .number({
        required_error: 'homeScore is required',
        invalid_type_error: 'homeScore must be an integer',
      })
      .int('homeScore must be an integer')
      .min(0, 'homeScore cannot be negative'),
    awayScore: z
      .number({
        required_error: 'awayScore is required',
        invalid_type_error: 'awayScore must be an integer',
      })
      .int('awayScore must be an integer')
      .min(0, 'awayScore cannot be negative'),
  })
  .strict();

export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>;
