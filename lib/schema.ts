import { z } from 'zod';
export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(12, 'Hasło musi mieć co najmniej 12 znaków.')
    .max(128, 'Hasło może mieć maksymalnie 128 znaków.'),
  organizationName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});
export const onboardingSchema = z.object({ companyName: z.string().min(1), reportingYear: z.number().int().min(2020), baseYear: z.number().int().min(2020), boundaryApproach: z.enum(['operational_control', 'financial_control', 'equity_share']), industry: z.string().min(1), ksefToken: z.string().min(10), supportsMarketBased: z.boolean(), hasGreenContracts: z.boolean(), businessTravelIncluded: z.boolean(), employeeCommutingIncluded: z.boolean(), notes: z.string().optional().nullable() });
export const importInvoicesSchema = z
  .object({
    xml: z.string().min(20).optional(),
    ksefReferenceNumber: z.string().min(5).optional(),
  })
  .refine((value) => Boolean(value.xml || value.ksefReferenceNumber), {
    message: 'Provide xml or ksefReferenceNumber',
  });
export const reviewUpdateSchema = z.object({ lineId: z.string().min(1), status: z.enum(['PENDING','IN_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','OVERRIDDEN']), overrideCategoryCode: z.string().optional().nullable(), overrideFactorId: z.string().optional().nullable(), assigneeUserId: z.string().optional().nullable(), comment: z.string().optional().nullable() });