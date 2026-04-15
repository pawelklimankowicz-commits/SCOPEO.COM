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
  acceptRegulations: z.literal(true, {
    errorMap: () => ({ message: 'Akceptacja regulaminu jest wymagana.' }),
  }),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Potwierdzenie polityki prywatnosci jest wymagane.' }),
  }),
});
export const onboardingSchema = z.object({
  companyName: z.string().min(1),
  taxId: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => /^\d{10}$/.test(v), 'NIP musi mieć 10 cyfr')
    .optional()
    .nullable(),
  reportingYear: z.number().int().min(2020),
  baseYear: z.number().int().min(2020),
  boundaryApproach: z.enum(['operational_control', 'financial_control', 'equity_share']),
  industry: z.string().min(1),
  ksefToken: z.string().min(10),
  supportsMarketBased: z.boolean(),
  hasGreenContracts: z.boolean(),
  businessTravelIncluded: z.boolean(),
  employeeCommutingIncluded: z.boolean(),
  notes: z.string().optional().nullable(),
});
export const onboardingProfileSchema = z.object({
  companyName: z.string().trim().min(2, 'Podaj nazwę firmy'),
  taxId: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 0 || /^\d{10}$/.test(v), 'NIP musi mieć 10 cyfr')
    .nullable()
    .optional(),
  addressStreet: z.string().trim().min(2, 'Podaj ulicę'),
  addressPostalCode: z.string().trim().min(4, 'Podaj kod pocztowy'),
  addressCity: z.string().trim().min(2, 'Podaj miasto'),
  reportingYear: z.number().int().min(2023).max(2100),
});

export const onboardingBoundarySchema = z.object({
  industry: z.string().trim().min(1, 'Wybierz branżę'),
  boundaryApproach: z.enum(['operational_control', 'financial_control', 'equity_share']),
  includeScope3: z.boolean().default(false),
});

export const onboardingKsefSchema = z.object({
  ksefToken: z.string().trim().min(10, 'Token KSeF musi mieć min. 10 znaków'),
  contextNip: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => /^\d{10}$/.test(v), 'NIP musi mieć 10 cyfr'),
  skip: z.boolean().optional().default(false),
});
export const importInvoicesSchema = z
  .object({
    xml: z.string().min(20).optional(),
    ksefReferenceNumber: z.string().min(5).optional(),
  })
  .refine((value) => Boolean(value.xml || value.ksefReferenceNumber), {
    message: 'Provide xml or ksefReferenceNumber',
  });
export const reviewUpdateSchema = z.object({ lineId: z.string().min(1), status: z.enum(['PENDING','IN_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','OVERRIDDEN']), overrideCategoryCode: z.string().optional().nullable(), overrideFactorId: z.string().optional().nullable(), assigneeUserId: z.string().optional().nullable(), comment: z.string().optional().nullable() });