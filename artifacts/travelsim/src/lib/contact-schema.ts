import { z } from 'zod';
import i18n from '@/lib/i18n';

/** Translation key for each subject tag, so labels follow the active language. */
export const CONTACT_SUBJECT_KEYS = {
  general: 'contact.subject_general',
  order_issue: 'contact.subject_order_issue',
  refund: 'contact.subject_refund',
  partnership: 'contact.subject_partnership',
} as const;

export type ContactSubject = keyof typeof CONTACT_SUBJECT_KEYS;

export const CONTACT_SUBJECTS = (
  Object.keys(CONTACT_SUBJECT_KEYS) as ContactSubject[]
).map((value) => ({ value, labelKey: CONTACT_SUBJECT_KEYS[value] }));

/**
 * Zod messages are resolved lazily: the schema is created once at module load,
 * but the active language can change at runtime.
 */
function msg(key: string, fallback: string): string {
  return i18n.t(key) || fallback;
}

export const contactFormSchema = z.object({
  email: z
    .string()
    .min(1, msg('validation.email_required', 'Enter your email'))
    .email(msg('validation.email_invalid', 'Invalid email'))
    .max(254, msg('validation.email_too_long', 'Email is too long')),
  name: z
    .string()
    .min(1, msg('validation.name_required', 'Enter your name'))
    .max(120, msg('validation.name_too_long', 'Name is too long')),
  subject: z.enum(['general', 'order_issue', 'refund', 'partnership'], {
    message: msg('validation.subject_required', 'Select a topic'),
  }),
  message: z
    .string()
    .min(10, msg('validation.message_too_short', 'Message is too short'))
    .max(4000, msg('validation.message_too_long', 'Message is too long')),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** Maps a ZodError to `{ field: message }` for inline field errors. */
export function fieldErrors(
  error: z.ZodError,
): Partial<Record<keyof ContactFormValues, string>> {
  const result: Partial<Record<keyof ContactFormValues, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in result)) {
      result[field as keyof ContactFormValues] = issue.message;
    }
  }
  return result;
}