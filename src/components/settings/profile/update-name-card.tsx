import { messages } from '@/messages';
import { FormError } from '@/components/shared/form-error';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/auth/client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface UpdateNameCardProps {
  className?: string;
}

const m = messages.settings.profile.name;

const nameSchema = z.object({
  name: z
    .string()
    .min(3, { message: m.minLength })
    .max(30, { message: m.maxLength }),
});

export function UpdateNameCard({ className }: UpdateNameCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { data: session, refetch } = authClient.useSession();

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: session?.user?.name || '' },
  });

  useEffect(() => {
    if (session?.user?.name) form.setValue('name', session.user.name);
  }, [session, form]);

  const user = session?.user;
  if (!user) return null;

  const onSubmit = async (values: z.infer<typeof nameSchema>) => {
    if (values.name === session?.user?.name) return;
    await authClient.updateUser(
      { name: values.name },
      {
        onRequest: () => {
          setIsSaving(true);
          setError('');
        },
        onResponse: () => {
          setIsSaving(false);
        },
        onSuccess: () => {
          toast.success(m.success);
          refetch();
          form.reset({ name: values.name });
        },
        onError: (ctx) => {
          setError(`${ctx.error.status}: ${ctx.error.message}`);
          toast.error(m.fail);
        },
      }
    );
  };

  return (
    <Card
      className={cn(
        'w-full overflow-hidden pt-6 pb-0 flex flex-col',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{m.title}</CardTitle>
        <CardDescription>{m.description}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col flex-1"
        >
          <CardContent className="space-y-4 flex-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{m.title}</FormLabel>
                  <FormControl>
                    <Input placeholder={m.placeholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormError message={error} />
          </CardContent>
          <CardFooter className="mt-6 px-6 py-4 flex justify-between items-center bg-muted rounded-none">
            <p className="text-sm text-muted-foreground">{m.hint}</p>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? m.saving : m.save}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
