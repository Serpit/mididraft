import EmailLayout from '../components/email-layout';
import { Text } from '@react-email/components';
import { messages } from '@/messages';

const m = messages.mail.contactMessage;

interface ContactMessageProps {
  name: string;
  email: string;
  message: string;
}

export default function ContactMessage({
  name,
  email,
  message,
}: ContactMessageProps) {
  return (
    <EmailLayout>
      <Text>
        {m.name} {name}
      </Text>
      <Text>
        {m.email} {email}
      </Text>
      <Text>
        {m.message} {message}
      </Text>
    </EmailLayout>
  );
}
