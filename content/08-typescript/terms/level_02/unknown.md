# `unknown`

> **Level 2 — Basic Types**
> The type-safe alternative to `any`. It represents a value that could be absolutely anything, but forces the developer to explicitly verify what the value is *before* interacting with it.

---

## 1. Prerequisites
- [`any`](any.md) — The dangerous type that `unknown` was designed to replace.
---

## 2. Term Category
- **TypeScript Type (Top Type)**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes, you truly don't know what a value is. If you use `JSON.parse()`, or fetch data from a random API, or catch an Error in a `try/catch` block, the data could be a string, an object, or null.
Historically, developers used [`any`](../level_02/any.md) for this. But `any` allows you to immediately call `.toUpperCase()` on the data, which will crash your app if the data happens to be a number.
TypeScript introduced **`unknown`** (in TS 3.0) to fix this. It means: *"This could be anything, so I am going to lock it down. You cannot do ANYTHING with this variable until you mathematically prove to me what type it is."*

### (2) The Lock Mechanism
If a variable is `unknown`, you cannot access properties on it, call it, or assign it to strictly typed variables.

```typescript
let mysteryData: unknown = "Hello World";

// ❌ Error: Object is of type 'unknown'.
console.log(mysteryData.toUpperCase());
```

### (3) Unlocking it (Type Narrowing)
To use an `unknown` value, you must use an `if` statement (a Type Guard) to "narrow" the type. Once TypeScript sees the `if` statement, it unlocks the variable!

```typescript
let mysteryData: unknown = "Hello World";

if (typeof mysteryData === "string") {
  // ✅ Inside this block, TS knows `mysteryData` is a string!
  console.log(mysteryData.toUpperCase()); 
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Leaving `catch` blocks typed as `any`

**The mistake:** A developer writes a `try/catch` block: `catch (error) { console.log(error.message); }`.

**Why it's wrong:** In JavaScript, you can literally `throw 5` or `throw "string"`. Therefore, the `error` in a catch block is never guaranteed to be an `Error` object. In older TS versions, `error` defaulted to `any`. Accessing `error.message` on a thrown string results in `undefined`.
**Golden Rule:** Modern TS configuration (`useUnknownInCatchVariables`) forces all caught errors to be `unknown`. You must narrow it: `if (error instanceof Error) { console.log(error.message); }`.

---



### Mistake 2: Attempting Property Access directly on `unknown` without Type Guards

**The mistake:** Writing `const len = val.length;` when `val` has type `unknown`.

**Why it's wrong:** `unknown` is the type-safe counterpart of `any`. TS forbids invoking methods or reading properties on `unknown` until narrowed.

*Incorrect:*
```typescript
function process(val: unknown) {
    // return val.toUpperCase(); // ❌ Object is of type 'unknown'
}
```

*Fix:*
```typescript
function process(val: unknown) {
    if (typeof val === "string") {
        return val.toUpperCase(); // Type narrowed to string
    }
}
```

### Mistake 3: Assigning `unknown` to Specific Types without Type Assertion or Guard

**The mistake:** Writing `const num: number = val;` where `val` is `unknown`.

**Why it's wrong:** Unlike `any`, `unknown` cannot be assigned to specific types (except `any` and `unknown`) without validation.

*Incorrect:*
```typescript
const input: unknown = 42;
// const n: number = input; // ❌ Type 'unknown' is not assignable to type 'number'
```

*Fix:*
```typescript
const input: unknown = 42;
if (typeof input === "number") {
    const n: number = input;
}
```

## 6. Practice Exercises

### Exercise 1: The Type Hierarchy

**Problem:** Can you assign a `string` to an `unknown` variable? Can you assign an `unknown` variable to a `string` variable?

**Expected output:**
> [!check]- Answer
> ```text
> 1. Yes: `let x: unknown = "Hello"` is allowed. `unknown` can accept EVERYTHING.
> 2. No: `let y: string = x` is an ERROR. You cannot assign `unknown` to a strict type without proving it is a string first!
> ```
> - Think of `unknown` as a locked safe.

---



### Exercise 2: Type Narrowing `unknown` Inputs

**Problem:** Safely extract `.length` from `val: unknown` using `Array.isArray()` check.

**Expected output:**
> [!check]- Answer
> ```text
> 3
> ```
> ```typescript
> function getLen(val: unknown): number {
>   if (Array.isArray(val)) return val.length;
>   return 0;
> }
> console.log(getLen([1, 2, 3]));
> ```
>
> **Explanation:** Type guards like `Array.isArray()` safely narrow `unknown` types to specific array types.

---

### Exercise 3: `any` vs `unknown` Assignment Rules

**Problem:** Can `unknown` be assigned to `number` without type narrowing? (No)

**Expected output:**
> [!check]- Answer
> ```text
> No, unknown requires type narrowing first
> ```
> ```typescript
> console.log("No, unknown requires type narrowing first");
> ```
>
> **Explanation:** `unknown` enforces compile-time safety by requiring type narrowing before assignment.

## 7. Related Terms
- [`any`](any.md) — The chaotic equivalent of `unknown`.
- [Type Narrowing](../level_06/type_narrowing.md) — The process of unlocking an `unknown` variable.
- [`void` & `never`](void_never.md) — Related concept: `void` & `never`.
- [Type Assertions (`as`)](../level_05/type_assertions.md) — Related concept: Type Assertions (`as`).
---

## 8. Key Takeaways
- **`unknown`** is the type-safe version of `any`.
- Like `any`, it can hold absolutely any value.
- Unlike `any`, you are strictly forbidden from interacting with an `unknown` variable until you perform a runtime check (e.g., `typeof`) to prove what it is.
- Always use `unknown` instead of `any` when dealing with unpredictable data (like API responses or caught errors).
