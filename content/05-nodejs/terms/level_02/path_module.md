# The path Module

> **Level 2 — Core Modules & Globals**
> A core utility module built into Node.js designed to safely construct, manipulate, and parse file paths across different operating systems.

---

## 1. Prerequisites
- [Global Objects (global, __dirname, __filename)](global_objects.md) — The `path` module is heavily used in conjunction with `__dirname`.
- [The fs Module (File System)](fs_module.md) — You use the `path` module to build the strings that you feed into `fs`.

---

## 2. Term Category

**Node.js Core Module (Universal .)**: The path Module is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to read a file located in a subfolder, you might write code like this:
```javascript
const myPath = __dirname + '/data/users.json';
```
This works perfectly on a Mac or a Linux server. However, if your coworker runs this exact same code on a Windows computer, **it will crash.**
Why? Because Windows uses backslashes (`\`) for file paths, while Mac/Linux use forward slashes (`/`). If you manually type slashes as strings, your code is no longer cross-platform.
The **`path`** module solves this by dynamically calculating the correct slashes for whatever Operating System the code is currently running on.

### (2) `path.join()`
This is the most important method in the module. You give it a list of folder names, and it stitches them together perfectly, using the correct slashes for the OS.
```javascript
const path = require('path');

// The safe, cross-platform way to build paths:
const safePath = path.join(__dirname, 'data', 'users.json');

// On Mac/Linux, safePath = "/Users/bob/data/users.json"
// On Windows, safePath   = "C:\Users\bob\data\users.json"
```

### (3) Parsing Paths
The `path` module also provides incredible utilities for breaking a path apart:
- `path.basename('/files/image.png')` Returns the file name: `"image.png"`
- `path.extname('/files/image.png')` Returns the extension: `".png"`
- `path.dirname('/files/image.png')` Returns the folder path: `"/files"`

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Hardcoding slashes in `require()` or `fs.readFile()`

**The mistake:** A developer writes `fs.readFile(__dirname + '/config.json')`. They deploy it to a Windows server and the server crashes with a "File Not Found" error.

**Why it's wrong:** As explained, hardcoding slashes ruins cross-platform compatibility. 
**Golden Rule:** NEVER use the `+` operator or template literals (`${__dirname}/config`) to build file paths. Always use `path.join()`.

---



### Mistake 2: Concatenating File Paths with Manual String Addition (`dir + '/' + file`)

**The mistake:** Writing `const fullPath = __dirname + '/' + 'files' + '/' + 'doc.txt'`.

**Why it's wrong:** Manual string concatenation breaks cross-platform path compatibility between Windows (`\`) and POSIX Linux/macOS (`/`). Use `path.join()`.

*Incorrect:*
```javascript
const p = __dirname + '\\' + 'config.json'; // ❌ Fails on Linux/macOS servers!
```

*Fix:*
```javascript
const p = path.join(__dirname, 'config', 'config.json'); // Cross-platform safe
```

### Mistake 3: Confusing `path.join()` with `path.resolve()` Path Resolution Logic

**The mistake:** Expecting `path.join('/a', '/b')` to return `/b`.

**Why it's wrong:** `path.join()` concatenates path segments normalize-style (`/a/b`). `path.resolve()` resolves absolute paths from right to left, treating root `/` as absolute root (`/b`).

*Incorrect:*
```javascript
path.join('/a', '/b'); // Returns '/a/b'
path.resolve('/a', '/b'); // Returns '/b' -- resolve treats /b as absolute root!
```

*Fix:*
```javascript
// Use path.join for simple joining; use path.resolve for absolute working directory resolution
```

## 5. Practice Exercises

### Exercise 1: Cross-Platform Path Normalizer & Directory Traversal Defense

**Scenario:** An API file download service sanitizes user-supplied file paths to prevent Directory Traversal security vulnerabilities (`../../etc/passwd`).

**Requirements:**
1. Write sanitizeFilePath(baseDir, userInputPath, mockPath).
2. Resolve absolute path using path.resolve.
3. Ensure path starts with baseDir.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function sanitizeFilePath(baseDir, userInputPath, mockPath) {
>   const pathLib = mockPath || require("path");
>
>   const normalizedBase = pathLib.resolve(baseDir);
>   const resolvedTarget = pathLib.resolve(normalizedBase, userInputPath);
>
>   // Security Check: Resolved target MUST start with baseDir!
>   if (!resolvedTarget.startsWith(normalizedBase)) {
>     return {
>       safe: false,
>       error: "DIRECTORY_TRAVERSAL_ATTACK",
>       resolvedPath: null
>     };
>   }
>
>   return {
>     safe: true,
>     resolvedPath: resolvedTarget
>   };
> }
>
> // Verification tests
> const path = require("path");
> const res1 = sanitizeFilePath("/var/app/uploads", "user1/photo.jpg", path);
> console.assert(res1.safe === true, "Test 1 Failed: Safe path allowed");
>
> const res2 = sanitizeFilePath("/var/app/uploads", "../../etc/passwd", path);
> console.assert(res2.safe === false, "Test 2 Failed: Directory traversal blocked");
> ```
>
> #### Technical Explanation
>
> 1. **Directory Traversal Vulnerability**: Attacker sends `../` sequences in file request parameters to access sensitive system files.
> 2. **path.resolve vs path.join**: path.resolve produces absolute paths by evaluating `.` and `..` segments relative to current directory.
> 3. **Path Sanitization Rule**: Always verify `resolvedPath.startsWith(allowedBaseDir)` before calling file system methods.
> 
---

### Exercise 2: File Metadata & Extension Parser

**Scenario:** An uploaded media processor parses file names, extensions, and directory paths cross-platform using `path.parse()`.

**Requirements:**
1. Write parseFileMetadata(filePath, mockPath).
2. Extract root, dir, base, ext, name.
3. Return metadata object.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function parseFileMetadata(filePath, mockPath) {
>   const pathLib = mockPath || require("path");
>   const parsed = pathLib.parse(filePath);
>
>   return {
>     directory: parsed.dir,
>     fileName: parsed.base,
>     nameWithoutExt: parsed.name,
>     extension: parsed.ext.toLowerCase(),
>     isImage: [".png", ".jpg", ".jpeg", ".webp"].includes(parsed.ext.toLowerCase())
>   };
> }
>
> // Verification tests
> const path = require("path");
> const meta = parseFileMetadata("/var/uploads/avatar.PNG", path);
>
> console.assert(meta.fileName === "avatar.PNG", "Test 1 Failed");
> console.assert(meta.nameWithoutExt === "avatar", "Test 2 Failed");
> console.assert(meta.extension === ".png", "Test 3 Failed: Extension must be lowercased");
> console.assert(meta.isImage === true, "Test 4 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **path.parse Utility**: Parses path string into structured object `{ root, dir, base, ext, name }`.
> 2. **path.extname**: Extracts file extension including leading dot (e.g. `.png`).
> 3. **Cross-Platform Delimiters**: Handles both POSIX forward slashes (`/`) and Windows backslashes (`\`) correctly.
> 
---

### Exercise 3: Cross-Platform Path Resolver for POSIX and Windows

**Scenario:** A build CLI normalizes path separators (`/` vs `\`) using `path.posix` and `path.win32` helper namespaces.

**Requirements:**
1. Write normalizePathForPosix(filePath, mockPath).
2. Replace backslashes with forward slashes.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function normalizePathForPosix(filePath, mockPath) {
>   const pathLib = mockPath || require("path");
>
>   // Convert Windows backslashes to POSIX forward slashes
>   const posixPath = filePath.replace(/\\/g, "/");
>   return pathLib.posix ? pathLib.posix.normalize(posixPath) : posixPath;
> }
>
> // Verification tests
> const res = normalizePathForPosix("C:\\Users\\Admin\\docs\\file.txt");
> console.assert(!res.includes("\\"), "Test 1 Failed: Backslashes removed");
> console.assert(res.includes("Users/Admin"), "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **POSIX vs Windows Paths**: POSIX uses `/` as separator; Windows uses `\` as separator and drives (`C:\`).
> 2. **path.posix & path.win32**: Node.js provides `path.posix` and `path.win32` properties to force specific OS path behaviors.
> 3. **path.sep and path.delimiter**: `path.sep` provides OS-specific path separator; `path.delimiter` provides environment PATH separator (`;` vs `:`).
## 6. Related Terms
- [The fs Module (File System)](fs_module.md) — The module that consumes the paths you build.
- [Global Objects (global, __dirname, __filename)](global_objects.md) — Related concept: Global Objects (global, __dirname, __filename).

---

## 7. Key Takeaways
- The **`path`** module is a core utility for manipulating file paths.
- Different Operating Systems use different slashes for paths (Windows uses `\`, Mac/Linux uses `/`).
- **`path.join()`** automatically uses the correct slash for the current OS.
- Never manually concatenate strings to build file paths.
