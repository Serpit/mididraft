import { AuthCard } from '@/components/auth/auth-card';
import { messages } from '@/messages';
import { Routes } from '@/lib/routes';
import { IconAlertTriangle } from '@tabler/icons-react';

const m = messages.auth.error;

function getDisplayMessage(
  errorCode: string | undefined,
  errorDescription: string | undefined
): string {
  if (errorCode && m.codes[errorCode]) {
    return m.codes[errorCode];
  }
  if (errorDescription) {
    return errorDescription;
  }
  if (errorCode) {
    return errorCode;
  }
  return m.tryAgain;
}

export function ErrorCard({
  errorCode,
  errorDescription,
}: {
  errorCode?: string;
  errorDescription?: string;
} = {}) {
  const displayMessage = getDisplayMessage(errorCode, errorDescription);

  return (
    <AuthCard
      headerLabel={m.title}
      bottomButtonHref={Routes.Login}
      bottomButtonLabel={m.backToLogin}
      className="border-none"
    >
      <div className="w-full flex flex-col justify-center items-center py-4 gap-2">
        <div className="flex items-center gap-2">
          <IconAlertTriangle className="text-destructive size-4 shrink-0" />
          <p className="font-medium text-destructive text-center">
            {displayMessage}
          </p>
        </div>
      </div>
    </AuthCard>
  );
}
