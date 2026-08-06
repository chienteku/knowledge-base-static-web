# Static Typing vs Dynamic Typing

> **Level 1 — Core Concepts & Environment Setup**
> The two fundamental paradigms of how programming languages handle data types (like strings, numbers, and objects). JavaScript is Dynamically Typed; TypeScript enforces Static Typing.

---

## 1. Prerequisites
- [TypeScript](typescript.md) — The language that brings Static Typing to the web.

---

## 2. Term Category

**Type System Fundamental** (Static vs Dynamic Typing Paradigm): Static vs Dynamic typing contrasts compile-time type checking in TypeScript against runtime type evaluation in JavaScript.



---

## 3. Explanation

### Environment Context
- **Compile-Time vs Runtime**

### (1) Dynamic Typing (JavaScript)
In a dynamically typed language, variables don't have types; only values have types. The type is checked **at Runtime** (when the code is actually executing).
```javascript
let score = 100;      // Currently a Number
score = "You won!";   // Now it's a String! JavaScript doesn't care.
score.push(5);        // Trying to treat a String like an Array.
// ^^^ The editor thinks this is fine. The program crashes violently at Runtime.
```
**Pros:** Very fast to write prototypes. Highly flexible.
**Cons:** Incredibly dangerous in large codebases. Bugs are only found when the code executes, often by angry end-users.

### (2) Static Typing (TypeScript)
In a statically typed language, variables are bound to a specific type **at Compile-Time** (while you are writing the code). Once a variable is declared as a `number`, it can never be anything else.
```typescript
let score: number = 100;
score = "You won!"; // ❌ ERROR in your IDE: Type 'string' is not assignable to type 'number'.
```
**Pros:** Catches 80% of trivial bugs before you even run the code. Creates massive self-documenting codebases where autocomplete actually works.
**Cons:** Requires writing more code. Sometimes fighting the compiler to prove your code is safe can be tedious.

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Fighting the Compiler instead of listening to it

**The mistake:** A developer migrating from JavaScript to TypeScript gets a red squiggly error: `Object is possibly undefined`. Frustrated because they "know" the object is there, they slap a `@ts-ignore` or an `any` type on it just to make the red line go away.

**Why it's wrong:** The Static Type checker is there to help you. If it says something might be undefined, there is a very real edge case where it *is* undefined, and your code will crash in production.
**Golden Rule:** Never ignore the compiler. If it says something might be undefined, write an `if (object) { ... }` check! Embrace the static typing.

---



### Mistake 2: Assuming Static Type Checking Prevents Runtime Dynamic Coercion Bugs

**The mistake:** Relying on TypeScript static types to catch dynamic JS coercion like `"5" - 1` when data comes from dynamic sources.

**Why it's wrong:** TypeScript static types operate purely at compile time. At runtime, raw JavaScript evaluation semantics and dynamic coercions take effect.

*Incorrect:*
```typescript
const val: any = "5";
const res: number = val - 1; // Compiles, but val could be unexpected type at runtime!
```

*Fix:*
```typescript
const val: unknown = "5";
if (typeof val === "number") {
    const res: number = val - 1;
}
```

### Mistake 3: Confusing Compile-Time Type Annotations with Runtime Type Checks

**The mistake:** Writing `if (typeof x === 'User')` attempting to check custom TypeScript interfaces at runtime.

**Why it's wrong:** Interfaces and type aliases are erased during compilation. `typeof` at runtime only recognizes primitive JS strings (`"string"`, `"number"`, `"object"`, etc.).

*Incorrect:*
```typescript
interface User { id: number; }
// if (typeof x === "User") {} // ❌ ReferenceError: User is not defined at runtime
```

*Fix:*
```typescript
interface User { id: number; }
function isUser(obj: any): obj is User {
    return typeof obj === "object" && obj !== null && "id" in obj;
}
```

## 5. Practice Exercises

### Exercise 1: Catching Runtime Type Errors at Compile Time

**Scenario:**
Identify a runtime type crash caused by calling a non-existent method on a string, and fix it using static type annotations.

**Requirements:**
1. Annotate function parameters explicitly.
2. Prevent compile-time property access errors.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function formatUsername(name: string): string {
>   // Static type checking prevents calling string.toFixed() at compile time!
>   return name.trim().toLowerCase();
> }
> 
> formatUsername("  Alice  ");
> ```
> 
> #### Technical Explanation
>
> 1. Static typing checks type compatibility and valid method signatures during compilation (`tsc`).
> 2. Dynamic typing defers type checking to runtime, leading to uncaught `TypeError: name.toFixed is not a function` crashes.
> 3. Eliminates entire classes of runtime type errors before code deployment.
> 
---

### Exercise 2: Defining Strict Function Return Contracts

**Scenario:**
Define a function calculating total order prices with explicit return type contracts.

**Requirements:**
1. Type input parameters and return value.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function calculateTotal(price: number, quantity: number): number {
>   return price * quantity;
> }
> 
> const total: number = calculateTotal(29.99, 3);
> ```
> 
> #### Technical Explanation
>
> 1. Explicit parameter types (`number`) enforce valid caller input data.
> 2. Return type annotations (`: number`) verify that function return expressions conform to expected interface contracts.
> 3. Makes code self-documenting for IDE autocomplete and developer tooling.
> 
---

### Exercise 3: Comparative Analysis: Static vs Dynamic Typing

**Scenario:**
Formulate an architectural comparison matrix contrasting Static Typing (TypeScript) against Dynamic Typing (JavaScript).

**Requirements:**
1. Contrast compilation stage, error detection timing, tooling support, and execution performance.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Static vs Dynamic Typing Matrix:
> - Static Typing (TypeScript): Type checking occurs at compile-time. Catches typos and shape errors early, enables IDE autocomplete, compiles down to plain JS.
> - Dynamic Typing (JavaScript): Type checking occurs at runtime. Flexible, but errors manifest as runtime exceptions during execution.
> ```
> 
> #### Technical Explanation
>
> 1. Static typing adds a compilation step (`tsc`) to validate type soundness.
> 2. TypeScript types are erased completely during compilation, producing plain JavaScript output.
> 3. Zero runtime performance overhead from type annotations.
> 
---



## 6. Related Terms
- [Type Inference](type_inference.md) — How TypeScript gives you Static Typing without forcing you to manually type everything.
- [TypeScript](typescript.md) — The language implementation.

---

## 7. Key Takeaways
- **Dynamic Typing** (JavaScript): Types are checked while the program is running. Variables can change types freely. Very flexible, highly error-prone.
- **Static Typing** (TypeScript): Types are checked by the compiler before the program runs. Variables are locked to a specific type. Extremely safe, requires more boilerplate.
- Static Typing moves bugs from Runtime (Browser Crashes) to Compile-Time (Editor red squiggles).
