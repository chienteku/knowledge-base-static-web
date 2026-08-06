# Custom Type Guards (`is`)

> **Level 6 — Type Narrowing & Guards**
> A way to write your own reusable narrowing functions. You explicitly tell TypeScript: *"If this function returns true, trust me, the variable is of Type X."*

---

## 1. Prerequisites
- [Type Narrowing](type_narrowing.md) — What this custom guard achieves.
- [Function Types](../level_04/function_types.md) — Where the `is` keyword is placed.

---

## 2. Term Category

**Type System Fundamental** (User-Defined Type Predicates): User-defined type guards (`arg is T`) use type predicate return values to narrow untyped or union values inside conditional statements.



---

## 3. Explanation

### Environment Context
- **Compile-Time Contract**

### (1) Design Motivation — "Why did we design this?"
You find yourself constantly writing `if ("fly" in animal)` or `if (typeof data === "string")` across your app. You want to extract this logic into a clean, reusable helper function.
```typescript
function isString(data: unknown) {
  return typeof data === "string";
}

if (isString(myVar)) {
  myVar.toUpperCase(); // ❌ ERROR: Object is of type 'unknown'
}
```
Why did it fail? Because `isString` just returns a `boolean`. The TypeScript compiler does not look *inside* the `isString` function to see your `typeof` check. It just sees `true` or `false`, which isn't enough to narrow the type.
**Custom Type Guards** solve this by using the **Type Predicate** (`is`) syntax in the return type.

### (2) The Type Predicate (`is`)
Instead of typing the function to return `boolean`, you type it to return `parameterName is Type`.

```typescript
// The return type is a Type Predicate
function isString(data: unknown): data is string {
  // You must return a boolean!
  return typeof data === "string";
}

if (isString(myVar)) {
  // ✅ SUCCESS! TS trusts the Custom Guard and narrows `myVar` to string.
  myVar.toUpperCase(); 
}
```

### (3) Using Guards with `.filter()`
Custom Type Guards are incredibly powerful when working with Arrays. If you use `.filter(Boolean)` on an array of `(string | undefined)[]`, TS still thinks the resulting array has `undefined` in it.
If you pass a Custom Type Guard to `.filter()`, TS will narrow the resulting array!

```typescript
const mixed: (string | undefined)[] = ["A", undefined, "B"];

// Narrow the array type from (string | undefined)[] to strictly string[]
const clean: string[] = mixed.filter((item): item is string => item !== undefined);
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Lying in your Type Guard

**The mistake:** You write a Custom Type Guard but make a mistake in the logic:
```typescript
function isNumber(data: unknown): data is number {
  return typeof data === "string"; // Oops! Logic bug!
}
```

**Why it's wrong:** TypeScript **blindly trusts** Custom Type Guards! If the function returns `true`, TS forces the type to `number`, even if your logic actually checked for a string. This will cause catastrophic runtime crashes.
**Golden Rule:** Custom Type Guards are functionally equivalent to Type Assertions (`as`). You are overriding the compiler. Ensure your logic inside the guard is 100% flawless and heavily unit-tested.

---



### Mistake 2: Returning Inaccurate Booleans inside `target is Type` Custom Guard Functions

**The mistake:** Writing `function isUser(obj: any): obj is User { return true; }` without actually validating properties.

**Why it's wrong:** TS trusts `arg is Type` annotations completely! Returning `true` for invalid runtime objects tricks TS into treating bad data as valid, leading to runtime crashes.

*Incorrect:*
```typescript
function isUser(obj: any): obj is { name: string } {
    return true; // 💥 Lies to compiler without validating obj.name!
}
```

*Fix:*
```typescript
function isUser(obj: any): obj is { name: string } {
    return typeof obj === "object" && obj !== null && typeof obj.name === "string";
}
```

### Mistake 3: Annotating Custom Type Guard Return Type as `: boolean` instead of `arg is Type`

**The mistake:** Writing `function isString(val: any): boolean` expecting calling code to narrow `val`.

**Why it's wrong:** A `: boolean` return type indicates a standard boolean result, failing to signal control flow type narrowing to TS.

*Incorrect:*
```typescript
function isStr(val: any): boolean { return typeof val === "string"; }
// if (isStr(x)) { x.toUpperCase(); } // ❌ x is not narrowed!
```

*Fix:*
```typescript
function isStr(val: any): val is string { return typeof val === "string"; }
// if (isStr(x)) { x.toUpperCase(); } // Correct: x narrowed to string
```

## 5. Practice Exercises

### Exercise 1: Authoring Custom User-Defined Type Predicates

**Scenario:**
Create a custom type guard function `isFish(pet: Fish | Bird): pet is Fish` to differentiate interface instances.

**Requirements:**
1. Annotate return type as `pet is Fish`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Fish {
>   swim(): void;
> }
> 
> interface Bird {
>   fly(): void;
> }
> 
> function isFish(pet: Fish | Bird): pet is Fish {
>   return (pet as Fish).swim !== undefined;
> }
> 
> function move(pet: Fish | Bird) {
>   if (isFish(pet)) {
>     pet.swim(); // pet is narrowed to Fish!
>   } else {
>     pet.fly();  // pet is narrowed to Bird!
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. Type predicate return types (`parameter is Type`) tell the compiler to narrow `parameter` when the function returns `true`.
> 2. Allows writing custom domain logic to inspect untyped or union objects.
> 3. Enables clean type narrowing across complex interface unions.
> 
---

### Exercise 2: Filtering Array Elements with Type Guards

**Scenario:**
Filter `null` and `undefined` values out of an array using `Array.prototype.filter` with a custom type guard.

**Requirements:**
1. Write a non-null type guard `isNotNull<T>(val: T | null | undefined): val is T`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function isNotNull<T>(val: T | null | undefined): val is T {
>   return val !== null && val !== undefined;
> }
> 
> const values: (string | null | undefined)[] = ["a", null, "b", undefined, "c"];
> 
> // Inferred cleanly as string[]:
> const validStrings: string[] = values.filter(isNotNull);
> ```
> 
> #### Technical Explanation
>
> 1. Standard boolean expressions passed to `filter` do not automatically narrow array element types.
> 2. Passing a type predicate (`val is T`) instructs `filter` to output a narrowed array (`T[]` instead of `(T | null)[]`).
> 3. Essential pattern for array sanitization.
> 
---

### Exercise 3: Auditing Dangerous/False Type Predicates

**Scenario:**
Demonstrate what happens when a type guard implementation returns `true` incorrectly.

**Requirements:**
1. Show runtime crash caused by a buggy type predicate function.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Admin {
>   role: "admin";
>   deleteDatabase(): void;
> }
> 
> // ⚠️ BUGGY TYPE GUARD: Returns true even when obj is not Admin!
> function isBadAdmin(obj: any): obj is Admin {
>   return true; // LIAR!
> }
> 
> function DangerousOperation(user: unknown) {
>   if (isBadAdmin(user)) {
>     // TS believes user is Admin, but crashes at runtime!
>     user.deleteDatabase(); // Uncaught TypeError: user.deleteDatabase is not a function
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. Type predicate functions rely entirely on developer correctness; the compiler does NOT verify that the internal boolean logic is sound.
> 2. Returning `true` incorrectly causes unsound type assertions down the line.
> 3. Ensure type predicate functions perform thorough runtime property validation.
> 
---



## 6. Related Terms
- [Type Narrowing](type_narrowing.md) — What this function achieves.
- [`in` Operator Narrowing](in_operator.md) — Often used inside the body of a Custom Type Guard.
- [Assertion Functions (`asserts`)](assertion_functions.md) — Related concept: Assertion Functions (`asserts`).

---

## 7. Key Takeaways
- **Custom Type Guards** allow you to extract narrowing logic into reusable helper functions.
- You create them by replacing the `boolean` return type with a **Type Predicate**: `param is Type`.
- When the function returns `true`, the TypeScript compiler will automatically narrow the variable to the specified type in the calling block.
- They are extremely useful as callbacks in `Array.prototype.filter()` to narrow array types.
- **Warning:** TypeScript blindly trusts your `is` signature. If your internal logic is flawed, you will cause runtime errors.
