import { createServerFn } from '@tanstack/react-start';
import { websiteConfig } from '@/config/website';
import { sendEmail } from '@/mail';
import { messages } from '@/messages';
import { z } from 'zod';

const m = messages.contact;

const schema = z.object({
  name: z.string().min(3, m.nameMin).max(30, m.nameMax),
  email: z.email(m.emailInvalid),
  message: z.string().min(10, m.messageMin).max(500, m.messageMax),
});

export const sendContactMessage = createServerFn({ method: 'POST' })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const supportEmail = websiteConfig.mail?.supportEmail;
    if (!supportEmail) {
      throw new Error('Contact form is not configured');
    }
    const result = await sendEmail({
      to: supportEmail,
      template: 'contactMessage',
      context: {
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      },
    });
    if (!result.success) {
      throw new Error('Failed to send the message');
    }
  });
