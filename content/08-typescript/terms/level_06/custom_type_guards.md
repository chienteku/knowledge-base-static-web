# Custom Type Guards (`is`)

> **Level 6 — Type Narrowing & Guards**
> A way to write your own reusable narrowing functions. You explicitly tell TypeScript: *"If this function returns true, trust me, the variable is of Type X."*

---

## 1. Prerequisites
- [Type Narrowing](../level_06/type_narrowing.md) — What this custom guard achieves.
- [Function Types](../level_04/function_types.md) — Where the `is` keyword is placed.

---

## 2. Term Category
- **TypeScript Advanced Syntax**

---

## 3. Environment Context
- **Compile-Time Contract**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Duck Test Guard

**Problem:** Write a Custom Type Guard function named `isBird` that accepts an `animal: unknown` and narrows it to the `Bird` interface (assuming Bird requires a `fly` method).

**Expected output:**
```typescript
interface Bird { fly(): void; }

function isBird(animal: unknown): animal is Bird {
  // We have to assert animal to any/object first to safely check the property
  return typeof animal === "object" && animal !== null && "fly" in animal;
}
```

> [!check]- Answer
> - Remember to return `animal is Bird`.
> - Check if it's an object before using the `in` operator!

---



### Exercise 2: Custom Array Guard `isStringArray`

**Problem:** Implement type guard `isStringArray(arr: unknown): arr is string[]`.

**Expected output:**
```text
isStringArray type guard created
```

> [!check]- Answer
> ```typescript
> function isStringArray(arr: unknown): arr is string[] {
>   return Array.isArray(arr) && arr.every(item => typeof item === "string");
> }
> console.log(isStringArray(["a", "b"]));
> ```
>
> **Explanation:** Array guards validate both array container and item types.

### Exercise 3: Type Guard Predicate Syntax

**Problem:** Syntax format for custom type guard return annotation (`paramName is TargetType`).

**Expected output:**
```text
paramName is TargetType
```

> [!check]- Answer
> ```typescript
> console.log("paramName is TargetType");
> ```
>
> **Explanation:** Type predicate syntax binds parameter narrowing to boolean return values.

## 7. Related Terms
- [Type Narrowing](../level_06/type_narrowing.md) — What this function achieves.
- [`in` Operator](../level_06/in_operator.md) — Often used inside the body of a Custom Type Guard.

---

## 8. Key Takeaways
- **Custom Type Guards** allow you to extract narrowing logic into reusable helper functions.
- You create them by replacing the `boolean` return type with a **Type Predicate**: `param is Type`.
- When the function returns `true`, the TypeScript compiler will automatically narrow the variable to the specified type in the calling block.
- They are extremely useful as callbacks in `Array.prototype.filter()` to narrow array types.
- **Warning:** TypeScript blindly trusts your `is` signature. If your internal logic is flawed, you will cause runtime errors.
