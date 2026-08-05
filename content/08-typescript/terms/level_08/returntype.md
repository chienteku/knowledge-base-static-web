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
- **TypeScript Standard Library**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Parameters Utility

**Problem:** If `ReturnType<T>` extracts the output of a function, what is the name of the built-in Utility Type that extracts the input (arguments) of a function into a Tuple?

**Expected output:**
> [!check]- Answer
> ```typescript
> // Parameters<T>
> type GraphArgs = Parameters<typeof createGraph>;
> // If the function was `(a: string, b: number) => void`
> // GraphArgs would resolve to the tuple: `[string, number]`
> ```
> - What is the common word for function inputs?

---



### Exercise 2: Extracting Factory Function Return Types

**Problem:** Extract return type of `function createStore() { return { state: 1, dispatch: () => {} }; }`.

**Expected output:**
> [!check]- Answer
> ```text
> { state: number; dispatch: () => void }
> ```
> ```typescript
> function createStore() { return { state: 1, dispatch: () => {} }; }
> type Store = ReturnType<typeof createStore>;
> console.log("{ state: number; dispatch: () => void }");
> ```
>
> **Explanation:** `ReturnType<typeof fn>` captures inferred function return object shapes.

---

### Exercise 3: Non-Function Argument Errors in `ReturnType`

**Problem:** What error occurs if `ReturnType<string>` is evaluated?

**Expected output:**
> [!check]- Answer
> ```text
> Type 'string' does not satisfy constraint '(...args: any) => any'
> ```
> ```typescript
> console.log("Type 'string' does not satisfy constraint '(...args: any) => any'");
> ```
>
> **Explanation:** `ReturnType<T>` constrains generic argument `T` to callable function types.

## 7. Related Terms
- [Function Types](../level_04/function_types.md) — What `ReturnType` analyzes.
- [Type Inference](../level_01/type_inference.md) — The engine powering this utility. `ReturnType` extracts whatever the engine inferred.
- [The `infer` Keyword](../level_09/infer.md) — The underlying syntax used to build `ReturnType`.
- [`Parameters` / `ConstructorParameters` / `Awaited`](parameters_awaited.md) — Sibling utilities that extract parameters and Promise contents.
- [`typeof` Operator](../level_09/typeof.md) — typeof function return type.

---

## 8. Key Takeaways
- **`ReturnType<T>`** extracts the specific return type out of a function.
- It is incredibly useful for typing variables when a third-party library exports a function, but forgets to export the interface for the object that function returns.
- You must pass a *Function Type* into the generic.
- To use an actual JavaScript function, you must combine it with `typeof`: `ReturnType<typeof myFunction>`.
