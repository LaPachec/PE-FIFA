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
    homePenaltyScore: z
      .number({
        invalid_type_error: 'homePenaltyScore must be an integer',
      })
      .int('homePenaltyScore must be an integer')
      .min(0, 'homePenaltyScore cannot be negative')
      .optional()
      .nullable(),
    awayPenaltyScore: z
      .number({
        invalid_type_error: 'awayPenaltyScore must be an integer',
      })
      .int('awayPenaltyScore must be an integer')
      .min(0, 'awayPenaltyScore cannot be negative')
      .optional()
      .nullable(),
  })
  .strict();

export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>;
