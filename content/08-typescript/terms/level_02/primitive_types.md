# Primitive Types

> **Level 2 — Basic Types**
> The foundational building blocks of the TypeScript type system, directly mirroring the primitive values found in standard JavaScript: `string`, `number`, and `boolean`.

---

## 1. Prerequisites
- [Primitive Types](../../../03-javascript/terms/level_01/primitive_types.md) — The runtime types these annotations protect.

---

## 2. Term Category

**Type System Fundamental** (Built-in Primitive Data Types): Primitive types (`string`, `number`, `boolean`, `symbol`, `bigint`) represent fundamental un-boxed JavaScript primitive values.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Annotating JavaScript Primitive Data Types

**Scenario:**
Annotate primitive data types (`string`, `number`, `boolean`, `symbol`, `bigint`) in a user account record.

**Requirements:**
1. Use explicit primitive type annotations.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const username: string = "alex_dev";
> const userId: number = 10482;
> const isPremium: boolean = true;
> const uniqueId: symbol = Symbol("id");
> const accountBalance: bigint = 9007199254740991n;
> ```

> #### Technical Explanation
>
> 1. TypeScript primitive types correspond directly to JavaScript `typeof` primitive return values.
> 2. `bigint` handles arbitrary precision integers beyond `Number.MAX_SAFE_INTEGER`.
> 3. Lowercase primitive type annotations (`string`, `number`) must be used instead of boxed wrapper objects (`String`, `Number`).

---

### Exercise 2: Auditing Boxed Wrapper Object Anti-Patterns

**Scenario:**
Explain why using boxed wrapper types (`String`, `Number`, `Boolean`) instead of primitive types (`string`, `number`, `boolean`) is an anti-pattern.

**Requirements:**
1. Show type mismatch between `String` object and `string` primitive.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ INCORRECT (Using boxed Object wrappers):
> // let title: String = "Hello";
> // let rawString: string = title; // FAILS under strict checks!

// ✅ CORRECT (Use lowercase primitive types):
let title: string = "Hello";
```

> #### Technical Explanation
>
> 1. `String`, `Number`, and `Boolean` refer to JavaScript boxed wrapper object instances (`new String()`), NOT primitives.
> 2. Primitive values (`"hello"`) are not assignable to object wrapper types in strict mode.
> 3. Always use lowercase primitive type keywords in TypeScript annotations.

---

### Exercise 3: Type Checking Primitives with `typeof`

**Scenario:**
Narrow a primitive union parameter `string | number` using `typeof` type guards.

**Requirements:**
1. Use `typeof` operator inside an `if` block.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function formatInput(val: string | number): string {
>   if (typeof val === "string") {
>     return val.trim().toUpperCase(); // val narrowed to string
>   }
>   return val.toFixed(2); // val narrowed to number
> }
> ```

> #### Technical Explanation
>
> 1. `typeof` expressions act as TypeScript control-flow type guards.
> 2. Automatically narrows union types to specific primitive branches inside `if` blocks.
> 3. Safe pattern for handling primitive union arguments.

---



## 6. Related Terms
- [Type Inference](../level_01/type_inference.md) — Why you rarely need to write primitive type annotations.
- [Arrays & Tuples](arrays_tuples.md) — How to group primitives together.
- [`null`, `undefined` & `strictNullChecks`](null_undefined_strict.md) — Related concept: `null`, `undefined` & `strictNullChecks`.

---

## 7. Key Takeaways
- **Primitive Types** in TypeScript map exactly to JavaScript primitives.
- The core three are `string`, `number`, and `boolean` (always lowercase!).
- Never use the capitalized Object wrapper equivalents (`String`, `Number`, `Boolean`).
- Avoid explicitly writing primitive types if the variable is initialized immediately; trust Type Inference instead.
