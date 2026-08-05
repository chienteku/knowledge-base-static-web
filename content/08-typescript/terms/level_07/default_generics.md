# Generic Default Types (`=`)

> **Level 7 — Generics**
> A way to provide a fallback Type for a Generic `<T>`. If the developer using your generic interface/function doesn't provide a type, it will automatically fall back to this default.

---

## 1. Prerequisites
- [Generic Interfaces & Classes](generic_interfaces_classes.md) — Where defaults are most commonly used.
- [Optional & Default Parameters](../level_04/optional_default_parameters.md) — The exact same concept, but for data instead of Types.

---

## 2. Term Category
- **TypeScript Advanced Mechanics**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You build a heavily used `interface ApiResponse<T>`. 
90% of the time, your API just returns an empty success object `{}` or `{ success: true }`. Only 10% of the time does it return an actual data payload (like a User object).
It is incredibly annoying for developers to constantly write `ApiResponse<any>` or `ApiResponse<{}>` for all those simple endpoints.
**Generic Defaults** allow you to say: *"If the developer doesn't provide a `<T>`, just assume `<T>` is an empty object."*

### (2) The Syntax
You provide a default by using the `=` operator directly inside the angle brackets.

```typescript
// If T is not provided, default T to `Record<string, unknown>` (a standard object)
interface ApiResponse<T = Record<string, unknown>> {
  status: number;
  data: T;
}

// Usage 1: Explicitly providing a Type
const userRes: ApiResponse<User> = { status: 200, data: myUser };

// Usage 2: Letting it fall back to the Default!
const blankRes: ApiResponse = { status: 200, data: {} }; 
```

### (3) Combining Constraints and Defaults
You can combine `extends` (Constraint) and `=` (Default) on the exact same Generic. The Constraint must come first.

```typescript
// "T must be an object. If not provided, it defaults to a standard object."
interface Config<T extends object = Record<string, unknown>> { ... }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Ordering rules for multiple generics

**The mistake:** A developer writes: `interface Wrapper<T = string, U> { ... }`

**Why it's wrong:** Just like Default Parameters in functions, Generic Defaults must always come **last** in the list. If `<T>` has a default, and `<U>` does not, how does the compiler know which one you are providing if you only write `Wrapper<number>`?
**Golden Rule:** All required generics (`<U>`) must be listed before any generics that have defaults (`<T = string>`).

---



### Mistake 2: Placing Required Generic Parameters After Default Generic Parameters

**The mistake:** Writing `type Container<T = string, U>` (TS1071).

**Why it's wrong:** Generic type parameters with defaults MUST be placed after all required generic type parameters without defaults.

*Incorrect:*
```typescript
// type Container<T = string, U> = { a: T, b: U }; // ❌ Required type parameter cannot follow default type parameter
```

*Fix:*
```typescript
type Container<U, T = string> = { a: T, b: U }; // Correct generic parameter ordering
```

### Mistake 3: Expecting Default Generics to Override Explicitly Passed Type Arguments

**The mistake:** Expecting `State<number>` to fall back to default `string` type.

**Why it's wrong:** When callers explicitly supply a generic argument (`number`), the explicit argument overrides the default parameter (`string`).

*Incorrect:*
```typescript
type State<T = string> = { data: T };
const s: State<number> = { data: 123 }; // Uses explicitly passed type 'number'
```

*Fix:*
```typescript
type State<T = string> = { data: T };
const s: State = { data: "default string" }; // Omitting type uses default 'string'
```

## 6. Practice Exercises

### Exercise 1: The generic DOM default

**Problem:** In the DOM, `document.querySelector<E>()` is a generic function. If you just call `document.querySelector(".btn")` without providing a generic, what do you think the Default Type is set to under the hood?

**Expected output:**
> [!check]- Answer
> ```text
> The default is `Element`.
> Under the hood, it looks something like: `querySelector<E extends Element = Element>(selector: string): E | null`
> This ensures that if you don't provide a specific type (like HTMLButtonElement), it safely falls back to the generic `Element` interface.
> ```
> - What is the most basic building block of the DOM?

---



### Exercise 2: Generic Interface Default Parameters

**Problem:** Define `interface Response<T = unknown> { status: number; data: T }`.

**Expected output:**
> [!check]- Answer
> ```text
> Response interface with default generic created
> ```
> ```typescript
> interface Response<T = unknown> {
>   status: number;
>   data: T;
> }
> const res: Response = { status: 200, data: "raw string" };
> console.log("Response interface with default generic created");
> ```
>
> **Explanation:** Default generic parameters supply fallback types when callers omit generic arguments.

---

### Exercise 3: Default Generics in Functions

**Problem:** Define generic function `function createRef<T = HTMLDivElement>(): T | null`.

**Expected output:**
> [!check]- Answer
> ```text
> HTMLDivElement | null
> ```
> ```typescript
> function createRef<T = HTMLDivElement>(): T | null {
>   return null;
> }
> console.log("HTMLDivElement | null");
> ```
>
> **Explanation:** Generic defaults in functions provide convenient default return and parameter types.

## 7. Related Terms
- [Optional & Default Parameters](../level_04/optional_default_parameters.md) — The runtime equivalent of this compile-time feature.
- [Generic Constraints (`extends`)](generic_constraints.md) — The other modifier applied inside `<...>`.
- [Generics Overview (`<T>`)](generics.md) — Related concept: Generics Overview (`<T>`).

---

## 8. Key Takeaways
- **Generic Defaults** (`<T = DefaultType>`) provide a fallback type if the user doesn't explicitly provide one.
- It dramatically improves developer experience (DX) by removing the need to repeatedly type obvious or generic shapes.
- Generics with defaults must always appear at the end of the Generic list (after all required generics).
- You can safely combine Constraints and Defaults: `<T extends Constraint = Default>`.
