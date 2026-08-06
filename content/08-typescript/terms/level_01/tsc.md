# The TypeScript Compiler (`tsc`)

> **Level 1 — Core Concepts & Environment Setup**
> The command-line tool (`tsc`) provided by Microsoft that analyzes your TypeScript code for errors and translates (transpiles) it into plain JavaScript.

---

## 1. Prerequisites
- [TypeScript](typescript.md) — The language that `tsc` compiles.

---

## 2. Term Category

**TypeScript Ecosystem & Tooling** (TypeScript Compiler CLI): `tsc` is the command-line TypeScript compiler executable that parses, type-checks, and transpiles TypeScript code to JavaScript.



---

## 3. Explanation

### Environment Context
- **Build-Time (Terminal)**

### (1) Design Motivation — "Why did we design this?"
You wrote a beautiful file named `app.ts`. You try to run it in the browser or via `node app.ts`. The computer immediately throws an error: `SyntaxError: Unexpected token ':'`.
Neither browsers nor Node.js can read TypeScript annotations. You need a translator. The **TypeScript Compiler (`tsc`)** is that translator.

### (2) The Two Jobs of `tsc`
When you run the command `npx tsc` in your terminal, the compiler performs two completely separate jobs:
1. **Type Checking:** It reads all your `.ts` files and looks for logical type errors (e.g., trying to call `.toUpperCase()` on a number). If it finds errors, it yells at you in the console.
2. **Code Emission (Transpilation):** It strips away all the type annotations (`interface`, `type`, `: string`) and creates a brand new `.js` file that contains only plain, executable JavaScript.

### (3) Compiling with Errors
By default, if `tsc` finds a type error during step 1, **it will still complete step 2!** It will still generate the `.js` file.
Why? Because TypeScript believes that even if the types are slightly wrong, the underlying JavaScript logic might still execute perfectly fine. (You can turn this off using `noEmitOnError` in the config).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on `tsc` for bundling

**The mistake:** A developer uses `tsc` to compile their massive React application, expecting it to output a single, minified `app.js` file for production.

**Why it's wrong:** `tsc` is a compiler, NOT a bundler. If you feed it 50 `.ts` files, it will spit out 50 `.js` files. It will not minify the code, and it will not bundle CSS or images.
**Golden Rule:** In modern web development (Vite, Next.js, Webpack), we almost NEVER use `tsc` to emit JavaScript files. We let Vite/Webpack handle the emission/bundling, and we use `tsc` *exclusively* for Type Checking (`tsc --noEmit`).

---



### Mistake 2: Assuming `tsc` Halts JS File Generation When Type Errors Occur

**The mistake:** Assuming that compile errors prevent `tsc` from outputting JavaScript files.

**Why it's wrong:** By default, `tsc` emits compiled JavaScript even if type errors exist! Enable `--noEmitOnError` in `tsconfig.json` to suppress output on errors.

*Incorrect:*
```typescript
// tsconfig.json
// noEmitOnError is false by default!
```

*Fix:*
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "noEmitOnError": true
  }
}
```

### Mistake 3: Running `tsc` with Filename Arguments Ignoring `tsconfig.json`

**The mistake:** Running `tsc file.ts` expecting `tsconfig.json` settings to be applied.

**Why it's wrong:** Running `tsc index.ts` tells the compiler to ignore `tsconfig.json` options! Run `tsc` without filename arguments to use project configuration.

*Incorrect:*
```typescript
$ tsc src/index.ts # ❌ Ignores tsconfig.json options!
```

*Fix:*
```typescript
$ tsc # Correct: Uses tsconfig.json settings
```

## 5. Practice Exercises

### Exercise 1: Compiling TypeScript Files via `tsc` CLI

**Scenario:**
Execute `tsc` command-line options to transpile `main.ts` to ES2022 JavaScript without emitting JS files on type errors.

**Requirements:**
1. Run `tsc` with `--noEmitOnError` and `--target ES2022`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Transpile main.ts with strict error checking
> npx tsc main.ts --target ES2022 --noEmitOnError --strict
> ```

> #### Technical Explanation
>
> 1. `tsc` parses, type-checks, and transpiles TypeScript source code to JavaScript.
> 2. `--noEmitOnError` prevents generating `.js` output files if type errors occur.
> 3. `--target ES2022` sets the target JavaScript syntax version.

---

### Exercise 2: Generating Declaration Files (`.d.ts`) with `tsc`

**Scenario:**
Configure `tsc` CLI options to emit TypeScript declaration files (`.d.ts`) alongside transpiled JavaScript files.

**Requirements:**
1. Use `--declaration` flag in `tsc`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Emit JS and .d.ts type declaration files into dist/ folder
> npx tsc --declaration --outDir dist
> ```

> #### Technical Explanation
>
> 1. `--declaration` instructs `tsc` to generate matching `.d.ts` type definition files.
> 2. Enables published npm packages to provide type IntelliSense to external TypeScript consumers.
> 3. Standard library build step.

---

### Exercise 3: Running Type Checking in Watch Mode (`tsc --watch`)

**Scenario:**
Run `tsc` in background watch mode during local development.

**Requirements:**
1. Execute `tsc --watch` or `tsc -w`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Start incremental background compilation watch mode
> npx tsc --watch
> ```

> #### Technical Explanation
>
> 1. `tsc --watch` monitors source files for changes and performs fast incremental re-compilation.
> 2. Provides immediate feedback in terminal consoles when type errors are introduced.
> 3. Essential local developer CLI workflow.

---



## 6. Related Terms
- [`tsconfig.json`](tsconfig.md) — The configuration file that tells `tsc` exactly how to behave.
- [TypeScript](typescript.md) — The language syntax `tsc` parses.

---

## 7. Key Takeaways
- **`tsc`** stands for the TypeScript Compiler.
- It has two distinct jobs: Type Checking (finding bugs) and Code Emission (generating JS).
- By default, `tsc` will still generate JS files even if there are type errors in your code.
- In modern web development, `tsc` is primarily used just for Type Checking (via `tsc --noEmit`), while tools like Vite handle the actual JS bundling.
