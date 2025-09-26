import { google, drive_v3 } from 'googleapis';
import { getAuthClient } from './google-auth';

let driveClient: drive_v3.Drive | null = null;

export async function getDriveClient(): Promise<drive_v3.Drive> {
  if (driveClient) {
    return driveClient;
  }

  const authClient = await getAuthClient();

  driveClient = google.drive({
    version: 'v3',
    auth: authClient,
  });

  return driveClient;
}

export const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

export const isSharedDrive = process.env.GOOGLE_IS_SHARED_DRIVE === 'true';
