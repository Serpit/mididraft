import EmailButton from '../components/email-button';
import EmailLayout from '../components/email-layout';
import { Text } from '@react-email/components';
import { messages } from '@/messages';

const m = messages.mail.verifyEmail;

interface VerifyEmailProps {
  url: string;
  name: string;
}

export default function VerifyEmail({ url, name }: VerifyEmailProps) {
  return (
    <EmailLayout>
      <Text>
        {m.greeting} {name}.
      </Text>
      <Text>{m.body}</Text>
      <EmailButton href={url}>{m.button}</EmailButton>
    </EmailLayout>
  );
}
