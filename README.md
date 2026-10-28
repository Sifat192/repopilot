# RepoPilot

RepoPilot is an AI-powered GitHub documentation generator and updater built with Next.js and deployed on Vercel. It analyzes public GitHub repositories to automatically generate or update comprehensive README files using Google's Gemini AI.

## Purpose

RepoPilot simplifies the creation and maintenance of open-source project documentation. By scanning a repository's directory tree and key source files, it synthesizes repository metadata and code structures into structured, professional Markdown documentation.

## Installation

Clone the repository and install dependencies using npm:

```bash
git clone https://github.com/Sifat192/repopilot.git
cd repopilot
npm install
```

## Configuration

RepoPilot relies on environment variables for AI generation, authentication, and database features. Set the following variables in your environment or Vercel project settings:

- `GEMINI_API_KEY`: Your Google Gemini API key (obtainable at [Google AI Studio](https://aistudio.google.com/apikey)).
- `GEMINI_MODEL`: Optionally set the model name (e.g., `gemini-3.5-flash-lite`).
- `NEXTAUTH_SECRET`: Secret used by NextAuth for session encryption.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Optional Google OAuth credentials.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: GitHub OAuth credentials required for GitHub integration and draft PR publishing.
- Supabase environment variables (refer to `supabase/SETUP.md` and `supabase/schema.sql`) for activity history and rate limiting features.

Do not commit API keys or secrets to version control.

## Usage

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

### End-User Walkthrough

1. **Sign In**: Navigate to the sign-in page to authenticate with configured providers like GitHub or Google. GitHub authorization connects your account to enable repository access and pull request publishing.
2. **Input Repository URL**: Enter a public GitHub repository URL into the generation prompt.
3. **Generate Documentation**: Choose between creation (`create`) or update (`update`) modes to let the AI process the repository and stream or generate the README content.
4. **Review and Edit**: Use the README Studio interface to view the live Markdown preview, make edits directly, or copy and download the resulting Markdown file.
5. **Publish**: Publish changes directly as a draft pull request on GitHub where you have write access.

## Project Structure

- `app/`: Next.js application routes, API endpoints, and UI components (including authentication, generation, studio, and dashboard pages).
- `lib/`: Utility modules handling activity tracking, pull request locks, and rate limiting.
- `supabase/`: Database setup scripts and schema definitions.

## Contribution Guidelines

Contributions are welcome! Please open an issue or submit a pull request for improvements, bug fixes, or new features. Ensure code adheres to existing TypeScript and Next.js conventions.

## Caveats

- **Public Repositories Only**: The current MVP restricts analysis and generation to public GitHub repositories. Private repositories are not supported.
- **API Limits**: The free Gemini tier and GitHub API requests are subject to availability, region, and rate limits.
- **Draft PRs**: Publishing changes automatically opens a draft pull request on repositories with write access; automatic merging is intentionally excluded so you retain full control.