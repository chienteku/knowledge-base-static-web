# Exhaustiveness Checking (`never`)

> **Level 6 — Type Narrowing & Guards**
> A pattern that leverages the `never` type to force the compiler to verify that all possible members of a Union type have been explicitly handled in control flow blocks (like `switch` or `if/else`).

---

## 1. Prerequisites
- [Discriminated Unions](discriminated_unions.md) — Objects with a shared literal tag.
- [`void` & `never`](../level_02/void_never.md) — The type representing unreachable states.

---

## 2. Term Category
- **Type System Fundamental**

---

## 3. Environment Context
- **Build-time** (The verification checks occur during compilation, translating to safety exceptions at runtime if checks fail).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing applications, you often write code that branches based on a type category—such as resolving payment options (`'card' | 'paypal'`), processing user permissions (`'admin' | 'editor'`), or handling action types in state reducers.

Typically, you write a `switch` statement to handle each case. However, as applications grow, team members add new options to these types (for example, adding `'apple-pay'` to payment options). 

If you forget to find and update every single `switch` statement in the codebase to handle this new type, the application will silently skip the new case, resulting in runtime errors, empty screens, or corrupt database states.

**Exhaustiveness Checking** provides a compile-time safeguard. It turns a silent runtime omission into an immediate build-time error, forcing developers to implement handling for the new option before they can build the code.

### (2) Core Mechanics
Exhaustiveness checking utilizes the fact that TypeScript narrows down union members as you check them.

If you have a variable representing a union of `Circle | Square`, and you handle the `Circle` case in one branch and the `Square` case in another, there are no possible types left. If you open a `default` or `else` block, the type of the variable is narrowed to **`never`** (since it can literally never be anything else).

We can write a utility function that accepts only `never`:
```typescript
function assertUnreachable(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
```

If we pass our variable into `assertUnreachable(val)` inside the `default` block:
- **If all cases are handled:** the variable is `never`, the call compiles.
- **If a case is missing (e.g. `Triangle`):** the variable is typed as `Triangle` inside the `default` block. The compiler throws an error because you cannot pass `Triangle` to a function expecting `never`!

```mermaid
graph TD
    A[Union Type: A | B | C] --> B{Switch Case}
    B -- case A --> C[Handle A]
    B -- case B --> D[Handle B]
    B -- default --> E{Is C handled?}
    E -- Yes --> F[Variable is never - OK]
    E -- No --> G[Variable is C - Compile Error!]
```

### (3) Code Examples

#### Short Snippet
```typescript
interface Circle { kind: 'circle'; radius: number; }
interface Square { kind: 'square'; side: number; }
// Add a new shape to the union
interface Triangle { kind: 'triangle'; base: number; height: number; }

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape) {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'square': return shape.side ** 2;
    // Bug: Triangle is unhandled!
    default:
      // Error: Argument of type 'Triangle' is not assignable to parameter of type 'never'
      return assertUnreachable(shape); 
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Relying on standard `default` blocks without `never` validation

**The mistake:** Adding a generic `default` fallback (e.g. `return 0` or doing nothing) instead of executing an exhaustiveness assertion.

**Why it's wrong:** While it satisfies the compiler, it hides omissions. When a new union option is added, it will silently trigger the fallback instead of warning the developer that code must be written for the new case.

*Incorrect:*
```typescript
type Status = 'success' | 'pending' | 'failed';

function notifyUser(status: Status) {
  switch (status) {
    case 'success': sendEmail('Done'); break;
    case 'failed': sendEmail('Error'); break;
    default:
      // If 'pending' is introduced, we do nothing. No build warning!
      break; 
  }
}
```

*Fix:* Add the assertion to force type safety when status types are updated.
```typescript
function notifyUser(status: Status) {
  switch (status) {
    case 'success': sendEmail('Done'); break;
    case 'failed': sendEmail('Error'); break;
    case 'pending': sendEmail('Loading'); break;
    default:
      assertUnreachable(status); // Safe compile guard
  }
}
```

**Golden Rule:** Always terminate dynamic union matching conditions (switches, if-else structures) with an explicit `never` assertion check inside the final fallback.

---



### Mistake 2: Omitting Exhaustiveness Checks when Adding New Variants to Unions

**The mistake:** Adding `| { kind: "triangle" }` to `Shape` union without default `never` checking in `area()` function.

**Why it's wrong:** Without an exhaustiveness check, unhandled union variants pass quietly during compilation, returning `undefined` at runtime.

*Incorrect:*
```typescript
type Action = { type: "login" } | { type: "logout" } | { type: "register" };
function handle(a: Action) {
    if (a.type === "login") return;
    if (a.type === "logout") return;
    // Missing register! Returns undefined silently.
}
```

*Fix:*
```typescript
function handle(a: Action) {
    switch(a.type) {
        case "login": return;
        case "logout": return;
        case "register": return;
        default:
            const _check: never = a; // ❌ Fails compilation if new Action variants are added!
            return _check;
    }
}
```

### Mistake 3: Returning Default Fallback Values in Place of Exhaustive `never` Checks

**The mistake:** Returning `return null` in default switch cases, hiding unhandled union variants.

**Why it's wrong:** Returning fallback values masks unhandled variants instead of flagging missing logic at build time.

*Incorrect:*
```typescript
switch(shape.kind) {
    case "circle": return 1;
    default: return 0; // Masks missing square variant!
}
```

*Fix:*
```typescript
switch(shape.kind) {
    case "circle": return 1;
    case "square": return 2;
    default:
        const _exhaustive: never = shape;
        throw new Error(`Unhandled shape: ${_exhaustive}`);
}
```

## 6. Practice Exercises

### Exercise 1: State Transition Security

**Problem:** You are building a payment transition handler. A new state `'refunded'` has been added to the `PaymentState` union. The compiler is flagging an error. Implement the missing switch case to fix the compiler error.

```typescript
type PaymentState = 'processing' | 'completed' | 'failed' | 'refunded';

function handlePayment(state: PaymentState) {
  switch (state) {
    case 'processing':
      console.log('Hold on...');
      break;
    case 'completed':
      console.log('Paid!');
      break;
    case 'failed':
      console.log('Failed transaction');
      break;
    default:
      // Error: 'refunded' is not assignable to 'never'
      const check: never = state;
      throw new Error(`Unknown state: ${check}`);
  }
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The compilation passes after adding:
> case 'refunded':
>   console.log('Money returned');
>   break;
> ```
> - The compiler checks if any possible payment states enter the `default` block.
> - Adding a `case 'refunded'` handles the final state, so the type of `state` inside `default` successfully falls back to `never`.

---



### Exercise 2: Implementing Custom `assertNever` Helper

**Problem:** Write `function assertNever(x: never): never { throw new Error("Unexpected: " + x); }`.

**Expected output:**
> [!check]- Answer
> ```text
> assertNever helper created
> ```
> ```typescript
> function assertNever(x: never): never {
>   throw new Error(`Unexpected object: ${x}`);
> }
> console.log("assertNever helper created");
> ```
>
> **Explanation:** `assertNever` verifies that all union variants have been handled at compile time.

---

### Exercise 3: Exhaustiveness Compiler Diagnostics

**Problem:** What compile error occurs when passing an unhandled union member to `assertNever(x)`?

**Expected output:**
> [!check]- Answer
> ```text
> Argument of type 'T' is not assignable to parameter of type 'never'
> ```
> ```typescript
> console.log("Argument of type 'T' is not assignable to parameter of type 'never'");
> ```
>
> **Explanation:** TS flags unhandled variants because non-never types cannot be assigned to `never`.

## 7. Related Terms
- [Discriminated Unions](discriminated_unions.md) — The type format that exhaustiveness checks protect.
- [`void` & `never`](../level_02/void_never.md) — The structural types representing emptiness.
- [Type Narrowing](type_narrowing.md) — The process of reducing union types.

---

## 8. Key Takeaways
- **Exhaustiveness Checking** triggers build-time warnings if you omit cases when matching union members.
- Utilizes type narrowing: if all cases are matched, the remaining types evaluate to `never`.
- Triggered by assigning the default state to a `never` variable or passing it to `assertUnreachable(value: never)`.
- Critical for maintaining large codebases, preventing silent bugs when union structures expand.
- Essential for state machines, reducers, and transaction processors.
