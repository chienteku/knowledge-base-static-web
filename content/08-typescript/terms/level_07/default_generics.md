# Generic Default Types (`=`)

> **Level 7 — Generics**
> A way to provide a fallback Type for a Generic `<T>`. If the developer using your generic interface/function doesn't provide a type, it will automatically fall back to this default.

---

## 1. Prerequisites
- [Generic Interfaces & Classes](generic_interfaces_classes.md) — Where defaults are most commonly used.
- [Optional & Default Parameters](../level_04/optional_default_parameters.md) — The exact same concept, but for data instead of Types.

---

## 2. Term Category

**TypeScript Advanced Type** (Default Generic Parameter Subsitutions): Default generic parameters (`<T = string>`) provide fallback type arguments when generic callers omit explicit type parameters.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Providing Default Generic Type Parameters

**Scenario:**
Create a generic `ApiResponse<T = string>` interface where `T` defaults to `string` if not explicitly specified.

**Requirements:**
1. Declare `<T = string>` in `ApiResponse`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface ApiResponse<T = string> {
>   data: T;
>   status: number;
> }

// T defaults to string:
const res1: ApiResponse = { data: "Operation Successful", status: 200 };

// T explicitly specified as number[]:
const res2: ApiResponse<number[]> = { data: [10, 20, 30], status: 200 };
```

> #### Technical Explanation
>
> 1. Default generic type parameters (`<T = DefaultType>`) supply a default type argument when callers omit explicit generic types.
> 2. Reduces boilerplate when a specific type parameter is used in the vast majority of cases.
> 3. Standard library design pattern for generic interfaces.

---

### Exercise 2: Combining Default Generics with Generic Constraints

**Scenario:**
Combine a generic constraint with a default type parameter `<T extends HTMLElement = HTMLDivElement>`.

**Requirements:**
1. Declare `<T extends HTMLElement = HTMLDivElement>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type ElementWrapper<T extends HTMLElement = HTMLDivElement> = {
>   element: T;
>   render: () => void;
> };

// Defaults to HTMLDivElement:
const divWrapper: ElementWrapper = {
  element: document.createElement("div"),
  render: () => console.log("Rendering div")
};

// Explicitly specified as HTMLButtonElement:
const btnWrapper: ElementWrapper<HTMLButtonElement> = {
  element: document.createElement("button"),
  render: () => console.log("Rendering button")
};
```

> #### Technical Explanation
>
> 1. `T extends Constraint = DefaultType` ensures that `T` MUST satisfy `Constraint` while providing a default fallback.
> 2. The default type (`HTMLDivElement`) must be assignable to the constraint (`HTMLElement`).
> 3. High-level generic component design pattern.

---

### Exercise 3: Default Parameter Ordering Rules Audit

**Scenario:**
Explain why generic type parameters with defaults must follow required generic parameters without defaults.

**Requirements:**
1. Demonstrate invalid generic parameter order `<T = string, U>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ Compile Error: Required type parameter cannot follow an optional type parameter!
> // type Invalid<T = string, U> = { t: T; u: U };

// ✅ CORRECT (Required parameters come FIRST):
type Valid<U, T = string> = { u: U; t: T };
```

> #### Technical Explanation
>
> 1. Generic type parameters evaluate positionally from left to right.
> 2. Optional generic parameters with defaults (`T = string`) must follow all required generic parameters without defaults (`U`).
> 3. Enforces consistent positional generic resolution.

---



## 6. Related Terms
- [Optional & Default Parameters](../level_04/optional_default_parameters.md) — The runtime equivalent of this compile-time feature.
- [Generic Constraints (`extends`)](generic_constraints.md) — The other modifier applied inside `<...>`.
- [Generics Overview (`<T>`)](generics.md) — Related concept: Generics Overview (`<T>`).

---

## 7. Key Takeaways
- **Generic Defaults** (`<T = DefaultType>`) provide a fallback type if the user doesn't explicitly provide one.
- It dramatically improves developer experience (DX) by removing the need to repeatedly type obvious or generic shapes.
- Generics with defaults must always appear at the end of the Generic list (after all required generics).
- You can safely combine Constraints and Defaults: `<T extends Constraint = Default>`.
