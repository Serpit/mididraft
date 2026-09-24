import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePresets,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
} from '@/hooks/use-presets';
import type { CleanupOptions, TranscribeOptions } from '@/lib/midi/types';
import { track } from '@/lib/analytics/events';
import { IconDeviceFloppy, IconTrash } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface PresetControlsProps {
  detection: TranscribeOptions;
  cleanup: CleanupOptions;
  bpm: number;
  onApply: (settings: {
    detection: TranscribeOptions;
    cleanup: CleanupOptions;
    bpm: number;
  }) => void;
}

export function PresetControls({
  detection,
  cleanup,
  bpm,
  onApply,
}: PresetControlsProps) {
  const { data: presets, isLoading } = usePresets(true);
  const createMutation = useCreatePreset();
  const updateMutation = useUpdatePreset();
  const deleteMutation = useDeletePreset();

  const [selectedId, setSelectedId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const currentSettings = {
    transcribe: detection,
    cleanup,
    bpm,
  };

  const handleSelect = useCallback(
    (id: string | null) => {
      if (!id) return;
      setSelectedId(id);
      const preset = presets?.find((p) => p.id === id);
      if (preset) {
        onApply({
          detection: preset.settings.transcribe,
          cleanup: preset.settings.cleanup,
          bpm: preset.settings.bpm,
        });
        track('preset_applied', { preset_id: id });
      }
    },
    [presets, onApply]
  );

  const handleSave = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: newName.trim(),
        settings: currentSettings,
      });
      setNewName('');
      setShowSaveForm(false);
      track('preset_created');
      toast.success('Preset saved');
    } catch {
      toast.error('Could not save preset');
    }
  }, [newName, currentSettings, createMutation]);

  const handleUpdate = useCallback(async () => {
    if (!selectedId) return;
    const preset = presets?.find((p) => p.id === selectedId);
    if (!preset) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        name: preset.name,
        settings: currentSettings,
      });
      track('preset_updated', { preset_id: selectedId });
      toast.success('Preset updated');
    } catch {
      toast.error('Could not update preset');
    }
  }, [selectedId, presets, currentSettings, updateMutation]);

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    try {
      await deleteMutation.mutateAsync({ id: selectedId });
      track('preset_deleted', { preset_id: selectedId });
      setSelectedId('');
      toast.success('Preset deleted');
    } catch {
      toast.error('Could not delete preset');
    }
  }, [selectedId, deleteMutation]);

  return (
    <div className="space-y-4 rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Cleanup presets</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full"
          onClick={() => setShowSaveForm(!showSaveForm)}
        >
          <IconDeviceFloppy className="mr-1.5 size-3.5" />
          Save current
        </Button>
      </div>

      {showSaveForm && (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Preset name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9"
          />
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-full px-4"
            onClick={handleSave}
            disabled={!newName.trim() || createMutation.isPending}
          >
            Save
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select value={selectedId} onValueChange={handleSelect}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Load a preset…" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Loading…
              </SelectItem>
            ) : presets && presets.length > 0 ? (
              presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No presets yet
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {selectedId && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full px-3"
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              Update
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <IconTrash className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
