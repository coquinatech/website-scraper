---

Created Date: 2025-09-05
Completed Date: 2025-09-05

# Feature Plan: Pluggable Storage Engine with MinIO/S3 Support

## ✅ Implementation Status: COMPLETED

All tasks in this plan have been successfully implemented and tested. The website scraper now supports:
- Pluggable storage engine architecture with a common interface
- Filesystem storage backend (maintaining backward compatibility)
- S3/MinIO storage backend with full S3 compatibility
- Automatic retry logic with exponential backoff
- Timestamp-based archive versioning
- Comprehensive error handling and recovery

# Overview

Currently, the website scraper saves archived sites to the local filesystem in the `mirror/` directory. This plan introduces a pluggable storage engine architecture that supports multiple storage backends, starting with filesystem (current) and MinIO/S3 storage options. This allows users to choose their preferred storage solution based on their infrastructure and requirements.

The storage engine will use a common interface, allowing seamless switching between:
- **Filesystem**: Local directory storage (current implementation)
- **MinIO/S3**: S3-compatible object storage for centralized, scalable storage

Archives will follow a structured path format: `/<domain>/source/<scrape_timestamp>/`, enabling versioned archival of websites regardless of storage backend.

Benefits of the pluggable architecture:
- Flexibility to choose storage based on deployment environment
- Easy addition of new storage backends (e.g., Azure Blob, GCS)
- Consistent interface for all storage operations
- Ability to migrate between storage backends

# Outcomes

- Pluggable storage engine interface supporting multiple backends
- Filesystem storage backend (maintaining current functionality)
- MinIO/S3 storage backend with full S3 compatibility
- MinIO service running as part of the devcontainer environment
- Configuration-based storage backend selection
- Archives organized by domain and timestamp for easy retrieval
- Ability to store multiple versions of the same site over time
- Consistent storage operations regardless of backend

# Open Questions

[x] Should we keep the local filesystem option as a fallback or configuration option?
Yes - filesystem will be one of the pluggable storage engine options, selectable via configuration

[x] Should we store metadata (scrape statistics, resource counts, etc.) alongside the archive?
Not right now - keep the implementation focused on core archiving functionality

[x] Do we want to use MinIO's versioning feature or rely on timestamp-based paths?
Use timestamp-based paths for explicit version control

[x] Should we compress archives before storing in MinIO?
No - store files uncompressed for simplicity and direct access

[x] What should be the bucket naming convention? Single bucket with paths or bucket per domain?
Single bucket with path-based organization

[x] Do we need to support resuming interrupted uploads to MinIO?
Handle interruptions by deleting incomplete uploads and retrying fresh

# Tasks

## Storage Engine Architecture
[x] Define `StorageEngine` interface with methods: `save()`, `exists()`, `read()`, `delete()`, `list()`
[x] Create `FilesystemStorage` class implementing the interface
[x] Create `S3Storage` class implementing the interface (supports both MinIO and AWS S3)
[x] Implement storage engine factory based on configuration
[x] Add storage engine configuration to environment variables

## MinIO/S3 Integration
[x] Add MinIO service to `.devcontainer/docker-compose.yml` with proper configuration
[x] Add AWS SDK v3 (`@aws-sdk/client-s3`) to scraper dependencies (fully compatible with MinIO)
[x] Create S3/MinIO configuration with environment variables (endpoint, access keys, bucket)
[x] Initialize S3 client with configurable endpoint (MinIO or AWS S3) in the S3Storage class
[x] Create/verify bucket exists on scraper startup
[x] Implement incomplete upload cleanup on interruption

## Core Implementation
[x] Modify `mirrorSite` function to accept storage engine instance
[x] Replace direct filesystem calls with storage engine methods
[x] Implement path structure: `/<domain>/source/<scrape_timestamp>/`
[x] Update `saveResource` function to use storage engine
[x] Update HTML/CSS rewriting logic to work with storage paths
[x] Add error handling and retry logic for storage operations
[x] Create utility function to generate archive paths with timestamps

## Testing & Documentation
[x] Add storage engine selection logic based on environment variable
[x] Update logging to include storage operation status
[x] Add health check for selected storage backend before starting scrape
[x] Create utility to download archives from S3/MinIO for local viewing
[x] Update README/CLAUDE.md with storage engine configuration
[x] Test filesystem storage maintains backward compatibility
[x] Test S3/MinIO storage with various website types

# Security

- MinIO access keys should be stored in environment variables, not hardcoded
- Use secure defaults for MinIO configuration (disable anonymous access)
- Ensure MinIO data volume is properly secured in production
- Consider encryption at rest for sensitive archived content
- Implement proper access policies for MinIO buckets
- Sanitize domain names to prevent path traversal attacks in bucket paths

# Storage Engine Interface

```typescript
interface StorageEngine {
  // Save a resource to storage
  save(path: string, content: Buffer): Promise<void>;
  
  // Check if a resource exists
  exists(path: string): Promise<boolean>;
  
  // Read a resource from storage
  read(path: string): Promise<Buffer>;
  
  // Delete a resource (used for cleanup)
  delete(path: string): Promise<void>;
  
  // List resources in a path
  list(prefix: string): Promise<string[]>;
  
  // Initialize storage (create buckets, directories, etc.)
  initialize(): Promise<void>;
}
```

# Architecture Changes

## Current Flow
```
Website → Playwright → Download → Local Filesystem (mirror/)
```

## New Flow with Pluggable Storage
```
Website → Playwright → Download → Storage Engine → [Filesystem | S3/MinIO]
                                         ↓
                              Selected via configuration
```

## Storage Path Structure (Same for All Backends)
```
<storage-root>/  (filesystem: ./mirror, S3: bucket-name)
├── example.com/
│   └── source/
│       ├── 2025-09-05T10-30-00Z/
│       │   ├── index.html
│       │   ├── css/
│       │   ├── js/
│       │   └── images/
│       └── 2025-09-05T14-45-00Z/
│           ├── index.html
│           └── ...
└── another-site.org/
    └── source/
        └── 2025-09-05T11-00-00Z/
            └── ...
```

# Configuration Schema

## Environment Variables
```
# Storage engine selection
STORAGE_ENGINE=s3  # Options: 'filesystem' | 's3'

# Filesystem storage config (when STORAGE_ENGINE=filesystem)
STORAGE_PATH=./mirror  # Local directory path

# S3/MinIO storage config (when STORAGE_ENGINE=s3)
S3_ENDPOINT=http://minio:9000  # MinIO endpoint or AWS S3 region endpoint
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=website-archives
S3_USE_SSL=false  # For MinIO local development
S3_FORCE_PATH_STYLE=true  # Required for MinIO
```

## MinIO Docker Service
```yaml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"
    - "9001:9001"  # Console UI
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  command: server /data --console-address ":9001"
  volumes:
    - minio-data:/data
```

# Implementation Considerations

1. **Large File Handling**: Some resources might be very large. Consider streaming uploads to MinIO rather than loading entire files into memory.

2. **Batch Uploads**: For efficiency, consider batching small resource uploads or using MinIO's multipart upload for large files.

3. **Path Sanitization**: Ensure domain names and resource paths are properly sanitized before using as object keys.

4. **Timestamp Format**: Use ISO 8601 format (e.g., `2025-09-05T10-30-00Z`) for timestamps to ensure proper sorting and avoid filesystem-incompatible characters.

5. **Error Recovery**: Implement proper error handling for network failures during MinIO uploads with exponential backoff retry logic.

6. **Progress Tracking**: Consider implementing progress callbacks for large uploads to provide user feedback.

# Testing Strategy

1. Unit tests for MinIO client initialization and configuration
2. Integration tests for upload/download functionality
3. Test with sites of varying sizes (small blog to large media-heavy site)
4. Test network failure scenarios and retry logic
5. Verify archive structure in MinIO matches expected format
6. Test retrieval and serving of archived sites from MinIO