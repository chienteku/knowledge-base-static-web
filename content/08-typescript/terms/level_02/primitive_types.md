# Primitive Types

> **Level 2 — Basic Types**
> The foundational building blocks of the TypeScript type system, directly mirroring the primitive values found in standard JavaScript: `string`, `number`, and `boolean`.

---

## 1. Prerequisites
- [JavaScript Data Types](../../../03-javascript/terms/level_01/primitive_types.md) — The runtime types these annotations protect.

---

## 2. Term Category
- **TypeScript Type Annotation**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, a variable can hold text, a numerical value, or a true/false flag. Because JS is dynamically typed, it's very easy to accidentally attempt math on a piece of text (`"5" * 10`), resulting in the dreaded `NaN`.
TypeScript provides **Primitive Types** (`string`, `number`, `boolean`) to strictly lock a variable into one of these fundamental formats, ensuring you never perform invalid operations.

### (2) The Three Core Primitives
The syntax for annotating a type is a colon `:` followed by the type name.
```typescript
const username: string = "Alice";
const age: number = 28; // Handles both integers and floats (28.5)
const isActive: boolean = true;
```

### (3) Redundancy vs Explicitness
Because of [Type Inference](../level_01/type_inference.md), typing initialized primitives is generally considered a bad practice in modern TypeScript.
```typescript
// ❌ BAD: Redundant. The compiler already knows "Alice" is a string.
const name: string = "Alice";

// ✅ GOOD: Clean and inferred.
const name = "Alice";

// ✅ GOOD: Explicitly needed because we aren't initializing the value yet.
let dynamicName: string;
dynamicName = "Bob";
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Capitalized Primitive Types

**The mistake:** A developer coming from Java writes `const age: Number = 5;` or `const name: String = "Alice";`.

**Why it's wrong:** In TypeScript, `String`, `Number`, and `Boolean` (with a capital letter) refer to the rare, built-in JavaScript wrapper *objects*, NOT the primitive values!
`const name: String = new String("Alice")` (You should almost never do this in JS).
**Golden Rule:** Always use lowercase `string`, `number`, and `boolean` for type annotations.

---



### Mistake 2: Using Wrapper Objects (`String`, `Number`, `Boolean`) instead of Primitives (`string`, `number`, `boolean`)

**The mistake:** Annotating variables with boxed Object types `: String` or `: Number`.

**Why it's wrong:** Capitalized `String` and `Number` refer to JS wrapper objects, NOT primitive types. Always use lowercase `string`, `number`, `boolean`.

*Incorrect:*
```typescript
let name: String = "Alice"; // ❌ Refers to Object wrapper, not primitive string
```

*Fix:*
```typescript
let name: string = "Alice"; // Correct primitive type annotation
```

### Mistake 3: Mixing `bigint` and `number` Primitives in Arithmetic Expressions

**The mistake:** Performing arithmetic `10n + 5` combining `bigint` and `number`.

**Why it's wrong:** JavaScript and TypeScript disallow mixing `bigint` and `number` primitives without explicit conversion.

*Incorrect:*
```typescript
const sum = 10n + 5; // ❌ Cannot mix BigInt and other types
```

*Fix:*
```typescript
const sum = 10n + BigInt(5);
```

## 6. Practice Exercises

### Exercise 1: BigInt and Symbol

**Problem:** You need to work with a massive number that exceeds JavaScript's standard number limit, so you use ES2020's `BigInt`. How do you type this in TypeScript?

**Expected output:**
```typescript
const hugeNumber: bigint = 9007199254740991n;
// Notice it is lowercase `bigint`!
// (You must configure your tsconfig.json `target` to "ES2020" for this to work).
```

> [!check]- Answer
> - Does `BigInt` have a primitive type in TS?

---



### Exercise 2: Primitive Type Annotations

**Problem:** Annotate variables `age` (25), `isStudent` (true), `symbolKey` (Symbol()).

**Expected output:**
```text
age: number, isStudent: boolean, symbolKey: symbol
```

> [!check]- Answer
> ```typescript
> const age: number = 25;
> const isStudent: boolean = true;
> const symbolKey: symbol = Symbol();
> console.log("age: number, isStudent: boolean, symbolKey: symbol");
> ```
>
> **Explanation:** Lowercase annotations represent core JavaScript primitive data types.

### Exercise 3: BigInt Type Usage

**Problem:** Annotate a 64-bit integer literal `100n` using primitive `bigint`.

**Expected output:**
```text
100n: bigint
```

> [!check]- Answer
> ```javascript
> const big: bigint = 100n;
> console.log("100n: bigint");
> ```
>
> **Explanation:** `bigint` primitive type handles arbitrary precision integers ending with `n`.

## 7. Related Terms
- [Type Inference](../level_01/type_inference.md) — Why you rarely need to write primitive type annotations.
- [Arrays & Tuples](../level_02/arrays_tuples.md) — How to group primitives together.

---

## 8. Key Takeaways
- **Primitive Types** in TypeScript map exactly to JavaScript primitives.
- The core three are `string`, `number`, and `boolean` (always lowercase!).
- Never use the capitalized Object wrapper equivalents (`String`, `Number`, `Boolean`).
- Avoid explicitly writing primitive types if the variable is initialized immediately; trust Type Inference instead.
