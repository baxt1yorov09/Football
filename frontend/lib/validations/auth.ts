import { z } from 'zod';

// Phone number validation for Uzbekistan
const uzPhoneRegex = /^\+998(90|91|93|94|95|97|98|99|88)\d{7}$/;

// Auth validation schemas
export const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, 'Telefon raqam kiritish majburiy')
    .regex(uzPhoneRegex, "To'g'ri O'zbekiston telefon raqamini kiriting (+998 XX XXX-XX-XX)"),
});

export const otpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Telefon raqam kiritish majburiy')
    .regex(uzPhoneRegex, "To'g'ri O'zbekiston telefon raqamini kiriting"),
  code: z
    .string()
    .min(6, '6 ta raqam kiritish majburiy')
    .max(6, '6 ta raqam kiritish majburiy')
    .regex(/^\d{6}$/, 'Faqat raqamlar kiritilishi kerak'),
});

export const profileSchema = z.object({
  firstName: z.string().min(1, 'Ism kiritish majburiy').max(100, 'Ism 100 ta belgidan oshmasligi kerak'),
  lastName: z.string().min(1, 'Familiya kiritish majburiy').max(100, 'Familiya 100 ta belgidan oshmasligi kerak'),
  birthDate: z.string().min(1, "Tug'ilgan sana kiritish majburiy"),
  gender: z.enum(['male', 'female'], {
    message: 'Jinsni tanlash majburiy',
  }),
  regionId: z.number().int().positive('Hududni tanlash majburiy'),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
