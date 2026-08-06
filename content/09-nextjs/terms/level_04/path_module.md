# Node.js `path` Module

> **Level 4 — Advanced Routing**
> A built-in Node.js server module providing utilities for resolving, combining, and parsing file and directory paths cross-platform.

---

## 1. Prerequisites
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The environment that hosts this module.
- [File-System Routing](../level_01/file_system_routing.md) — Path string manipulation for file-system routing.

---

## 2. Term Category

**Server & Edge API** (Node.js Path Resolution Utility): Node.js `path` module utilities (`path.join`, `path.resolve`) manipulate server filesystem paths safely.



---

## 3. Explanation

### Environment Context
- **Server Only** (File system operations can only execute on the backend server).

### (1) Design Motivation — "Why did we design this?"
When writing full-stack software, resolving paths to files on the host computer is a daily task. However, different operating systems use different separator characters to represent directories:
-   **Windows:** uses backslashes (e.g. `C:\users\project`).
-   **macOS / Linux:** uses forward slashes (e.g. `/home/users/project`).

If a developer manually concatenates path strings (such as `dir + '/' + filename`), the code will crash when compiled and run on a Windows machine. The Node.js **`path` module** was designed to solve this by providing cross-platform helper methods that inspect the host operating system dynamically and format paths safely. Next.js relies on this module internally, and adapts its relative navigation conventions (`.`, `..`) to define advanced page routing flows.

---

### (2) Core Concept — Cross-Platform Path Helpers
To use the `path` module on the server:

```typescript
import path from 'path';

// 1. Combine segments using the host platform's path separator
const dataPath = path.join(process.cwd(), 'data', 'users.json');
// - On Linux/macOS: "/workspace/data/users.json"
// - On Windows: "C:\workspace\data\users.json"

// 2. Extract parts of a path string
const filename = path.basename('/images/logo.png'); // Returns: "logo.png"
const folder = path.dirname('/images/logo.png');    // Returns: "/images"
```

---

### (3) Connection to Next.js Intercepting Routes
Next.js applies these exact path navigation conventions to its file-system routing structure. When using **Intercepting Routes**, folders are named using directory-matching operators to tell the router how many levels up to search in the path tree:
-   `(.)` matches segments at the **same** directory level.
-   `(..)` matches segments **one level up** (like `../`).
-   `(...)` matches segments starting from the **root** `app/` directory level.

For example, a folder named `app/feed/(..)photo/[id]/page.tsx` intercepts requests to `/photo/[id]` from within the `/feed` route because `(..)` navigates one level up, mirroring the `path` module logic.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Importing the Node.js `path` module inside a Client Component

**The mistake:** Trying to resolve file paths using the `path` module inside a client-side component:

```typescript
// app/components/Avatar.tsx
'use client'; // Client Component boundary!

import path from 'path'; // ❌ ERROR: Node.js module cannot run in browser!

export default function Avatar({ src }: { src: string }) {
  const assetUrl = path.join('/assets', src);
  return <img src={assetUrl} alt="Avatar" />;
}
```

**Why it's wrong:** The browser environment does not contain the Node.js compiler or file system APIs. If you import a Node.js core module inside a Client Component, the Next.js bundler will fail during compiling.

**Golden Rule:** Keep the `path` module restricted strictly to Server Components and backend scripts.

---

### Mistake 2: Using `path.join()` in Client Components or Edge Runtime

**The mistake:** Importing `import path from 'path'` in a file marked with `'use client'`.

**Why it's wrong:** Node.js `path` module is a server C++ binding that does NOT exist in browser client bundles or Edge Runtime. Use Node.js runtime (`export const runtime = 'nodejs'`) in Server Components.

*Incorrect:*
```typescript
'use client';
import path from 'path'; // ❌ Client compilation error!
```

*Fix:*
```typescript
// Keep Node.js path module calls in Server Components or Node.js Route Handlers
```

---

### Mistake 3: Hardcoding OS-Specific Path Separators (`/` vs `\`) for Local File System Reads

**The mistake:** Constructing file paths with manual string concatenation `process.cwd() + '/data/file.json'`.

**Why it's wrong:** Manual slash concatenation breaks on Windows OS (which uses backslashes `\`). Always use `path.join(process.cwd(), 'data', 'file.json')`.

*Incorrect:*
```typescript
const filePath = process.cwd() + '/data/file.json'; // ❌ Windows OS file path bug!
```

*Fix:*
```typescript
import path from 'path';
const filePath = path.join(process.cwd(), 'data', 'file.json'); // Cross-platform path join
```


---

## 5. Practice Exercises

### Exercise 1: Joining Filesystem Paths Safely with `path.join()`

**Scenario:**
Use Node.js `path.join()` inside a Server Component to read a local JSON data file safely across OS platforms.

**Requirements:**
1. Import `path` module.
2. Resolve file path with `path.join(process.cwd(), 'data', 'file.json')`.

> [!check]- Answer
>
> #### Implementation
>
> ```tsx
> import path from "node:path";
> import fs from "node:fs/promises";
> 
> export default async function DataPage() {
>   const filePath = path.join(process.cwd(), "data", "users.json");
>   const fileContent = await fs.readFile(filePath, "utf-8");
>   const users = JSON.parse(fileContent);
> 
>   return (
>     <main className="p-6">
>       <h1>Local Users</h1>
>       <ul>
>         {users.map((u: any) => (
>           <li key={u.id}>{u.name}</li>
>         ))}
>       </ul>
>     </main>
>   );
> }
> ```
> 
> #### Technical Explanation
>
> 1. `path.join()` concatenates path segments using platform-specific delimiters (`/` on Linux/macOS, `\` on Windows).
> 2. `process.cwd()` returns the root directory of the Next.js project.
> 3. Prevents path traversal security vulnerabilities and cross-platform path errors.
> 
---

### Exercise 2: Extracting File Extensions with `path.extname()`

**Scenario:**
Validate file extensions of uploaded files inside a Route Handler using `path.extname()`.

**Requirements:**
1. Call `path.extname(filename)` in server code.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // app/api/upload/route.ts
> import path from "node:path";
> 
> export async function POST(req: Request) {
>   const { fileName } = await req.json();
>   const ext = path.extname(fileName).toLowerCase();
> 
>   if (![".png", ".jpg", ".webp"].includes(ext)) {
>     return Response.json({ error: "Invalid image format" }, { status: 400 });
>   }
> 
>   return Response.json({ success: true, extension: ext });
> }
> ```
> 
> #### Technical Explanation
>
> 1. `path.extname()` extracts file extensions from file path strings.
> 2. Server-side file format validation prevents unsafe file upload processing.
> 3. Utility pattern for server-side API handlers.
> 
---

### Exercise 3: Preventing Directory Traversal Security Vulnerabilities

**Scenario:**
Sanitize user-supplied file path inputs using `path.resolve()` and `path.normalize()` to prevent `../` attacks.

**Requirements:**
1. Validate resolved path starts with base directory.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> import path from "node:path";
> 
> export function getSafeFilePath(userInputPath: string) {
>   const baseDir = path.resolve(process.cwd(), "public/uploads");
>   const safePath = path.resolve(baseDir, path.normalize(userInputPath));
> 
>   if (!safePath.startsWith(baseDir)) {
>     throw new Error("Security Violation: Directory Traversal Attempt Blocked");
>   }
> 
>   return safePath;
> }
> ```
> 
> #### Technical Explanation
>
> 1. Malicious user inputs (`../../etc/passwd`) attempt to break out of public directories.
> 2. `path.resolve()` resolves relative path segments into absolute paths.
> 3. Checking `safePath.startsWith(baseDir)` guarantees files stay within authorized folders.
> 
---


## 6. Related Terms
- [Node.js Runtime](../level_01/nodejs_runtime.md) — The parent execution runtime.
- [Intercepting Routes (`(..)folder`)](intercepting_routes.md) — The routing feature utilizing path navigation operators.

---

## 7. Key Takeaways
- The Node.js `path` module provides cross-platform file path resolution tools.
- Use `path.join()` instead of manual string concatenation to support Windows and POSIX hosts.
- `path.resolve()` returns absolute paths; `path.basename()` extracts the filename segment.
- Next.js Intercepting Routes adapt standard path navigation operators (`.`, `..`) for route interception.
- Do not import `path` inside Client Components.
