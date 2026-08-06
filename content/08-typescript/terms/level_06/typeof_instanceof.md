# `typeof` & `instanceof` Guards

> **Level 6 — Type Narrowing & Guards**
> The two most common built-in JavaScript operators used as Type Guards to trigger Type Narrowing in TypeScript.

---

## 1. Prerequisites
- [Type Narrowing](type_narrowing.md) — The process these operators trigger.
- [Primitive Types](../level_02/primitive_types.md) — What `typeof` checks.

---

## 2. Term Category

**Type System Fundamental** (Primitive & Prototype Guard Operators): `typeof` and `instanceof` act as runtime type guards, narrowing primitive types and class prototype instances respectively.



---

## 3. Explanation

### Environment Context
- **Runtime (Analyzed at Compile-Time)**

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Primitive Narrowing with `typeof`

**Scenario:**
Write a function `doubleValue` taking `input: number | string | boolean` and processing each primitive using `typeof`.

**Requirements:**
1. Use `typeof input === "number"`, `"string"`, and `"boolean"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function doubleValue(input: number | string | boolean): string | number {
>   if (typeof input === "number") {
>     return input * 2;
>   } else if (typeof input === "string") {
>     return input.repeat(2);
>   }
>   return input ? "TRUE_TRUE" : "FALSE_FALSE";
> }
> ```

> #### Technical Explanation
>
> 1. `typeof` expressions return standard JS type strings (`"number"`, `"string"`, `"boolean"`, `"symbol"`, `"bigint"`, `"function"`, `"object"`).
> 2. TypeScript uses `typeof` conditions to narrow primitive union parameters inside `if` branches.
> 3. Standard primitive type guard mechanism.

---

### Exercise 2: Class Prototype Instance Narrowing with `instanceof`

**Scenario:**
Differentiate between `Date` and `RegExp` objects passed as `input: Date | RegExp` using `instanceof`.

**Requirements:**
1. Use `input instanceof Date`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function processObject(input: Date | RegExp): string {
>   if (input instanceof Date) {
>     return input.toISOString(); // input narrowed to Date
>   }
>   return input.source; // input narrowed to RegExp
> }
> ```

> #### Technical Explanation
>
> 1. `instanceof` checks if a constructor's `prototype` property appears in an object's prototype chain.
> 2. Narrows union parameters to specific class constructor types (`Date`, `RegExp`, custom classes).
> 3. Reliable mechanism for object prototype instance narrowing.

---

### Exercise 3: Auditing `typeof null === "object"` Edge Case

**Scenario:**
Explain why `typeof val === "object"` is insufficient for checking non-null objects due to JavaScript's legacy `typeof null === "object"` bug.

**Requirements:**
1. Demonstrate how `typeof null` causes runtime crashes if `null` is not checked.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function processObjectUnsafe(val: object | null) {
>   // ❌ DANGEROUS: typeof null returns "object"!
>   // if (typeof val === "object") {
>   //   console.log(val.toString()); // Crashes if val is null!
>   // }

// ✅ SAFE (Include explicit null check):
if (typeof val === "object" && val !== null) {
  console.log(val.toString());
}
```

> #### Technical Explanation
>
> 1. In JavaScript, `typeof null` evaluates to `"object"` due to a legacy 1995 implementation quirk.
> 2. `typeof val === "object"` alone does NOT exclude `null`.
> 3. Always pair `typeof val === "object"` with `val !== null` checks.

---



## 6. Related Terms
- [Type Narrowing](type_narrowing.md) — The goal of using these operators.
- [Classes Overview](../level_10/classes.md) — The structures `instanceof` works with.
- [`in` Operator Narrowing](in_operator.md) — Related concept: `in` Operator Narrowing.

---

## 7. Key Takeaways
- **`typeof`** is used to narrow Primitive types (`string`, `number`, `boolean`, `function`).
- **`instanceof`** is used to narrow Class instances (`Date`, `MouseEvent`, custom Classes).
- Beware of `typeof object` — it matches arrays, objects, and `null`.
- You cannot use `instanceof` to check if an object matches an `interface`, because interfaces do not exist at runtime.
