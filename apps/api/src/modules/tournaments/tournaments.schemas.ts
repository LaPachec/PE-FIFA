import { z } from 'zod';

const tournamentFormatSchema = z.enum(['LEAGUE', 'KNOCKOUT', 'LEAGUE_KNOCKOUT']);
const qualifiedCountSchema = z.union([
  z.literal(2),
  z.literal(4),
  z.literal(8),
  z.literal(16),
]);

export const createTournamentSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional().nullable(),
    format: tournamentFormatSchema,
    isTwoLegged: z.boolean().optional().default(false),
    qualifiedCount: qualifiedCountSchema.optional().nullable(),
    hasThirdPlaceMatch: z.boolean().optional().default(false),
  })
  .superRefine((data, context) => {
    if (data.format === 'LEAGUE_KNOCKOUT' && !data.qualifiedCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['qualifiedCount'],
        message: 'Qualified count is required for LEAGUE_KNOCKOUT tournaments',
      });
    }
  });

export const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    description: z.string().trim().optional().nullable(),
    format: tournamentFormatSchema.optional(),
    isTwoLegged: z.boolean().optional(),
    qualifiedCount: qualifiedCountSchema.optional().nullable(),
    hasThirdPlaceMatch: z.boolean().optional(),
  })
  .strict();

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;
