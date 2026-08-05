# Type Aliases (`type`)

> **Level 5 — Union & Intersection Types**
> A way to give a custom name to *any* valid TypeScript type. It is the primary alternative to `interface`.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — The other way to name types.
- [Union Types (`|`)](union_types.md) — A structure that `type` can handle, but `interface` cannot.
---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You are typing an ID parameter as `string | number`. You have to write `string | number` in 50 different function signatures. 
You cannot use an `interface` to fix this, because `interface` can *only* represent Object shapes. It cannot represent primitives or unions.
**Type Aliases** solve this. You use the `type` keyword to assign a custom name to literally *any* type configuration.

### (2) The Syntax
It looks exactly like declaring a variable with `const`, but you use `type`.

```typescript
// Naming a Union
type ID = string | number;

function printId(id: ID) { ... }

// Naming an Object (Just like an interface)
type User = {
  name: string;
  age: number;
};
```

### (3) Interface vs Type
This is the most common debate in TypeScript. Which one should you use for objects?
- **`interface`**: Can ONLY define objects. Supports `extends`. Supports Declaration Merging (you can declare it twice to add properties). Often preferred by the TS compiler for error message readability.
- **`type`**: Can define objects, primitives, unions, and tuples. Supports Intersections (`&`). Does NOT support Declaration Merging (declaring it twice throws an error).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying too heavily on `type` for public library APIs

**The mistake:** A developer writes a public NPM package and exports all their configuration objects as `type Config = { ... }`.

**Why it's wrong:** If a user downloads your package and realizes your `Config` object is missing a specific property they need for a niche use case, they cannot inject it. If you had exported `interface Config`, the user could use Declaration Merging to patch your library locally.
**Golden Rule:** For application code, `type` vs `interface` is mostly personal preference. For public library APIs, always use `interface` for object shapes to allow extensibility by the users.

---



### Mistake 2: Attempting Declaration Merging with `type` Aliases

**The mistake:** Declaring `type User = { name: string };` twice in the same module scope.

**Why it's wrong:** Type aliases cannot be merged; duplicate `type` declarations trigger `Duplicate identifier` compile errors. Use `interface` if merging is required.

*Incorrect:*
```typescript
type Point = { x: number };
// type Point = { y: number }; // ❌ Duplicate identifier 'Point'
```

*Fix:*
```typescript
interface Point { x: number; }
interface Point { y: number; } // Merges successfully
```

### Mistake 3: Creating Direct Non-Optional Recursive Type Aliases without Array/Promise Wrappers

**The mistake:** Writing `type Tree = { parent: Tree };` without optional or container wrapping.

**Why it's wrong:** Direct self-referencing non-optional types create infinite type resolution loops during compilation.

*Incorrect:*
```typescript
// type Node = { child: Node }; // ❌ Type alias 'Node' circularly references itself
```

*Fix:*
```typescript
type Node = { children: Node[] }; // Safe container recursive type
```

## 6. Practice Exercises

### Exercise 1: Naming a Tuple

**Problem:** How would you use a Type Alias to give a name to a Tuple that holds an X and Y coordinate (`[number, number]`)? Can you do this with an interface?

**Expected output:**
> [!check]- Answer
> ```typescript
> type Coordinate = [number, number];
> 
> // No, you cannot cleanly do this with an interface! 
> // Interfaces are for Objects. Tuples are Arrays. You must use `type` for this!
> ```
> - Tuples are just strict arrays, not standard objects.

---



### Exercise 2: Complex Union & Intersection Aliases

**Problem:** Define `type ID = string | number` and `type Admin = User & { permissions: string[] }`.

**Expected output:**
> [!check]- Answer
> ```text
> Type aliases defined
> ```
> ```typescript
> type ID = string | number;
> type User = { name: string };
> type Admin = User & { permissions: string[] };
> console.log("Type aliases defined");
> ```
>
> **Explanation:** Type aliases can model arbitrary complex unions, intersections, primitives, and tuples.

---

### Exercise 3: Type Alias vs Interface Summary

**Problem:** Which construct can model primitive unions `type Status = "a" | "b"`? (Type Alias)

**Expected output:**
> [!check]- Answer
> ```text
> Type Alias
> ```
> ```typescript
> console.log("Type Alias");
> ```
>
> **Explanation:** Type aliases can represent any valid TypeScript type including primitive unions.

## 7. Related Terms
- [Interfaces](../level_03/interfaces.md) — The alternative naming syntax for objects.
- [Union Types (`|`)](union_types.md) — The primary reason you need `type` aliases.
- [Declaration Merging](../level_03/declaration_merging.md) — Related concept: Declaration Merging.
- [Generic Interfaces & Classes](../level_07/generic_interfaces_classes.md) — Related concept: Generic Interfaces & Classes.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — Related concept: Structural Typing / Duck Typing.
---

## 8. Key Takeaways
- **Type Aliases** (`type Name = ...`) allow you to assign a custom name to *any* TypeScript type.
- Unlike `interface`, Type Aliases can name Primitives, Unions, Tuples, and Functions.
- Type Aliases do not support Declaration Merging (you cannot declare the same type twice to merge properties).
- Use `interface` by default for Object shapes (especially in public libraries), and use `type` when dealing with Unions, Intersections, or Primitives.
