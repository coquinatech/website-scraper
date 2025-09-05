# Archive Viewer Server

A web server that serves archived websites directly from storage backends (filesystem or S3/MinIO).

## Features

- **Automatic archive selection**: Always serves the latest archived version of a domain
- **Transparent resource serving**: HTML, CSS, JS, images, and other assets served with correct MIME types
- **Storage backend support**: Works with both filesystem and S3/MinIO storage
- **Request logging**: Built-in logging with response times
- **Health check endpoint**: Monitor server status
- **Security**: Path sanitization to prevent directory traversal attacks
- **Performance**: Efficient streaming from storage backends

## Installation

```bash
cd server
npm install
```

## Configuration

The server is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Port to run the server on | `6767` |
| `SERVER_HOST` | Host to bind to | `0.0.0.0` |
| `SERVER_DEFAULT_DOMAIN` | Domain to serve archives for | `dylanwatt.com` |
| `ENABLE_LOGGING` | Enable request logging | `true` |
| `DEBUG_MODE` | Enable debug mode with verbose logging | `false` |

### Storage Configuration

The server uses the same storage configuration as the scraper:

#### Filesystem Storage
```bash
export STORAGE_ENGINE=filesystem
export STORAGE_PATH=../scraper/mirror
```

#### S3/MinIO Storage
```bash
export STORAGE_ENGINE=s3
export S3_ENDPOINT=http://minio:9010
export S3_ACCESS_KEY=minioadmin
export S3_SECRET_KEY=minioadmin
export S3_BUCKET=website-archives
export S3_USE_SSL=false
export S3_FORCE_PATH_STYLE=true
```

## Usage

### Starting the Server

```bash
# With default configuration (filesystem storage)
npm run server

# With S3/MinIO storage
STORAGE_ENGINE=s3 npm run server

# With custom port and domain
SERVER_PORT=8080 SERVER_DEFAULT_DOMAIN=example.com npm run server
```

### Development Mode

```bash
# Run with hot reload
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Run compiled JavaScript
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns server status and configured domain:
```json
{
  "status": "healthy",
  "domain": "dylanwatt.com"
}
```

### Serve Archived Resources
```bash
GET /*
```
Serves any resource from the latest archive:
- `/` - Returns the archived index.html
- `/css/style.css` - Returns CSS files
- `/js/script.js` - Returns JavaScript files
- `/images/logo.png` - Returns images
- `/posts/example/` - Returns nested pages

## How It Works

1. **Archive Resolution**: When a request comes in, the server finds the latest timestamp for the configured domain
2. **Path Mapping**: The request path is mapped to the archive structure
3. **Resource Serving**: The file is streamed from storage with appropriate headers
4. **Caching**: Static assets (images, fonts, CSS, JS) are served with cache headers

## Archive Structure Expected

The server expects archives to follow this structure:
```
<domain>/source/<timestamp>/<domain>/<resources>
```

Example:
```
dylanwatt.com/source/2025-09-05T10-30-00Z/dylanwatt.com/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── images/
    └── logo.png
```

## Response Headers

The server sets appropriate headers for each resource type:
- **Content-Type**: Based on file extension
- **Cache-Control**: 
  - Static assets: `public, max-age=3600`
  - HTML/dynamic: `no-cache`
- **X-Response-Time**: Response time in milliseconds

## Logging

When logging is enabled, the server logs all requests in the format:
```
METHOD /path STATUS RESPONSE_TIME - SIZE bytes - IP
```

Example:
```
GET / 200 25ms - 5206 bytes - 127.0.0.1
GET /css/style.css 200 6ms - 5142 bytes - 127.0.0.1
```

## Error Handling

- **404 Not Found**: Returns JSON error for missing resources
- **400 Bad Request**: Returns error for invalid/unsafe paths
- **500 Internal Server Error**: Returns error for server issues

## Security Features

- **Path Sanitization**: Prevents directory traversal attacks
- **Input Validation**: Validates all incoming paths
- **Safe Path Checking**: Blocks access to system directories

## Testing

```bash
# Type checking
npm run typecheck

# Test the server
curl http://localhost:6767/health
curl http://localhost:6767/
curl http://localhost:6767/css/style.css
```

## Docker/Production Deployment

The server can be containerized or deployed behind a reverse proxy (nginx, Caddy, etc.).

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name archive.example.com;
    
    location / {
        proxy_pass http://localhost:6767;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### No archives found
- Ensure the domain has been scraped and archived
- Check that the storage backend is accessible
- Verify the domain name matches exactly

### Resources not loading
- Check browser console for errors
- Verify the archive structure is correct
- Check server logs for 404 errors

### Connection refused
- Ensure the server is running
- Check the port isn't already in use
- Verify firewall settings

## Future Enhancements

- Multiple domain support
- Archive timestamp selection via URL parameter
- Archive browsing UI
- Caching layer for frequently accessed resources
- WebSocket support for live updates
- Archive comparison/diff viewing