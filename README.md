# MyConverterTool.com

A full-stack web application offering a suite of free online tools for file conversion, code formatting, PDF operations, QR code generation, and more. Built with React (Vite) on the frontend and Node.js/Express on the backend. Deployed with Docker and Render.

---

## Features

### 🛠️ Conversion & Utility Tools
- **File Converters:** PDF, DOCX, images, and more
- **Code Formatters:** JSON, Markdown, Minify/Beautify, etc.
- **Text Tools:** Case conversion, URL encoding/decoding, base64, etc.
- **QR Code Generator**
- **SEO Tools**
- **Batch Processing**
- **Blog & Documentation**

### 📄 PDF Tools
- Merge, split, compress, and convert PDFs
- PDF annotation and editing
- Batch PDF downloads

### 👤 User & Admin
- User authentication (login/signup)
- Admin dashboard: analytics, posts, users, settings

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose; users, sessions, blog posts, and conversion metadata.
- **Deployment:** Docker, Render
- **Linting:** ESLint, PropTypes

---

## Project Structure

```
myconvertertool.com/
├── client/           # Frontend (React)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # App pages (tools, blog, admin, etc.)
│   │   ├── context/      # React context (auth, etc.)
│   │   ├── data/         # Static data (blogposts, navigation)
│   │   ├── utils/        # Utilities (SEO, helpers)
│   │   └── ...
│   ├── public/       # Static assets
│   ├── index.html
│   ├── package.json
│   └── ...
├── server/           # Backend (Node.js/Express)
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Auth, validation
│   ├── models/       # Data models
│   ├── routes/       # API routes
│   ├── uploads/      # File uploads
│   ├── package.json
│   └── ...
└── README.md         # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js 24.9+ (24.x)
- npm
- Ghostscript and LibreOffice for PDF compression and document conversion features

### 1. Clone the Repository
```sh
git clone https://github.com/ShahidManzoor008/myconvertertool.com.git
cd myconvertertool.com
```

### 2. Install Dependencies
Use the root workspace lockfile (do not install client/server independently):
```sh
PUPPETEER_SKIP_DOWNLOAD=true CYPRESS_INSTALL_BINARY=0 npm ci
```
See [TESTING.md](TESTING.md) for local test database isolation and required browser/LibreOffice dependencies.

### 3. Development
#### Start Client (React)
```sh
cd client
npm run dev
```
#### Start Server (Node.js)
```sh
cd ../server
npm start
```

### 4. Linting & Code Quality
#### Run ESLint (client)
```sh
cd client
npm run lint
```

---

## Deployment

### Production host
The production setup uses Nginx to serve `client/dist` and proxy API requests to
the Node.js service managed by PM2. MongoDB runs as a host service. Install
Ghostscript and LibreOffice on the host for PDF compression and document
conversion features.

---

## Configuration
- **API endpoints:** See `server/routes/`
- **Auth config:** See `client/src/config/auth.config.js`
- **Environment variables:** Create a `.env` file in both the `client` and `server` directories based on the `.env.example` files (if they exist) or the required environment variables for each part of the application.

---

## Contributing
1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## License
[MIT](LICENSE)

---

## Credits
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/)

---

## Contact
- **Project:** https://myconvertertool.com
- **Author:** [Shahid Manzoor](https://github.com/ShahidManzoor008)
- **Email:** ShahidManzoor6293@gmail.com
