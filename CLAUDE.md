# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this template.

## Project Overview

This is a production-ready development template featuring:

- **Backend**: Minimal Fastify server with TypeScript
- **Frontend**: Minimal React + Vite application
- **Database**: PostgreSQL with Drizzle ORM
- **Observability**: Complete stack with Grafana, Loki, Tempo, and Prometheus
- **Development**: DevContainer with all tools pre-configured

All development of this project is done in a .devcontainer.

Most importantly, the server is running on server:5000 and the client at frontend:5173 via a docker compose process. It will hot reload new changes automatically, so never attempt to restart it.

To get server logs (2 minute example):

curl -G -s "http://loki:3100/loki/api/v1/query_range" \
 --data-urlencode 'query={service="server"}' \
 --data-urlencode "start=$(date -d '2 minutes ago' +%s)000000000" \
    --data-urlencode "end=$(date +%s)000000000" | jq -r '.data.result[].values[][1]'

To get client logs (10 minute example):

curl -G -s "http://loki:3100/loki/api/v1/query_range" \
 --data-urlencode 'query={service="frontend"}' \
 --data-urlencode "start=$(date -d '10 minutes ago' +%s)000000000" \
    --data-urlencode "end=$(date +%s)000000000" | jq -r '.data.result[].values[][1]'

## Architecture

### Directory Structure

```
.
├── server/               # Backend application
│   ├── src/
│   │   ├── controllers/  # HTTP handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── db/          # Database schema and migrations
│   │   └── utils/       # Utilities and helpers
│   └── drizzle/         # SQL migrations
├── frontend/            # Frontend application
│   └── src/
│       ├── pages/       # React pages
│       ├── components/  # React components
│       └── services/    # API client
└── .devcontainer/       # DevContainer configuration
    ├── grafana/         # Grafana dashboards
    └── docker-compose.yml

```

## Key Features

### Backend (Port 5000)

- Health check endpoint (`/health`)
- Prometheus metrics (`/metrics`)
- Example API endpoints (`/api/example`)
- Mock authentication (`/api/auth/login`)
- Swagger documentation (`/documentation`)

### Frontend (Port 5173)

- Home page with feature overview
- Dashboard with live metrics
- API testing console
- Responsive Tailwind CSS design

### Observability Stack

- **Grafana** (http://grafana:3000) - Dashboards and visualization
- **Loki** - Log aggregation
- **Tempo** - Distributed tracing
- **Prometheus** - Metrics collection

## Essential Commands

### Development

```bash
# Backend
cd server
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run typecheck    # Type check without building

# Frontend
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database

```bash
cd server
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio GUI (port 4983)
```

### Testing

```bash
# Backend
cd server
npm test             # Run tests

# Frontend
cd frontend
npm test             # Run tests
```

## Development Workflow

1. **Backend changes**: Edit files in `server/src/`, server auto-reloads
2. **Frontend changes**: Edit files in `frontend/src/`, Vite hot-reloads
3. **Database changes**:
   - Modify schema in `server/src/db/schema/`
   - Run `npm run db:generate`
   - Run `npm run db:migrate`

## Extending the Template

### Adding a New API Endpoint

1. Create controller in `server/src/controllers/`
2. Create route in `server/src/routes/`
3. Register route in `server/src/routes/index.ts`
4. Add API client method in `frontend/src/services/api.ts`

### Adding a New Page

1. Create page component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in `frontend/src/components/Layout.tsx`

### Adding Database Tables

1. Create schema file in `server/src/db/schema/`
2. Export from `server/src/db/schema/index.ts`
3. Generate and apply migration

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `PORT` - Backend server port
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - Frontend API base URL
- `LOG_LEVEL` - Logging verbosity

## Important Notes

- The backend server runs on port 5000 by default
- The frontend dev server runs on port 5173 by default
- All development is done in the devcontainer
- PostgreSQL and Redis are already running in containers
- Observability stack is pre-configured and running

## Common Issues

### Port Already in Use

- Check for running processes: `ps aux | grep node`
- Kill specific port: `kill -9 $(lsof -ti:PORT)`

### Database Connection Failed

- Ensure PostgreSQL is running: `docker ps`
- Check DATABASE_URL in environment

### Frontend Can't Connect to Backend

- Verify backend is running on expected port
- Check VITE_API_URL configuration
- Ensure CORS_ORIGIN includes frontend URL
