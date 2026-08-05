# Type Widening

> **Level 1 — Core Concepts & Environment Setup**
> The compiler process where TypeScript automatically expands a highly specific literal type (like `"hello"` or `42`) to its broader base type (like `string` or `number`) when inferring mutable variables.

---

## 1. Prerequisites
- [Type Inference](type_inference.md) — How the compiler determines types when they are not explicitly declared.
- [Literal Types](../level_05/literal_types.md) — Custom types representing exact primitive values.
---

## 2. Term Category
- **Type System Fundamental**

---

## 3. Environment Context
- **Build-time** (Inference and widening are compile-time operations used to generate warnings before transpilation).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, variables are declared as either mutable (`let`, `var`) or immutable (`const`). 

If you write:
```javascript
const user = 'Alice'
```
JavaScript guarantees that `user` will always hold the value `'Alice'`. It cannot change. Therefore, TypeScript can infer a highly specific type: the literal type `'Alice'`.

However, if you write:
```javascript
let role = 'admin'
```
You are explicitly telling JavaScript that you plan to change `role` later. If TypeScript inferred `role` as the literal type `'admin'`, then trying to write `role = 'moderator'` on the next line would trigger a compiler error because `'moderator'` does not fit in the type `'admin'`.

To make JavaScript development intuitive, TypeScript designed **Type Widening**. When you declare a mutable variable without an explicit type, the compiler automatically widens the inferred type from the literal value to its parent primitive type (e.g. `'admin'` becomes `string`, `42` becomes `number`).

### (2) Core Mechanics
Type widening is triggered based on the mutability of the variable container:

- **Primitive Constants (`const`):** Do not widen. The literal value is locked.
  ```typescript
  const count = 10; // Inferred type: 10
  ```
- **Primitive Variables (`let`/`var`):** Automatically widen to their base type.
  ```typescript
  let count = 10; // Inferred type: number
  ```
- **Objects and Arrays:** Regardless of `const`, object and array properties can be mutated. Therefore, their property types are automatically widened by default.
  ```typescript
  const config = {
    port: 8080 // Inferred type: number (not 8080)
  };
  config.port = 9000; // Allowed because port is widened to number
  ```

If you want to prevent widening on objects or arrays, you must use a **Const Assertion** (`as const`), which forces all properties to become readonly literals.

### (3) Real-World Application
Widening helps coordinate dynamic configurations and function inputs. It ensures that variables can be updated with any compatible value of their general class.

```typescript
// Function expects a union of specific strings
type Theme = 'light' | 'dark' | 'system';
function setTheme(theme: Theme) {
  console.log(`Setting theme: ${theme}`);
}

// Case 1: Constant - No Widening
const myTheme = 'dark'; // Type: 'dark'
setTheme(myTheme); // Works!

// Case 2: Variable - Widened!
let activeTheme = 'dark'; // Type: string
// setTheme(activeTheme); // Error: Argument of type 'string' is not assignable to 'Theme'
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Declaring a literal variable with `let` and passing it to a strict type config

**The mistake:** Using `let` to declare a parameter variable that is later passed to a function requiring a union of literal types.

**Why it's wrong:** The variable is widened to `string` or `number` upon creation, making it too broad for the strict literal check.

*Incorrect:*
```typescript
let responseMode = 'json'; // Inferred type: string

function handleResponse(mode: 'json' | 'xml') {
  console.log(mode);
}

handleResponse(responseMode); // Error: string is not assignable to 'json' | 'xml'
```

*Fix:* Declare the variable with `const`, or provide an explicit type annotation if it must remain a mutable variable.
```typescript
const responseMode = 'json'; // Type: 'json' (no widening)
// OR
let responseMode: 'json' | 'xml' = 'json'; // Type: 'json' | 'xml'

handleResponse(responseMode); // Works!
```

**Golden Rule:** If a value must match a strict literal union, declare it with `const`, type it explicitly, or cast it with `as const`.

---



### Mistake 2: Unexpected Type Widening on Reassignable Object Properties

**The mistake:** Creating `const config = { env: "production" };` expecting `config.env` to be literal type `"production"`.

**Why it's wrong:** Because object properties are mutable, TS widens string property initializers to `string`. Use `as const` to freeze property literal types.

*Incorrect:*
```typescript
const config = { env: "production" }; // config.env is string!
```

*Fix:*
```typescript
const config = { env: "production" } as const; // config.env is "production"
```

### Mistake 3: Implicit `any` Widening in Uninitialized `let` Bindings

**The mistake:** Declaring `let x;` without initialization or explicit type annotation.

**Why it's wrong:** Uninitialized `let` bindings widen to evolving `any` type, reducing type safety until assigned.

*Incorrect:*
```typescript
let x; // Inferred as evolving any!
x = 10; x = "hello";
```

*Fix:*
```typescript
let x: number;
x = 10; // Enforces number type
```

## 6. Practice Exercises

### Exercise 1: Identifying Widening

**Problem:** What are the inferred types of `x`, `y`, and `z` in the script below?

```typescript
const x = 'Hello';
let y = 'Hello';
const z = { greeting: 'Hello' };
```

**Expected output:**
> [!check]- Answer
> ```text
> Inferred Types:
> - x: "Hello" (Literal type)
> - y: string (Widened primitive)
> - z: { greeting: string } (Object property widened)
> ```
> - `x` is a constant string, so its value cannot change.
> - `y` is a variable string, meaning it can change.
> - The property of `z` can be reassigned (e.g. `z.greeting = 'Hi'`), even though `z` is a constant reference.

---



### Exercise 2: Widening Prevention with `as const`

**Problem:** Prevent type widening on array `const colors = ["red", "green"] as const`.

**Expected output:**
> [!check]- Answer
> ```text
> readonly ["red", "green"]
> ```
> ```typescript
> const colors = ["red", "green"] as const;
> console.log("readonly [\"red\", \"green\"]");
> ```
>
> **Explanation:** `as const` creates immutable literal tuple/object types.

---

### Exercise 3: Const vs Let Widening Behavior

**Problem:** State inferred types for `const x = 10` vs `let y = 10`.

**Expected output:**
> [!check]- Answer
> ```text
> x: 10 (literal), y: number (widened)
> ```
> ```typescript
> console.log("x: 10 (literal), y: number (widened)");
> ```
>
> **Explanation:** `const` primitive bindings preserve literal types; `let` widens to base primitive types.

## 7. Related Terms
- [Type Inference](type_inference.md) — The mechanism that triggers widening.
- [Literal Types](../level_05/literal_types.md) — The specific types that are widened.
- [Const Assertions (`as const`)](../level_11/const_assertions.md) — The syntax used to opt-out of widening on objects and arrays.
- [`satisfies` Operator](../level_05/satisfies_operator.md) — Related concept: `satisfies` Operator.
---

## 8. Key Takeaways
- **Type Widening** is the automatic conversion of a literal type to its general primitive type.
- It prevents type-checking errors when mutable variables (`let`) are updated with new values.
- Immutable variables (`const`) do not trigger widening for primitive values.
- Object and array values are always widened by default because their properties remain mutable.
- Use explicit annotations, `const`, or `as const` to freeze type widening.
