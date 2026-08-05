# `Parameters` / `ConstructorParameters` / `Awaited`

> **Level 8 — Utility Types**
> Built-in utility types that inspect and extract nested signature signatures, extracting function argument types as tuples (`Parameters`), class constructor arguments (`ConstructorParameters`), or unwrapping Promises (`Awaited`).

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The baseline standard utility overview.
- [`ReturnType<T>`](returntype.md) — Extracting return types from functions.

---

## 2. Term Category
- **Utility Type**

---

## 3. Environment Context
- **Build-time** (These operations run inside the compiler to infer arguments and Promise boundaries, leaving no footprint in the runtime JS bundle).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building utility functions, API wrappers, decorator patterns, or middleware, you often need to forward or duplicate the arguments of a function or class. 

For instance, you might want to create a logging decorator that wraps an existing database saving function:
```typescript
function saveUser(id: string, age: number, active: boolean) { ... }
```
If you had to manually duplicate this signature (`(id: string, age: number, active: boolean)`) for the logging decorator, any future update to `saveUser` would require updating the wrapper as well, causing code maintenance drift.

Additionally, when working with async values, developers need to extract the type *inside* a nested Promise without writing complex chain checks.

TypeScript introduced `Parameters`, `ConstructorParameters`, and `Awaited` to inspect function structures and resolve Promise contents dynamically, keeping types DRY (Don't Repeat Yourself).

### (2) Core Mechanics
These utilities use the `infer` keyword inside conditional types to capture signature inputs.

#### `Parameters<Type>`
Extracts a tuple representing the parameters of a function type.
- **Under the hood:** `type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;`
```typescript
type MyFunc = (name: string, age: number) => void;
type Args = Parameters<MyFunc>; // Type: [name: string, age: number]
```

#### `ConstructorParameters<Type>`
Extracts the arguments of a class constructor.
- **Under the hood:** `type ConstructorParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never;`
```typescript
class Person {
  constructor(name: string, age: number) {}
}
type PersonArgs = ConstructorParameters<typeof Person>; // Type: [name: string, age: number]
```

#### `Awaited<Type>`
Recursively unwraps Promise objects (or values that contain a `.then()` method) to resolve their final value.
```typescript
type PromiseType = Promise<Promise<string>>;
type Unwrapped = Awaited<PromiseType>; // Type: string
```

### (3) Real-World Application
Building a generic wrapper function that intercepts arguments and forwards them to a target function.

```typescript
function fetchUser(userId: string, authHeader: string) {
  return Promise.resolve({ id: userId, email: 'test@domain.com' });
}

// Automatically match parameter inputs without manual duplication!
function loggedFetch(...args: Parameters<typeof fetchUser>): Promise<{ id: string; email: string }> {
  console.log(`Executing fetch with arguments:`, args);
  return fetchUser(...args); // Correctly typed!
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Passing a function value directly instead of using `typeof`

**The mistake:** Passing a real JavaScript function variable directly to `Parameters` or a Class name to `ConstructorParameters`.

**Why it's wrong:** Utility types operate on **Types**, not values. You must apply the `typeof` keyword to convert a value into its TypeScript type representation first.

*Incorrect:*
```typescript
function register(token: string) {}

// Error: 'register' refers to a value, but is being used as a type here.
type Args = Parameters<register>; 
```

*Fix:* Use `typeof register` to extract the function's type signature.
```typescript
type Args = Parameters<typeof register>; // Type: [token: string]
```

**Golden Rule:** If you are passing an active function variable, class, or object to a utility type, you must prefix it with the `typeof` keyword.

---



### Mistake 2: Passing Function Implementation Objects instead of Function Types to `Parameters<T>`

**The mistake:** Writing `Parameters<myFunc>` passing raw function value `myFunc`.

**Why it's wrong:** Utility types expect TYPE parameters, NOT runtime values. Pass `typeof myFunc`.

*Incorrect:*
```typescript
function add(a: number, b: number) {}
// type Params = Parameters<add>; // ❌ 'add' refers to a value, but is being used as a type
```

*Fix:*
```typescript
function add(a: number, b: number) {}
type Params = Parameters<typeof add>; // Yields [a: number, b: number]
```

### Mistake 3: Expecting `Awaited<T>` to Require Chained `await` Resolution

**The mistake:** Wrapping deeply nested promises in multiple nested `Awaited` calls `Awaited<Awaited<Promise<Promise<number>>>>`.

**Why it's wrong:** `Awaited<T>` unwraps nested promises recursively in a single utility invocation.

*Incorrect:*
```typescript
type Deep = Promise<Promise<string>>;
type Manual = Awaited<Awaited<Deep>>; // Redundant unwrap
```

*Fix:*
```typescript
type Deep = Promise<Promise<string>>;
type Clean = Awaited<Deep>; // Unwraps recursively to 'string'
```

## 6. Practice Exercises

### Exercise 1: Extracting Async API Payloads

**Problem:** You have a function that loads database configurations asynchronously. Write a type called `ConfigData` that extracts the resolved, unwrapped payload type from the function's return promise.

```typescript
async function loadConfig() {
  return {
    databaseUrl: 'mysql://localhost:3306',
    poolSize: 10
  };
}

// Complete the definition using ReturnType and Awaited:
type PromiseReturn = ReturnType<typeof loadConfig>; // Type: Promise<{...}>
type ConfigData = Awaited<PromiseReturn>;
```

**Expected output:**
> [!check]- Answer
> ```text
> ConfigData evaluates to the object type: { databaseUrl: string; poolSize: number; }
> ```
> - First get the return type of `loadConfig` (which is a Promise) using `ReturnType<typeof loadConfig>`.
> - Wrap that result in `Awaited<...>` to peel away the Promise envelope.

---



### Exercise 2: Extracting First Parameter Type

**Problem:** Extract type of first parameter from `function fetchUser(id: number, opts?: object)`.

**Expected output:**
> [!check]- Answer
> ```text
> number
> ```
> ```typescript
> function fetchUser(id: number, opts?: object) {}
> type FirstParam = Parameters<typeof fetchUser>[0];
> console.log("number");
> ```
>
> **Explanation:** `Parameters<typeof fn>[0]` indexes the tuple type returned by `Parameters`.

---

### Exercise 3: Unwrapping Async Return Types with `Awaited`

**Problem:** Unwrap return type of `async function getData(): Promise<{ a: number }>`.

**Expected output:**
> [!check]- Answer
> ```text
> { a: number }
> ```
> ```typescript
> async function getData() { return { a: 1 }; }
> type Unwrapped = Awaited<ReturnType<typeof getData>>;
> console.log("{ a: number }");
> ```
>
> **Explanation:** Combining `Awaited` and `ReturnType` unwraps promised async return types.

## 7. Related Terms
- [`ReturnType<T>`](returntype.md) — Extracting outputs of functions.
- [The `infer` Keyword](../level_09/infer.md) — The mechanism enabling parameter capture.
- [Conditional Types](../level_09/conditional_types.md) — The underlying type branching logic.

---

## 8. Key Takeaways
- **`Parameters`** extracts function arguments as a tuple type.
- **`ConstructorParameters`** extracts class constructor arguments as a tuple type.
- **`Awaited`** unwraps Promise layers recursively to get the raw return type of async actions.
- You must use **`typeof`** when passing active values or functions into these utility types.
- Extremely useful for writing generic middleware, wrappers, and decorators.
