# DefinitelyTyped

> **Level 11 — Modules, Declaration Files & Configuration**
> A massive, community-driven GitHub repository that hosts high-quality TypeScript Declaration Files for third-party JavaScript libraries that don't include their own types.

---

## 1. Prerequisites
- [Declaration Files (`.d.ts`)](declaration_files.md) — The `.d.ts` files that DefinitelyTyped provides.
- [`tsconfig.json`](../level_01/tsconfig.md) — Configuring type declaration resolution in tsconfig.json.

---

## 2. Term Category

**TypeScript Ecosystem & Tooling** (Community Type Repository): DefinitelyTyped (`@types/*`) is a community-maintained repository hosting high-quality TypeScript declaration packages.

---

## 3. Explanation



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Installing `@types/*` Packages as Runtime Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@types/express": "^4.17.21"
  }
}
```

**Why it's wrong:** `@types/*` packages contain compile-time type declarations only; including them in `dependencies` bloats production runtime dependencies.

**Golden Rule:** Always install `@types/*` packages under `devDependencies`.

---

### Mistake 2: Version Mismatches Between Runtime Package and `@types/*`

```json
{
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/lodash": "^3.10.0"
  }
}
```

**Why it's wrong:** Installing mismatched major versions between library packages and type definition packages causes missing API method types or compilation errors.

**Golden Rule:** Align `@types/*` package major and minor versions with the installed runtime library version.

---

### Mistake 3: Installing Duplicate `@types` for Libraries Containing Built-in Types

```bash
# ❌ UNNECESSARY: Axios includes native .d.ts files!
npm install --save-dev @types/axios
```

**Why it's wrong:** Modern libraries (Axios, RxJS, Prisma) ship with native `.d.ts` declaration files built-in. Installing obsolete `@types` packages creates type declaration conflicts.

**Golden Rule:** Check if a library includes native type definitions before installing `@types/*`.





## 5. Practice Exercises

### Exercise 1: Installing Community Type Definitions (`@types/*`)

**Scenario:**
Install type definitions for `lodash` and `express` using npm.

**Requirements:**
1. Run `npm install --save-dev @types/lodash @types/express`.

> [!check]- Answer
>
> #### Implementation
>
> ```bash
> # Install runtime packages
> npm install lodash express
> 
> # Install matching DefinitelyTyped type definition packages as devDependencies
> npm install --save-dev @types/lodash @types/express
> ```

> #### Technical Explanation
>
> 1. DefinitelyTyped is a community-maintained GitHub repository hosting TypeScript type declarations for untyped npm packages.
> 2. Published to npm under the `@types` scope (e.g. `@types/lodash`).
> 3. Should be installed as `devDependencies` since type declarations are required only during development compilation.

---

### Exercise 2: Managing `@types` Version Alignment

**Scenario:**
Explain why `@types/package` major and minor version numbers must match the installed runtime `package` version.

**Requirements:**
1. Detail version matching rules between runtime dependencies and `@types/*`.

> [!check]- Answer
>
> #### Implementation
>
> ```json
> {
>   "dependencies": {
>     "express": "^4.18.2"
>   },
>   "devDependencies": {
>     "@types/express": "^4.17.21"
>   }
> }
> ```

> #### Technical Explanation
>
> 1. `@types` packages follow the semantic versioning of the underlying JavaScript library.
> 2. Installing mismatched major versions (e.g. `express@5` with `@types/express@4`) results in missing API method types or compilation errors.
> 3. Always align `@types` major versions with runtime dependency versions.

---

### Exercise 3: Auditing `typeRoots` and `types` in `tsconfig.json`

**Scenario:**
Configure `compilerOptions.types` in `tsconfig.json` to include only specific global types (`node`, `jest`).

**Requirements:**
1. Set `"types": ["node", "jest"]` in `tsconfig.json`.

> [!check]- Answer
>
> #### Implementation
>
> ```json
> {
>   "compilerOptions": {
>     "types": ["node", "jest"]
>   }
> }
> ```

> #### Technical Explanation
>
> 1. By default, `tsc` includes all packages found under `node_modules/@types`.
> 2. Configuring `"types": ["node", "jest"]` restricts global type inclusion to explicitly listed packages.
> 3. Prevents namespace collisions between competing global type packages (e.g. Jest vs Mocha `test` functions).

---





---



## 6. Related Terms
- [`tsconfig.json`](../level_01/tsconfig.md) — The `typeRoots` and `types` compiler options control how TypeScript searches for these `@types` packages.

---

---

## 7. Key Takeaways

- DefinitelyTyped (`@types/*`) provides community-maintained type definitions for untyped npm packages.
- Always install `@types/*` packages as `devDependencies`.
- Align `@types/*` major versions with runtime dependency versions.
- Check if packages include native `.d.ts` definitions before installing `@types/*`.
