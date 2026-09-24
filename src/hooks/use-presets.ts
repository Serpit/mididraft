import {
  listPresets,
  createPreset,
  updatePreset,
  deletePreset,
} from '@/api/presets';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Server functions take their input under `data`.
type CreateInput = Parameters<typeof createPreset>[0]['data'];
type UpdateInput = Parameters<typeof updatePreset>[0]['data'];
type DeleteInput = Parameters<typeof deletePreset>[0]['data'];

export function usePresets(enabled: boolean) {
  return useQuery({
    queryKey: ['presets'],
    queryFn: () => listPresets(),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createPreset({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updatePreset({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deletePreset({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });
}
