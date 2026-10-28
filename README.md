# RepoPilot

RepoPilot is an AI-powered GitHub documentation generator and updater, built with Next.js and deployed on Vercel. It analyzes public GitHub repositories and automatically generates or updates comprehensive Markdown documentation.

## Purpose

RepoPilot streamlines repository maintenance by reading file trees and code contents from public GitHub repositories, leveraging Gemini AI models to structure, write, or update `README.md` documentation, and providing tools to preview, edit, download, or publish the results via a pull request.

## Installation

Clone the repository and install dependencies using npm:

```bash
git clone https://github.com/Sifat192/repopilot.git
cd repopilot
npm install
```

## Configuration

RepoPilot reads environment variables for AI generation, authentication, and payment integrations. 

### Environment Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key required for AI generation (obtainable from Google AI Studio). |
| `GEMINI_MODEL` | Optional Gemini model override (defaults are handled in the application). |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for sign-in. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret for sign-in. |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID for sign-in and pull request publishing. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret for sign-in and pull request publishing. |
| `NEXTAUTH_SECRET` | Secret key used by NextAuth to encrypt tokens and session data. |
| `RAZORPAY_PAYMENT_PAGE_URL` | Payment gateway link used by the donation route. |

## Usage

### Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the user interface.

### Production Build

To build and start for production:

```bash
npm run build
npm start
```

## Project Structure

```text
repopilot/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth authentication configuration (Google & GitHub providers)
│   │   ├── donate/               # Donation processing endpoint (Razorpay integration)
│   │   ├── generate/             # Repository parsing and AI documentation generation endpoint
│   │   └── pull-request/         # GitHub API integration for publishing pull requests
│   ├── layout.tsx                # Root layout wrapper
│   ├── page.tsx                  # Main user interface component
│   ├── signin/                   # Sign-in page component
│   └── style.css                 # Global styling
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## End-User Walkthrough

1. **Sign In**: Navigate to the application and sign in using either Google or GitHub credentials via the sign-in page. Note that GitHub authentication is required if you intend to publish generated changes as a pull request.
2. **Input Repository**: Enter a public GitHub repository URL into the input field and select your desired mode (`create` a new README or `update` an existing one).
3. **Generate Documentation**: Click the generation trigger to analyze the repository files and compile AI-generated Markdown documentation.
4. **Preview, Edit, & Download**: 
   - Switch between **Preview**, **Raw**, and **Edit** modes to inspect or modify the generated Markdown content directly in the UI.
   - Use the **Download** action to save the generated file locally (`README.md` or `README.updated.md`).
5. **Publish**: If signed in with GitHub and your GitHub account is properly connected, click the publish action to automatically submit the documentation changes as a pull request to the target repository.
6. **Support**: Optionally use the donation section to submit a contribution amount, which redirects via the configured payment page URL.

## Contribution Guidance

Contributions, bug reports, and feature requests are welcome. Please ensure that any pull requests or issue submissions are well-tested and cleanly implemented against the existing TypeScript and Next.js structure.

## Caveats

- **Public Repositories Only**: The application explicitly restricts analysis to public GitHub repositories; private repositories are not supported.
- **Authentication Scope**: Google sign-in does not grant the necessary GitHub repository permissions. Publishing a pull request requires signing in specifically with a GitHub account that provides `public_repo` scope access.
- **External Integrations**: Features like donation processing depend on external gateway configuration (`RAZORPAY_PAYMENT_PAGE_URL`) and will return service unavailable errors if unconfigured.
- **API Limits**: Free-tier Gemini API calls are subject to availability, regional constraints, and strict rate limits.