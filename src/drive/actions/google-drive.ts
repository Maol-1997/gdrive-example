'use server'

import {
  getDriveClient,
  driveFolderId,
  isSharedDrive,
} from '../lib/google-drive-client'
import type { drive_v3 } from 'googleapis'
import {
  DriveFile,
  ListFilesResponse,
  FileUpdateSchema,
  FileIdSchema,
  ListFilesSchema,
  BreadcrumbItem,
  FolderInfo,
} from '../types/google-drive'
import { Readable } from 'stream'

export async function listFiles(params?: {
  pageSize?: number
  pageToken?: string
  query?: string
  orderBy?: string
  folderId?: string
}): Promise<ListFilesResponse> {
  try {
    const validatedParams = ListFilesSchema.parse(params || {})
    const drive = await getDriveClient()

    let query = validatedParams.query || ''
    const parentFolderId = validatedParams.folderId || driveFolderId
    const useSharedDrive = isSharedDrive

    if (parentFolderId) {
      const folderQuery = `'${parentFolderId}' in parents`
      query = query ? `${query} and ${folderQuery}` : folderQuery
    }

    query = query ? `${query} and trashed=false` : 'trashed=false'

    const listParams: drive_v3.Params$Resource$Files$List = {
      pageSize: validatedParams.pageSize,
      pageToken: validatedParams.pageToken,
      q: query,
      orderBy: validatedParams.orderBy || 'modifiedTime desc',
      fields:
        'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink, trashed, starred, shared)',
    }

    if (useSharedDrive) {
      listParams.supportsAllDrives = true
      listParams.includeItemsFromAllDrives = true
      const rootFolderId = driveFolderId
      if (rootFolderId && !validatedParams.folderId) {
        listParams.corpora = 'drive'
        listParams.driveId = rootFolderId
      }
    } else if (parentFolderId) {
      listParams.supportsAllDrives = true
      listParams.includeItemsFromAllDrives = true
    }

    const response = await drive.files.list(listParams)

    // Sort files to show folders first
    const files = (response.data.files || []) as DriveFile[]
    files.sort((a, b) => {
      const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder'
      const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder'

      if (aIsFolder && !bIsFolder) return -1
      if (!aIsFolder && bIsFolder) return 1

      // If both are folders or both are files, sort by name
      return a.name.localeCompare(b.name)
    })

    return {
      files,
      nextPageToken: response.data.nextPageToken || undefined,
    }
  } catch (error) {
    console.error('Error listing files:', error)
    throw new Error('Failed to list files from Google Drive')
  }
}

export async function uploadFile(formData: FormData): Promise<DriveFile> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No file provided')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const drive = await getDriveClient()

    const folderId =
      (formData.get('folderId') as string | null) || driveFolderId

    const fileMetadata: drive_v3.Schema$File = {
      name: file.name,
    }

    if (folderId) {
      fileMetadata.parents = [folderId]
    }

    const createParams: drive_v3.Params$Resource$Files$Create = {
      requestBody: fileMetadata,
      media: {
        mimeType: file.type,
        body: Readable.from(buffer),
      },
      fields:
        'id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink',
      supportsAllDrives: true, // Always include this to support both regular and shared drives
    }

    const response = await drive.files.create(createParams)

    return response.data as DriveFile
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload file to Google Drive')
  }
}

export async function updateFile(
  fileId: string,
  updates: { name?: string; addParents?: string[]; removeParents?: string[] },
): Promise<DriveFile> {
  try {
    const validated = FileUpdateSchema.parse({ fileId, ...updates })
    const drive = await getDriveClient()

    const updateParams: drive_v3.Params$Resource$Files$Update = {
      fileId: validated.fileId,
      fields:
        'id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink',
      supportsAllDrives: true, // Always include this to support both regular and shared drives
    }

    if (validated.name) {
      updateParams.requestBody = { name: validated.name }
    }

    if (validated.addParents) {
      updateParams.addParents = validated.addParents.join(',')
    }

    if (validated.removeParents) {
      updateParams.removeParents = validated.removeParents.join(',')
    }

    const response = await drive.files.update(updateParams)

    return response.data as DriveFile
  } catch (error) {
    console.error('Error updating file:', error)
    throw new Error('Failed to update file in Google Drive')
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    const validated = FileIdSchema.parse({ fileId })
    const drive = await getDriveClient()

    // First, try to get file info to check if we own it or have permissions
    const fileInfo = await drive.files.get({
      fileId: validated.fileId,
      fields: 'id, name, ownedByMe, capabilities, trashed, parents',
      supportsAllDrives: true,
    })

    console.log('File info before delete:', {
      id: fileInfo.data.id,
      name: fileInfo.data.name,
      ownedByMe: fileInfo.data.ownedByMe,
      canDelete: fileInfo.data.capabilities?.canDelete,
      canTrash: fileInfo.data.capabilities?.canTrash,
      canRemoveMyDriveParent:
        fileInfo.data.capabilities?.canRemoveMyDriveParent,
      trashed: fileInfo.data.trashed,
    })

    // If file is already trashed, try to permanently delete it if we can
    if (fileInfo.data.trashed) {
      if (fileInfo.data.capabilities?.canDelete) {
        await drive.files.delete({
          fileId: validated.fileId,
          supportsAllDrives: true,
        })
        return
      } else {
        // File is already in trash, consider it deleted from the user's perspective
        console.log('File is already in trash, skipping further deletion')
        return
      }
    }

    // If we can delete, delete it
    if (fileInfo.data.capabilities?.canDelete) {
      await drive.files.delete({
        fileId: validated.fileId,
        supportsAllDrives: true,
      })
      return
    }

    // If we can trash it, move it to trash
    if (fileInfo.data.capabilities?.canTrash) {
      await drive.files.update({
        fileId: validated.fileId,
        requestBody: {
          trashed: true,
        },
        supportsAllDrives: true,
      })
      return
    }

    // If we can remove it from our drive (for shared files)
    if (
      fileInfo.data.capabilities?.canRemoveMyDriveParent &&
      fileInfo.data.parents
    ) {
      await drive.files.update({
        fileId: validated.fileId,
        removeParents: fileInfo.data.parents.join(','),
        supportsAllDrives: true,
      })
      return
    }

    // If none of the above work, we don't have permission
    throw new Error('You do not have permission to delete or remove this file')
  } catch (error) {
    console.error('Error in deleteFile:', error)

    const message = error instanceof Error ? error.message : undefined
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: number }).code
        : undefined

    if (
      message &&
      (message.includes('You do not have permission') ||
        message.includes('already in trash'))
    ) {
      throw error instanceof Error ? error : new Error(message)
    }

    if (code === 403) {
      throw new Error('You do not have permission to delete this file')
    }

    if (code === 404) {
      throw new Error('File not found')
    }

    throw new Error(message || 'Failed to delete file from Google Drive')
  }
}

export async function downloadFile(
  fileId: string,
): Promise<{ url: string; name: string }> {
  try {
    const validated = FileIdSchema.parse({ fileId })
    const drive = await getDriveClient()

    const getParams: drive_v3.Params$Resource$Files$Get = {
      fileId: validated.fileId,
      fields: 'id, name, webContentLink',
      supportsAllDrives: true, // Always include this to support both regular and shared drives
    }

    const response = await drive.files.get(getParams)

    if (!response.data.webContentLink) {
      throw new Error('File cannot be downloaded')
    }

    return {
      url: response.data.webContentLink,
      name: response.data.name || 'download',
    }
  } catch (error) {
    console.error('Error getting download URL:', error)
    throw new Error('Failed to get download URL from Google Drive')
  }
}

export async function getFolderInfo(
  folderId: string,
): Promise<FolderInfo | null> {
  try {
    const drive = await getDriveClient()

    const getParams: drive_v3.Params$Resource$Files$Get = {
      fileId: folderId,
      fields: 'id, name, parents',
      supportsAllDrives: true, // Always include this to support both regular and shared drives
    }

    const response = await drive.files.get(getParams)

    return {
      id: response.data.id!,
      name: response.data.name!,
      parents: response.data.parents || undefined,
    }
  } catch (error) {
    console.error('Error getting folder info:', error)
    return null
  }
}

export async function getBreadcrumbs(
  folderId: string | null,
): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = []
  let currentId = folderId

  const rootFolderId = driveFolderId
  const rootName = isSharedDrive ? 'Shared Drive' : 'My Drive'

  if (!currentId || currentId === rootFolderId) {
    return [{ id: rootFolderId || 'root', name: rootName }]
  }

  while (currentId && currentId !== rootFolderId) {
    const folderInfo = await getFolderInfo(currentId)
    if (!folderInfo) break

    breadcrumbs.unshift({
      id: folderInfo.id,
      name: folderInfo.name,
    })

    currentId = folderInfo.parents?.[0] || null
  }

  breadcrumbs.unshift({ id: rootFolderId || 'root', name: rootName })

  return breadcrumbs
}

export async function searchFiles(
  query: string,
  currentFolderId?: string,
): Promise<DriveFile[]> {
  try {
    const drive = await getDriveClient()
    const folderId = currentFolderId || driveFolderId

    let searchQuery = `name contains '${query}' and trashed=false`

    if (folderId) {
      searchQuery = `${searchQuery} and '${folderId}' in parents`
    }

    const searchParams: drive_v3.Params$Resource$Files$List = {
      q: searchQuery,
      pageSize: 20,
      orderBy: 'modifiedTime desc',
      fields:
        'files(id, name, mimeType, size, modifiedTime, createdTime, parents, webViewLink, webContentLink, iconLink, thumbnailLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    }

    // Only use corpora and driveId for the root shared drive, not for subfolders
    if (isSharedDrive && driveFolderId && !currentFolderId) {
      searchParams.corpora = 'drive'
      searchParams.driveId = driveFolderId
    }

    const response = await drive.files.list(searchParams)

    return (response.data.files || []) as DriveFile[]
  } catch (error) {
    console.error('Error searching files:', error)
    throw new Error('Failed to search files in Google Drive')
  }
}
