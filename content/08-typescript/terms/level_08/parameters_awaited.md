# `Parameters` / `ConstructorParameters` / `Awaited`

> **Level 8 — Utility Types**
> Built-in utility types that inspect and extract nested signature signatures, extracting function argument types as tuples (`Parameters`), class constructor arguments (`ConstructorParameters`), or unwrapping Promises (`Awaited`).

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The baseline standard utility overview.
- [`ReturnType<T>`](returntype.md) — Extracting return types from functions.

---

## 2. Term Category

**TypeScript Utility Type** (Function Parameter & Async Promise Unwrapping): `Parameters<T>` and `Awaited<T>` extract function argument tuple types and recursively unwrap Promise return types.



---

## 3. Explanation

### Environment Context
- **Build-time** (These operations run inside the compiler to infer arguments and Promise boundaries, leaving no footprint in the runtime JS bundle).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Extracting Function Parameter Tuples with `Parameters<T>`

**Scenario:**
Extract the parameter tuple type of a third-party function `fetchUser(id: string, options?: Config)` using `Parameters`.

**Requirements:**
1. Apply `Parameters<typeof fetchUser>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function fetchUser(id: string, options?: { verbose: boolean }) {
>   return { id, name: "Alice" };
> }

type FetchUserParams = Parameters<typeof fetchUser>;
// Inferred as: [id: string, options?: { verbose: boolean } | undefined]

const args: FetchUserParams = ["usr_100", { verbose: true }];
```

> #### Technical Explanation
>
> 1. `Parameters<T>` extracts the parameter tuple type of a function type `T`.
> 2. Obtains exact argument signatures without manually re-declaring parameter types.
> 3. Ideal for wrapping external library functions.

---

### Exercise 2: Recursively Unwrapping Promises with `Awaited<T>`

**Scenario:**
Unwrap nested `Promise<Promise<string[]>>` return types using `Awaited<T>`.

**Requirements:**
1. Apply `Awaited<T>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> async function getItems(): Promise<string[]> {
>   return ["item1", "item2"];
> }

type ItemsResult = Awaited<ReturnType<typeof getItems>>;
// Inferred as: string[]

const items: ItemsResult = ["a", "b"];
```

> #### Technical Explanation
>
> 1. `Awaited<T>` recursively unwraps Promises, resolving nested `Promise<Promise<T>>` types to concrete `T`.
> 2. Models the exact runtime behavior of `await` expressions in async functions.
> 3. Introduced in TypeScript 4.5 for accurate async return typing.

---

### Exercise 3: Combining `Parameters<T>` and `ReturnType<T>` in Wrappers

**Scenario:**
Create a higher-order logger function wrapper preserving exact parameter and return types.

**Requirements:**
1. Use `Parameters<T>` and `ReturnType<T>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function withLogging<T extends (...args: any[]) => any>(fn: T) {
>   return function (...args: Parameters<T>): ReturnType<T> {
>     console.log("Invoking function with args:", args);
>     return fn(...args);
>   };
> }
> ```

> #### Technical Explanation
>
> 1. `Parameters<T>` captures arguments while `ReturnType<T>` captures function output.
> 2. Wraps arbitrary functions while preserving exact type safety for callers.
> 3. Standard higher-order decorator and proxy pattern.

---



## 6. Related Terms
- [`ReturnType<T>`](returntype.md) — Extracting outputs of functions.
- [The `infer` Keyword](../level_09/infer.md) — The mechanism enabling parameter capture.
- [Conditional Types](../level_09/conditional_types.md) — The underlying type branching logic.

---

## 7. Key Takeaways
- **`Parameters`** extracts function arguments as a tuple type.
- **`ConstructorParameters`** extracts class constructor arguments as a tuple type.
- **`Awaited`** unwraps Promise layers recursively to get the raw return type of async actions.
- You must use **`typeof`** when passing active values or functions into these utility types.
- Extremely useful for writing generic middleware, wrappers, and decorators.
