# Enums

> **Level 11 — Modules, Declaration Files & Configuration**
> A feature that allows you to define a set of named constants. It is one of the very few features in TypeScript that actually creates code at runtime, rather than just being erased at compile-time.

---

## 1. Prerequisites
- [Literal Types](../level_05/literal_types.md) — The modern alternative to Enums.
- [Union Types (`|`)](../level_05/union_types.md) — Usually combined with Literal Types to replace Enums.
- [Primitive Types](../level_02/primitive_types.md) — TypeScript numeric and string enum declarations.

---

## 2. Term Category

**TypeScript Core Syntax** (Named Constant Value Enumerations): Enums (`enum`) define sets of named numeric or string constants with bi-directional or unidirectional value mappings.



---

## 3. Explanation

### Environment Context
- **Compile-Time & Runtime**

### (1) Design Motivation — "Why did we design this?"
In languages like C# and Java, Enums are heavily used to group related constants together (e.g., `Direction.Up`, `Direction.Down`).
Early in TypeScript's life, JavaScript did not have a good way to represent this, so TS added the `enum` keyword. It gives you a clean way to organize strict groups of options, rather than passing around magic numbers (`1`, `2`, `3`) or magic strings (`"UP"`, `"DOWN"`).

### (2) Numeric Enums
By default, Enums are zero-indexed numbers.

```typescript
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

// You can use the Enum as a Type AND as a Value!
function move(dir: Direction) {
  if (dir === Direction.Up) { console.log("Moving Up!"); }
}

move(Direction.Left);
```

### (3) String Enums
Because debugging numbers is hard (what does `status === 2` mean?), String Enums are vastly preferred. You manually assign the string value.

```typescript
enum Status {
  Loading = "LOADING",
  Success = "SUCCESS",
  Error = "ERROR"
}

console.log(Status.Success); // Prints "SUCCESS"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using Enums in modern TypeScript

**The mistake:** A developer writes a massive new project using `enum` for every set of constants.

**Why it's controversial:** The modern TypeScript community heavily discourages the use of `enum`. 
1. **They pollute the runtime:** Unlike Interfaces or Types, Enums are *not* erased at compile-time. They compile into bulky, confusing IIFE (Immediately Invoked Function Expressions) in your final JavaScript bundle.
2. **Numeric Enums are unsafe:** In TS (prior to 5.0), you could pass *any* number into a function expecting a numeric enum. `move(99)` was valid!
**Golden Rule:** The modern alternative is to use a Union of Literal Types: `type Direction = "Up" | "Down" | "Left" | "Right"`. It provides identical type safety, better autocomplete, and completely disappears at compile-time (zero bundle size cost). 
If you must iterate over the values, use a standard `const` object: `const Direction = { Up: "Up", Down: "Down" } as const;`.

---



### Mistake 2: Using Numeric Enums without Realizing They Allow Unsafe Number Assignments

**The mistake:** Declaring `enum Status { OK, FAIL }` expecting `Status` to reject invalid number `999`.

**Why it's wrong:** Numeric enums permit assigning ANY arbitrary number value for reverse mapping compatibility, bypassing safety checks.

*Incorrect:*
```typescript
enum Status { OK, FAIL }
const s: Status = 999; // 💥 Compiles without error despite 999 being invalid!
```

*Fix:*
```typescript
enum Status { OK = "OK", FAIL = "FAIL" } // String enums enforce strict literal value safety
```

### Mistake 3: Overusing Standard Enums when Union Types or `as const` Objects Suffice

**The mistake:** Creating heavy numeric Enums that emit verbose JavaScript IIFE objects.

**Why it's wrong:** Standard enums generate runtime JS objects. Union literal types or `const` objects (`as const`) generate zero extra runtime overhead.

*Incorrect:*
```typescript
enum Direction { Up, Down } // Emits IIFE lookup object in compiled JS
```

*Fix:*
```typescript
type Direction = "Up" | "Down"; // Zero JS runtime code overhead
```

## 5. Practice Exercises

### Exercise 1: Numeric vs String Enums

**Scenario:**
Create a numeric enum `Direction` and a string enum `LogLevel`.

**Requirements:**
1. Define numeric enum `Direction` (`Up`, `Down`).
2. Define string enum `LogLevel` (`INFO = "INFO"`).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Numeric Enum (auto-incrementing 0, 1, 2...):
> enum Direction {
>   Up,    // 0
>   Down,  // 1
>   Left,  // 2
>   Right  // 3
> }
> 
> // String Enum:
> enum LogLevel {
>   Info = "INFO",
>   Warn = "WARN",
>   Error = "ERROR"
> }
> 
> console.log(Direction.Up);   // 0
> console.log(LogLevel.Info);  // "INFO"
> ```
> 
> #### Technical Explanation
>
> 1. Numeric enums automatically assign auto-incrementing integer values starting from 0.
> 2. String enums require explicit string value initializers for each member.
> 3. String enums produce readable values in debugging output and log files.
> 
---

### Exercise 2: Inlining Enums with `const enum`

**Scenario:**
Optimize transpiled JavaScript bundle size using `const enum`.

**Requirements:**
1. Define `const enum Status { Active, Inactive }`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // TypeScript Source:
> const enum Status {
>   Active = 1,
>   Inactive = 0
> }
> 
> const currentStatus = Status.Active;
> ```
> 
> ```javascript
> // Transpiled Output (JS):
> const currentStatus = 1; // Inlined completely! No enum object generated!
> ```
> 
> #### Technical Explanation
>
> 1. `const enum` instructs `tsc` to inline enum member values directly at call sites during compilation.
> 2. Does NOT generate a runtime JavaScript object, saving memory and bundle size.
> 3. Cannot be used when reverse mapping or dynamic enum iteration is required.
> 
---

### Exercise 3: Auditing Numeric Enum Reverse Mapping Security

**Scenario:**
Explain why numeric enums generate bi-directional reverse mappings in JavaScript output while string enums do not.

**Requirements:**
1. Show JS output for numeric vs string enums.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Numeric Enum JS Output:
> var Direction;
> (function (Direction) {
>     Direction[Direction["Up"] = 0] = "Up"; // Creates Direction[0] = "Up" AND Direction["Up"] = 0!
> })(Direction || (Direction = {}));
> 
> Direction[0]; // Returns "Up" (Reverse Mapping)
> ```
> 
> #### Technical Explanation
>
> 1. Numeric enums create bi-directional mappings (`Enum[0]` returns `"Up"` and `Enum["Up"]` returns `0`).
> 2. Reverse mapping allows converting numeric status codes back into human-readable member names at runtime.
> 3. String enums do NOT generate reverse mappings.
> 
---

## 6. Related Terms
- [Literal Types](../level_05/literal_types.md) — The modern replacement for Enums.
- [Const Assertions (`as const`)](const_assertions.md) — Used with standard JS objects to replace Enums.

---

## 7. Key Takeaways
- **Enums** allow you to group named constants together.
- They can be Numeric (default, auto-incrementing from 0) or String-based.
- They act as both a **Type** and a **Value**.
- Unlike most TS features, standard Enums are NOT erased at compile-time; they generate real JS code.
- Modern TS developers generally avoid `enum` in favor of Literal Type Unions (`"UP" | "DOWN"`) because they are safer and have zero runtime cost.
