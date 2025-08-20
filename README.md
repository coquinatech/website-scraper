# AI Agent Development Template

A production-ready template optimized for AI-assisted development. After two years of forcing myself to use AI for code generation, I've discovered that codebases need to be specifically architected for AI agents to be truly effective. This template embodies those learnings.

**TL;DR**: This is the battle-tested template I use for all my AI-coded projects - structured to maximize AI agent effectiveness while maintaining human-friendly best practices.

## Why This Template Exists

Modern AI coding agents like Claude Code and Cursor can write impressive amounts of code, but they often struggle with:

- Starting/stopping services (hanging the agent)
- Maintaining context across sessions
- Understanding what's happening in running code
- Working with untested or poorly structured codebases

This template solves these problems by following **8 core principles for AI-optimized development**:

1. **Tested**: Fast, comprehensive test suites provide immediate feedback
2. **Modular**: Minimized context requirements through modular architecture
3. **Sandboxed**: DevContainers allow agents to run wild safely
4. **Process Managed**: Services run in separate threads with live reload
5. **Repeatable**: Trivial environment setup enables parallel development
6. **Documented**: Clear plans persist across sessions as long-term memory
7. **Tooled**: MCPs and specialized tools give agents deterministic actions
8. **Structured**: Static typing and compilation catch AI-generated bugs early

## Features

### AI-First Architecture

- **Isolated Service Containers**: Frontend and backend run separately with live reload - agents never need to manage processes
- **Persistent Sessions**: Volume mounts preserve AI agent authentication and history across container restarts
- **Observable Development**: Centralized Loki logging lets agents inspect all services without hanging
- **Pre-configured Agents**: Claude Code and Cursor ready out of the box

### Core Stack

- **Backend**: TypeScript + Fastify with hot-reload in isolated container
- **Frontend**: React + Vite + Tailwind CSS in isolated container
- **Database**: PostgreSQL + Drizzle ORM with migrations
- **Caching**: Redis (optional)

### Complete Observability (AI-Friendly)

- **Grafana**: Beautiful dashboards and visualization
- **Prometheus**: Metrics collection and alerting
- **Loki**: Centralized log aggregation - AI agents can query logs from all services
- **Tempo**: Distributed tracing with OpenTelemetry
- **Alloy**: Automatic log forwarding from all containers to Loki

### Developer Experience

- **DevContainer**: Fully configured development environment
- **Hot Reload**: Both frontend and backend
- **TypeScript**: Strict mode with full type safety
- **API Documentation**: Auto-generated Swagger UI
- **Database Studio**: Drizzle Studio GUI for database management

### Testing & Quality

- **Vitest**: Fast unit and integration testing
- **MSW**: API mocking for frontend tests
- **ESLint & Prettier**: Code quality and formatting
- **Pre-configured CI/CD**: GitHub Actions ready

## Quick Start

### The Power of This Approach

This template enables AI agents to deliver features in days that traditionally take weeks. The optimizations feel odd at first - spending time structuring for AI rather than just coding - but the productivity gains are transformative.

### Prerequisites

- Docker
- IDE that supports devcontainers (VSCode, Jetbrains, etc)
- Git

### Setup

1. **Fork and clone the repository**

   - Fork this repository to your own GitHub account
   - Clone your forked repository:

   ```bash
   git clone <your-forked-repo-url>
   cd <your-project>
   ```

2. **Open in your IDE**

   ```bash
   code .  # For VS Code
   ```

3. **Reopen in Container**

   - VS Code: Press `F1` → "Dev Containers: Reopen in Container"
   - Wait for container to build (first time only)
   - All services start automatically - no manual setup needed!

4. **Everything is already running!**

   The magic of this template:

   - Backend service runs in isolation with live reload
   - Frontend service runs in isolation with live reload
   - Observability stack (Grafana, Loki, Prometheus, Tempo) is ready
   - AI agents can immediately start working without process management

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Grafana: http://grafana:3000 (admin/admin)
6. **Start coding with AI agents**

   ```bash
   # Claude Code (recommended for complex features)
   claude code

   # Use /plan for feature planning
   # Use /execute_plan to implement

   # Cursor is also pre-configured
   cursor .
   ```

## Project Structure

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

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

Key variables:

- `PORT` - Backend server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - Frontend API base URL
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)

## Development Guide

### Backend Development

The backend runs in its own Docker container managed by devcontainer's docker-compose. It's already running with hot-reload when you open the devcontainer.

```bash
cd server
npm run dev          # Already running in container with hot-reload
npm run build        # Build for production
npm run typecheck    # Type checking
npm run lint         # Lint code
npm run test         # Run tests
```

**Note**: The backend service auto-restarts on code changes. You never need to manually restart it.

### Frontend Development  

The frontend runs in its own Docker container managed by devcontainer's docker-compose. It's already running with hot-reload when you open the devcontainer.

```bash
cd frontend
npm run dev          # Already running in container with hot-reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

**Note**: The frontend service auto-reloads on code changes via Vite's HMR. You never need to manually restart it.

### Database Management

```bash
cd server
npm run db:generate  # Generate migration from schema
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio (port 4983)
```

## Observability

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

## Testing

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

## Building for Production

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

## Security

- Helmet.js for security headers
- Rate limiting configured
- CORS properly configured
- Environment variables for secrets
- SQL injection protection via Drizzle ORM
- XSS protection in React

## API Documentation

Swagger documentation is automatically generated and available at:

- http://localhost:5000/documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Built with:

- [Fastify](https://www.fastify.io/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Grafana Stack](https://grafana.com/)
- [OpenTelemetry](https://opentelemetry.io/)

## AI Agent Development Philosophy

### The Problem with Traditional Codebases

After two years of AI-assisted development, I've learned that the longer an agent continues down a path with bad assumptions, the harder it is to recover. Traditional codebases lack the feedback loops and structure that AI agents need to be effective.

### How This Template Solves It

**Fast Feedback Loops Are Paramount**: Every architectural decision prioritizes rapid, clear feedback to prevent agents from spiraling down incorrect paths.

**Process Management**: Your code runs in separate threads from the agent. The web server runs in its own container with live reload, sending logs to Loki where the agent can check them - preventing the common issue of agents hanging when trying to start services.

**Planning Over Coding**: This template encourages generating clear, step-by-step plans before implementation. These plans persist across sessions, acting as long-term memory for the agent. Use multiple AI models (Claude Code, Gemini, Codex) to check each other's work during planning.

**Observable by Design**: Instead of having agents run `docker logs` or `ps` commands (often leading down rabbit holes), all logs drain to Loki with Alloy. Agents simply query Loki to see errors immediately after changes.

### Best Practices

- **Never let agents manage processes** - Services run continuously in containers
- **Test fast and often** - Quick feedback prevents cascading errors
- **Plan before coding** - Use `/plan` and `/execute_plan` commands in Claude Code
- **Keep modules small** - Minimize context requirements for each task
- **Use static typing** - TypeScript compilation catches a class of bugs AI creates
- **Query logs, don't restart** - Use Loki queries instead of service restarts
- **Mount home directories** - Preserve agent sessions across container restarts

## General Tips

- Use the DevContainer for consistent development environment
- Check Grafana dashboards for performance insights
- Run `npm run typecheck` before committing
- Use the API testing page at `/api-test` for quick debugging
- Database Studio is great for data exploration

## Troubleshooting

### Port already in use

```bash
# Find process using port
lsof -i :5000
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

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation in `/docs`

---

Happy coding!
