import { Link } from '@tanstack/react-router';
import { AuthCard } from '@/components/auth/auth-card';
import { FormError } from '@/components/shared/form-error';
import { FormSuccess } from '@/components/shared/form-success';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { websiteConfig } from '@/config/website';
import { authClient } from '@/auth/client';
import { cn } from '@/lib/utils';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/lib/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { messages } from '@/messages';
import * as z from 'zod';
import { SocialLoginButton } from './social-login-button';

const m = messages.auth.login;

interface LoginFormProps {
  className?: string;
  callbackUrl?: string;
  onSuccess?: () => void;
}

export function LoginForm({
  className,
  callbackUrl: propCallbackUrl,
  onSuccess,
}: LoginFormProps) {
  const paramCallbackUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('callbackUrl')
      : null;
  const defaultCallbackUrl = DEFAULT_LOGIN_REDIRECT;
  const callbackUrl =
    propCallbackUrl ??
    (paramCallbackUrl ? paramCallbackUrl : defaultCallbackUrl);

  const [error, setError] = useState<string | undefined>(undefined);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const credentialLoginEnabled =
    websiteConfig.auth?.enableCredentialLogin ?? false;

  const LoginSchema = z.object({
    email: z.email({ message: m.emailRequired }),
    password: z.string().min(1, { message: m.passwordRequired }),
  });

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null;

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: callbackUrl,
      },
      {
        onRequest: () => {
          setIsPending(true);
          setError('');
          setSuccess('');
        },
        onResponse: () => setIsPending(false),
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (ctx) => {
          const code = ctx.error.code;
          const friendlyMessage =
            code && messages.auth.error.codes[code]
              ? messages.auth.error.codes[code]
              : ctx.error.message;
          setError(friendlyMessage);
        },
      }
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <AuthCard
      headerLabel={m.welcomeBack}
      bottomButtonLabel={m.signUpHint}
      bottomButtonHref={Routes.Register}
      className={cn('', className)}
    >
      {credentialLoginEnabled && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{m.email}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={m.placeholderEmail}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>{m.password}</FormLabel>
                      <Link
                        to={Routes.ForgotPassword}
                        className="text-xs font-normal text-muted-foreground hover:underline hover:underline-offset-4 hover:text-primary"
                      >
                        {m.forgotPassword}
                      </Link>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder={m.placeholderPassword}
                          type={showPassword ? 'text' : 'password'}
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 border-0 bg-transparent hover:bg-transparent hover:opacity-70 dark:hover:bg-transparent"
                        onClick={togglePasswordVisibility}
                        disabled={isPending}
                      >
                        {showPassword ? (
                          <IconEyeOff className="size-4 text-muted-foreground" />
                        ) : (
                          <IconEye className="size-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showPassword ? m.hidePassword : m.showPassword}
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormError message={error || urlError || undefined} />
            <FormSuccess message={success} />
            <Button
              disabled={isPending}
              size="lg"
              type="submit"
              className="w-full flex items-center justify-center gap-2"
            >
              {isPending && <IconLoader2 className="size-4 animate-spin" />}
              <span>{m.signIn}</span>
            </Button>
          </form>
        </Form>
      )}
      <div className="mt-4">
        <SocialLoginButton
          callbackUrl={callbackUrl}
          showDivider={credentialLoginEnabled}
        />
      </div>
    </AuthCard>
  );
}
