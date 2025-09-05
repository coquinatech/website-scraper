# Website Scraper Service

Standalone service for archiving websites as static assets with pluggable storage backend support.

## Features

- Full page rendering with Playwright (handles JavaScript-heavy sites)
- Resource downloading (HTML, CSS, JS, images, fonts, SVGs)
- URL rewriting for local viewing
- CSS resource extraction and processing
- Configurable crawl depth and domain boundaries
- **Pluggable storage backends**: Filesystem and S3/MinIO support
- **Versioned archives**: Timestamp-based archive organization
- **Automatic retry logic**: Built-in error handling with exponential backoff

## Installation

```bash
npm install
npx playwright install chromium
```

## Usage

### Quick Start

```bash
# Run with filesystem storage (default)
npm run scrape

# Run with S3/MinIO storage
STORAGE_ENGINE=s3 npm run scrape
```

### Storage Configuration

The scraper supports two storage backends configurable via environment variables:

#### Filesystem Storage (Default)

```bash
export STORAGE_ENGINE=filesystem
export STORAGE_PATH=./mirror  # Local directory path
npm run scrape
```

#### S3/MinIO Storage

```bash
export STORAGE_ENGINE=s3
export S3_ENDPOINT=http://minio:9010  # MinIO endpoint or AWS S3 endpoint
export S3_ACCESS_KEY=minioadmin
export S3_SECRET_KEY=minioadmin
export S3_BUCKET=website-archives
export S3_USE_SSL=false  # For MinIO local development
export S3_FORCE_PATH_STYLE=true  # Required for MinIO
npm run scrape
```

### Development

```bash
# Run with hot reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build
npm start

# Test MinIO connectivity
npx tsx test-minio-simple.ts

# Test S3 storage implementation
npx tsx test-s3-storage.ts
```

### Programmatic Usage

```typescript
import { createStorageEngine, getStorageConfig, generateArchivePath } from './storage';
import { mirrorSite } from './main';

// Get storage configuration from environment
const config = getStorageConfig();
const storage = createStorageEngine(config);

// Generate archive path with timestamp
const domain = new URL(targetUrl).host;
const archivePath = generateArchivePath(domain);

// Run the scraper
await mirrorSite(
  'https://example.com',  // URL to archive
  storage,                // Storage engine instance
  archivePath,           // Archive path with timestamp
  3,                     // Max crawl depth
  true                   // Stay within same domain
);
```

## Archive Structure

Archives are organized with timestamp-based versioning:

```
<storage-root>/
├── example.com/
│   └── source/
│       ├── 2025-09-05T10-30-00Z/  # First archive
│       │   ├── example.com/
│       │   │   ├── index.html
│       │   │   ├── css/
│       │   │   ├── js/
│       │   │   ├── images/
│       │   │   └── fonts/
│       └── 2025-09-05T14-45-00Z/  # Second archive
│           └── example.com/
│               └── ...
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_ENGINE` | Storage backend (`filesystem` or `s3`) | `filesystem` |
| `STORAGE_PATH` | Filesystem storage directory | `./mirror` |
| `S3_ENDPOINT` | S3/MinIO endpoint URL | `http://localhost:9000` |
| `S3_ACCESS_KEY` | S3/MinIO access key | `minioadmin` |
| `S3_SECRET_KEY` | S3/MinIO secret key | `minioadmin` |
| `S3_BUCKET` | S3/MinIO bucket name | `website-archives` |
| `S3_REGION` | AWS region (for S3) | `us-east-1` |
| `S3_USE_SSL` | Use SSL for S3 connection | `false` |
| `S3_FORCE_PATH_STYLE` | Force path-style URLs (MinIO) | `true` |

## MinIO Setup

MinIO is included in the devcontainer configuration:

1. MinIO API: http://localhost:9010 (or http://minio:9010 from within container)
2. MinIO Console: http://localhost:9011
3. Default credentials: `minioadmin` / `minioadmin`

To access the MinIO console:
1. Forward port 9011 in VS Code
2. Open http://localhost:9011
3. Login with the default credentials

## Serving Archives

### Using the Archive Viewer Server
The project includes a dedicated web server for viewing archives:

```bash
cd ../server
npm install
STORAGE_ENGINE=s3 npm run server
# Open http://localhost:6767/
```

The server automatically serves the latest archive for the configured domain. See [server/README.md](../server/README.md) for details.

### Manual Serving from Filesystem
```bash
cd mirror/example.com/source/[timestamp]/
python3 -m http.server 8000
# Open http://localhost:8000/example.com/
```

### From S3/MinIO Console
Use the MinIO console to browse and download archives at http://localhost:9011

## Features Implemented

- ✅ Full JavaScript rendering with Playwright
- ✅ Resource downloading (HTML, CSS, JS, images, fonts, SVGs)
- ✅ CSS resource extraction and URL rewriting
- ✅ HTML link rewriting for local viewing
- ✅ SVG sprite support with fragment preservation
- ✅ Favicon detection and downloading
- ✅ Directory structure preservation
- ✅ Pluggable storage engine architecture
- ✅ S3/MinIO storage backend
- ✅ Filesystem storage backend
- ✅ Automatic retry with exponential backoff
- ✅ Incomplete upload cleanup
- ✅ Timestamp-based versioning

## Error Handling

The storage engines include:
- Automatic retry with exponential backoff for network failures
- Proper cleanup of incomplete uploads on startup
- Path sanitization for S3 compatibility
- Non-retryable error detection (auth failures, 4xx errors)
- Graceful handling of missing resources

## Testing

Several test scripts are included:

- `test-minio-simple.ts`: Basic MinIO connectivity test
- `test-s3-storage.ts`: Comprehensive S3Storage implementation test
- `test-scraper-s3.ts`: Full scraper test with S3 backend
- `verify-minio-structure.ts`: Verify archive structure in MinIO

## Limitations

- Sequential crawling (no parallelization yet)
- No rate limiting
- Large files are loaded into memory
- No WARC format export

## Future Improvements

- Resource deduplication by content hash
- Parallel crawling for faster archiving
- WARC format export
- Resume interrupted crawls
- Progress reporting with callbacks
- Streaming uploads for large files
- Database integration for metadata