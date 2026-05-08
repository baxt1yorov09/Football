import { z } from 'zod';

// Personal info step validation
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'Ism kiritish majburiy').max(100),
  lastName: z.string().min(1, 'Familiya kiritish majburiy').max(100),
  birthDate: z.string().min(1, "Tug'ilgan sana kiritish majburiy"),
  gender: z.enum(['male', 'female']),
  phone: z.string().min(1, 'Telefon raqam kiritish majburiy'),
  regionId: z.number().int().positive('Viloyatni tanlash majburiy'),
});

// Professional info step validation
export const professionalSchema = z.object({
  workplace: z.string().min(1, 'Ish joyini kiritish majburiy').max(300),
  jobTitle: z.string().min(1, 'Lavozimni kiritish majburiy').max(200),
  coachingYears: z.number().int().min(0).max(50, 'Tajriba 50 yildan oshmasligi kerak'),
});

// Previous license step validation
export const previousLicenseSchema = z.object({
  prevLicenseDate: z.string().optional(),
});

// Documents step validation
export const documentsSchema = z.object({
  passport: z.any().refine((file) => file instanceof File || file === null, {
    message: 'Pasport nusxasini yuklash majburiy',
  }),
  photo3x4: z.any().refine((file) => file instanceof File || file === null, {
    message: '3x4 rasm yuklash majburiy',
  }),
  prevLicense: z.any().optional(),
});

// Renewal step validation
export const renewalSchema = z.object({
  validityStart: z.string().min(1, 'Boshlanish sanasini kiritish majburiy'),
  validityEnd: z.string().min(1, 'Tugash sanasini kiritish majburiy'),
}).refine((data) => {
  if (!data.validityStart || !data.validityEnd) return true;
  return new Date(data.validityEnd) > new Date(data.validityStart);
}, {
  message: 'Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak',
  path: ['validityEnd'],
});

// Confirmation step validation
export const confirmationSchema = z.object({
  consent: z.boolean().refine((val) => val === true, {
    message: "Ma'lumotlar to'g'riligini tasdiqlang",
  }),
});

// Full application form validation
export const applicationFormSchema = z.object({
  ...personalInfoSchema.shape,
  ...professionalSchema.shape,
  ...previousLicenseSchema.shape,
  ...documentsSchema.shape,
  ...renewalSchema.shape,
  ...confirmationSchema.shape,
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ProfessionalInput = z.infer<typeof professionalSchema>;
export type PreviousLicenseInput = z.infer<typeof previousLicenseSchema>;
export type DocumentsInput = z.infer<typeof documentsSchema>;
export type RenewalInput = z.infer<typeof renewalSchema>;
export type ConfirmationInput = z.infer<typeof confirmationSchema>;
export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;
