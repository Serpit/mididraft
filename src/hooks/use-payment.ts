import { getCurrentPlan } from '@/api/payment';
import { useQuery } from '@tanstack/react-query';

export function useCurrentPlan(enabled = true) {
  const query = useQuery({
    queryKey: ['currentPlan'],
    queryFn: async () => {
      return getCurrentPlan();
    },
    enabled,
    refetchOnWindowFocus: true,
  });

  const planId = query.data?.currentPlan?.id ?? 'free';

  return {
    ...query,
    planId,
    isPass: planId === 'pass',
    isPro: planId === 'pro',
    hasBatchAccess: planId === 'pass' || planId === 'pro',
    hasPresetAccess: planId === 'pro',
  };
}
