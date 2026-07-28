# Static Typing vs Dynamic Typing

> **Level 1 — Core Concepts & Environment Setup**
> The two fundamental paradigms of how programming languages handle data types (like strings, numbers, and objects). JavaScript is Dynamically Typed; TypeScript enforces Static Typing.

---

## 1. Prerequisites
- [TypeScript](../level_01/typescript.md) — The language that brings Static Typing to the web.

---

## 2. Term Category
- **Computer Science Theory / Language Paradigm**

---

## 3. Environment Context
- **Compile-Time vs Runtime**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Spot the paradigm

**Problem:** Is Python statically or dynamically typed? What about Java?

**Expected output:**
> [!check]- Answer
> ```text
> Python is dynamically typed (like JavaScript). You can reassign a string to a number variable.
> Java is statically typed (like TypeScript). You must declare `int x = 5;` and it can never be a string.
> ```
> - Think about whether you have to declare variable types in Python.

---



### Exercise 2: Static vs Dynamic Typing Identification

**Problem:** Identify whether type checking occurs at Compile-Time (Static) or Runtime (Dynamic).

**Expected output:**
> [!check]- Answer
> ```text
> Static: Compile-Time, Dynamic: Runtime
> ```
> ```typescript
> console.log("Static: Compile-Time, Dynamic: Runtime");
> ```
>
> **Explanation:** Static typing verifies types during compilation; dynamic typing checks types during execution.

---

### Exercise 3: Type Error Detection Timing

**Problem:** Explain why `"hello".toUpperCase()` typo in static TS is caught in editor vs dynamic JS in browser.

**Expected output:**
> [!check]- Answer
> ```text
> Caught immediately in editor at build time
> ```
> ```typescript
> console.log("Caught immediately in editor at build time");
> ```
>
> **Explanation:** Static type analyzers flag missing methods immediately during development.

## 7. Related Terms
- [Type Inference](../level_01/type_inference.md) — How TypeScript gives you Static Typing without forcing you to manually type everything.
- [TypeScript](../level_01/typescript.md) — The language implementation.

---

## 8. Key Takeaways
- **Dynamic Typing** (JavaScript): Types are checked while the program is running. Variables can change types freely. Very flexible, highly error-prone.
- **Static Typing** (TypeScript): Types are checked by the compiler before the program runs. Variables are locked to a specific type. Extremely safe, requires more boilerplate.
- Static Typing moves bugs from Runtime (Browser Crashes) to Compile-Time (Editor red squiggles).
