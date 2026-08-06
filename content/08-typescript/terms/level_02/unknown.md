# `unknown`

> **Level 2 — Basic Types**
> The type-safe alternative to `any`. It represents a value that could be absolutely anything, but forces the developer to explicitly verify what the value is *before* interacting with it.

---

## 1. Prerequisites
- [`any`](any.md) — The dangerous type that `unknown` was designed to replace.

---

## 2. Term Category

**Type System Fundamental** (Type-Safe Top Type): `unknown` is the type-safe counterpart of `any`, requiring explicit type narrowing or assertions before property dereferencing.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Safe Parsing of Unknown API Payloads

**Scenario:**
Receive an untyped JSON API response payload as `unknown` and safely validate its properties before consumption.

**Requirements:**
1. Annotate incoming payload as `unknown`.
2. Perform type narrowing before property access.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function processApiResponse(data: unknown) {
>   // ❌ FAILS: Cannot access data.name directly on unknown!
>   // console.log(data.name);
> 
>   // ✅ CORRECT (Perform runtime shape check):
>   if (
>     typeof data === "object" &&
>     data !== null &&
>     "name" in data &&
>     typeof (data as any).name === "string"
>   ) {
>     console.log("User Name:", (data as any).name.toUpperCase());
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. `unknown` forces developers to prove a value's type at runtime before accessing properties.
> 2. Prevents unexpected runtime crashes from malformed external JSON payloads.
> 3. Modern replacement for unsafe `any` in API boundaries.
> 
---

### Exercise 2: Narrowing `unknown` with Custom Type Guards

**Scenario:**
Write a user-defined type guard function `isUser(obj: unknown): obj is User` to narrow `unknown` values safely.

**Requirements:**
1. Create custom type guard returning `obj is User`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: number;
>   username: string;
> }
> 
> function isUser(obj: unknown): obj is User {
>   return (
>     typeof obj === "object" &&
>     obj !== null &&
>     "id" in obj &&
>     "username" in obj &&
>     typeof (obj as Record<string, unknown>).id === "number" &&
>     typeof (obj as Record<string, unknown>).username === "string"
>   );
> }
> 
> function handleData(input: unknown) {
>   if (isUser(input)) {
>     // TypeScript knows input is User here!
>     console.log(`User ID: ${input.id}, Name: ${input.username}`);
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. Type predicate return types (`obj is User`) instruct the compiler to narrow `unknown` parameters upon returning `true`.
> 2. Provides clean, type-safe narrowing for complex data structures.
> 3. Standard pattern for validating untyped dynamic inputs.
> 
---

### Exercise 3: Type Assignability Matrix for `unknown`

**Scenario:**
Formulate an assignability rules matrix for the `unknown` top type.

**Requirements:**
1. Contrast assignability TO `unknown` vs assignability FROM `unknown`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> unknown Assignability Rules:
> - Assignability TO unknown: ANYTHING can be assigned to unknown (number, string, object, any).
> - Assignability FROM unknown: unknown can ONLY be assigned to unknown or any (CANNOT be assigned to string, number, or custom types without narrowing/casting).
> ```
> 
> #### Technical Explanation
>
> 1. `unknown` represents the top type in TypeScript's type hierarchy.
> 2. Enforces type checking at consuming call sites rather than producer declaration sites.
> 3. Complete type-safe abstraction for untyped data.
> 
---



## 6. Related Terms
- [`any`](any.md) — The chaotic equivalent of `unknown`.
- [Type Narrowing](../level_06/type_narrowing.md) — The process of unlocking an `unknown` variable.
- [`void` & `never`](void_never.md) — Related concept: `void` & `never`.
- [Type Assertions (`as`)](../level_05/type_assertions.md) — Related concept: Type Assertions (`as`).

---

## 7. Key Takeaways
- **`unknown`** is the type-safe version of `any`.
- Like `any`, it can hold absolutely any value.
- Unlike `any`, you are strictly forbidden from interacting with an `unknown` variable until you perform a runtime check (e.g., `typeof`) to prove what it is.
- Always use `unknown` instead of `any` when dealing with unpredictable data (like API responses or caught errors).
