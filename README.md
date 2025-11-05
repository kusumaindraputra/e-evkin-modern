# E-EVKIN Modern

Modern full-stack application for Health Center Performance Evaluation System (Sistem Evaluasi Kinerja Puskesmas).

## Tech Stack

### Backend
- Node.js 20+ with TypeScript
- Express.js
- PostgreSQL with Sequelize ORM
- JWT Authentication
- Zod Validation
- Security: Helmet, CORS, Rate Limiting

### Frontend
- React 18 with TypeScript
- Vite
- Ant Design UI Library
- React Router v6
- Zustand for State Management
- Axios for HTTP Requests
- Recharts for Data Visualization

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or higher
- npm or pnpm

## Installation

1. **Clone and install dependencies**
```bash
cd e-evkin-modern
npm install
```

2. **Setup Backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup Database**
```bash
# Create PostgreSQL database
createdb evkin_db

# Run migrations (when available)
npm run db:migrate
```

4. **Start Development**

```bash
# From root directory - runs both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:5173
```

## Project Structure

```
e-evkin-modern/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── models/       # Sequelize models
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utility functions
│   │   ├── app.ts        # Express app setup
│   │   └── server.ts     # Server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Zustand stores
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   └── package.json
│
└── package.json          # Root package.json
```

## Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both projects
- `npm run lint` - Lint both projects
- `npm run format` - Format code with Prettier

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=evkin_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173
```

## Features

- 🔐 **Authentication** - JWT-based secure authentication
- 👥 **User Management** - Puskesmas and Admin users
- 📊 **Dashboard** - Performance metrics and visualizations
- 📝 **Reports** - Create, view, and manage performance reports
- 📈 **Charts** - Interactive data visualizations
- 📤 **Export** - Excel/PDF export functionality
- 🔒 **Security** - Rate limiting, CORS, Helmet, input validation
- 📱 **Responsive** - Mobile-friendly UI with Ant Design
- 🌐 **Modern UX** - SPA with smooth navigation

## API Documentation

API documentation will be available at `/api-docs` (Swagger) when the server is running.

## Testing

```bash
# Run all tests
npm run test

# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend
```

## License

Open Source - MIT License

## Migration from PHP Version

This is a complete rewrite of the original PHP-based E-EVKIN application with:
- Modern technology stack
- Better security practices
- Improved user experience
- Better performance and scalability
- TypeScript for type safety
- Comprehensive testing

---

Built with ❤️ using 100% open source technologies
