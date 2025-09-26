export function createFolderSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createFolderPath(folderId: string, folderName: string): string {
  // Just use the folder ID directly to avoid issues with IDs that contain hyphens
  return folderId;
}

export function extractFolderIdFromPath(pathSegment: string): string {
  // Always return the full path segment as the ID
  return pathSegment;
}

export function buildUrlPath(folders: Array<{ id: string; name: string }>): string {
  return folders
    .map(folder => folder.id)
    .join('/');
}