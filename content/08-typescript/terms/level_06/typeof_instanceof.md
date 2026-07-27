# `typeof` & `instanceof` Guards

> **Level 6 — Type Narrowing & Guards**
> The two most common built-in JavaScript operators used as Type Guards to trigger Type Narrowing in TypeScript.

---

## 1. Prerequisites
- [Type Narrowing](../level_06/type_narrowing.md) — The process these operators trigger.
- [Primitive Types](../level_02/primitive_types.md) — What `typeof` checks.

---

## 2. Term Category
- **TypeScript Core Mechanic / JavaScript Operators**

---

## 3. Environment Context
- **Runtime (Analyzed at Compile-Time)**

---

## 4. Explanation

### (1) The `typeof` Type Guard (For Primitives)
In standard JavaScript, `typeof` returns a string representing the primitive type (`"string"`, `"number"`, `"boolean"`, `"function"`, `"object"`, `"undefined"`).
TypeScript explicitly recognizes `typeof` checks and uses them to narrow Union types consisting of primitives.

```typescript
function format(data: string | number) {
  if (typeof data === "string") {
    // Narrowed to `string`
    return data.toUpperCase();
  }
  // Narrowed to `number`
  return data.toFixed(2);
}
```

### (2) The `instanceof` Type Guard (For Classes)
`typeof` is useless for custom objects or classes. `typeof new Date()` just returns `"object"`. `typeof new User()` returns `"object"`. 
To narrow between different classes, you must use `instanceof`. This operator checks if an object's prototype chain contains the specific Class constructor.

```typescript
function handleEvent(event: MouseEvent | KeyboardEvent) {
  if (event instanceof MouseEvent) {
    // Narrowed to `MouseEvent`! We can safely access X/Y coordinates.
    console.log(event.clientX);
  } else {
    // Narrowed to `KeyboardEvent`! We can safely access the key.
    console.log(event.key);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `typeof` for `null` or Arrays

**The mistake:** A developer has `data: string[] | null`. They write `if (typeof data === "object")` expecting it to safely narrow to the array.

**Why it's wrong:** Welcome to one of JavaScript's oldest bugs: `typeof null === "object"` evaluates to `true`! Furthermore, Arrays are also objects, so `typeof [] === "object"`. The `typeof "object"` check is almost entirely useless for narrowing because it catches arrays, plain objects, and `null` all at once.
**Golden Rule:** 
- To check for `null`, use Truthiness checks: `if (data === null)`.
- To check for Arrays, use `if (Array.isArray(data))` (TypeScript recognizes this as a Type Guard too!).
- Only use `typeof` for strings, numbers, booleans, and functions.

### Mistake 2: Using `instanceof` for Interfaces

**The mistake:** A developer writes `if (user instanceof UserInterface)`.

**Why it's wrong:** Interfaces are erased at compile-time! They do not exist in JavaScript. `instanceof` is a runtime JavaScript operator, so it can only check against actual Classes (`class User {}`) that survive compilation. You cannot use `instanceof` with an Interface or a Type Alias.

---



### Mistake 3: Using `instanceof` Checks on TypeScript Interfaces or Type Aliases

**The mistake:** Writing `if (obj instanceof UserInterface)` (ReferenceError).

**Why it's wrong:** Interfaces and type aliases are erased at compile time! `instanceof` is a JS runtime operator checking class constructor prototypes.

*Incorrect:*
```typescript
interface User { name: string }
// if (x instanceof User) {} // ❌ ReferenceError: User is not defined!
```

*Fix:*
```typescript
class UserClass { name!: string }
if (x instanceof UserClass) { /* Works at runtime */ }
```

### Mistake 4: Expecting `typeof null` to Return `"null"`

**The mistake:** Writing `if (typeof val === "null")` expecting it to check for null values.

**Why it's wrong:** In JavaScript, `typeof null === "object"` (legacy JS bug). Check `val === null` directly.

*Incorrect:*
```typescript
// if (typeof val === "null") {} // ❌ Never evaluates to true!
```

*Fix:*
```typescript
if (val === null) { /* Correct null check */ }
```

## 6. Practice Exercises

### Exercise 1: Array Type Guard

**Problem:** You have a parameter `data: string | string[]`. How do you safely narrow it so you can call `.join(",")` if it's an array?

**Expected output:**
```typescript
if (Array.isArray(data)) {
  console.log(data.join(","));
} else {
  console.log(data); // Narrowed to string
}
```

> [!check]- Answer
> - Remember, `typeof data === "object"` is dangerous!

---



### Exercise 2: Class Narrowing with `instanceof`

**Problem:** Narrow `err: Error | CustomError` using `if (err instanceof CustomError)`.

**Expected output:**
```text
Narrowed to CustomError instance
```

> [!check]- Answer
> ```typescript
> class CustomError extends Error { code = 400; }
> function handle(err: Error) {
>   if (err instanceof CustomError) console.log(err.code);
> }
> handle(new CustomError());
> console.log("Narrowed to CustomError instance");
> ```
>
> **Explanation:** `instanceof` checks prototype chain references to narrow object class instances.

### Exercise 3: Typeof Guard Values List

**Problem:** List 6 primitive string return values of JS `typeof` operator (`"string"`, `"number"`, `"boolean"`, `"bigint"`, `"symbol"`, `"undefined"`).

**Expected output:**
```text
string, number, boolean, bigint, symbol, undefined
```

> [!check]- Answer
> ```typescript
> console.log("string, number, boolean, bigint, symbol, undefined");
> ```
>
> **Explanation:** `typeof` returns standard primitive type name strings.

## 7. Related Terms
- [Type Narrowing](../level_06/type_narrowing.md) — The goal of using these operators.
- [Classes](../level_10/classes.md) — The structures `instanceof` works with.

---

## 8. Key Takeaways
- **`typeof`** is used to narrow Primitive types (`string`, `number`, `boolean`, `function`).
- **`instanceof`** is used to narrow Class instances (`Date`, `MouseEvent`, custom Classes).
- Beware of `typeof object` — it matches arrays, objects, and `null`.
- You cannot use `instanceof` to check if an object matches an `interface`, because interfaces do not exist at runtime.
