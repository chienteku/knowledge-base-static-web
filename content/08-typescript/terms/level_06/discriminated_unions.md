# Discriminated Unions

> **Level 6 — Type Narrowing & Guards**
> The most powerful and common pattern for typing complex state in TypeScript. It involves giving every object in a Union a shared, literal property (the "discriminant") used to easily narrow the types.

---

## 1. Prerequisites
- [Union Types (`|`)](../level_05/union_types.md) — The structure being narrowed.
- [Literal Types](../level_05/literal_types.md) — The properties used as the discriminant.

---

## 2. Term Category

**TypeScript Core Syntax** (Tagged Union Pattern): Discriminated unions combine object variant types sharing a common literal property tag for pattern matching and type narrowing.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
Using the [`in` operator](../level_06/in_operator.md) or Custom Type Guards works fine for simple unions (`Bird | Fish`). But what if you have a complex union of 10 different Event types, or 5 different API response states (Loading, Success, Error)?
Checking `"data" in response` or `"errorMessage" in response` becomes extremely messy and hard to read.
**Discriminated Unions** solve this by forcing every object in the union to share a single, identical property name (usually `type`, `kind`, or `status`). The value of this property is a strict **Literal Type**. 

### (2) The Pattern
Notice how all three interfaces share the exact same property name: `status`.

```typescript
interface LoadingState {
  status: "loading"; // Literal Type!
}
interface SuccessState {
  status: "success"; // Literal Type!
  data: string[];
}
interface ErrorState {
  status: "error";   // Literal Type!
  errorMessage: string;
}

type APIState = LoadingState | SuccessState | ErrorState;
```

### (3) The Magic of the Switch Statement
Because all objects in the Union share the `status` property, TypeScript allows you to read `status` without any narrowing.
Once you use an `if` or `switch` statement on the discriminant (`status`), TypeScript instantly narrows the entire object!

```typescript
function renderUI(state: APIState) {
  switch (state.status) {
    case "loading":
      // Narrowed to LoadingState
      return "Loading...";
    case "success":
      // Narrowed to SuccessState! Safe to access `data`
      return `Loaded ${state.data.length} items`;
    case "error":
      // Narrowed to ErrorState! Safe to access `errorMessage`
      return `Error: ${state.errorMessage}`;
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the literal type

**The mistake:** A developer writes:
```typescript
interface Success { status: string; data: string; }
interface Error { status: string; code: number; }
```

**Why it's wrong:** The `status` property is just a generic `string`. If you check `if (state.status === "success")`, TypeScript won't narrow anything, because any generic string can theoretically equal "success".
**Golden Rule:** The discriminant property MUST be typed as a specific Literal Type (e.g., `"success"`), an Enum, or a boolean. It cannot be a generic primitive.

---



### Mistake 2: Using Non-Literal or Dynamic Types as Discriminant Properties

**The mistake:** Using `kind: string` as discriminant field in `type Shape = { kind: string; radius: number } | ...`.

**Why it's wrong:** Discriminant properties MUST be literal types (e.g. `kind: "circle"`). A general `string` type cannot uniquely identify union variants.

*Incorrect:*
```typescript
type A = { type: string; a: number };
type B = { type: string; b: string };
// TS cannot discriminate variant by string property!
```

*Fix:*
```typescript
type A = { type: "A"; a: number };
type B = { type: "B"; b: string };
// TS discriminates via 'A' vs 'B' literal tags
```

### Mistake 3: Mismatched Discriminant Field Property Names across Variants

**The mistake:** Using `kind: "a"` in variant A and `type: "b"` in variant B.

**Why it's wrong:** Discriminant properties must share the exact same property key name across all variants in the union.

*Incorrect:*
```typescript
type VariantA = { type: "A"; val: number };
type VariantB = { kind: "B"; str: string };
```

*Fix:*
```typescript
type VariantA = { type: "A"; val: number };
type VariantB = { type: "B"; str: string };
```

## 5. Practice Exercises

### Exercise 1: Pattern Matching Discriminated Unions

**Scenario:**
Define a `Shape` discriminated union containing `Square`, `Rectangle`, and `Circle` variants with a common `kind` literal tag.

**Requirements:**
1. Create variants sharing `kind` discriminant string literal.
2. Implement area calculator using `switch(shape.kind)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Square = { kind: "square"; size: number };
> type Rectangle = { kind: "rectangle"; width: number; height: number };
> type Circle = { kind: "circle"; radius: number };

type Shape = Square | Rectangle | Circle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size * shape.size;
    case "rectangle":
      return shape.width * shape.height;
    case "circle":
      return Math.PI * shape.radius ** 2;
  }
}
```

> #### Technical Explanation
>
> 1. Discriminated unions share a common single-valued property tag (`kind`) across all variants.
> 2. `switch (shape.kind)` narrows `shape` to its exact constituent type in each `case` block.
> 3. Fundamental pattern for domain modeling and state management.

---

### Exercise 2: Modeling Asynchronous State Machines

**Scenario:**
Create an asynchronous HTTP state discriminated union (`IdleState`, `LoadingState`, `SuccessState<T>`, `ErrorState`).

**Requirements:**
1. Use `status` discriminant tag across 4 state variants.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type IdleState = { status: "idle" };
> type LoadingState = { status: "loading" };
> type SuccessState<T> = { status: "success"; data: T };
> type ErrorState = { status: "error"; error: string };

type AsyncState<T> = IdleState | LoadingState | SuccessState<T> | ErrorState;

function renderState(state: AsyncState<string[]>) {
  switch (state.status) {
    case "idle": return "Click to load";
    case "loading": return "Loading items...";
    case "success": return `Loaded ${state.data.length} items`;
    case "error": return `Error: ${state.error}`;
  }
}
```

> #### Technical Explanation
>
> 1. Discriminated unions prevent invalid state combinations (e.g. `loading: true` and `error: "Failed"` simultaneously).
> 2. Guarantees that data payload properties (`data`, `error`) exist ONLY when the corresponding `status` tag matches.
> 3. Standard architecture for UI state management (React `useReducer`, Redux).

---

### Exercise 3: Nested Discriminants and Composite Tags

**Scenario:**
Demonstrate narrowing on nested discriminant properties like `event.payload.type`.

**Requirements:**
1. Narrow nested discriminant `action.meta.type`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type UserEvent = 
>   | { meta: { type: "USER_LOGIN" }; userId: string }
>   | { meta: { type: "USER_LOGOUT" }; timestamp: number };

function handleEvent(event: UserEvent) {
  if (event.meta.type === "USER_LOGIN") {
    console.log("Logged in user:", event.userId);
  } else {
    console.log("Logged out at:", event.timestamp);
  }
}
```

> #### Technical Explanation
>
> 1. TypeScript control-flow analysis can narrow unions using nested property tags (`event.meta.type`).
> 2. Simplifies deep event routing and payload handling.
> 3. Highly versatile discriminant pattern.

---



## 6. Related Terms
- [Literal Types](../level_05/literal_types.md) — The building blocks of the discriminant.
- [`void` & `never`](../level_02/void_never.md) — `never` is used in the `default` case of a Discriminated Union switch statement for exhaustive checking.
- [Exhaustiveness Checking (`never`)](exhaustiveness_checking.md) — Related concept: Exhaustiveness Checking (`never`).
- [`in` Operator Narrowing](in_operator.md) — Related concept: `in` Operator Narrowing.
- [Union Types (`|`)](../level_05/union_types.md) — Union types.
- [Type Narrowing](type_narrowing.md) — Related concept: Type Narrowing.

---

## 7. Key Takeaways
- A **Discriminated Union** is a union of object types that all share a common property (the "discriminant").
- The discriminant property must be a unique **Literal Type** for each object (e.g., `kind: "circle"` vs `kind: "square"`).
- It is the cleanest, most scalable way to narrow complex state, especially when using `switch` statements.
- This pattern is universally used in TypeScript architecture, heavily featuring in state machines, API responses, and Redux reducers.
