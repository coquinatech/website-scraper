# AI Agent Development Template 🤖

A production-ready starter template specifically designed for developing with AI coding agents (Claude Code, GitHub Copilot Workspace, Cursor, Windsurf). Features pre-configured AI agents, persistent sessions, isolated service containers, and comprehensive observability to help AI agents understand and debug your code.

## 🌟 Features

### 🤖 AI Agent Integration

- **Pre-configured AI Agents**: Claude Code, GitHub Copilot Workspace, Cursor, and Windsurf ready to use
- **Persistent Sessions**: Volumes configured to maintain AI agent authentication across container refreshes
- **Isolated Service Architecture**: Frontend and backend run as separate containers with live reload, while the main container runs AI agents
- **Observable Development**: AI agents can inspect running services through centralized Loki logs, avoiding timeout issues from trying to start/stop services

### 🎯 Core Stack

- **Backend**: TypeScript + Fastify with hot-reload in isolated container
- **Frontend**: React + Vite + Tailwind CSS in isolated container
- **Database**: PostgreSQL + Drizzle ORM with migrations
- **Caching**: Redis (optional)

### 📊 Complete Observability (AI-Friendly)

- **Grafana**: Beautiful dashboards and visualization
- **Prometheus**: Metrics collection and alerting
- **Loki**: Centralized log aggregation - AI agents can query logs from all services
- **Tempo**: Distributed tracing with OpenTelemetry
- **Alloy**: Automatic log forwarding from all containers to Loki

### 🛠️ Developer Experience

- **DevContainer**: Fully configured development environment
- **Hot Reload**: Both frontend and backend
- **TypeScript**: Strict mode with full type safety
- **API Documentation**: Auto-generated Swagger UI
- **Database Studio**: Drizzle Studio GUI for database management

### 🧪 Testing & Quality

- **Vitest**: Fast unit and integration testing
- **MSW**: API mocking for frontend tests
- **ESLint & Prettier**: Code quality and formatting
- **Pre-configured CI/CD**: GitHub Actions ready

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- VS Code with Dev Containers extension
- Git

### Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd <your-project>
   ```

2. **Open in VS Code**

   ```bash
   code .
   ```

3. **Reopen in Container**

   - Press `F1` → "Dev Containers: Reopen in Container"
   - Wait for container to build (first time only)
   - AI agents and services will start automatically

4. **Services are already running!**
   
   The template automatically starts:
   - Backend service (isolated container with live reload)
   - Frontend service (isolated container with live reload)
   - All observability tools (Grafana, Loki, Prometheus, Tempo)
   
   No need to manually start services - AI agents can immediately begin working!

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Grafana: http://grafana:3000 (admin/admin)
   
6. **Start coding with AI agents**
   ```bash
   # Claude Code
   claude code

   # GitHub Copilot Workspace
   gh copilot workspace

   # Cursor/Windsurf - use their respective CLIs
   ```

## 📁 Project Structure

```
.
├── server/                 # Backend application (runs in separate container)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── db/            # Database schema & migrations
│   │   └── utils/         # Utilities & helpers
│   └── drizzle/           # SQL migrations
│
├── frontend/              # Frontend application (runs in separate container)
│   └── src/
│       ├── pages/         # React pages
│       ├── components/    # Reusable components
│       └── services/      # API client
│
├── CLAUDE.md              # AI agent instructions and context
│
└── .devcontainer/         # Development environment
    ├── docker-compose.yml # Service orchestration (auto-starts all services)
    ├── devcontainer.json  # AI agent configuration & persistent volumes
    └── grafana/          # Dashboards & datasources
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Key variables:

- `PORT` - Backend server port (default: 3333)
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - Frontend API base URL
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)

## 📚 Development Guide

### Backend Development

```bash
cd server
npm run dev          # Start with hot-reload
npm run build        # Build for production
npm run typecheck    # Type checking
npm run lint         # Lint code
npm run test         # Run tests
```

### Frontend Development

```bash
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

### Database Management

```bash
cd server
npm run db:generate  # Generate migration from schema
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio (port 4983)
```

## 📊 Observability

### Accessing Tools

- **Grafana**: http://grafana:3000

  - Username: admin
  - Password: admin
  - Pre-configured dashboards for all metrics

- **Prometheus**: http://localhost:9090

  - Metrics explorer
  - Alert manager

- **Logs**: Query via Grafana Loki datasource

### Available Metrics

- HTTP request duration
- Request rate
- Error rate
- Database query performance
- System metrics (CPU, memory, etc.)

### Distributed Tracing

OpenTelemetry is pre-configured. Traces are automatically collected and sent to Tempo.

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd frontend && npm test

# With coverage
npm run test:coverage
```

### Test Structure

- Unit tests: Next to source files
- Integration tests: In `__tests__` directories
- E2E tests: In `e2e/` directory

## 📦 Building for Production

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Serve dist/ directory with any static server
```

### Docker

```bash
docker build -t my-app-backend ./server
docker build -t my-app-frontend ./frontend
```

## 🔒 Security

- Helmet.js for security headers
- Rate limiting configured
- CORS properly configured
- Environment variables for secrets
- SQL injection protection via Drizzle ORM
- XSS protection in React

## 📝 API Documentation

Swagger documentation is automatically generated and available at:

- http://localhost:3333/documentation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built with:

- [Fastify](https://www.fastify.io/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Grafana Stack](https://grafana.com/)
- [OpenTelemetry](https://opentelemetry.io/)

## 🤖 AI Agent Development Tips

### Why This Template?

This template solves common AI agent development challenges:

1. **Service Management**: Services run in separate containers, preventing AI agents from getting stuck trying to start/stop servers
2. **Persistent Auth**: Volume mounts preserve AI agent sessions across container restarts
3. **Observable Debugging**: AI agents can query Loki logs to understand what's happening in running services
4. **Live Reload**: Both frontend and backend auto-reload on code changes, AI agents see results immediately
5. **Isolated Environments**: Each service has its own container, preventing conflicts and simplifying debugging

### Best Practices

- Let services run continuously - AI agents should focus on code, not process management
- Use Grafana/Loki to inspect service behavior instead of restarting services
- The CLAUDE.md file provides context to AI agents about your project structure
- All AI agent tools and CLIs are pre-installed in the main container

## 💡 General Tips

- Use the DevContainer for consistent development environment
- Check Grafana dashboards for performance insights
- Run `npm run typecheck` before committing
- Use the API testing page at `/api-test` for quick debugging
- Database Studio is great for data exploration

## 🐛 Troubleshooting

### Port already in use

```bash
# Find process using port
lsof -i :3333
# Kill process
kill -9 <PID>
```

### Database connection issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# Restart database
docker-compose -f .devcontainer/docker-compose.yml restart postgres
```

### Frontend can't connect to backend

- Check VITE_API_URL in frontend/.env
- Ensure backend is running on expected port
- Check CORS_ORIGIN in backend configuration

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation in `/docs`

---

Happy coding! 🎉
