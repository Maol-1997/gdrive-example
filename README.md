# Google Drive Web Interface

A modern web-based Google Drive file browser built with Next.js 15, featuring a clean UI and seamless Google Drive API integration.

## Features

- 🗂️ **File Browser** - Navigate through your Google Drive folders and files with an intuitive interface
- 🔍 **Search** - Quick search functionality to find files across your Drive
- 📤 **File Upload** - Drag-and-drop file uploads with progress tracking
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Built with shadcn/ui components for a polished user experience
- 🔐 **Secure Authentication** - OAuth 2.0 authentication with Google
- 🌙 **Dark Mode** - Support for light and dark themes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Authentication**: Google OAuth 2.0
- **API**: Google Drive API v3
- **State Management**: React Hooks with SWR for data fetching
- **Package Manager**: Bun

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Google Cloud Console account
- Google Drive API enabled in your project
- OAuth 2.0 credentials configured

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gdrive
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

4. Configure Google OAuth:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Drive API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback` to authorized redirect URIs

## Development

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
gdrive/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── [...path]/    # Dynamic routing for folder navigation
│   │   └── page.tsx      # Main homepage
│   ├── components/       # Reusable UI components
│   │   └── ui/          # shadcn/ui components
│   ├── drive/           # Google Drive integration
│   │   ├── actions/     # Server actions for Drive API
│   │   ├── components/  # Drive-specific components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Authentication and client setup
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Utility functions
│   ├── hooks/           # Global custom hooks
│   └── lib/            # Global utilities
├── components.json      # shadcn/ui configuration
└── package.json        # Project dependencies
```

## Features in Detail

### File Browser
- View files and folders in a grid or list layout
- Navigate through folder hierarchy with breadcrumbs
- File previews for supported formats
- Sort by name, date modified, or size

### Search
- Real-time search with debouncing
- Filter by file type
- Search within current folder or entire Drive

### File Management
- Upload files via drag-and-drop or file picker
- Create new folders
- Download files
- Move and copy files between folders
- Delete files (move to trash)

## Building for Production

```bash
bun run build
```

The build output will be optimized for production in the `.next` folder.

## Deployment

This application can be deployed on various platforms:

### Vercel (Recommended)
- Push your code to GitHub
- Import the repository in Vercel
- Add environment variables
- Deploy

### Self-Hosting
```bash
bun run build
bun run start
```

## Security Considerations

- All API routes are protected with authentication
- OAuth tokens are stored securely
- File access is limited to authenticated user's Drive
- Environment variables are never exposed to the client

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)