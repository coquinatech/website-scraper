# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this website archiving project.

## Project Overview

This is a standalone website archiving service that creates static snapshots of websites for offline viewing, similar to archive.is or the Wayback Machine.

**Main Features**:
- Full page rendering with Playwright (handles JavaScript-heavy sites)
- Complete resource downloading (HTML, CSS, JS, images, fonts, SVGs)
- URL rewriting for local viewing
- Directory structure preservation
- Configurable crawl depth and domain boundaries
- SVG sprite support with fragment preservation

All development of this project is done in a .devcontainer.

## Architecture

### Directory Structure

```
.
├── scraper/             # Main archiving service
│   ├── main.ts         # Core scraper implementation
│   ├── package.json    # Dependencies and scripts
│   ├── tsconfig.json   # TypeScript configuration
│   └── mirror/         # Output directory for archives (git-ignored)
└── .devcontainer/      # DevContainer configuration
    └── docker-compose.yml
```

## Key Components

### Website Scraper (`scraper/main.ts`)

The main `mirrorSite` function accepts:
- `startUrl`: The URL to begin archiving
- `outdir`: Output directory (default: "mirror")
- `maxDepth`: Maximum crawl depth (default: 2)
- `sameDomain`: Stay within the same domain (default: true)

**Core functionality**:
1. Browser automation via Playwright
2. Resource interception and downloading
3. CSS parsing for embedded resources
4. HTML rewriting with relative paths
5. Directory structure preservation

## Essential Commands

### Development

```bash
cd scraper

# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Run the scraper
npm run scrape

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

### Usage

Edit the URL in `main.ts`:
```typescript
await mirrorSite("https://example.com", "mirror", 2, true);
```

Then run:
```bash
npm run scrape
```

## Serving Archived Sites

After archiving, serve the mirror directory:

```bash
cd scraper/mirror
python3 -m http.server 8000
# Then open: http://localhost:8000/[domain]/
```

## Key Implementation Details

### URL Processing

- **Fragment preservation**: SVG sprite references (`#icon`) are preserved
- **Resource deduplication**: Tracks downloaded resources to avoid duplicates
- **Path sanitization**: Handles long filenames and special characters

### CSS Resource Extraction

The scraper processes CSS files to:
1. Extract `url()` references
2. Download referenced resources (fonts, images)
3. Rewrite paths to relative references

### Directory Structure

Archives maintain the original site structure:
```
mirror/
└── example.com/
    ├── index.html
    ├── css/
    │   ├── style.css
    │   └── fonts.css
    ├── js/
    │   └── script.js
    ├── fonts/
    │   └── font.woff2
    └── images/
        └── logo.png
```

## Extending the Scraper

### Adding Resource Types

To handle new resource types, modify the response handler:
```typescript
if (["document", "stylesheet", "image", "font", "script", "media", "newtype"].includes(type)) {
  // Handle new type
}
```

### Custom URL Rewriting

Modify the `urlAttributes` object to handle new HTML elements:
```typescript
const urlAttributes = {
  'a': 'href',
  'link': 'href',
  'custom-element': 'data-src',
  // Add new elements here
};
```

### Rate Limiting

To add rate limiting between requests:
```typescript
// Add delay between page loads
await new Promise(resolve => setTimeout(resolve, 1000));
```

## Important Notes

- The scraper creates a complete offline copy of websites
- JavaScript execution is handled by Playwright's Chromium instance
- Large sites may take significant time and disk space
- The `mirror/` directory is git-ignored by default
- Always respect robots.txt and website terms of service

## Common Issues

### Long Filename Errors

Some URLs create filenames exceeding filesystem limits. The scraper truncates these automatically.

### CORS and External Resources

External domain resources (CDNs, APIs) are downloaded if referenced but won't include cross-origin dynamic content.

### JavaScript-Heavy Sites

Sites relying heavily on API calls may not archive completely. The scraper captures the rendered DOM at page load completion.

### Missing Resources

If resources are missing in the archive:
1. Check if they load via JavaScript after initial render
2. Verify the resource domain is within crawl scope
3. Increase the `waitUntil: "networkidle"` timeout

## Future Enhancements

Potential improvements tracked in comments:
- Resource deduplication by content hash
- Parallel crawling for faster archiving
- WARC format export
- Resume interrupted crawls
- Progress reporting
- Database integration for metadata