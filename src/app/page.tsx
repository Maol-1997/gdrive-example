'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { FileList } from '@/drive/components/file-list'
import { FileUpload } from '@/drive/components/file-upload'
import { FileSearch } from '@/drive/components/file-search'
import { Breadcrumbs } from '@/drive/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { RefreshCw } from 'lucide-react'
import {
  listFiles,
  searchFiles,
  updateFile,
  deleteFile,
  getBreadcrumbs,
  getFolderInfo,
} from '@/drive/actions/google-drive'
import { DriveFile, BreadcrumbItem } from '@/drive/types/google-drive'
import {
  extractFolderIdFromPath,
  buildUrlPath,
} from '@/drive/utils/url-helpers'

export default function DrivePage() {
  const router = useRouter()
  const pathArray: string[] = [] // Root page has no path
  const [searchQuery, setSearchQuery] = useState('')
  const [files, setFiles] = useState<DriveFile[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [folderPath, setFolderPath] = useState<string[]>([])
  const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false)
  const [navigating, setNavigating] = useState(false)

  const { data, error, isLoading, mutate } = useSWR(
    searchQuery
      ? ['search', searchQuery, currentFolderId]
      : ['files', currentFolderId],
    async () => {
      if (searchQuery) {
        return await searchFiles(searchQuery, currentFolderId || undefined)
      }
      const response = await listFiles({
        folderId: currentFolderId || undefined,
      })
      return response.files
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // Initialize folder from URL path
  useEffect(() => {
    async function initializeFromPath() {
      if (pathArray.length === 0) {
        setCurrentFolderId(null)
        setBreadcrumbs([])
        setFolderPath([])
        setBreadcrumbsLoading(false)
        return
      }

      setBreadcrumbsLoading(true)

      // Extract folder ID from the last segment (handles both ID and slug-ID format)
      const lastSegment = pathArray[pathArray.length - 1]
      const folderId = extractFolderIdFromPath(lastSegment)
      setCurrentFolderId(folderId)

      // Fetch breadcrumbs
      const crumbs = await getBreadcrumbs(folderId)
      setBreadcrumbs(crumbs)

      // Build folder path for URL
      const path: string[] = []
      for (const crumb of crumbs.slice(1)) {
        // Skip root
        path.push(crumb.id)
      }
      setFolderPath(path)
      setBreadcrumbsLoading(false)
    }
    initializeFromPath()
  }, [pathArray.join('/')]) // Use joined string as dependency

  useEffect(() => {
    if (data) {
      setFiles(data)
      setNavigating(false)
    }
  }, [data])

  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  const handleFileUpdate = useCallback(
    async (fileId: string, newName: string) => {
      try {
        await updateFile(fileId, { name: newName })
        mutate()
      } catch (error) {
        console.error('Failed to update file:', error)
      }
    },
    [mutate],
  )

  const handleFileDelete = useCallback(
    async (fileId: string) => {
      try {
        await deleteFile(fileId)
        mutate()
      } catch (error) {
        console.error('Failed to delete file:', error)
      }
    },
    [mutate],
  )

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFolderClick = useCallback(
    async (folderId: string) => {
      setNavigating(true)
      // Get folder info to build a readable URL
      const folderInfo = await getFolderInfo(folderId)
      if (!folderInfo) {
        // Fallback to just ID
        const newPath = [...folderPath, folderId]
        router.push(`/${newPath.join('/')}`)
      } else {
        // Build path with readable folder names
        const newBreadcrumbs = [
          ...breadcrumbs.slice(1),
          { id: folderId, name: folderInfo.name },
        ]
        const urlPath = buildUrlPath(newBreadcrumbs)
        router.push(`/${urlPath}`)
      }
      setSearchQuery('')
    },
    [folderPath, breadcrumbs, router],
  )

  const handleBreadcrumbNavigate = useCallback(
    (folderId: string | null) => {
      setNavigating(true)
      if (!folderId || folderId === 'root') {
        router.push('/')
      } else {
        // Find the breadcrumb item
        const crumbIndex = breadcrumbs.findIndex((b) => b.id === folderId)
        if (crumbIndex > 0) {
          // Build URL from breadcrumbs up to this point
          const pathCrumbs = breadcrumbs.slice(1, crumbIndex + 1)
          const urlPath = buildUrlPath(pathCrumbs)
          router.push(`/${urlPath}`)
        } else {
          // Fallback: navigate directly to the folder
          router.push(`/${folderId}`)
        }
      }
      setSearchQuery('')
    },
    [breadcrumbs, router],
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Google Drive Files</h1>
        <p className="text-muted-foreground">
          Manage your files stored in Google Drive
        </p>
      </div>

      <div className="mb-4">
        <Breadcrumbs
          items={breadcrumbs}
          onNavigate={handleBreadcrumbNavigate}
          loading={breadcrumbsLoading}
        />
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <FileSearch onSearch={handleSearch} />
        </div>
        <FileUpload
          onUploadComplete={handleRefresh}
          folderId={currentFolderId || undefined}
        />
        <Button onClick={handleRefresh} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded mb-4">
          Failed to load files. Please check your configuration.
        </div>
      )}

      <FileList
        files={files}
        loading={isLoading || navigating}
        onRefresh={handleRefresh}
        onFileUpdate={handleFileUpdate}
        onFileDelete={handleFileDelete}
        onFolderClick={handleFolderClick}
      />

      <Toaster />
    </div>
  )
}
