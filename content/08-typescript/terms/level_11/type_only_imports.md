# Type-Only Imports & Exports

> **Level 11 — Modules, Declaration Files & Configuration**
> A module import/export syntax (`import type` and `export type`, introduced in TS 3.8) that explicitly tells compiler engines to erase the imported symbols from the compiled JavaScript output.

---

## 1. Prerequisites
- [ES Modules in TypeScript](../level_11/modules.md) — How code files load each other.
- [Declaration Files](../level_11/declaration_files.md) — The type signatures separation.

---

## 2. Term Category
- **Module System**

---

## 3. Environment Context
- **Build-time** (These imports are completely stripped during compilation. The final JavaScript bundle contains no reference to type-only imports or exports).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
TypeScript works using **Type Erasure**. When code compiles, all interfaces, type aliases, and type annotations are deleted, leaving behind plain JavaScript.

However, if you import an interface using standard import syntax:
```typescript
import { User } from './types';
```
If you compile with the standard TypeScript compiler (`tsc`), it is smart enough to see that `User` is only used as a type annotation, and it deletes the import statement from the output.

But modern build tools (like Babel, SWC, ESBuild, or Vite) transpile files **in isolation**—meaning they compile each file without checking other files. If ESBuild compiles your component, it sees the import of `User`. Because it doesn't know if `User` is a runtime Class (must be kept) or a compile-time Interface (must be deleted), it keeps the import statement. At runtime, the browser tries to load `User` from `./types`, but since `User` was erased, the application crashes with:
`SyntaxError: The requested module './types' does not export 'User'`

TypeScript designed **Type-Only Imports (`import type`)** to solve this. It explicitly marks an import as type-only, ensuring transpilers can safely strip it without scanning other files.

### (2) Core Mechanics
You declare type-only imports and exports by adding the `type` keyword:

```typescript
// 1. Entire import is type-only
import type { UserProfile, AccountData } from './models';

// 2. Inline type import (TS 4.5+) - combines values and types
import { registerUser, type ConnectionConfig } from './service';

// 3. Type-only export
export type { UserProfile };
```

Transpilers instantly erase these statements during build, producing clean JavaScript output:
```javascript
// Compiled output
import { registerUser } from './service'; // UserProfile and ConnectionConfig are gone!
```

#### Bypassing Circular Dependencies
In complex architectures, Class A imports Class B, and Class B imports Class A, creating a circular dependency that crashes the bundler. If Class A only uses Class B as a type signature, changing Class A's import to `import type` breaks the cycle because the dependency is completely removed from the runtime bundle.

### (3) Real-World Application
Writing components under strict framework bundlers with `"isolatedModules": true` enabled.

```typescript
// src/components/UserCard.ts
import type { User } from '../types'; // Erased entirely

export function renderUserCard(user: User) {
  return `<div>${user.name}</div>`;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to instantiate or check type-only imports at runtime

**The mistake:** Using `import type` to import a Class, and then attempting to use `new` or `instanceof` on it.

**Why it's wrong:** Because `import type` is completely erased at build time, the class constructor does not exist at runtime. Running this code throws a runtime `ReferenceError`.

*Incorrect:*
```typescript
import type { UserService } from './UserService';

function initialize(service: any) {
  // Bug: UserService is erased! runtime crashes on instanceof UserService check
  if (service instanceof UserService) { 
    service.start();
  }
}
```

*Fix:* Import classes or values using standard import syntax.
```typescript
import { UserService } from './UserService'; // Kept in JS output
```

**Golden Rule:** Use `import type` only when you are referencing the symbol in type annotations. If you need to instantiate it (`new`), use it in comparisons (`instanceof`), or access static values, use standard `import`.

---



### Mistake 2: Importing Type Declarations using Standard Imports in Isolated Modules Mode

**The mistake:** Writing `import { User } from './user'` when `User` is an interface and `isolatedModules: true` is enabled.

**Why it's wrong:** Single-file transpilers (like Babel or esbuild) cannot tell whether `User` is a type or value without type-only `import type { User }` syntax, leading to bad JS imports.

*Incorrect:*
```typescript
import { UserInterface } from './user'; // Standard import for type-only item
```

*Fix:*
```typescript
import type { UserInterface } from './user'; // Explicit type-only import
```

### Mistake 3: Attempting Runtime Access to Type-Only Imported Entities

**The mistake:** Attempting `new User()` when `User` was imported with `import type { User }`.

**Why it's wrong:** Type-only imports are completely erased from compiled JS output! Referencing a type-only import as a runtime value causes `ReferenceError: User is not defined`.

*Incorrect:*
```typescript
import type { UserClass } from './user';
// const u = new UserClass(); // ❌ 'UserClass' resolves to a type-only declaration and cannot be used as a value
```

*Fix:*
```typescript
import { UserClass } from './user'; // Standard import for runtime values
```

## 6. Practice Exercises

### Exercise 1: Resolving isolatedModules

**Problem:** You are using Vite. Your file fails to build, throwing this error:
`Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.`
Resolve the error by converting the export block to type-only.

```typescript
// src/index.ts
import { AppUser } from './types';

// Fix this export statement:
export type { AppUser };
```

**Expected output:**
```text
Vite successfully compiles src/index.ts without throwing isolatedModules errors.
```

> [!check]- Answer
> - Add the `type` keyword between the `export` keyword and the curly braces.

---



### Exercise 2: Inline Type-Only Imports Syntax

**Problem:** Import value `createUser` and type `type User` in a single line using `import { createUser, type User } from './user'`.

**Expected output:**
```text
Inline type-only import created
```

> [!check]- Answer
> ```typescript
> import { createUser, type User } from './user';
> console.log("Inline type-only import created");
> ```
>
> **Explanation:** Inline `type` modifiers selectively mark type-only imports within mixed import lists.

### Exercise 3: Type-Only Export Syntax

**Problem:** Write type-only re-export `export type { User } from './user'`.

**Expected output:**
```text
Type-only re-export created
```

> [!check]- Answer
> ```typescript
> export type { User } from './user';
> console.log("Type-only re-export created");
> ```
>
> **Explanation:** `export type` ensures exported type contracts emit zero runtime JavaScript export code.

## 7. Related Terms
- [ES Modules in TypeScript](../level_11/modules.md) — The baseline module loading specification.
- [Declaration Files](../level_11/declaration_files.md) — The type files that circular imports are often fetched from.
- [Strict Mode](../level_11/strict_mode.md) — Configuring compiler constraints.

---

## 8. Key Takeaways
- **Type-Only Imports/Exports** explicitly mark imported symbols as compile-time types, ensuring they are erased from compiled JavaScript.
- Essential when using isolated file transpilers (like SWC, ESBuild, or Babel) with `"isolatedModules": true` active.
- Helps avoid runtime circular dependency crashes.
- Can be declared as entire statements (`import type { X }`) or inline (`import { type X, y }`).
- You cannot instantiate or perform runtime checks (`new`, `instanceof`) on type-only imports.
