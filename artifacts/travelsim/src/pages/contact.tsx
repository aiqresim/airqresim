import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateContactMessage } from '@workspace/api-client-react';
import { CheckCircle2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScaleIn } from '@/components/motion';
import { toast } from '@/hooks/use-toast';
import {
  CONTACT_SUBJECTS,
  contactFormSchema,
  fieldErrors,
  type ContactFormValues,
} from '@/lib/contact-schema';
import { errorMessage } from '@/lib/format';

type Errors = Partial<Record<keyof ContactFormValues, string>>;

const EMPTY: ContactFormValues = {
  email: '',
  name: '',
  subject: 'general',
  message: '',
};

export default function Contact() {
  const { t } = useTranslation();
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [isSent, setIsSent] = useState(false);

  const createMessage = useCreateContactMessage();

  function update<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear the field error as soon as the user edits that field.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast({
        title: t('contact.toast_invalid'),
        description: t('contact.toast_invalid_body'),
      });
      return;
    }

    try {
      await createMessage.mutateAsync({ data: parsed.data });
      setIsSent(true);
      toast({
        title: t('contact.toast_success'),
        description: t('contact.success_body'),
      });
    } catch (error) {
      toast({
        title: t('contact.toast_fail'),
        description: errorMessage(error, t('contact.toast_fail_body')),
      });
    }
  }

  if (isSent) {
    return (
      <div className="page-shell py-20">
        <ScaleIn className="mx-auto max-w-md text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="display mt-5 text-3xl font-bold">{t('contact.success_title')}</h1>
          <p className="mt-3 text-muted-foreground">
            {t('contact.success_body')}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setValues(EMPTY);
              setIsSent(false);
            }}
          >
            {t('contact.send_another')}
          </Button>
        </ScaleIn>
      </div>
    );
  }
  return (
    <div className="page-shell py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="display text-4xl font-bold">{t('contact.title')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('contact.subtitle')}
        </p>
      </header>

      <Card className="mx-auto mt-10 max-w-xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('contact.name_label')}</Label>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive">{errors.name}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('contact.email_label')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => update('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t('contact.subject_label')}</Label>
              <Select
                value={values.subject}
                onValueChange={(value) =>
                  update('subject', value as ContactFormValues['subject'])
                }
              >
                <SelectTrigger id="subject" aria-invalid={Boolean(errors.subject)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {t(subject.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject ? (
                <p className="text-xs text-destructive">{errors.subject}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t('contact.message_label')}</Label>
              <Textarea
                id="message"
                rows={6}
                value={values.message}
                onChange={(event) => update('message', event.target.value)}
                placeholder={t('contact.message_placeholder')}
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message ? (
                <p className="text-xs text-destructive">{errors.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t('contact.message_hint')}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={createMessage.isPending}
            >
              <Send />
              {createMessage.isPending ? t('contact.sending') : t('contact.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}