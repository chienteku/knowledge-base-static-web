# DefinitelyTyped

> **Level 11 — Modules, Declaration Files & Configuration**
> A massive, community-driven GitHub repository that hosts high-quality TypeScript Declaration Files for third-party JavaScript libraries that don't include their own types.

---

## 1. Prerequisites
- [Declaration Files](../level_11/declaration_files.md) — The `.d.ts` files that DefinitelyTyped provides.

---

## 2. Term Category
TypeScript Open Source Ecosystem

---

## 3. Core Definition
When you `npm install` a library written purely in JavaScript (like `lodash` or `express`), the TypeScript Compiler throws errors because it doesn't know the shapes of the functions in that library.

**DefinitelyTyped** solves this. It is a giant repository maintained by the community where developers have manually written the type definitions for thousands of JavaScript libraries. These definitions are published to NPM under the `@types/` organization.

---

## 4. Key Characteristics / Rules
- **Installation:** You install the types using `npm install --save-dev @types/library-name`.
- **Automatic Resolution:** Once installed, TypeScript automatically finds the `@types` folder in your `node_modules` and applies the types, without you needing to change any code.

---

## 5. Typical Usage / Common Patterns

### Adding Types to a Vanilla JS Library
If you install the popular `uuid` library:
```bash
npm install uuid
```
TypeScript will throw an error when you try to import it: `Could not find a declaration file for module 'uuid'`.

To fix this, you install the DefinitelyTyped package:
```bash
npm install -D @types/uuid
```
Now, TypeScript instantly knows the type signatures for all functions inside the `uuid` library.

---

## 6. Common Pitfalls
- **Installing Types for TypeScript Libraries:** If a library is written in TypeScript natively, it will ship with its own `.d.ts` files included. You do not need to (and cannot) install `@types/` for it. Check the NPM page—if it has a blue `DT` badge, you need `@types`. If it has a blue `TS` badge, it provides its own types.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Installing `@types/pkg` for Libraries that Already Ship Built-In Types

**The mistake:** Running `npm install @types/axios` when Axios already includes native type definitions.

**Why it's wrong:** Installing redundant `@types` packages for libraries with native types causes version mismatch conflicts and duplicate declaration errors.

*Incorrect:*
```typescript
$ npm install @types/axios # ❌ Unnecessary: Axios includes native ts definitions
```

*Fix:*
```typescript
$ npm install axios # Axio ships native types automatically!
```

### Mistake 2: Installing `@types/pkg` as `dependencies` instead of `devDependencies`

**The mistake:** Running `npm install @types/node --save`.

**Why it's wrong:** Type declarations are development compile-time artifacts. They should be saved in `devDependencies` (`-D`).

*Incorrect:*
```typescript
$ npm install @types/node --save # ❌ Installed as production dependency
```

*Fix:*
```typescript
$ npm install @types/node -D # Correct: Saved in devDependencies
```

### Mistake 3: Ignoring `@types` Version Alignment with Installed Library Versions

**The mistake:** Installing `@types/lodash@4` while using runtime `lodash@3`.

**Why it's wrong:** Type declaration packages on `@types` match major library versions. Mismatched versions lead to compile-time signature errors.

*Incorrect:*
```typescript
$ npm install lodash@3 @types/lodash@4 # ❌ Version mismatch!
```

*Fix:*
```typescript
$ npm install lodash@4 @types/lodash@4 # Matching major versions
```

## 6. Practice Exercises



### Exercise 1: DefinitelyTyped Repository Namespace Format

**Problem:** What npm organization scope prefix hosts community DefinitelyTyped definitions?

**Expected output:**
```text
@types/
```

> [!check]- Answer
> ```typescript
> console.log("@types/");
> ```
>
> **Explanation:** DefinitelyTyped packages are published under the `@types/` npm scope.

### Exercise 2: Inspecting `types` Field in `package.json`

**Problem:** Which field in a library `package.json` points to built-in type declarations?

**Expected output:**
```text
types (or typings)
```

> [!check]- Answer
> ```typescript
> console.log("types (or typings)");
> ```
>
> **Explanation:** The `types` field points module resolvers to `.d.ts` declaration entry files.

### Exercise 3: Type Declaration Search Path

**Problem:** Where does TS look for types when importing `import _ from 'lodash'`? (`node_modules/@types/lodash` or `node_modules/lodash/package.json`).

**Expected output:**
```text
node_modules/@types/lodash or native package.json types field
```

> [!check]- Answer
> ```typescript
> console.log("node_modules/@types/lodash or native package.json types field");
> ```
>
> **Explanation:** TS checks package `types` field first, falling back to `@types/pkg`.

## 7. Related Terms
- [tsconfig.json](../level_01/tsconfig.md) — The `typeRoots` and `types` compiler options control how TypeScript searches for these `@types` packages.

---
