# Const Assertions (`as const`)

> **Level 11 — Modules, Declaration Files & Configuration**
> A powerful TypeScript feature that locks down the types of arrays and objects, converting them into deeply immutable, perfectly literal types.

---

## 1. Prerequisites
- [Literal Types](../level_05/literal_types.md) — The specific, exact types that `as const` generates.
- [Enums](enums.md) — The legacy feature that `as const` is rapidly replacing.

---

## 2. Term Category

**Type System Fundamental** (Deep Immutability & Literal Casting): Const assertions (`as const`) construct deeply `readonly` object structures and infer literal primitive types without widening.

---

## 3. Explanation



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Expecting `as const` to Provide Runtime Protection

```typescript
const config = { host: "localhost" } as const;

// ❌ INCORRECT: Expecting as const to execute Object.freeze() at runtime
// (config as any).host = "other"; // Mutates runtime object!
```

**Why it's wrong:** `as const` is a compile-time type assertion; it is erased completely in transpiled JavaScript output and does NOT perform `Object.freeze()` at runtime.

**Golden Rule:** Use `as const` for compile-time type locking and `Object.freeze()` if runtime immutability is required.

---

### Mistake 2: Applying `as const` to Variables Instead of Expressions

```typescript
// ❌ INCORRECT: Applying as const to variable declaration
// const x as const = "hello"; // Syntax Error!

// ✅ CORRECT (Apply to expression value):
const x = "hello" as const;
```

**Why it's wrong:** `as const` is a type assertion applied to value expressions, not a variable declaration keyword.

**Golden Rule:** Place `as const` after the value expression (`value as const`).

---

### Mistake 3: Confusing Array `as const` with Regular Arrays

```typescript
const tuple = [1, 2] as const;

// ❌ INCORRECT: Attempting to push to a const tuple
// tuple.push(3); // Compile Error: Property 'push' does not exist on type 'readonly [1, 2]'.
```

**Why it's wrong:** `as const` on array literals infers `readonly` fixed-length tuples, stripping array mutation methods like `push`.

**Golden Rule:** Remember that `as const` arrays become immutable `readonly` tuples.





## 5. Practice Exercises

### Exercise 1: Locking Objects into Readonly Literals with `as const`

**Scenario:**
Create an immutable configuration object using `as const` to prevent property mutation and widening.

**Requirements:**
1. Apply `as const` to configuration object.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const appConfig = {
>   endpoint: "https://api.example.com",
>   timeout: 5000,
>   allowedRoles: ["admin", "editor"]
> } as const;
> 
> // appConfig.timeout = 10000; // ❌ Compile Error: Cannot assign to read-only property!
> // appConfig.allowedRoles.push("user"); // ❌ Compile Error: Property 'push' does not exist on readonly tuple!
> ```
> 
> #### Technical Explanation
>
> 1. `as const` locks all object fields into deeply `readonly` properties.
> 2. Prevents string and number literal widening (`"https://..."` is inferred as exact literal type, not `string`).
> 3. Converts array literals (`["admin", "editor"]`) into fixed `readonly` tuples.
> 
---

### Exercise 2: Generating Union Types from `as const` Arrays

**Scenario:**
Extract a string literal union type from a `const` array of navigation routes.

**Requirements:**
1. Define `const ROUTES = ["/home", "/about", "/contact"] as const`.
2. Extract `type Route = (typeof ROUTES)[number]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const ROUTES = ["/home", "/about", "/contact"] as const;
> 
> type Route = (typeof ROUTES)[number];
> // Inferred as: "/home" | "/about" | "/contact"
> 
> function navigateTo(route: Route) {
>   console.log(`Navigating to ${route}`);
> }
> 
> navigateTo("/home");
> // navigateTo("/dashboard"); // ❌ Compile Error!
> ```
> 
> #### Technical Explanation
>
> 1. `as const` preserves exact string literal array element types (`readonly ["/home", ...]`).
> 2. `(typeof ROUTES)[number]` extracts a string literal union of all array elements.
> 3. Standard pattern for creating runtime array constants and compile-time union types simultaneously.
> 
---

### Exercise 3: Auditing `as const` vs Object.freeze()

**Scenario:**
Formulate an architectural comparison matrix contrasting `as const` against `Object.freeze()`.

**Requirements:**
1. Contrast compilation stage, deep immutability, and runtime bundle footprint.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> as const vs Object.freeze() Matrix:
> - as const: Compile-time ONLY (0 bytes in JS output). Deeply freezes all nested properties and array tuples statically.
> - Object.freeze(): Runtime JavaScript execution. Shallow immutability (nested properties can still be mutated at runtime).
> ```
> 
> #### Technical Explanation
>
> 1. `as const` provides deep compile-time type safety without runtime execution overhead.
> 2. `Object.freeze()` is a shallow runtime JavaScript function call.
> 3. Combine `Object.freeze(obj as const)` for both compile-time and runtime immutability.
> 
---

## 6. Related Terms
- [Type Assertions (`as`)](../level_05/type_assertions.md) — `as const` is a specialized form of the standard `as Type` syntax.

---


## 7. Key Takeaways

- `as const` constructs deeply `readonly` object structures and array tuples.
- Prevents string and number literal type widening at compile time.
- `(typeof ARRAY)[number]` extracts string literal union types from `as const` arrays.
- Pure compile-time type assertion with zero runtime JavaScript output.
