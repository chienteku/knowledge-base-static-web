# `tsconfig.json`

> **Level 1 — Core Concepts & Environment Setup**
> The essential configuration file that lives at the root of any TypeScript project. It explicitly tells the TypeScript compiler (`tsc`) how strict to be and exactly how to process the code.

---

## 1. Prerequisites
- [The TypeScript Compiler (`tsc`)](tsc.md) — The engine that reads this configuration file.

---

## 2. Term Category
- **Configuration / Tooling**

---

## 3. Environment Context
- **Project Root / Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you run `tsc app.ts`, the compiler will just use its default, somewhat lenient settings. But what if you are writing code for an old Internet Explorer browser and need the JS output to be ES5? What if you want the compiler to be incredibly strict? What if you want to include `.ts` files in the `/src` folder but completely ignore the `/tests` folder?
Instead of passing 50 different command-line flags every time (`tsc app.ts --target es5 --strict true --outDir dist`), you save all these rules in a single file: **`tsconfig.json`**. The moment you create this file, your folder officially becomes a "TypeScript Project".

### (2) Key Configuration Areas
A standard `tsconfig.json` has two main sections:
1. **File Inclusion/Exclusion:** Which files should the compiler look at?
   ```json
   {
     "include": ["src/**/*"],
     "exclude": ["node_modules", "**/*.spec.ts"]
   }
   ```
2. **Compiler Options (`compilerOptions`):** The rules of the engine.
   ```json
   {
     "compilerOptions": {
       "target": "es2022",       // Output modern JavaScript
       "module": "esnext",       // Use modern import/export syntax
       "outDir": "./dist",       // Put the compiled JS files here
       "strict": true            // Enable all strict type-checking rules!
     }
   }
   ```

### (3) The Almighty `"strict": true`
This is the single most important setting in TypeScript. By default, TypeScript is lenient (to make migrating legacy JS easier). Turning on `"strict": true` activates a suite of aggressive safety checks (like `strictNullChecks` and `noImplicitAny`). If you don't have this turned on, you are losing 80% of the value of TypeScript.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not reading the default `tsconfig`

**The mistake:** A developer initializes a new project. They notice their TypeScript compiler allows them to write incredibly sloppy code without complaining.

**Why it's wrong:** Some frameworks generate a `tsconfig.json` that has `"strict": false` or `"noImplicitAny": false` to cater to beginners. 
**Golden Rule:** As a Senior Architect, you must always audit the `tsconfig.json` of a new project. Ensure `"strict": true` is enabled immediately before writing a single line of code.

---



### Mistake 2: Leaving `strict: false` in Production Projects

**The mistake:** Setting `"strict": false` in `tsconfig.json`.

**Why it's wrong:** Disabling strict mode turns off `strictNullChecks`, `noImplicitAny`, and `strictBindCallApply`, rendering TypeScript significantly less safe.

*Incorrect:*
```typescript
// tsconfig.json
{ "compilerOptions": { "strict": false } } // ❌ Relinquishes safety checks
```

*Fix:*
```typescript
// tsconfig.json
{ "compilerOptions": { "strict": true } } // Enforces strict type safety
```

### Mistake 3: Misconfiguring Module Resolution Settings

**The mistake:** Using `"moduleResolution": "classic"` in modern Node/Vite projects.

**Why it's wrong:** `classic` module resolution fails to resolve package exports subpaths in modern npm packages. Use `"moduleResolution": "bundler"` or `"node16"`.

*Incorrect:*
```typescript
{ "compilerOptions": { "moduleResolution": "classic" } }
```

*Fix:*
```typescript
{ "compilerOptions": { "moduleResolution": "bundler" } }
```

## 6. Practice Exercises

### Exercise 1: The Base URL

**Problem:** You hate writing `import Button from '../../../components/Button'`. You want to write `import Button from '@/components/Button'`. What `compilerOptions` in `tsconfig.json` make this possible?

**Expected output:**
> [!check]- Answer
> ```json
> {
>   "compilerOptions": {
>     "baseUrl": ".",
>     "paths": {
>       "@/*": ["src/*"]
>     }
>   }
> }
> ```
> - Look up `baseUrl` and `paths`.

---



### Exercise 2: Inspecting Critical Compiler Flags

**Problem:** Name 2 critical strictness flags enabled by `"strict": true` (`strictNullChecks`, `noImplicitAny`).

**Expected output:**
> [!check]- Answer
> ```text
> strictNullChecks, noImplicitAny
> ```
> ```typescript
> console.log("strictNullChecks, noImplicitAny");
> ```
>
> **Explanation:** `strict: true` activates family of safety enforcement compiler flags.

---

### Exercise 3: Configuring Output Directories

**Problem:** Specify compiler option key to redirect compiled JS files into `./dist` directory (`outDir`).

**Expected output:**
> [!check]- Answer
> ```text
> outDir: "./dist"
> ```
> ```typescript
> console.log('outDir: "./dist"');
> ```
>
> **Explanation:** `outDir` specifies target folder location for compiled JavaScript artifacts.

## 7. Related Terms
- [The TypeScript Compiler (`tsc`)](tsc.md) — The tool that reads this file.
- [Strict Mode](../level_11/strict_mode.md) — The specific flag that determines the quality of your entire project.
- [Declaration Files (`.d.ts`)](../level_11/declaration_files.md) — Related concept: Declaration Files (`.d.ts`).
- [DefinitelyTyped](../level_11/definitely_typed.md) — Related concept: DefinitelyTyped.
- [Module Resolution & Path Aliases](../level_11/module_resolution.md) — Related concept: Module Resolution & Path Aliases.

---

## 8. Key Takeaways
- **`tsconfig.json`** is the root configuration file that defines a TypeScript project.
- It tells `tsc` which files to compile (`include`/`exclude`) and what rules to follow (`compilerOptions`).
- `"target"` defines the specific version of JavaScript you want the compiler to emit (e.g., `es5`, `es6`, `es2022`).
- **Always enable `"strict": true`** in new projects to maximize Type Safety.
