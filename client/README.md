# MyConverterTool.com Client (React/Vite)

This directory contains the frontend application for MyConverterTool.com, built with React and Vite.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Linting & Code Quality](#linting--code-quality)
  - [Testing](#testing)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Contributing](#contributing)

## Features
- **Responsive UI:** Modern and responsive design using Tailwind CSS.
- **Interactive Tools:** Dynamic and user-friendly interfaces for various conversion and utility tools.
- **Authentication:** User login/signup with Google OAuth integration.
- **Routing:** Client-side routing with React Router DOM.
- **Performance:** Optimized for fast loading and smooth user experience with Vite.

## Tech Stack
- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **State Management:** React Context API
- **Animations:** Framer Motion
- **Icons:** Lucide React, React Icons
- **PDF Handling:** `pdfjs-dist`, `react-pdf`
- **Linting:** ESLint (with React, React Hooks, React Refresh plugins)
- **Testing:** Vitest (Unit/Component), Cypress (E2E, Visual Regression, Accessibility)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation
1.  Navigate to the `client` directory:
    ```sh
    cd client
    ```
2.  Install dependencies:
    ```sh
    npm install
    ```

### Development
To start the development server:
```sh
npm run dev
```
This will typically run the app at `http://localhost:3000`.

### Linting & Code Quality
To run ESLint for code quality checks:
```sh
npm run lint
```

### Testing
- **Unit/Component Tests (Vitest):**
  ```sh
  npm test
  ```
- **End-to-End Tests (Cypress):**
  ```sh
  npm run cypress:open # To open Cypress UI
  npm run cypress:run  # To run tests headlessly
  ```

## Deployment
The client application is deployed as a static site using Render, configured via `render.yaml`.

## Configuration
- **API Proxy:** Configured in `vite.config.js` to proxy `/api` requests to the backend server.
- **Environment Variables:** Ensure your `.env` file in the root of the `client` directory is set up with necessary variables (e.g., API keys, backend URL).

## Contributing
Refer to the main project's `CONTRIBUTING.md` (if available) or follow these general steps:
1.  Fork the main repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes in the `client/` directory.
4.  Ensure all tests pass and linting checks are clear.
5.  Submit a pull request to the `main` branch of the upstream repository.
