# Google Drive CRUD Application - Setup Guide

## Quick Start

### 1. Install dependencies
```bash
bun install
```

### 2. Configure Google Cloud Platform

#### Create a Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

#### Generate Service Account Credentials
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Enter a name (e.g., "drive-crud-service")
4. Click "Create and Continue"
5. Skip optional permissions (click "Continue")
6. Click "Done"
7. Click on the created service account
8. Go to "Keys" tab
9. Click "Add Key" > "Create new key"
10. Choose JSON format
11. Download the key file

### 3. Configure Environment Variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Open `.env.local` and add your credentials from the JSON key:

**For Shared Drives (Team Drives):**
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=your-shared-drive-id
GOOGLE_IS_SHARED_DRIVE=true
```

**For regular My Drive folders:**
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID=optional-folder-id
GOOGLE_IS_SHARED_DRIVE=false
```

### 4. Share Google Drive Access

**For Shared Drives (Team Drives):**
1. Open Google Drive
2. Go to your Shared Drive
3. Click "Manage members" (top right)
4. Add the service account email
5. Set permission to "Content Manager" or "Manager"
6. Click "Share"

**For regular My Drive folders:**
1. Open Google Drive
2. Right-click the folder you want to access
3. Click "Share"
4. Paste the service account email
5. Set permission to "Editor"
6. Click "Send"

### 5. Run the Application

```bash
bun run dev
```

Visit: `http://localhost:3000`

## Troubleshooting

### Common Issues

1. **"Failed to list files"**
   - Verify service account has access to the folder/shared drive
   - Check environment variables are set correctly
   - For shared drives, ensure GOOGLE_IS_SHARED_DRIVE=true

2. **"Missing credentials"**
   - Ensure `.env.local` exists with valid credentials
   - Restart the development server after adding env vars

3. **Files not showing in Shared Drive**
   - Confirm GOOGLE_IS_SHARED_DRIVE=true in `.env.local`
   - Check service account is added as member of the shared drive
   - Verify GOOGLE_DRIVE_FOLDER_ID contains the shared drive ID

4. **Files not showing in My Drive**
   - Confirm the folder is shared with service account
   - Set GOOGLE_IS_SHARED_DRIVE=false (or omit it)
   - Check if GOOGLE_DRIVE_FOLDER_ID is set correctly