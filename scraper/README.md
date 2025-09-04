# Website Scraper Service

Standalone service for archiving websites as static assets, similar to archive.is.

## Features

- Full page rendering with Playwright (handles JavaScript-heavy sites)
- Resource downloading (HTML, CSS, JS, images, fonts)
- URL rewriting for local viewing
- Configurable crawl depth
- Domain boundary control

## Installation

```bash
npm install
npx playwright install chromium
```

## Usage

### Quick Start

```bash
# Run the default scrape (edit URL in main.ts)
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
```

### Programmatic Usage

```typescript
import { mirrorSite } from './main';

await mirrorSite(
  'https://example.com',  // URL to archive
  'output',               // Output directory
  3,                      // Max crawl depth
  true                    // Stay within same domain
);
```

## Configuration

Edit `main.ts` to modify:
- Target URL
- Output directory
- Maximum crawl depth
- Domain restrictions

## Output Structure

Archives are saved to the `mirror/` directory by default:
- HTML files are rewritten with local resource paths
- Resources (CSS, JS, images) are saved with sanitized filenames
- All links are converted to work locally

## Limitations

- Flat file structure (may have naming collisions)
- No CSS URL rewriting yet
- Sequential crawling (no parallelization)
- No rate limiting

## Future Improvements

- Resource deduplication
- CSS/JS URL rewriting
- Parallel crawling
- Better directory structure
- Progress reporting
- Resume interrupted crawls