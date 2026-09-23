'use client';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserFiles } from '@/db/types';
import { formatBytes, formatDate } from '@/lib/formatter';
import { getFileAccessUrl } from '@/lib/urls';
import { cn } from '@/lib/utils';
import { messages } from '@/messages';
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  IconDots,
  IconExternalLink,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';

const t = messages.settings.files;

function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <TableRow className="h-14">
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index} className="py-3">
          <Skeleton className="h-4 w-24" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function toDate(value: number | Date | undefined | null): Date | null {
  if (value == null) return null;
  return value instanceof Date ? value : new Date(value);
}

interface FilesTableProps {
  data: UserFiles[];
  total: number;
  pageIndex: number;
  pageSize: number;
  loading?: boolean;
  uploading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDelete: (id: string) => void;
  onUpload: (params: {
    file: File;
    isPublic?: boolean;
    description?: string;
  }) => Promise<void>;
}

export function FilesTable({
  data,
  total,
  pageIndex,
  pageSize,
  loading,
  uploading,
  onPageChange,
  onPageSizeChange,
  onDelete,
  onUpload,
}: FilesTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState('');

  const columns: ColumnDef<UserFiles>[] = useMemo(
    () => [
      {
        id: 'originalName',
        accessorKey: 'originalName',
        header: t.columns.originalName,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.originalName ?? '—'}
          </span>
        ),
        minSize: 140,
        size: 180,
        enableSorting: false,
      },
      {
        id: 'contentType',
        accessorKey: 'contentType',
        header: t.columns.contentType,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.contentType ?? '—'}
          </span>
        ),
        minSize: 100,
        size: 120,
        enableSorting: false,
      },
      {
        id: 'size',
        accessorKey: 'size',
        header: t.columns.size,
        cell: ({ row }) => formatBytes(row.original.size ?? 0),
        minSize: 80,
        size: 100,
        enableSorting: false,
      },
      {
        id: 'isPublic',
        accessorKey: 'isPublic',
        header: t.columns.isPublic,
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              row.original.isPublic
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {row.original.isPublic ? 'Public' : 'Private'}
          </span>
        ),
        minSize: 80,
        size: 90,
        enableSorting: false,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: t.columns.createdAt,
        cell: ({ row }) => {
          const d = toDate(row.original.createdAt ?? null);
          return d ? formatDate(d) : '—';
        },
        minSize: 110,
        size: 120,
        enableSorting: false,
      },
      {
        id: 'accessLink',
        header: t.columns.accessLink,
        cell: ({ row }) => {
          const url = getFileAccessUrl(row.original.r2Key);
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'h-8 gap-1'
              )}
            >
              <IconExternalLink className="size-3.5" />
              {t.openLink}
            </a>
          );
        },
        minSize: 100,
        size: 110,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: t.columns.actions,
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' })
                )}
              >
                <IconDots className="size-4" />
                <span className="sr-only">{t.columns.actions}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDelete(id)}>
                  <IconTrash className="mr-2 size-4" />
                  {t.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        minSize: 80,
        size: 100,
        enableSorting: false,
      },
    ],
    [onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    state: {
      columnFilters: [],
      columnVisibility,
      pagination: { pageIndex, pageSize },
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize })
          : updater;
      if (next.pageSize !== pageSize) {
        onPageSizeChange(next.pageSize);
        if (pageIndex !== 0) onPageChange(0);
      } else if (next.pageIndex !== pageIndex) {
        onPageChange(next.pageIndex);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    enableMultiSort: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload({
      file: selectedFile,
      isPublic,
      description: description || undefined,
    });
    setSelectedFile(null);
    setDescription('');
    setIsPublic(false);
    setUploadOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file ?? null);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: 'default', size: 'default' })
            )}
          >
            <IconPlus className="size-4" />
            {t.uploadButton}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.uploadDialogTitle}</DialogTitle>
              <DialogDescription>{t.uploadDialogDescription}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file-input">{t.fileLabel}</Label>
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {selectedFile && (
                  <span className="text-muted-foreground text-sm">
                    {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public">{t.isPublicLabel}</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t.descriptionLabel}</Label>
                <Input
                  id="description"
                  placeholder={t.descriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? t.uploading : t.upload}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRowSkeleton key={index} columns={columns.length} />
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? 'selected' : undefined}
                    className="h-14"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {t.noResults}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} className="px-0" />
      </div>
    </div>
  );
}
