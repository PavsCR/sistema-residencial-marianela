# Sistema Residencial Marianela - AI Agent Instructions

## Project Overview
Sistema Residencial Marianela is a residential management system built with a TypeScript/Node.js backend and React frontend. The system handles resident management, payments, finances, budgets, and reports for a residential complex.

## Architecture

### Backend (`/backend`)
- Express.js REST API with TypeScript
- PostgreSQL database connection
- Key middleware: cors, helmet, morgan for security and logging
- Environment configuration via dotenv
- Authentication using JWT and bcrypt

### Frontend (`/frontend`)
- React + TypeScript + Vite
- React Router for navigation
- Feature-based folder structure in `src/`
- Shared components in `src/shared/components/`

## Development Workflow

### Backend Development
```bash
cd backend
npm install
npm run dev     # Start development server with nodemon
npm run build   # Compile TypeScript
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run lint    # Run ESLint
```

## Key Files and Patterns

### Frontend
- `frontend/src/App.tsx`: Main routing configuration
- `frontend/src/shared/components/`: Reusable UI components
- Feature folders follow pattern: `frontend/src/<feature-name>/<Feature>.tsx`

### Backend
- `backend/src/app.ts`: Express application setup and middleware
- `backend/src/shared/database/connection.ts`: Database connection management
- Environment variables managed through `backend/.env` (not committed)

## Project Conventions

### Code Organization
- Frontend features are organized in dedicated folders (e.g., `finanzas/`, `gestion-vecinos/`)
- Each feature component is named in PascalCase matching its folder name
- Shared UI components are centralized in `shared/components/`

### Type Safety
- Strict TypeScript configuration in both frontend and backend
- Type-aware ESLint rules enabled

### Security
- Backend uses helmet for security headers
- CORS enabled with appropriate configuration
- Request size limits enforced (10mb)

## Integration Points
- Frontend-Backend communication via REST API
- Health check endpoint at `/health`
- Authentication handled through JWT tokens
- PostgreSQL for data persistence

## Common Tasks
- Adding a new feature: Create a new folder in `frontend/src/` with component file
- Updating routes: Modify `frontend/src/App.tsx`
- Backend endpoint addition: Follow Express router pattern in `backend/src/`