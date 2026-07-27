# The TypeScript Compiler (`tsc`)

> **Level 1 — Core Concepts & Environment Setup**
> The command-line tool (`tsc`) provided by Microsoft that analyzes your TypeScript code for errors and translates (transpiles) it into plain JavaScript.

---

## 1. Prerequisites
- [TypeScript](../level_01/typescript.md) — The language that `tsc` compiles.

---

## 2. Term Category
- **Tooling / CLI**

---

## 3. Environment Context
- **Build-Time (Terminal)**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The `--noEmit` Flag

**Problem:** If you run `npx tsc --noEmit`, what happens?

**Expected output:**
```text
The compiler will read your code and perform the Type Checking step (reporting any errors in the console). 
However, it will completely skip the Code Emission step. No `.js` files will be generated.
This is exactly how modern frameworks like Vite use TypeScript! They handle the JS building themselves, and just use `tsc` as a linter.
```

> [!check]- Answer
> - What does "Emit" mean in the context of compilers?

---



### Exercise 2: TSC Output Verification

**Problem:** Command to compile project in watch mode automatically recompiling on file save.

**Expected output:**
```text
tsc --watch
```

> [!check]- Answer
> ```typescript
> console.log("tsc --watch");
> ```
>
> **Explanation:** `tsc -w` / `tsc --watch` runs incremental compilations on file modifications.

### Exercise 3: Type Checking Without JS Code Generation

**Problem:** Command to run type check without emitting `.js` output files.

**Expected output:**
```text
tsc --noEmit
```

> [!check]- Answer
> ```typescript
> console.log("tsc --noEmit");
> ```
>
> **Explanation:** `tsc --noEmit` validates type safety without writing files to disk.

## 7. Related Terms
- [`tsconfig.json`](../level_01/tsconfig.md) — The configuration file that tells `tsc` exactly how to behave.
- [TypeScript](../level_01/typescript.md) — The language syntax `tsc` parses.

---

## 8. Key Takeaways
- **`tsc`** stands for the TypeScript Compiler.
- It has two distinct jobs: Type Checking (finding bugs) and Code Emission (generating JS).
- By default, `tsc` will still generate JS files even if there are type errors in your code.
- In modern web development, `tsc` is primarily used just for Type Checking (via `tsc --noEmit`), while tools like Vite handle the actual JS bundling.
