# Module Resolution & Path Aliases

> **Level 11 — Modules, Declaration Files & Configuration**
> The compiler settings and algorithms (`moduleResolution`, `paths`, and `baseUrl`) that TypeScript uses to locate files on disk when resolving import statements and managing absolute import aliases.

---

## 1. Prerequisites
- [tsconfig.json](../level_01/tsconfig.md) — The compiler configurations manager.
- [ES Modules in TypeScript](../level_11/modules.md) — The syntax for imports and exports.

---

## 2. Term Category
- **Compiler / Config**

---

## 3. Environment Context
- **Build-time** (Resolving paths is a compilation process used to verify module compatibility; output path translations must be supported by the bundler or runtime engine).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In large-scale codebases, deep directory trees often lead to messy, confusing relative import paths:
```typescript
import { database } from '../../../../config/database';
```
These relative imports are difficult to read, hard to write, and break instantly if you move your file to another folder.

Developers prefer to use clean, absolute path aliases that point directly to root directories:
```typescript
import { database } from '@/config/database'; // "@" represents "src"
```

To make this work, the TypeScript compiler needs a clear set of rules to determine:
1. Where to physically search on disk when it sees an import statement (the **Module Resolution Strategy**).
2. How to map alias prefixes (like `@/`) to real folder locations (the **Path Aliases**).

### (2) Core Mechanics

#### Module Resolution Strategies
Controlled by `"moduleResolution"` in `tsconfig.json`:
- **`"node"` (or `"classic"`):** Legacy resolution strategies modeling older CommonJS Node module lookups (looks in `node_modules`).
- **`"node16"` / `"nodenext"`:** Strictly enforces modern ES Modules in Node.js, checking package exports fields and requiring file extensions in import statements (e.g. `import './file.js'`).
- **`"bundler"` (TS 5.0+):** The standard setting for frontend projects. It delegates runtime lookup constraints to bundlers (like Vite, Webpack, or ESBuild), allowing extensionless imports and package exports lookups.

#### Path Aliases (`paths` and `baseUrl`)
You configure custom path mappings inside `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".", // Defines the root directory for non-relative path lookups
    "paths": {
      "@/*": ["src/*"] // Maps imports starting with "@/" to "src/"
    }
  }
}
```

#### Crucial Gotcha: Type-Only Mapping
Setting `"paths"` in `tsconfig.json` **only** tells the TypeScript compiler how to resolve types during build validation. It **does not change** the path strings in the compiled JavaScript output.

If you compile:
```typescript
import { log } from '@/utils/log';
```
The compiled output remains:
```javascript
import { log } from '@/utils/log'; // Will crash at runtime if not resolved by your bundler!
```
To run this code, you must configure your runtime bundler (like Vite aliases or Webpack resolve config) to translate the `@/` string to the real path during packaging.

### (3) Real-World Application
Configuring a Vite + TypeScript application path mapping.

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Configure Vite to translate "@" to "src" at runtime!
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Configuring `paths` in `tsconfig` and expecting it to run in Node.js without resolution engines

**The mistake:** Using path aliases (`@/`) in a backend Node.js project and running `tsc && node dist/index.js`, expecting it to resolve automatically.

**Why it's wrong:** The compiled JS files still contain the literal `@/` imports. Node.js does not read `tsconfig.json` at runtime and will throw a `Cannot find module` error.

*Incorrect run:*
```bash
node dist/index.js # Crashes! Error: Cannot find module '@/config/db'
```

*Fix:* Use a helper library like `tsconfig-paths` at runtime, configure Node's built-in subpath imports in `package.json` (`"imports"` field), or use a runtime runner like `ts-node` / `tsx`.
```bash
node -r tsconfig-paths/register dist/index.js # Resolves aliases at runtime!
```

**Golden Rule:** `tsconfig.json` paths are only for the compiler's type checking. The actual runtime execution environment (Vite, Node.js, Webpack) must be separately configured to translate path aliases.

---



### Mistake 2: Configuring `moduleResolution: "classic"` in Modern Bundler Projects

**The mistake:** Using `"moduleResolution": "classic"` in `tsconfig.json` for modern React/Node apps.

**Why it's wrong:** `classic` resolution fails to locate packages in nested `node_modules` or process package `.exports` subpaths. Use `"moduleResolution": "bundler"` or `"node16"`.

*Incorrect:*
```typescript
// tsconfig.json
{ "compilerOptions": { "moduleResolution": "classic" } }
```

*Fix:*
```typescript
// tsconfig.json
{ "compilerOptions": { "moduleResolution": "bundler" } }
```

### Mistake 3: Adding Path Aliases in `tsconfig.json` without Configuring Bundler Resolvers

**The mistake:** Configuring `"paths": { "@/*": ["./src/*"] }` in `tsconfig.json` expecting Webpack/Vite to resolve `@/` automatically.

**Why it's wrong:** `tsconfig.json` path aliases inform TS for type checking only! Your bundler (Vite, Webpack, Rollup) requires matching path alias configs.

*Incorrect:*
```typescript
// tsconfig.json
{ "compilerOptions": { "paths": { "@/*": ["src/*"] } } } // ❌ Bundler throws 'Cannot find module'
```

*Fix:*
```typescript
// Configure Vite vite.config.ts / Webpack alias matching tsconfig paths
```

## 6. Practice Exercises

### Exercise 1: Absolute Config Mapping

**Problem:** You want to add a path alias `@services/*` pointing to `src/services/*` inside `tsconfig.json`. Fill in the missing JSON configuration.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // Complete this line:
      "@services/*": ["src/services/*"]
    }
  }
}
```

**Expected output:**
```text
The compiler successfully resolves Service imports:
import { UserService } from '@services/UserService';
```

> [!check]- Answer
> - The key is the alias pattern `"@services/*"`.
> - The value is an array containing the path relative to `baseUrl`: `["src/services/*"]`.

---



### Exercise 2: Path Aliasing Configuration

**Problem:** Configure `baseUrl: "."` and `paths: { "@components/*": ["src/components/*"] }`.

**Expected output:**
```text
Path aliases configured
```

> [!check]- Answer
> ```typescript
> console.log("Path aliases configured");
> ```
>
> **Explanation:** `paths` and `baseUrl` create concise import path aliases in TS projects.

### Exercise 3: ESM `.js` File Extension Imports

**Problem:** Why does `moduleResolution: "node16"` require writing `import { foo } from './foo.js'` in `.ts` files?

**Expected output:**
```text
Node16 module resolution enforces explicit file extension imports
```

> [!check]- Answer
> ```typescript
> console.log("Node16 module resolution enforces explicit file extension imports");
> ```
>
> **Explanation:** ESM Node.js standards mandate explicit relative file extensions in import specifiers.

## 7. Related Terms
- [tsconfig.json](../level_01/tsconfig.md) — The compiler options file.
- [ES Modules in TypeScript](../level_11/modules.md) — The modular loading specification.
- [DefinitelyTyped](../level_11/definitely_typed.md) — The third-party modules type registry.

---

## 8. Key Takeaways
- **Module Resolution** is the compiler's algorithm to resolve relative and non-relative import paths to files on disk.
- **`moduleResolution`** options (like `"bundler"` and `"nodenext"`) select lookup behaviors matching specific environments.
- **Path Aliases** (`"paths"`) replace long, nested relative paths (`../../../`) with clean absolute shortcuts (like `@/`).
- `tsconfig.json` path configurations are strictly type-only; they do not alter path strings in compile outputs.
- You must configure runtime engines (Vite aliases, Webpack resolve, or Node subpaths) to handle path alias resolution.
