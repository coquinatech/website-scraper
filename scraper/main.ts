import * as cheerio from "cheerio";
import * as path from "path";
import { chromium } from "playwright";
import { URL } from "url";
import type { StorageEngine } from "./storage/index.js";
import { createStorageEngine, generateArchivePath, getStorageConfig } from "./storage/index.js";

async function mirrorSite(startUrl: string, storage: StorageEngine, archivePath: string, maxDepth = 2, sameDomain = true) {
  const visited = new Set<string>();
  const savedResources = new Map<string, string>(); // Map original URL to local path
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const baseHost = new URL(startUrl).host;
  const baseUrl = new URL(startUrl);

  // Initialize storage
  await storage.initialize();
  
  // Clean up any incomplete uploads from previous runs
  await storage.cleanupIncomplete(archivePath);

  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Convert URL to local file path, preserving directory structure
  function urlToLocalPath(url: string): string {
    const parsed = new URL(url);
    
    // Remove hash fragments
    const cleanUrl = url.split('#')[0];
    
    // Build path from host and pathname
    let localPath = path.join(parsed.host, parsed.pathname);
    
    // Handle query strings by encoding them
    if (parsed.search) {
      localPath += parsed.search.replace(/[?&=]/g, '_');
    }
    
    // If it's a directory or has no extension, add index.html
    if (localPath.endsWith('/')) {
      localPath += 'index.html';
    } else if (!path.extname(localPath) && !localPath.endsWith('.html')) {
      // Check if this looks like a page route (no file extension)
      localPath += '/index.html';
    }
    
    // Handle special case for root
    if (cleanUrl === startUrl || cleanUrl === startUrl + '/') {
      localPath = path.join(parsed.host, 'index.html');
    }
    
    return localPath;
  }

  async function saveResource(url: string, buffer: Buffer): Promise<string> {
    if (savedResources.has(url)) {
      return savedResources.get(url)!;
    }
    
    const localPath = urlToLocalPath(url);
    const storagePath = path.join(archivePath, localPath);
    
    // Save to storage engine
    await storage.save(storagePath, buffer);
    savedResources.set(url, localPath);
    
    return localPath;
  }

  // Calculate relative path from one file to another
  function getRelativePath(fromPath: string, toPath: string): string {
    // Both paths are relative to archive root
    const from = path.dirname(fromPath);
    let relative = path.relative(from, toPath);
    
    // Ensure forward slashes for web paths
    relative = relative.split(path.sep).join('/');
    
    // If the path doesn't start with . or /, add ./
    if (!relative.startsWith('.') && !relative.startsWith('/')) {
      relative = './' + relative;
    }
    
    return relative;
  }

  // Process CSS to extract and download referenced resources
  async function processCssContent(cssContent: string, cssUrl: string): Promise<string> {
    const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
    let processedCss = cssContent;
    const cssLocalPath = urlToLocalPath(cssUrl);
    const replacements: Array<{ original: string; replacement: string }> = [];
    
    let match;
    while ((match = urlRegex.exec(cssContent)) !== null) {
      const resourceUrl = match[1];
      if (!resourceUrl.startsWith('data:') && !resourceUrl.startsWith('#')) {
        try {
          const absUrl = new URL(resourceUrl, cssUrl).href;
          
          // Download the resource if we haven't already
          if (!savedResources.has(absUrl)) {
            try {
              const response = await fetch(absUrl);
              if (response.ok) {
                const buffer = Buffer.from(await response.arrayBuffer());
                await saveResource(absUrl, buffer);
              }
            } catch (e) {
              console.error(`Error downloading CSS resource ${absUrl}: ${e}`);
              continue;
            }
          }
          
          // Get relative path from CSS file to resource
          const resourceLocalPath = urlToLocalPath(absUrl);
          const relativePath = getRelativePath(cssLocalPath, resourceLocalPath);
          replacements.push({
            original: match[0],
            replacement: `url('${relativePath}')`
          });
        } catch (e) {
          console.error(`Error processing CSS URL ${resourceUrl}: ${e}`);
        }
      }
    }
    
    // Apply all replacements
    for (const { original, replacement } of replacements) {
      processedCss = processedCss.replace(original, replacement);
    }
    
    return processedCss;
  }

  while (queue.length > 0) {
    const { url, depth } = queue.shift()!;
    if (visited.has(url) || depth > maxDepth) continue;
    visited.add(url);

    console.log(`Processing: ${url} (depth: ${depth})`);

    const page = await context.newPage();
    const resourcePromises: Promise<void>[] = [];

    page.on("response", async (response) => {
      const promise = (async () => {
        try {
          const rurl = response.url();
          const type = response.request().resourceType();
          
          if (["document", "stylesheet", "image", "font", "script", "media"].includes(type)) {
            const body = await response.body();
            
            // Don't save HTML documents here - we'll process them later
            if (type !== "document") {
              // Process CSS files to download their resources
              if (type === "stylesheet" && body) {
                const cssContent = body.toString('utf-8');
                const processedCss = await processCssContent(cssContent, rurl);
                await saveResource(rurl, Buffer.from(processedCss));
              } else {
                await saveResource(rurl, body);
              }
            }
          }
        } catch (e) {
          const error = e as Error;
          if (!error.message?.includes('ENAMETOOLONG')) {
            console.error(`Error saving resource: ${error}`);
          }
        }
      })();
      resourcePromises.push(promise);
    });

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      
      // Wait for all resource downloads to complete
      await Promise.all(resourcePromises);
      
      // Also check for favicon and SVG sprite
      try {
        const faviconUrl = new URL('/favicon.ico', baseUrl).href;
        if (!savedResources.has(faviconUrl)) {
          const response = await fetch(faviconUrl);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            await saveResource(faviconUrl, buffer);
          }
        }
      } catch (e) {
        // Favicon might not exist
      }
      
      // Try to fetch SVG sprite if referenced
      const html = await page.content();
      const svgMatch = html.match(/\/svg\/[^"'\s]+\.svg/);
      if (svgMatch) {
        try {
          const svgUrl = new URL(svgMatch[0], url).href;
          if (!savedResources.has(svgUrl)) {
            const response = await fetch(svgUrl);
            if (response.ok) {
              const buffer = Buffer.from(await response.arrayBuffer());
              await saveResource(svgUrl, buffer);
            }
          }
        } catch (e) {
          console.error(`Error fetching SVG sprite: ${e}`);
        }
      }
      
      const currentPageLocalPath = urlToLocalPath(url);

      // Rewrite links in HTML using more robust regex approach
      const $ = cheerio.load(html);
      
      // Process all elements with URL attributes
      const urlAttributes = {
        'a': 'href',
        'link': 'href',
        'script': 'src',
        'img': 'src',
        'source': 'srcset',
        'video': 'src',
        'audio': 'src',
        'use': 'href',
        'iframe': 'src',
        'embed': 'src',
        'object': 'data'
      };

      // First pass: rewrite all absolute URLs that point to our domain
      Object.entries(urlAttributes).forEach(([tag, attr]) => {
        $(`${tag}[${attr}]`).each((_, el) => {
          const val = $(el).attr(attr);
          if (val) {
            // Extract any fragment identifier (e.g., #github for SVG sprites)
            const [urlPart, fragment] = val.split('#');
            const fragmentSuffix = fragment ? `#${fragment}` : '';
            
            // Handle absolute URLs to our domain
            if (val.startsWith(`https://${baseHost}`) || val.startsWith(`http://${baseHost}`)) {
              const cleanUrl = urlPart;
              if (savedResources.has(cleanUrl)) {
                const resourceLocalPath = savedResources.get(cleanUrl)!;
                const relativePath = getRelativePath(currentPageLocalPath, resourceLocalPath);
                $(el).attr(attr, relativePath + fragmentSuffix);
              }
            }
            // Handle protocol-relative URLs
            else if (val.startsWith(`//${baseHost}`)) {
              const absUrl = `https:${urlPart}`;
              if (savedResources.has(absUrl)) {
                const resourceLocalPath = savedResources.get(absUrl)!;
                const relativePath = getRelativePath(currentPageLocalPath, resourceLocalPath);
                $(el).attr(attr, relativePath + fragmentSuffix);
              }
            }
            // Handle root-relative URLs
            else if (val.startsWith('/') && !val.startsWith('//')) {
              const absUrl = new URL(urlPart, `https://${baseHost}`).href;
              if (savedResources.has(absUrl)) {
                const resourceLocalPath = savedResources.get(absUrl)!;
                const relativePath = getRelativePath(currentPageLocalPath, resourceLocalPath);
                $(el).attr(attr, relativePath + fragmentSuffix);
              }
            }
            // Handle relative URLs
            else if (!val.startsWith('http') && !val.startsWith('data:') && !val.startsWith('mailto:') && !val.startsWith('tel:')) {
              try {
                const absUrl = new URL(urlPart, url).href;
                if (savedResources.has(absUrl)) {
                  const resourceLocalPath = savedResources.get(absUrl)!;
                  const relativePath = getRelativePath(currentPageLocalPath, resourceLocalPath);
                  $(el).attr(attr, relativePath + fragmentSuffix);
                }
              } catch (e) {
                // Invalid URL
              }
            }
          }
        });
      });
      
      // Handle inline styles with url()
      $('[style]').each((_, el) => {
        const style = $(el).attr('style');
        if (style && style.includes('url(')) {
          const processedStyle = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, resourceUrl) => {
            if (!resourceUrl.startsWith('data:')) {
              try {
                const absUrl = new URL(resourceUrl, url).href;
                if (savedResources.has(absUrl)) {
                  const resourceLocalPath = savedResources.get(absUrl)!;
                  const relativePath = getRelativePath(currentPageLocalPath, resourceLocalPath);
                  return `url('${relativePath}')`;
                }
              } catch (e) {
                return match;
              }
            }
            return match;
          });
          $(el).attr('style', processedStyle);
        }
      });
      
      // Handle <style> blocks
      $('style').each((_, el) => {
        const styleContent = $(el).html();
        if (styleContent && styleContent.includes('url(')) {
          const processedStyle = styleContent.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, resourceUrl) => {
            if (!resourceUrl.startsWith('data:')) {
              try {
                const absUrl = new URL(resourceUrl, url).href;
                if (savedResources.has(absUrl)) {
                  const resourceLocalPath = savedResources.get(absUrl)!;
                  const relativePath = getRelativePath(currentPageLocalPath, resourceLocalPath);
                  return `url('${relativePath}')`;
                }
              } catch (e) {
                return match;
              }
            }
            return match;
          });
          $(el).html(processedStyle);
        }
      });

      // Save rewritten HTML
      await saveResource(url, Buffer.from($.html(), 'utf-8'));

      // Queue links for recursion
      $("a[href]").each((_, el) => {
        const link = $(el).attr("href");
        if (link && !link.startsWith('mailto:') && !link.startsWith('tel:') && !link.startsWith('#')) {
          try {
            // Handle absolute URLs
            if (link.startsWith('http')) {
              const linkUrl = new URL(link);
              if (sameDomain && linkUrl.host !== baseHost) return;
              if (!visited.has(link)) queue.push({ url: link, depth: depth + 1 });
            }
            // Handle relative URLs
            else {
              const absUrl = new URL(link, url).href;
              if (!visited.has(absUrl)) queue.push({ url: absUrl, depth: depth + 1 });
            }
          } catch (e) {
            // Invalid URL
          }
        }
      });
    } catch (err) {
      console.error(`Failed ${url}: ${err}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nArchiving complete! Archive saved to: ${archivePath}`);
  console.log(`Total resources saved: ${savedResources.size}`);
  console.log(`Storage engine: ${storage.constructor.name}`);
}

(async () => {
  // Get storage configuration from environment
  const config = getStorageConfig();
  const storage = createStorageEngine(config);
  
  // Generate archive path with timestamp
  const targetUrl = "https://dylanwatt.com";
  const domain = new URL(targetUrl).host;
  const archivePath = generateArchivePath(domain);
  
  console.log(`Starting archive of ${targetUrl}`);
  console.log(`Storage engine: ${config.engine}`);
  console.log(`Archive path: ${archivePath}`);
  
  await mirrorSite(targetUrl, storage, archivePath, 2, true);
})();