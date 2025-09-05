---

Created Date: 2025-09-05
Completed Date: 2025-09-05

# Feature Plan: Archive Viewer Web Server

## ✅ Implementation Status: COMPLETED

The Archive Viewer Web Server has been successfully implemented and tested. The server:
- Automatically serves the latest archived version of dylanwatt.com
- Runs on port 6767 with full request logging
- Supports both filesystem and S3/MinIO storage backends
- Handles all resource types with correct MIME types and caching headers
- Includes security features like path sanitization
- Successfully tested with real archived content

# Overview

Currently, archived websites are stored in MinIO/S3 or filesystem storage but require manual retrieval to view. This feature adds a web server that automatically serves the latest archived version of websites directly from the storage backend. Users can browse archived sites through a normal web interface, with the server transparently fetching and serving resources (HTML, CSS, JS, images) from the storage backend.

This enables seamless viewing of archived websites without manual download or extraction, making the archive system more accessible and user-friendly.

# Outcomes

- Web server that serves archived websites directly from storage backends (S3/MinIO or filesystem)
- Automatic selection of the latest archive timestamp for a given domain
- Proper resource serving with correct content types and paths
- Support for both filesystem and S3 storage backends
- Clean URL structure that mirrors the original site
- Fast response times through efficient storage queries
- Optional caching layer for frequently accessed resources

# Open Questions

[x] Should we support serving multiple domains or focus on a single configured domain initially?
Single domain for now

[x] Do we want to implement caching for frequently accessed resources to reduce storage backend calls?
No caching initially

[x] Should the server support selecting specific archive timestamps via URL parameters or UI?
Not now - always serve latest

[x] Do we need authentication/authorization for viewing archived sites?
Not now

[x] Should we implement a simple index page listing available archives when no specific path is requested?
Not now - serve the archived site directly

[x] What port should the server run on by default (3000, 8080, etc.)?
Port 6767

[x] Do we want to support live-reloading when new archives are added?
No

[x] Should we implement request logging and metrics?
Yes - implement request logging

# Tasks

## Core Server Implementation

[x] Create new `server/` directory for the web server code
[x] Set up Express.js server with TypeScript configuration
[x] Implement storage backend integration using existing storage engines
[x] Create `ArchiveResolver` class to find and select latest archive for a domain
[x] Implement request router to map incoming URLs to storage paths
[x] Add content-type detection and proper response headers
[x] Handle 404s gracefully when resources don't exist

## Storage Integration

[x] Create method to list all timestamps for a given domain
[x] Implement timestamp sorting to find latest archive
[x] Add efficient file streaming from storage to HTTP response
[x] Handle both filesystem and S3 storage backends
[x] Implement storage connection pooling/reuse for performance

## URL Routing & Path Resolution

[x] Map root URL (/) to domain's index.html
[x] Handle nested paths (e.g., /css/style.css)
[x] Preserve relative paths within archived content
[x] Support query parameters and fragments
[x] Handle trailing slashes correctly

## Resource Serving

[x] Implement MIME type detection for correct Content-Type headers
[ ] Add support for range requests (for video/audio streaming) - future enhancement
[ ] Handle compression (gzip) if needed - future enhancement
[x] Set appropriate cache headers
[x] Support OPTIONS and HEAD requests

## Configuration

[x] Add environment variables for server configuration
[x] Create configuration for default domain to serve
[x] Add storage backend configuration reuse from scraper
[x] Implement port and host binding configuration
[x] Add optional debug/verbose logging mode

## Testing & Documentation

[ ] Create integration tests for server endpoints - future enhancement
[x] Test with both filesystem and S3 storage backends
[ ] Add performance benchmarks - future enhancement
[x] Create README documentation for server usage
[x] Add example nginx/reverse proxy configuration
[x] Document API endpoints if any are exposed

## Optional Enhancements

[ ] Add simple web UI for browsing available archives
[ ] Implement archive timestamp selector
[ ] Add basic analytics/metrics collection
[ ] Create health check endpoint
[ ] Add WebSocket support for live updates

# Security

- **Path Traversal Prevention**: Sanitize all incoming paths to prevent accessing files outside the archive
- **Input Validation**: Validate domain names and paths to prevent injection attacks
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **CORS Headers**: Configure appropriate CORS headers for security
- **Content Security Policy**: Set CSP headers to prevent XSS in archived content
- **Resource Limits**: Implement limits on response size and streaming to prevent DoS
- **Authentication**: Consider adding basic auth if serving sensitive archives
- **HTTPS Support**: Plan for TLS/SSL in production deployments

# Architecture

## Request Flow

```
Client Request → Express Server → Path Resolution → Storage Engine → Response
                                          ↓
                                  Archive Resolver
                                  (finds latest timestamp)
```

## URL Mapping

```
Incoming: GET http://localhost:3000/css/style.css
Archive Path: dylanwatt.com/source/2025-09-05T10-30-00Z/dylanwatt.com/css/style.css
```

## Server Structure

```
server/
├── index.ts              # Main server entry point
├── config.ts            # Configuration management
├── middleware/
│   ├── errorHandler.ts # Error handling middleware
│   └── logging.ts      # Request logging
├── routes/
│   └── archive.ts      # Archive serving routes
├── services/
│   ├── archiveResolver.ts  # Find latest archives
│   └── resourceServer.ts   # Serve resources from storage
└── utils/
    ├── mimeTypes.ts    # MIME type detection
    └── pathSanitizer.ts # Path security
```

# Configuration Schema

## Environment Variables

```bash
# Server Configuration
SERVER_PORT=6767
SERVER_HOST=0.0.0.0
SERVER_DEFAULT_DOMAIN=dylanwatt.com

# Storage Configuration (reuse from scraper)
STORAGE_ENGINE=s3
S3_ENDPOINT=http://minio:9010
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=website-archives

# Optional Features
ENABLE_CACHE=true
CACHE_TTL=3600
ENABLE_LOGGING=true
DEBUG_MODE=false
```

# API Endpoints

## Core Endpoints

- `GET /*` - Serve archived resources
- `GET /health` - Health check endpoint
- `GET /api/archives` - List available archives (optional)
- `GET /api/archives/:domain` - List timestamps for domain (optional)

# Performance Considerations

1. **Streaming**: Use Node.js streams to pipe large files directly from storage to response
2. **Caching**: Implement in-memory cache for frequently accessed small files
3. **Connection Pooling**: Reuse storage client connections
4. **Compression**: Support gzip compression for text resources
5. **CDN Ready**: Design with CDN/reverse proxy compatibility in mind

# Example Usage

```bash
# Start the server
npm run server

# Access archived site
curl http://localhost:6767/
# Returns latest archived index.html for configured domain

curl http://localhost:6767/css/style.css
# Returns CSS file from latest archive

# With specific timestamp (future enhancement)
curl http://localhost:6767/?timestamp=2025-09-05T10-30-00Z
```
