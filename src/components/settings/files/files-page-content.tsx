import { FilesTable } from '@/components/settings/files/files-table';
import {
  useDeleteUserFile,
  useUploadUserFile,
  useUserFiles,
} from '@/hooks/use-user-files';
import { messages } from '@/messages';
import { toast } from 'sonner';
import { useState } from 'react';

const t = messages.settings.files;

export function FilesPageContent() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useUserFiles(page, pageSize);
  const uploadMutation = useUploadUserFile();
  const deleteMutation = useDeleteUserFile();

  const handleUpload = (params: {
    file: File;
    isPublic?: boolean;
    description?: string;
  }) =>
    new Promise<void>((resolve, reject) => {
      uploadMutation.mutate(params, {
        onSuccess: () => {
          toast.success(t.uploadSuccess);
          resolve();
        },
        onError: (err) => {
          toast.error(err.message || t.uploadError);
          reject(err);
        },
      });
    });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(t.deleteSuccess),
      onError: () => toast.error(t.deleteError),
    });
  };

  return (
    <FilesTable
      data={data?.items ?? []}
      total={data?.total ?? 0}
      pageIndex={page}
      pageSize={pageSize}
      loading={isLoading}
      uploading={uploadMutation.isPending}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(0);
      }}
      onDelete={handleDelete}
      onUpload={handleUpload}
    />
  );
}
