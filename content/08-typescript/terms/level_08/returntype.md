# `ReturnType<T>`

> **Level 8 — Utility Types**
> A Utility Type that extracts the output type (return value) from a specific function type.

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The core concept.
- [Function Types](../level_04/function_types.md) — The specific type of data this utility operates on.
- [typeof](../../../03-javascript/terms/level_01/typeof.md) — Often used in conjunction with this utility.

---

## 2. Term Category

**TypeScript Utility Type** (Function Return Type Extraction): `ReturnType<T>` extracts the return type of a function type `T` using conditional type inference.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
Imagine you are using a third-party library. It exports a function `createComplexGraph()`. This function returns a massive, heavily nested configuration object.
You want to write a variable to hold the result of this function, but the library author forgot to export the actual Interface for that object!
How do you type your variable? You can't write out the 50 properties manually.
**`ReturnType<T>`** solves this by asking TypeScript's compiler: *"Hey, look at that function. What type does it return? Cool, extract that into a usable Type alias for me."*

### (2) How to use it
You must pass a **Function Type** into the generic `<T>`. 

```typescript
// 1. The third party function
function createGraph() {
  return { nodes: 10, edges: 15, theme: "dark", /* 50 more fields */ };
}

// 2. We use `typeof` to grab the type of the function, 
// and `ReturnType` to grab the output of that function!
type GraphConfig = ReturnType<typeof createGraph>;

// 3. Now we have a perfectly typed variable without writing an interface!
const myConfig: GraphConfig = createGraph();
```

### (3) Using `typeof`
Notice the `typeof` keyword. `ReturnType` expects a Type. `createGraph` is a JavaScript value (a function). You MUST use `typeof createGraph` to convert the JavaScript value into a TypeScript Function Type before passing it into `<T>`.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing the function call instead of the type

**The mistake:** A developer writes `type Config = ReturnType<createGraph()>`. 

**Why it's wrong:** `ReturnType` is a TypeScript feature that operates entirely in the Type space. `createGraph()` is a runtime JavaScript execution. You cannot execute JavaScript inside a TypeScript generic `<T>`.
**Golden Rule:** You must pass the *Type* of the function into `ReturnType`. You almost always do this by using `typeof theFunctionName`.

---



### Mistake 2: Passing Function Values to `ReturnType<T>` instead of Function Types `typeof fn`

**The mistake:** Writing `ReturnType<myFunc>`.

**Why it's wrong:** `ReturnType<T>` is a generic type expecting a function TYPE parameter. Pass `typeof myFunc`.

*Incorrect:*
```typescript
function makeUser() { return { id: 1 }; }
// type User = ReturnType<makeUser>; // ❌ 'makeUser' refers to a value, but is being used as a type
```

*Fix:*
```typescript
function makeUser() { return { id: 1 }; }
type User = ReturnType<typeof makeUser>; // Correct type inference
```

### Mistake 3: Expecting `ReturnType` to Unwrap Promises Automatically

**The mistake:** Expecting `ReturnType<typeof fetchUser>` (where `fetchUser` is async) to yield `{ id: number }`.

**Why it's wrong:** Async functions return `Promise<T>`. `ReturnType` yields `Promise<{ id: number }>`. Wrap in `Awaited<ReturnType<...>>` to unwrap.

*Incorrect:*
```typescript
async function getData() { return 42; }
type Raw = ReturnType<typeof getData>; // Yields Promise<number>!
```

*Fix:*
```typescript
async function getData() { return 42; }
type Unwrapped = Awaited<ReturnType<typeof getData>>; // Yields number
```

## 5. Practice Exercises

### Exercise 1: Extracting Function Return Types with `ReturnType<T>`

**Scenario:**
Extract the return type of a factory function `createUser()` using `ReturnType`.

**Requirements:**
1. Apply `ReturnType<typeof createUser>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function createUser() {
>   return {
>     id: 101,
>     username: "coder_bob",
>     settings: { theme: "dark" }
>   };
> }

type UserObject = ReturnType<typeof createUser>;
// Inferred as: { id: number; username: string; settings: { theme: string; } }

const user: UserObject = createUser();
```

> #### Technical Explanation
>
> 1. `ReturnType<T>` extracts the return type of function type `T`.
> 2. Uses `typeof functionName` to query the function type first.
> 3. Obtains exact return types without manually duplicating interface definitions.

---

### Exercise 2: Inferring Return Types of Generic Functions

**Scenario:**
Extract the return type of a generic function using `ReturnType` and explicit type binding.

**Requirements:**
1. Extract return type of generic function.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function makeArray<T>(item: T): T[] {
>   return [item];
> }

type StringArray = ReturnType<typeof makeArray<string>>;
// Inferred as: string[]
```

> #### Technical Explanation
>
> 1. `typeof makeArray<string>` instantiates generic parameter `T` to `string` before passing to `ReturnType`.
> 2. Extracts concrete generic return types cleanly.
> 3. Supported in modern TypeScript syntax.

---

### Exercise 3: Auditing `ReturnType` Conditional Implementation Mechanics

**Scenario:**
Explain the internal conditional type definition of `ReturnType<T>`.

**Requirements:**
1. Detail `type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Internal TypeScript standard library definition:
> type CustomReturnType<T extends (...args: any) => any> = 
>   T extends (...args: any) => infer R ? R : any;
> ```

> #### Technical Explanation
>
> 1. `ReturnType` uses conditional types (`T extends ...`) and the `infer` keyword.
> 2. `infer R` instructs the compiler to introduce a new type variable `R` capturing the function's return type.
> 3. Fundamental demonstration of conditional type inference in TypeScript.

---



## 6. Related Terms
- [Function Types](../level_04/function_types.md) — What `ReturnType` analyzes.
- [Type Inference](../level_01/type_inference.md) — The engine powering this utility. `ReturnType` extracts whatever the engine inferred.
- [The `infer` Keyword](../level_09/infer.md) — The underlying syntax used to build `ReturnType`.
- [`Parameters` / `ConstructorParameters` / `Awaited`](parameters_awaited.md) — Sibling utilities that extract parameters and Promise contents.
- [`typeof` Operator](../level_09/typeof.md) — typeof function return type.

---

## 7. Key Takeaways
- **`ReturnType<T>`** extracts the specific return type out of a function.
- It is incredibly useful for typing variables when a third-party library exports a function, but forgets to export the interface for the object that function returns.
- You must pass a *Function Type* into the generic.
- To use an actual JavaScript function, you must combine it with `typeof`: `ReturnType<typeof myFunction>`.
