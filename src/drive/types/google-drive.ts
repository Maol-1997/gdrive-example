import { Buffer } from 'buffer';
import { z } from 'zod';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  trashed?: boolean;
  starred?: boolean;
  shared?: boolean;
}

export interface ListFilesResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

export interface UploadFileRequest {
  name: string;
  mimeType: string;
  content: Buffer | string;
  folderId?: string;
}

export interface UpdateFileRequest {
  fileId: string;
  name?: string;
  addParents?: string[];
  removeParents?: string[];
}

export const FileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  content: z.union([z.instanceof(Buffer), z.string()]),
  folderId: z.string().optional(),
});

export const FileUpdateSchema = z.object({
  fileId: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  addParents: z.array(z.string()).optional(),
  removeParents: z.array(z.string()).optional(),
});

export const FileIdSchema = z.object({
  fileId: z.string().min(1),
});

export const ListFilesSchema = z.object({
  pageSize: z.number().min(1).max(100).default(20),
  pageToken: z.string().optional(),
  query: z.string().optional(),
  orderBy: z.string().optional(),
  folderId: z.string().optional(),
});

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export interface FolderInfo {
  id: string;
  name: string;
  parents?: string[];
}
