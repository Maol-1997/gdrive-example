'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DriveFile } from '../types/google-drive'
import { FileActions } from './file-actions'
import {
  FileIcon,
  FolderIcon,
  ImageIcon,
  FileTextIcon,
  FileVideoIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FileListProps {
  files: DriveFile[]
  loading?: boolean
  onRefresh?: () => void
  onFileUpdate?: (fileId: string, newName: string) => void
  onFileDelete?: (fileId: string) => void
  onFolderClick?: (folderId: string) => void
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('folder'))
    return <FolderIcon className="h-4 w-4 text-muted-foreground" />
  if (mimeType.includes('image'))
    return <ImageIcon className="h-4 w-4 text-muted-foreground" />
  if (mimeType.includes('video'))
    return <FileVideoIcon className="h-4 w-4 text-muted-foreground" />
  if (mimeType.includes('text') || mimeType.includes('document'))
    return <FileTextIcon className="h-4 w-4 text-muted-foreground" />
  return <FileIcon className="h-4 w-4 text-muted-foreground" />
}

function formatFileSize(bytes?: string): string {
  if (!bytes) return '-'
  const size = parseInt(bytes)
  if (size === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  return `${parseFloat((size / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function FileList({
  files,
  loading = false,
  onRefresh,
  onFileUpdate,
  onFileDelete,
  onFolderClick,
}: FileListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleEdit = (file: DriveFile) => {
    setEditingId(file.id)
    setEditingName(file.name)
  }

  const handleSave = async () => {
    if (editingId && onFileUpdate) {
      await onFileUpdate(editingId, editingName)
      setEditingId(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingName('')
  }

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(8)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[200px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[60px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No files found</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" className="mt-4">
            Refresh
          </Button>
        )}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => {
          const isFolder =
            file.mimeType === 'application/vnd.google-apps.folder'
          return (
            <TableRow
              key={file.id}
              className={isFolder ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={(e) => {
                // Check if click is not on actions button or its children
                const target = e.target as HTMLElement
                const isActionsClick =
                  target.closest('button[aria-haspopup="menu"]') ||
                  target.closest('[role="menu"]')

                if (isFolder && !isActionsClick && editingId !== file.id) {
                  onFolderClick?.(file.id)
                }
              }}
            >
              <TableCell>{getFileIcon(file.mimeType)}</TableCell>
              <TableCell>
                {editingId === file.id ? (
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancel()
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSave}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <span className="font-medium">{file.name}</span>
                )}
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>
                {file.modifiedTime
                  ? formatDistanceToNow(new Date(file.modifiedTime), {
                      addSuffix: true,
                    })
                  : '-'}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <FileActions
                  file={file}
                  onEdit={() => handleEdit(file)}
                  onDelete={() => onFileDelete?.(file.id)}
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
