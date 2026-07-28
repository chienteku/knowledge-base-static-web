# Serving Static Files (express.static)

> **Level 7 — Web Servers & APIs**
> Serving HTML/CSS/images straight from a folder (the old index's term 36).

---

## 1. Prerequisites
- [Express.js](./express_js.md) — The parent framework hosting the middleware.
- [Middleware](./middleware.md) — The request processing pipeline.

---

## 2. Term Category
- **Third-Party Framework Concept (Express.js)**

---

## 3. Environment Context
- **Web App Server Layer** (Directly manages static assets and file serving logic).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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



### Mistake 5: Passing Relative Directory Paths to `express.static()`

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

### Mistake 6: Exposing Sensitive Root Directories via `express.static()` (Security Risk)

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



### Mistake 7: Passing Relative Directory Paths to `express.static()`

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

### Mistake 8: Exposing Sensitive Root Directories via `express.static()` (Security Risk)

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

## 6. Practice Exercises

### Exercise 1: Configuring Static Routes

**Problem:** You want to mount a folder named `assets` under the virtual URL prefix `/static`. Write the correct Express configuration code:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Solution:
const assetsPath = path.join(__dirname, 'assets');
app.use('/static', express.static(assetsPath));
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

---

### Exercise 2: Mounting Static Assets on Virtual Prefix Path

**Problem:** Mount `public` static directory under virtual path prefix `/static`.

**Expected output:**
> [!check]- Answer
> ```text
> app.use('/static', express.static(path.join(__dirname, 'public')));
> ```
> ```javascript
> app.use('/static', express.static(path.join(__dirname, 'public')));
> ```
>
> **Explanation:** Providing path prefix string mounts static middleware under a virtual URL path.

---

### Exercise 3: Configuring Cache Control Headers for Static Files

**Problem:** Configure `express.static` to set `maxAge` cache header to 1 day (86400000 ms).

**Expected output:**
> [!check]- Answer
> ```text
> app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
> ```
> ```javascript
> app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
> ```
>
> **Explanation:** Options object configures HTTP `Cache-Control` maxAge headers for served assets.

## 7. Related Terms
- [Routing](./routing.md) — The system matching URL structures.
- [The http Module](../level_02/http_module.md) — The underlying HTTP server layer.

---

## 8. Key Takeaways
- `express.static` serves static files (HTML, CSS, images, client JS) from a directory.
- If a requested file exists, the middleware sends it and ends the request cycle.
- If the file does not exist, the middleware calls `next()` to continue down the route chain.
- Always use absolute paths via `path.join(__dirname, 'folder')` to prevent directory resolution bugs.
- Do not include the host folder name (e.g. `public`) in the client URL request path.
- Use virtual path prefixes to organize static routes under specific sub-paths.
