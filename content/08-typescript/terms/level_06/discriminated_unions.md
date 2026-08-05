# Discriminated Unions

> **Level 6 — Type Narrowing & Guards**
> The most powerful and common pattern for typing complex state in TypeScript. It involves giving every object in a Union a shared, literal property (the "discriminant") used to easily narrow the types.

---

## 1. Prerequisites
- [Union Types (`|`)](../level_05/union_types.md) — The structure being narrowed.
- [Literal Types](../level_05/literal_types.md) — The properties used as the discriminant.
---

## 2. Term Category
- **TypeScript Architecture Pattern**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Redux Actions

**Problem:** The popular React state management library, Redux, relies entirely on Discriminated Unions. Look at a standard Redux action: `{ type: "ADD_TODO", payload: "Buy milk" }`. What is the "discriminant" property in Redux?

**Expected output:**
> [!check]- Answer
> ```text
> The `type` property is the discriminant!
> By putting a `switch(action.type)` inside a Redux Reducer, TypeScript can perfectly narrow the `action` object, ensuring you only access `payload` if that specific action type actually has a payload.
> ```
> - Which property dictates the shape of the rest of the object?

---



### Exercise 2: API Response Discriminated Union

**Problem:** Create `Result` union with `{ status: "success"; data: string } | { status: "error"; error: Error }`.

**Expected output:**
> [!check]- Answer
> ```text
> Discriminated union created
> ```
> ```typescript
> type Result =
>   | { status: "success"; data: string }
>   | { status: "error"; error: Error };
> console.log("Discriminated union created");
> ```
>
> **Explanation:** Literal tag `status` provides clean discriminant narrowing across async result variants.

---

### Exercise 3: Narrowing with Switch Statements

**Problem:** Use `switch (res.status)` to handle success and error states safely.

**Expected output:**
> [!check]- Answer
> ```text
> Handled success status
> ```
> ```typescript
> function handle(res: Result) {
>   switch (res.status) {
>     case "success": return res.data;
>     case "error": throw res.error;
>   }
> }
> console.log("Handled success status");
> ```
>
> **Explanation:** `switch` statements over discriminant tags narrow variant types in each `case` block.

## 7. Related Terms
- [Literal Types](../level_05/literal_types.md) — The building blocks of the discriminant.
- [`void` & `never`](../level_02/void_never.md) — `never` is used in the `default` case of a Discriminated Union switch statement for exhaustive checking.
- [Exhaustiveness Checking (`never`)](exhaustiveness_checking.md) — Related concept: Exhaustiveness Checking (`never`).
- [`in` Operator Narrowing](in_operator.md) — Related concept: `in` Operator Narrowing.
- [Union Types (`|`)](../level_05/union_types.md) — Union types.
- [Type Narrowing](type_narrowing.md) — Related concept: Type Narrowing.
---

## 8. Key Takeaways
- A **Discriminated Union** is a union of object types that all share a common property (the "discriminant").
- The discriminant property must be a unique **Literal Type** for each object (e.g., `kind: "circle"` vs `kind: "square"`).
- It is the cleanest, most scalable way to narrow complex state, especially when using `switch` statements.
- This pattern is universally used in TypeScript architecture, heavily featuring in state machines, API responses, and Redux reducers.
