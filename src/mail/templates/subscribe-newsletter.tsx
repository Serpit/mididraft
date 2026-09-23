import EmailLayout from '../components/email-layout';
import { Heading, Text } from '@react-email/components';
import { messages } from '@/messages';

const m = messages.mail.subscribeNewsletter;

export default function SubscribeNewsletter() {
  return (
    <EmailLayout>
      <Heading className="text-xl">{m.title}</Heading>
      <Text>{m.body}</Text>
    </EmailLayout>
  );
}
