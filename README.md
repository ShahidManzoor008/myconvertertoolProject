# MyConverterTool

MyConverterTool is a monorepo web app for browser-based conversion and productivity tools. The project combines a Vite + React frontend with an Express + MongoDB backend to provide PDF workflows, text utilities, SEO tools, developer utilities, and content management features in one platform.

## Overview

The application is designed as a free online utility website for creators, developers, marketers, and admin users. It includes document conversion tools, file compression, metadata previewing, formatting utilities, blog content workflows, and an authenticated admin experience.

## Current feature set

### PDF and document tools
- Excel to PDF conversion and PDF to Excel extraction
- Multi-format document conversion to PDF
- PDF viewing and browser-based processing
- PDF compression and image optimization
- Markdown to DOCX generation for documentation and notes

### Text and developer utilities
- JSON formatting, validation, and minification
- Base64 encoding and decoding
- URL encoding and decoding
- HTML, CSS, JS, and JSON beautify/minify workflows
- Text case conversion
- Word, character, sentence, and paragraph counting

### SEO and marketing tools
- QR code generation for URLs, Wi-Fi, contacts, and events
- Meta title/description and Open Graph preview
- SEO-friendly page and content tooling

### Content and account features
- Blog listing and article pages
- User registration/login flows
- Profile management
- Admin dashboard and blog management workflows
- AI-assisted blog writing support behind server-side config

## Tech stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Lucide and React Icons

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- JWT-based authentication
- Multer for uploads
- Structured API routes and middleware

### Processing libraries
- pdf-lib
- sharp
- puppeteer
- js-beautify
- markdown-it
- @turbodocx/html-to-docx
- qrcode.react

### Testing and tooling
- Vitest for frontend tests
- Jest for server-side tests
- Turbo for monorepo orchestration
- ESLint

## Repository structure

```text
myconvertertoolProject/
├── client/                   # React frontend
│   ├── src/                  # App pages, components, hooks, routes, data
│   ├── public/              # Static assets
│   ├── .env.example         # Client env template
│   ├── package.json         # Frontend scripts and dependencies
│   └── vite.config.js
├── server/                   # Express backend
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, validation, request handling
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── scripts/             # Seed/reset/admin utilities
│   ├── tests/               # Jest and Node test suites
│   ├── .env.example         # Backend env template
│   └── package.json
├── scripts/                  # Shared build and helper scripts
├── docs/                     # Deployment and operational notes
├── tests/                    # Additional project-level tests
├── package.json              # Root workspace scripts
├── turbo.json                # Turbo task configuration
├── render.yaml               # Render deployment config
├── README.md                 # Project documentation
├── TESTING.md                # Local testing and environment guidance
├── DEPLOYMENT_REPORT.md      # Deployment notes
└── package-lock.json
```

## Requirements

Before running the app locally, make sure you have:
- Node.js 24.x
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- Optional PDF tooling dependencies for conversion/compression workflows:
  - Ghostscript
  - LibreOffice

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/ShahidManzoor008/myconvertertoolProject.git
cd myconvertertoolProject
```

### 2. Install dependencies

Use the workspace install from the repo root:

```bash
npm install
```

### 3. Configure environment variables

Copy the provided templates and update values for your environment:

```bash
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

Key values to configure:
- `server/.env`: MongoDB URL, JWT secret, frontend URL, Google OAuth client ID, SMTP settings, and optional Gemini AI blog settings
- `client/.env.local`: API base URL and optional ad config

### 4. Start the application

From the project root:

```bash
npm run dev
```

This runs the frontend and backend together in development mode.

## Useful scripts

Run from the project root:

```bash
npm run dev         # start client + server together
npm run build       # production build for the monorepo
npm run lint       # lint all workspaces
npm test           # run workspace test scripts
```

Run frontend or backend tasks directly if needed:

```bash
npm --prefix client run dev
npm --prefix client run build
npm --prefix client run test

npm --prefix server run dev
npm --prefix server run test
npm --prefix server run test:blog
npm --prefix server run test:markdown
npm --prefix server run test:spreadsheet
```

## Deployment notes

The project includes deployment-related config for hosting and release workflows, including Render configuration and deployment docs. Recommended production hosting includes:
- a Node.js service for the API
- a static frontend build for the React app
- MongoDB for application data
- system-level PDF utilities such as Ghostscript and LibreOffice
- environment variables managed securely in the host platform

See the docs directory for operational guidance and deployment reports.

## Security and configuration notes

- Keep `JWT_SECRET` and other sensitive values in environment variables, not in source control.
- The server includes Google Identity Services authentication configuration and optional AI blog generation settings.
- Admin and AI features should remain disabled until explicitly configured and authorized.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and keep them focused.
4. Validate relevant tests or build checks.
5. Open a pull request with a clear summary.

## License

This project currently uses the ISC license package metadata. If the repository policy changes, update the license file and this section accordingly.

## Contact

- Project site: https://myconvertertool.com
- GitHub: https://github.com/ShahidManzoor008
- Author: Shahid Manzoor
