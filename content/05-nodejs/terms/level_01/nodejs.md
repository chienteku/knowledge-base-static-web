# Node.js (Runtime Environment)

> **Level 1 — Introduction & Architecture**
> An open-source, cross-platform runtime environment that allows developers to execute JavaScript code on the server (outside of a web browser).

---

## 1. Prerequisites
- None!

---

## 2. Term Category

**Runtime Environment / Backend Architecture (Server-Side)**: Node.js (Runtime Environment) is a fundamental concept in this technology stack. **Level 1 — Introduction & Architecture**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
For the first 15 years of its existence, JavaScript was physically trapped inside the web browser. You could only use it to animate buttons or validate forms on the Frontend. If you wanted to build the Backend Server (to talk to a database or handle HTTP requests), you had to switch to a completely different language like PHP, Java, or Ruby.
In 2009, Ryan Dahl took the incredibly fast **V8 Engine** (the engine inside Google Chrome that executes JS) and ripped it out of the browser. He wrapped it in a C++ program that could read files from a hard drive and listen to network ports. He called this wrapper **Node.js**.
Suddenly, developers could developers use the exact same language (JavaScript) on both the Frontend and the Backend!

### (2) What is a "Runtime"?
A "Language" (like JS) is just a set of grammar rules. It doesn't actually *do* anything.
A "Runtime" is the physical software that reads those rules, translates them into machine code, and executes them on the CPU. 
- The Browser is a runtime for the Frontend.
- Node.js is a runtime for the Backend.

### (3) JavaScript in the Browser vs Node.js
While they use the same grammar, they have completely different superpowers:
- **Browser JS:** Has the `window` object and `document.getElementById()`. It can manipulate the UI, but it is strictly forbidden from reading your computer's hard drive (for security).
- **Node.js:** Has no `window` or `document` (because there is no screen!). Instead, it has the `fs` (File System) and `http` modules. It can read your hard drive, delete files, and spin up an HTTP server on port 3000.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Trying to use DOM APIs in Node.js

**The mistake:** A developer writes a backend script in Node.js to scrape data, and tries to use `document.querySelector('h1')`.

**Why it's wrong:** The `document` object does not exist in Node.js! The DOM (Document Object Model) is an API provided exclusively by Web Browsers to manipulate HTML. Because Node.js runs on a headless server without a screen or HTML engine, DOM APIs will throw a fatal `ReferenceError: document is not defined`.
**Golden Rule:** "JavaScript on the server is not JavaScript in the browser."

---



### Mistake 2: Using Browser Global Objects (`window`, `document`) in Node.js Applications

**The mistake:** Referencing `window` or `document` inside Node.js scripts.

**Why it's wrong:** Node.js is a server runtime without a browser DOM. Accessing `window` or `document` throws `ReferenceError`.

*Incorrect:*
```javascript
const theme = window.localStorage.getItem('theme'); // ❌ ReferenceError: window is not defined
```

*Fix:*
```javascript
const fs = require('fs');
const theme = process.env.THEME || 'dark'; // Use Node.js globals & APIs
```

### Mistake 3: Failing to Handle Asynchronous Rejections in Node.js Servers

**The mistake:** Omitting error handling on asynchronous promises or database calls.

**Why it's wrong:** Unhandled promise rejections crash modern Node.js processes or leave them in unhandled states. Always attach `.catch()` or try/catch blocks.

*Incorrect:*
```javascript
app.get('/data', async (req, res) => {
  const data = await fetchData(); // ❌ If fetchData rejects, request hangs or crashes server!
  res.send(data);
});
```

*Fix:*
```javascript
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.send(data);
  } catch (err) {
    next(err);
  }
});
```

## 5. Practice Exercises

### Exercise 1: Node.js Environment Capability & Runtime Inspector

**Scenario:** A cross-platform library checks runtime capabilities to confirm code is executing in Node.js rather than browser environments.

**Requirements:**
1. Write inspectNodeRuntime().
2. Check process.versions.node.
3. Check global vs window.
4. Return runtime environment metadata.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectNodeRuntime() {
>   const isNode = typeof process !== "undefined" && 
>                  process.versions !== undefined && 
>                  process.versions.node !== undefined;
>
>   if (!isNode) {
>     return { isNode: false, environment: "BROWSER_OR_OTHER" };
>   }
>
>   return {
>     isNode: true,
>     nodeVersion: process.versions.node,
>     v8Version: process.versions.v8,
>     platform: process.platform,
>     arch: process.arch,
>     pid: process.pid
>   };
> }
>
> // Verification tests
> const info = inspectNodeRuntime();
> console.assert(info.isNode === true, "Test 1 Failed: Must detect Node.js runtime");
> console.assert(typeof info.nodeVersion === "string", "Test 2 Failed: Must return Node.js version string");
> ```
>
> #### Technical Explanation
>
> 1. **Node.js Runtime Architecture**: Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 engine and libuv.
> 2. **Server vs Browser Globals**: Node.js provides global, process, Buffer, and require/import; Browser provides window, document, and navigator.
> 3. **Native OS Access**: Node.js grants full access to file system (fs), networking (net/http), and system processes (child_process).
> 
---

### Exercise 2: Graceful Shutdown Process Signal Handler

**Scenario:** An API server registers process signal handlers (`SIGTERM`, `SIGINT`) to close HTTP servers, database pools, and Redis connections before exiting.

**Requirements:**
1. Write setupGracefulShutdown(serverMock, dbPoolMock, processMock).
2. Listen for SIGTERM / SIGINT.
3. Close HTTP server, close DB pool, exit process.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function setupGracefulShutdown(serverMock, dbPoolMock, processMock) {
>   const proc = processMock || process;
>   let isShuttingDown = false;
>
>   async function shutdown(signal) {
>     if (isShuttingDown) return;
>     isShuttingDown = true;
>
>     try {
>       if (serverMock && typeof serverMock.close === "function") {
>         await new Promise(r => serverMock.close(r));
>       }
>       if (dbPoolMock && typeof dbPoolMock.end === "function") {
>         await dbPoolMock.end();
>       }
>       proc.exit(0);
>     } catch (err) {
>       proc.exit(1);
>     }
>   }
>
>   proc.on("SIGTERM", () => shutdown("SIGTERM"));
>   proc.on("SIGINT", () => shutdown("SIGINT"));
>
>   return { isShuttingDown: () => isShuttingDown, trigger: shutdown };
> }
>
> // Verification tests
> let serverClosed = false;
> let dbClosed = false;
> let exitCode = null;
>
> const mockServer = { close: (cb) => { serverClosed = true; cb(); } };
> const mockDb = { end: async () => { dbClosed = true; } };
> const mockProc = { on: () => {}, exit: (code) => { exitCode = code; } };
>
> const handler = setupGracefulShutdown(mockServer, mockDb, mockProc);
> handler.trigger("SIGTERM").then(() => {
>   console.assert(serverClosed === true && dbClosed === true, "Test 1 Failed: Server and DB must close");
>   console.assert(exitCode === 0, "Test 2 Failed: Exit code 0");
> });
> ```
>
> #### Technical Explanation
>
> 1. **SIGTERM vs SIGINT**: SIGTERM is sent by Kubernetes/Docker to request graceful termination; SIGINT is sent by Ctrl+C in terminal.
> 2. **Graceful Shutdown Sequence**: Stop accepting new HTTP connections -> Finish in-flight requests -> Close DB connection pools -> Exit process.
> 3. **Kubernetes Termination Grace Period**: K8s gives containers ~30s to shut down gracefully before sending SIGKILL (force kill).
> 
---

### Exercise 3: Memory Usage Inspector & Heap Allocation Guard

**Scenario:** An APM monitor inspects Node.js memory metrics via `process.memoryUsage()`, alerting when heap memory usage approaches V8 limits.

**Requirements:**
1. Write inspectMemoryUsage(processMock, maxHeapMb).
2. Extract rss, heapTotal, heapUsed.
3. Flag warning if heapUsed exceeds maxHeapMb.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function inspectMemoryUsage(processMock, maxHeapMb = 1400) {
>   const proc = processMock || process;
>   const mem = proc.memoryUsage();
>
>   const toMb = (bytes) => Number((bytes / (1024 * 1024)).toFixed(2));
>
>   const rssMb = toMb(mem.rss);
>   const heapTotalMb = toMb(mem.heapTotal);
>   const heapUsedMb = toMb(mem.heapUsed);
>   const externalMb = toMb(mem.external || 0);
>
>   const isWarning = heapUsedMb >= maxHeapMb;
>
>   return {
>     rssMb,
>     heapTotalMb,
>     heapUsedMb,
>     externalMb,
>     isWarning
>   };
> }
>
> // Verification tests
> const mockProc = {
>   memoryUsage: () => ({
>     rss: 200 * 1024 * 1024,
>     heapTotal: 150 * 1024 * 1024,
>     heapUsed: 100 * 1024 * 1024,
>     external: 10 * 1024 * 1024
>   })
> };
>
> const metrics = inspectMemoryUsage(mockProc, 80);
> console.assert(metrics.heapUsedMb === 100, "Test 1 Failed");
> console.assert(metrics.isWarning === true, "Test 2 Failed: Must flag warning when 100MB > 80MB limit");
> ```
>
> #### Technical Explanation
>
> 1. **process.memoryUsage() Metrics**: rss (Resident Set Size), heapTotal (V8 allocated memory), heapUsed (actual memory consumed by JS objects).
> 2. **RSS (Resident Set Size)**: Total physical memory occupied by the Node.js process (includes V8 heap, C++ objects, code segment).
> 3. **V8 Default Memory Limit**: By default V8 caps max memory (~1.4GB - 4GB depending on Node version); configurable via `--max-old-space-size`.
## 6. Related Terms
- [V8 JavaScript Engine](v8_engine.md) — The actual engine beating inside the heart of Node.js.
- [NPM (Node Package Manager)](../level_04/npm.md) — The package manager that made the Node.js ecosystem the largest in the world.
- [Docker](../level_10/docker.md) — Related concept: Docker.
- [The Event Loop & Libuv](event_loop.md) — Node.js Event Loop.
- [Non-Blocking I/O](non_blocking_io.md) — Non-blocking I/O model.

---

## 7. Key Takeaways
- **Node.js** is a C++ program that wraps the V8 engine, allowing JS to run on servers.
- It popularized "Full-Stack JavaScript" (using JS for both frontend and backend).
- It lacks Browser APIs (like `window`, `document`, and `alert`).
- It provides Backend APIs (like File System access, Networking, and OS interactions).
