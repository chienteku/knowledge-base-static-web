# Declaration Merging

> **Level 3 — Object Types & Interfaces**
> The compiler behavior where TypeScript automatically combines multiple separate declarations sharing the exact same name into a single, unified definition.

---

## 1. Prerequisites
- [Interfaces](interfaces.md) — The fundamental contract for object shapes.
- [Type Aliases (`type`)](../level_05/type_aliases.md) — Creating names for custom union/intersection shapes.

---

## 2. Term Category

**TypeScript Core Syntax** (Interface & Namespace Merging): Declaration merging automatically combines multiple separate interface declarations sharing the same identifier into a single unified type.



---

## 3. Explanation

### Environment Context
- **Build-time** (Merging is a compile-time concept. During build, definitions are combined, compiling down to standard, plain JS objects).

### (1) Design Motivation — "Why did we design this?"
In JavaScript, it is common practice to extend objects, modularize configurations across files, or mutate global namespaces (like adding a custom method to `Array.prototype` or appending properties to the global `window` object).

If TypeScript restricted every type identifier to be declared only once, extending third-party library configurations or writing modular plugins would be impossible without modifying the library's core files.

TypeScript introduced **Declaration Merging** to solve this. If the compiler encounters multiple declarations of the same name (such as two interfaces named `User`), it automatically merges their properties. This enables modular type extension, allowing developers to plug into global libraries and extend definitions cleanly.

### (2) Core Mechanics
Declaration merging behaves differently based on the declaration type:

#### Interface Merging
This is the most common form. When two interfaces merge, their members are combined:
- **Non-function properties:** Must have the exact same type. If you declare `id: string` in one, you cannot declare `id: number` in the other.
- **Method properties:** Are treated as **Function Overloads**. Methods declared in later interfaces take precedence over earlier ones.

```typescript
interface User {
  name: string;
}

interface User {
  age: number; // Merged with first definition!
}

const developer: User = {
  name: 'Bob',
  age: 30
};
```

#### Namespace Merging
Merged namespaces combine their exported members.

#### Class / Namespace Merging
This allows you to add static inner classes or properties to a class.

#### Type Aliases (`type`)
Type aliases **cannot** be merged. If you declare two type aliases with the same name, the compiler will throw a duplicate identifier error.

### (3) Real-World Application
Declaration merging is heavily used to extend third-party library contexts. For example, if you are using Express, you might want to add a `currentUser` property to Express's `Request` interface so your authentication middleware is fully typed.

```typescript
// src/types/express.d.ts
import { User } from '../models/user';

declare global {
  namespace Express {
    // Merge our property into Express's native Request interface!
    interface Request {
      currentUser?: User;
    }
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to overwrite properties with different types

**The mistake:** Declaring an existing property with a different type inside a merged interface.

**Why it's wrong:** TypeScript requires non-function properties of merged interfaces to be identical. Overwriting them with a different type causes a compile error.

*Incorrect:*
```typescript
interface Document {
  title: string;
}

interface Document {
  title: string[]; // Error: Subsequent property declarations must have the same type.
}
```

*Fix:* If properties vary in type, declare them as unions initially, or use inheritance (`extends`) rather than merging.
```typescript
interface Document {
  title: string | string[];
}
```

**Golden Rule:** Properties in merged interfaces must be fully compatible. Merging is for extension, not overriding.

---



### Mistake 2: Expecting Type Aliases `type` to Perform Declaration Merging Like `interface`

**The mistake:** Writing two duplicate `type User = ...` declarations expecting them to merge.

**Why it's wrong:** Only `interface` declarations support declaration merging in TypeScript. Duplicate `type` alias declarations throw a `Duplicate identifier` error.

*Incorrect:*
```typescript
type User = { name: string };
// type User = { age: number }; // ❌ Duplicate identifier 'User'
```

*Fix:*
```typescript
interface User { name: string; }
interface User { age: number; } // Merges into { name: string; age: number; }
```

### Mistake 3: Overwriting Interface Method Signatures with Incompatible Parameter Types

**The mistake:** Merging an interface method with conflicting non-overloaded parameter types.

**Why it's wrong:** When merging interfaces, method signatures create function overloads, but non-method properties with incompatible types trigger compile errors.

*Incorrect:*
```typescript
interface A { id: string; }
// interface A { id: number; } // ❌ Subsequent property declaration must have type 'string'
```

*Fix:*
```typescript
interface A { getId(): string; }
interface A { getId(): number; } // Creates method overloads
```

## 5. Practice Exercises

### Exercise 1: Extending Global Third-Party Library Interfaces

**Scenario:**
Use interface declaration merging to attach a custom `user` property to Express or Request interfaces globally.

**Requirements:**
1. Declare interface matching module interface name.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Augmenting global express Request interface:
> declare global {
>   namespace Express {
>     interface Request {
>       currentUser?: { id: string; role: string };
>     }
>   }
> }

export {};
```

> #### Technical Explanation
>
> 1. Interface declaration merging automatically merges multiple declarations with identical names in the same scope.
> 2. Allows third-party library interfaces (`Express.Request`) to be augmented with custom domain properties (`currentUser`).
> 3. Standard pattern for attaching session or auth data to HTTP request objects.

---

### Exercise 2: Merging Multi-File Interface Declarations

**Scenario:**
Demonstrate how two separate `Window` interface definitions merge into a unified shape.

**Requirements:**
1. Declare `interface Window` twice with different properties.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Window {
>   analytics: { track: (event: string) => void };
> }

interface Window {
  appVersion: string;
}

// Window now contains BOTH analytics and appVersion:
window.analytics.track("page_view");
console.log(window.appVersion);
```

> #### Technical Explanation
>
> 1. TypeScript merges interface fields across multiple declarations seamlessly.
> 2. Does NOT apply to type aliases (`type`) which throw duplicate identifier errors.
> 3. Key design motivation for why `interface` is preferred for public SDK contracts.

---

### Exercise 3: Declaration Merging Limitations Audit

**Scenario:**
Explain why property types cannot conflict across merged interface declarations.

**Requirements:**
1. Show compile error when merging conflicting property types.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: number;
> }

// ❌ Compile Error: Subsequent property declarations must have the same type!
// interface User {
//   id: string; 
// }
```

> #### Technical Explanation
>
> 1. Merged interface fields must have identical types across all declaration sites.
> 2. Conflicting field types trigger an immediate compilation error.
> 3. Prevents ambiguous type resolution during interface merging.

---



## 6. Related Terms
- [Interfaces](interfaces.md) — The extensible objects contract.
- [Type Aliases (`type`)](../level_05/type_aliases.md) — Non-mergable type naming structures.
- [Namespaces](../level_11/namespaces.md) — Extensible namespace scopes.

---

## 7. Key Takeaways
- **Declaration Merging** combines separate type declarations with the same name into a single definition.
- Interfaces and namespaces can merge; type aliases cannot merge.
- Merging interfaces combines fields (must match types) and overloads methods.
- Commonly used in declaration files (`.d.ts`) to extend global types (`Window`, `ProcessEnv`) or library properties (`Express.Request`).
