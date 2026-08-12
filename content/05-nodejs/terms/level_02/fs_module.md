# The fs Module (File System)

> **Level 2 — Core Modules & Globals**
> A core module built into Node.js that gives your JavaScript code the superpower to read, write, update, and delete physical files on the computer's hard drive.

---

## 1. Prerequisites
- [Non-Blocking I/O](../level_01/non_blocking_io.md) — The `fs` module is the classic example of why Non-Blocking I/O is critical.
- [Node.js (Runtime Environment)](../level_01/nodejs.md) — This module is impossible in the browser for security reasons.

---

## 2. Term Category

**Node.js Core Module (Node.js Only)**: The fs Module (File System) is a fundamental concept in this technology stack. **Level 2 — Core Modules & Globals**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
If you are building a Web Server, you eventually need to save data. Sometimes you don't need a massive Postgres database; you just want to save a user's uploaded profile picture, write a log file, or read a configuration JSON file.
Because standard JavaScript in the browser is explicitly banned from touching the hard drive (to stop malicious websites from stealing your files), Node.js had to invent a completely new API for file manipulation. This is the `fs` (File System) module.

### (2) The Three Flavors of `fs`
The `fs` module has evolved over the years, and now offers three different ways to interact with files:
1. **Synchronous (Blocking):** Halts the entire server until the file is read. ONLY use this during initial server startup.
   ```javascript
   const fs = require('fs');
   const data = fs.readFileSync('config.txt', 'utf8');
   ```
2. **Callbacks (Non-Blocking):** The old, legacy way. It doesn't block the server, but it creates messy "Callback Hell".
   ```javascript
   fs.readFile('data.txt', 'utf8', (err, data) => {
     console.log(data);
   });
   ```
3. **Promises (The Modern Way):** Uses modern `async/await`. This is the industry standard today.
   ```javascript
   const fs = require('fs/promises');
   const data = await fs.readFile('data.txt', 'utf8');
   ```

### (3) Core Methods
- `fs.readFile()`: Reads the entire contents of a file into memory.
- `fs.writeFile()`: Overwrites a file completely.
- `fs.appendFile()`: Adds text to the end of a file (great for logging).
- `fs.unlink()`: Deletes a file.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the Character Encoding (`utf8`)

**The mistake:** A developer writes: `const text = await fs.readFile('poem.txt'); console.log(text);`
The terminal prints `<Buffer 48 65 6c 6c 6f 20 57 6f ...>` instead of the poem.

**Why it's wrong:** The computer doesn't know if the file is a text file, an image, or a video! By default, Node.js returns raw binary `Buffer` data. 
**Golden Rule:** If you are reading a text file or JSON file, you MUST pass `'utf8'` as the second argument: `fs.readFile('poem.txt', 'utf8')`. This tells Node.js to translate the binary into human-readable English characters.

---



### Mistake 2: Loading Massive Files into Memory via `fs.readFile` Instead of Streaming

**The mistake:** Reading a 5GB log file into memory using `fs.promises.readFile('huge.log')`.

**Why it's wrong:** Reading huge files entirely into memory exceeds V8 max heap allocation limits, causing Out Of Memory crashes. Use `fs.createReadStream()`.

*Incorrect:*
```javascript
const data = await fs.promises.readFile('5gb_video.mp4'); // ❌ Memory heap crash!
```

*Fix:*
```javascript
const stream = fs.createReadStream('5gb_video.mp4');
stream.pipe(res);
```

### Mistake 3: Using `fs.exists()` (Deprecated API)

**The mistake:** Checking file existence with `fs.exists(path)` before reading.

**Why it's wrong:** `fs.exists()` is deprecated because checking existence before opening creates race conditions (TOCTOU: time-of-check to time-of-use). Open the file directly and handle `ENOENT` error.

*Incorrect:*
```javascript
if (fs.existsSync('file.txt')) {
  fs.readFileSync('file.txt'); // ❌ Race condition risk!
}
```

*Fix:*
```javascript
try {
  const data = await fs.promises.readFile('file.txt');
} catch (err) {
  if (err.code === 'ENOENT') console.log('File does not exist');
}
```

## 5. Practice Exercises

### Exercise 1: Atomic File Writer with Temporary Swap

**Scenario:** A configuration service writes application state atomically by writing to a temporary file (`config.tmp`) before renaming to `config.json` to prevent partial file corruption.

**Requirements:**
1. Write writeAtomicFile(filePath, dataStr, mockFs).
2. Write to `${filePath}.tmp`.
3. Rename temporary file to target `filePath`.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function writeAtomicFile(filePath, dataStr, mockFs) {
>   const fsLib = mockFs || require("fs").promises;
>   const tempPath = `${filePath}.tmp_${Date.now()}`;
>
>   try {
>     await fsLib.writeFile(tempPath, dataStr, "utf-8");
>     await fsLib.rename(tempPath, filePath);
>     return { success: true, filePath };
>   } catch (err) {
>     try { await fsLib.unlink(tempPath); } catch (_) {}
>     throw err;
>   }
> }
>
> // Verification tests
> const written = {};
> const mockFs = {
>   writeFile: async (p, d) => { written[p] = d; },
>   rename: async (src, dest) => {
>     written[dest] = written[src];
>     delete written[src];
>   }
> };
>
> writeAtomicFile("/app/config.json", '{"theme":"dark"}', mockFs).then(res => {
>   console.assert(written["/app/config.json"] === '{"theme":"dark"}', "Test 1 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **Atomic File Writes**: Prevents readers from reading partially written files if application crashes mid-write.
> 2. **fs.rename Atomicity**: POSIX `rename` system call is atomic on same file system partition.
> 3. **Corruption Defense**: Essential strategy for database engines, cache stores, and critical system configurations.
> 
---

### Exercise 2: Recursive Directory Traverser & File Finder

**Scenario:** A log analyzer recursively scans nested directories to collect all `.log` file paths.

**Requirements:**
1. Write findFilesInDir(dirPath, extension, mockFs).
2. Recursively read directory entries.
3. Return array of matching file paths.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function findFilesInDir(dirPath, extension = ".log", mockFs) {
>   const fsLib = mockFs || require("fs").promises;
>   const matches = [];
>
>   async function traverse(currentDir) {
>     const entries = await fsLib.readdir(currentDir, { withFileTypes: true });
>
>     for (const entry of entries) {
>       const fullPath = `${currentDir}/${entry.name}`;
>       if (entry.isDirectory()) {
>         await traverse(fullPath);
>       } else if (entry.isFile() && entry.name.endsWith(extension)) {
>         matches.push(fullPath);
>       }
>     }
>   }
>
>   await traverse(dirPath);
>   return matches;
> }
>
> // Verification tests
> const mockFs = {
>   readdir: async (dir) => {
>     if (dir === "/logs") {
>       return [
>         { name: "app.log", isDirectory: () => false, isFile: () => true },
>         { name: "sub", isDirectory: () => true, isFile: () => false }
>       ];
>     }
>     if (dir === "/logs/sub") {
>       return [
>         { name: "db.log", isDirectory: () => false, isFile: () => true }
>       ];
>     }
>     return [];
>   }
> };
>
> findFilesInDir("/logs", ".log", mockFs).then(files => {
>   console.assert(files.length === 2, "Test 1 Failed");
>   console.assert(files.includes("/logs/app.log"), "Test 2 Failed");
>   console.assert(files.includes("/logs/sub/db.log"), "Test 3 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **fs.readdir withFileTypes**: Passing `{ withFileTypes: true }` returns `Dirent` objects, avoiding separate `fs.stat` system calls per file.
> 2. **Recursive File System Traversal**: Recurses through directory trees while filtering by extension or stat metadata.
> 3. **Performance Optimization**: Reducing file stat calls dramatically speeds up directory scanning over large file trees.
> 
---

### Exercise 3: File Access & Permissions Checker

**Scenario:** An API startup check verifies that required config files exist and are readable/writable using `fs.promises.access()`.

**Requirements:**
1. Write checkFilePermissions(filePath, mockFs).
2. Check read and write permissions.
3. Return { exists, canRead, canWrite }.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> async function checkFilePermissions(filePath, mockFs) {
>   const fsLib = mockFs || require("fs").promises;
>   const fsConstants = (mockFs && mockFs.constants) || require("fs").constants;
>
>   let canRead = false;
>   let canWrite = false;
>
>   try {
>     await fsLib.access(filePath, fsConstants.R_OK);
>     canRead = true;
>   } catch (_) {}
>
>   try {
>     await fsLib.access(filePath, fsConstants.W_OK);
>     canWrite = true;
>   } catch (_) {}
>
>   return {
>     filePath,
>     exists: canRead || canWrite,
>     canRead,
>     canWrite
>   };
> }
>
> // Verification tests
> const mockFs = {
>   constants: { R_OK: 4, W_OK: 2 },
>   access: async (p, mode) => {
>     if (mode === 4) return;
>     throw new Error("Permission denied");
>   }
> };
>
> checkFilePermissions("/etc/config.json", mockFs).then(res => {
>   console.assert(res.exists === true && res.canRead === true, "Test 1 Failed");
>   console.assert(res.canWrite === false, "Test 2 Failed");
> });
> ```
>
> #### Technical Explanation
>
> 1. **fs.access vs fs.exists**: `fs.exists` is deprecated; `fs.access` checks existence and specific file mode permissions (R_OK, W_OK, X_OK).
> 2. **Race Condition Warning**: Checking permissions before `fs.open()` can cause TOCTOU (Time-of-check to time-of-use) race conditions.
> 3. **Best Practice Pattern**: Handle file operation errors directly inside try/catch rather than checking `fs.access` first whenever possible.
## 6. Related Terms
- [Buffers](../level_06/buffers.md) — What the `fs` module returns if you forget to specify `utf8`.
- [Streams (General Concept)](../level_06/streams.md) — If a file is 10 Gigabytes, `fs.readFile` will crash your RAM. You must use `fs.createReadStream` instead.
- [The path Module](path_module.md) — Related concept: The path Module.
- [Promisification (util.promisify)](../level_05/promisification.md) — Related concept: Promisification (util.promisify).

---

## 7. Key Takeaways
- The **`fs`** module allows Node.js to interact with the hard drive.
- It is explicitly banned in the browser for security reasons.
- You should always use the modern **`fs/promises`** version combined with `async/await`.
- Never use the `*Sync` methods (like `readFileSync`) in a live web server, as they block the Event Loop.
- Always remember to specify `'utf8'` when reading text or JSON.
