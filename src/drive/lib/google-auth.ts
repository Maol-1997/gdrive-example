import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { AuthClient } from 'google-auth-library';

let authClient: AuthClient | null = null;

export async function getAuthClient(): Promise<AuthClient> {
  if (authClient) {
    return authClient;
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      'Missing Google service account credentials. Please check your .env.local file.'
    );
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
    ],
  });

  authClient = await auth.getClient();
  return authClient;
}
