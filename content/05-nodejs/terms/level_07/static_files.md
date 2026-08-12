# Serving Static Files (express.static)

> **Level 7 — Web Servers & APIs**
> Serving HTML/CSS/images straight from a folder (the old index's term 36).

---

## 1. Prerequisites
- [Express.js](express_js.md) — The parent framework hosting the middleware.
- [Middleware](middleware.md) — The request processing pipeline.

---

## 2. Term Category

**Third-Party Framework Concept (Express.js) (Web App Server Layer .)**: Serving Static Files (express.static) is a fundamental concept in this technology stack. **Level 7 — Web Servers & APIs**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Web applications require static assets (such as HTML pages, CSS stylesheets, client-side JavaScript, and images) that do not change dynamically per request.

Writing manual Express route handlers for every single image and stylesheet using `fs.readFile` and manually setting the HTTP `Content-Type` header (MIME type) is tedious and error-prone.

To automate this process, Express provides the built-in **`express.static`** middleware:
-   **Directory Mapping:** You specify a folder on your server (often named `public` or `assets`) to host static files:
    `app.use(express.static('public'))`.
-   **Asset Resolution:** When a request arrives (e.g. `GET /images/logo.png`), the middleware checks if `public/images/logo.png` exists.
-   **Stream & Header Management:** If the file exists, the middleware automatically reads it, determines the correct MIME type (e.g. `image/png`), sets cache-control headers, and streams the file back to the client, ending the request cycle.
-   **Automatic Fallback:** If the file is not found, the middleware calls `next()`, allowing subsequent route handlers to process the request.

---

### (2) Virtual Path Prefixes
You can host your static files under a virtual URL prefix that does not exist in the physical folder structure:
```javascript
// Files in 'public' must now be requested with the '/static' prefix in the URL
app.use('/static', express.static('public'));
```

---

### (3) Reality Metaphor
Imagine visiting a store for a snack.
- **Dynamic Routes** are like a **custom sandwich counter**. You place a specific order ("I want a turkey sandwich with extra cheese and no onions"). The chef prepares it on the spot (e.g., executing database queries and template rendering) and hands it to you.
- **Static Files (`express.static`)** are like a **vending machine**. You enter a code (`GET /soda.png`), and the machine drops the pre-packaged item immediately. It does not cook or customize anything; it just retrieves the file from its designated slot. If the slot is empty, the machine buzzes (calls `next()`).

---

### (4) Express Implementation Example

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Use path.join to create an absolute path to the 'public' folder
const publicDirectoryPath = path.join(__dirname, 'public');

// Register the static file server
app.use(express.static(publicDirectoryPath));

// Fallback API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});
```

Assuming the `public` directory contains:
- `public/index.html`
- `public/css/styles.css`
- `public/images/avatar.jpg`

The files can be accessed at:
- `http://localhost:3000/` (Express automatically serves `index.html` for root `/` requests).
- `http://localhost:3000/css/styles.css`
- `http://localhost:3000/images/avatar.jpg`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using relative directory paths

**The mistake:** Passing a relative path like `public` directly to `express.static`:
```javascript
// BAD: Breaks if you start the app from another directory!
app.use(express.static('public'));
```

**Why it's wrong:** Relative paths in Node.js resolve relative to the **Current Working Directory** (`process.cwd()`), which is the directory where you run the launch command (e.g. `node subfolder/app.js`), not the directory where the file resides. If you start your application from outside its root directory, Express will look for the `public` folder in the wrong location, resulting in `404 Not Found` errors for all assets.

*Fix:* Always generate an absolute path using `__dirname` and the `path` module:
```javascript
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
```

### Mistake 2: Including the source folder name in the asset request URL

**The mistake:** Including `/public/` in the browser URL path when request-routing assets:
`http://localhost:3000/public/css/styles.css`

**Why it's wrong:** The name of the hosting directory is not part of the URL. Express resolves files relative to the designated directory. The URL path is directly appended to the static folder path.

*Fix:* Omit the folder name from the request path. Access files directly from the root path:
`http://localhost:3000/css/styles.css`

---



### Mistake 3: Passing Relative Directory Paths to `express.static()`

**The mistake:** Mounting `app.use(express.static('public'))` without absolute path resolution.

**Why it's wrong:** Relative paths in `express.static('public')` resolve relative to `process.cwd()` (where `node` was launched from). Launching from another folder fails to locate public static files. Use `path.join(__dirname, 'public')`.

*Incorrect:*
```javascript
app.use(express.static('public')); // ❌ Breaks if node launched from different directory!
```

*Fix:*
```javascript
app.use(express.static(path.join(__dirname, 'public'))); // Absolute directory path
```

### Mistake 4: Exposing Sensitive Root Directories via `express.static()` (Security Risk)

**The mistake:** Serving static files from project root directory `app.use(express.static(__dirname))`.

**Why it's wrong:** Serving root `__dirname` exposes `package.json`, `.env` secrets files, and server source code to public HTTP download.

*Incorrect:*
```javascript
app.use(express.static(__dirname)); // ❌ Exposes .env secrets and source code!
```

*Fix:*
```javascript
app.use(express.static(path.join(__dirname, 'public'))); // Dedicated public subfolder
```

## 5. Practice Exercises

### Exercise 1: Static File Server with Content-Type MIME Lookup & Range Requests

**Scenario:** Serves static assets (HTML, CSS, JS, Images) from a public directory with correct `Content-Type` headers and path traversal guards.

**Requirements:**
1. Write serveStaticFile(reqPath, publicDirMock, mockFs).
2. Lookup MIME type by extension.
3. Serve file content.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function serveStaticFile(reqPath, publicDirMock = "/var/www/public", mockFs) {
>   const fsLib = mockFs || require("fs").promises;
>   const pathLib = require("path");
>
>   const mimeTypes = {
>     ".html": "text/html",
>     ".css": "text/css",
>     ".js": "application/javascript",
>     ".png": "image/png",
>     ".json": "application/json"
>   };
>
>   const safePath = pathLib.resolve(publicDirMock, reqPath.replace(/^\//, ""));
>
>   if (!safePath.startsWith(pathLib.resolve(publicDirMock))) {
>     return { status: 403, error: "FORBIDDEN_TRAVERSAL" };
>   }
>
>   try {
>     const ext = pathLib.extname(safePath).toLowerCase();
>     const contentType = mimeTypes[ext] || "application/octet-stream";
>     const data = await fsLib.readFile(safePath);
>
>     return {
>       status: 200,
>       contentType,
>       data
>     };
>   } catch (err) {
>     return { status: 404, error: "FILE_NOT_FOUND" };
>   }
> }
>
> // Verification tests
> const mockFs = {
>   readFile: async (p) => Buffer.from("body { color: red; }")
> };
>
> serveStaticFile("styles/main.css", "/var/www/public", mockFs).then(res => {
>   console.assert(res.status === 200, "Test 1 Failed");
>   console.assert(res.contentType === "text/css", "Test 2 Failed: MIME type resolved to text/css");
> });
> ```
>
> #### Technical Explanation
>
> 1. **express.static Middleware**: Express built-in middleware (`express.static('public')`) serving static frontend assets.
> 2. **MIME Type Headers**: Setting accurate `Content-Type` headers (`text/html`, `application/javascript`) ensures browsers render assets correctly.
> 3. **Security Path Guards**: Always sanitize static file paths to prevent directory traversal attacks outside root asset folder.
> 
---

### Exercise 2: HTTP ETag & Cache-Control Validator

**Scenario:** Generates HTTP `ETag` hashes for static files and validates incoming `If-None-Match` request headers to return `304 Not Modified`.

**Requirements:**
1. Write validateETagCache(reqHeaders, fileContentBuffer, mockCrypto).
2. Compute ETag hash.
3. Return 304 if match, 200 if modified.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function validateETagCache(reqHeaders = {}, fileContentBuffer, mockCrypto) {
>   const cryptoLib = mockCrypto || require("crypto");
>   const hash = cryptoLib.createHash("md5").update(fileContentBuffer).digest("hex");
>   const etag = `W/"${fileContentBuffer.length}-${hash.substring(0, 8)}"`;
>
>   const clientETag = reqHeaders["if-none-match"] || reqHeaders["If-None-Match"];
>
>   if (clientETag === etag) {
>     return {
>       status: 304, // Not Modified!
>       headers: { "ETag": etag },
>       sendBody: false
>     };
>   }
>
>   return {
>     status: 200,
>     headers: {
>       "ETag": etag,
>       "Cache-Control": "public, max-age=86400"
>     },
>     sendBody: true
>   };
> }
>
> // Verification tests
> const mockCrypto = {
>   createHash: () => ({ update: () => ({ digest: () => "abcdef123456" }) })
> };
> const buf = Buffer.from("static_content");
>
> const res1 = validateETagCache({}, buf, mockCrypto);
> console.assert(res1.status === 200 && res1.sendBody === true, "Test 1 Failed");
>
> const res2 = validateETagCache({ "If-None-Match": res1.headers.ETag }, buf, mockCrypto);
> console.assert(res2.status === 304 && res2.sendBody === false, "Test 2 Failed: 304 Not Modified returned");
> ```
>
> #### Technical Explanation
>
> 1. **HTTP 304 Not Modified Status**: Instructs browser to use cached local copy without re-downloading file bytes over the network.
> 2. **ETag Header Validation**: Weak or strong entity tags (`W/"..."`) validate whether static file content has changed.
> 3. **Cache-Control Max-Age**: Tells browsers and CDN edge servers how long to cache static assets in seconds.
> 
---

### Exercise 3: Static Asset Directory Traversal Guard

**Scenario:** A security validator checks requested file paths to ensure they stay strictly within the root public directory.

**Requirements:**
1. Write guardStaticPath(requestedPath, rootDir).
2. Resolve absolute target path.
3. Return boolean indicating if path is safe.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function guardStaticPath(requestedPath, rootDir = "/var/www/public") {
>   const pathLib = require("path");
>
>   const resolvedRoot = pathLib.resolve(rootDir);
>   const resolvedTarget = pathLib.resolve(resolvedRoot, requestedPath.replace(/^\//, ""));
>
>   const isSafe = resolvedTarget.startsWith(resolvedRoot);
>
>   return {
>     isSafe,
>     resolvedTarget,
>     resolvedRoot
>   };
> }
>
> // Verification tests
> console.assert(guardStaticPath("images/logo.png").isSafe === true, "Test 1 Failed");
> console.assert(guardStaticPath("../../etc/shadow").isSafe === false, "Test 2 Failed: Traversal blocked");
> ```
>
> #### Technical Explanation
>
> 1. **Directory Traversal Attack**: Attackers submit `../../` relative paths to access private system files outside public root.
> 2. **path.resolve Normalization**: Resolves `.` and `..` path segments to produce absolute canonical paths.
> 3. **Path Prefix Checking**: `targetPath.startsWith(rootPath)` guarantees static file server stays inside target public directory.
## 6. Related Terms
- [Routing](routing.md) — The system matching URL structures.
- [The http Module](../level_02/http_module.md) — The underlying HTTP server layer.

---

## 7. Key Takeaways
- `express.static` serves static files (HTML, CSS, images, client JS) from a directory.
- If a requested file exists, the middleware sends it and ends the request cycle.
- If the file does not exist, the middleware calls `next()` to continue down the route chain.
- Always use absolute paths via `path.join(__dirname, 'folder')` to prevent directory resolution bugs.
- Do not include the host folder name (e.g. `public`) in the client URL request path.
- Use virtual path prefixes to organize static routes under specific sub-paths.
