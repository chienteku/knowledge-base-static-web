# Type Narrowing

> **Level 6 — Type Narrowing & Guards**
> The process where TypeScript's static analysis engine follows your logic (like `if` statements) to logically deduce a more specific type from a broader type (like a Union or `unknown`).

---

## 1. Prerequisites
- [`unknown`](../level_02/unknown.md) — Another broad type that strictly requires narrowing before use.

---

## 2. Term Category

**Type System Fundamental** (Control-Flow Type Narrowing Engine): Type narrowing is the process by which TypeScript's control-flow analysis refines broad union types into narrower, specific types based on guards.



---

## 3. Explanation

### Environment Context
- **Compile-Time Analysis of Runtime Code**

### (1) Design Motivation — "Why did we design this?"
If you declare a variable as `number | string`, you cannot call `.toUpperCase()` on it, because it might be a number.
But wait! If you write a standard JavaScript `if` statement to check if it's a string, obviously it's safe to call `.toUpperCase()` inside that `if` block, right?
Yes. The TypeScript compiler was designed with **Control Flow Analysis**. It actually reads your `if` statements, `switch` statements, and early `return`s. When it sees you prove a type using JavaScript logic, it **Narrows** the type inside that specific block of code.

### (2) How Narrowing Works
Narrowing is the bridge between Runtime JavaScript and Compile-Time TypeScript.

```typescript
function printLength(data: string | number) {
  // AT THIS LINE: `data` is (string | number)
  // console.log(data.length); // ❌ ERROR!

  if (typeof data === "string") {
    // AT THIS LINE: TS has narrowed `data` to strictly (string)
    console.log(data.length); // ✅ SUCCESS!
  } else {
    // AT THIS LINE: TS knows it wasn't a string. Therefore it MUST be a (number)
    console.log(data.toFixed(2)); // ✅ SUCCESS!
  }
}
```

### (3) Types of Type Guards
The actual JavaScript expressions used to trigger Type Narrowing are called **Type Guards**. The most common built-in guards are:
1. `typeof` (for primitives like string/number).
2. `instanceof` (for Classes).
3. The `in` operator (for checking if an object has a specific property).
4. Truthiness checks (e.g., `if (data)` to narrow away `null` or `undefined`).

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on generic variables for narrowing

**The mistake:** A developer assigns the result of a `typeof` check to a boolean variable, and then uses that boolean variable in the `if` statement.
```typescript
const isString = typeof data === "string";
if (isString) {
  data.toUpperCase(); // ❌ Error!
}
```

**Why it's wrong:** TypeScript's Control Flow Analysis is incredibly smart, but historically, it struggled to track type guards that were extracted into separate variables. 
**Golden Rule:** Always inline your Type Guards directly inside the `if` condition: `if (typeof data === "string")`. (Note: TS 4.4+ added "Aliased Conditions" to fix this for `const` variables, but inlining remains the safest and most readable approach).

---



### Mistake 2: Expecting Narrowing to Persist Across Asynchronous Callback Closures

**The mistake:** Expecting a narrowed variable `val: string | null` to remain `string` inside async `setTimeout` callbacks.

**Why it's wrong:** Between outer execution and async callback invocation, outer code might mutate `val` back to `null`! TS resets control flow narrowing inside closures.

*Incorrect:*
```typescript
let val: string | null = "hello";
if (val !== null) {
    setTimeout(() => {
        // val.toUpperCase(); // ❌ Object is possibly 'null' inside async closure!
    }, 100);
}
```

*Fix:*
```typescript
let val: string | null = "hello";
if (val !== null) {
    const safeVal = val; // Capture narrowed value in local const
    setTimeout(() => {
        safeVal.toUpperCase(); // Retains narrowed string type safely
    }, 100);
}
```

### Mistake 3: Confusing Equality Narrowing (`===`) with Truthiness Checks (`Boolean(x)`)

**The mistake:** Using `if (val)` truthiness check expecting it to narrow `number | null` without stripping `0`.

**Why it's wrong:** Truthiness check `if (val)` filters out falsy values like `0` or `""`, unintentionally skipping valid zero/empty values.

*Incorrect:*
```typescript
function printNum(n: number | null) {
    if (n) { console.log(n); } // ❌ Fails to print 0!
}
```

*Fix:*
```typescript
function printNum(n: number | null) {
    if (n !== null) { console.log(n); } // Correct: Preserves 0
}
```

## 5. Practice Exercises

### Exercise 1: Truthiness and Equality Type Narrowing

**Scenario:**
Narrow a parameter `str: string | null | undefined` using truthiness checks and equality comparison.

**Requirements:**
1. Perform truthiness check `if (str)`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function printUppercase(str: string | null | undefined) {
>   if (str != null) {
>     // Loose inequality != null removes BOTH null and undefined!
>     console.log(str.toUpperCase()); // str is narrowed to string
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. TypeScript control-flow analysis tracks runtime conditional branches to refine types.
> 2. Loose inequality `str != null` narrows out both `null` and `undefined`.
> 3. Ensures safe method invocation on primitive union types.
> 
---

### Exercise 2: Narrowing via Assignment and Control Flow Re-assignment

**Scenario:**
Demonstrate variable type narrowing across sequential assignment statements.

**Requirements:**
1. Re-assign `let x: string | number`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> let data: string | number;
> 
> data = "Hello";
> console.log(data.toUpperCase()); // Inferred as string!
> 
> data = 42;
> console.log(data.toFixed(2));    // Inferred as number!
> ```
> 
> #### Technical Explanation
>
> 1. Control-flow analysis tracks variable assignments in real time.
> 2. Assigning `"Hello"` narrows `data` to `string`; re-assigning `42` narrows `data` to `number`.
> 3. Dynamic type refinement based on local code execution order.
> 
---

### Exercise 3: Narrowing Failure Auditing in Asynchronous Callbacks

**Scenario:**
Explain why type narrowing performed BEFORE an asynchronous callback does NOT persist inside the callback body.

**Requirements:**
1. Demonstrate closure narrowing invalidation inside `setTimeout()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function asyncNarrowing(val: string | null) {
>   if (val !== null) {
>     setTimeout(() => {
>       // ❌ Compile error if val is mutable: val might have been modified by external code before timeout executes!
>       // console.log(val.toUpperCase());
>       
>       // ✅ FIX: Capture narrowed value in a local const variable!
>       const safeVal = val;
>       console.log(safeVal.toUpperCase());
>     }, 1000);
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. Mutable variables captured in closures can be modified asynchronously before the callback executes.
> 2. TypeScript invalidates narrowing on mutable variables inside async callbacks.
> 3. Assigning the narrowed value to a local `const` variable preserves type narrowing safely inside closures.
> 
---



## 6. Related Terms
- [`typeof` & `instanceof` Guards](typeof_instanceof.md) — The most common tools used to achieve narrowing.
- [Union Types (`|`)](../level_05/union_types.md) — The types that require narrowing.
- [`unknown`](../level_02/unknown.md) — Related concept: `unknown`.
- [`void` & `never`](../level_02/void_never.md) — Related concept: `void` & `never`.
- [Optional Properties (`?`)](../level_03/optional_properties.md) — Related concept: Optional Properties (`?`).
- [Non-null Assertion Operator (`!`)](../level_05/non_null_assertion.md) — Related concept: Non-null Assertion Operator (`!`).
- [Type Assertions (`as`)](../level_05/type_assertions.md) — Related concept: Type Assertions (`as`).
- [Assertion Functions (`asserts`)](assertion_functions.md) — Related concept: Assertion Functions (`asserts`).
- [Custom Type Guards (`is`)](custom_type_guards.md) — Related concept: Custom Type Guards (`is`).
- [Exhaustiveness Checking (`never`)](exhaustiveness_checking.md) — Related concept: Exhaustiveness Checking (`never`).
- [Discriminated Unions](discriminated_unions.md) — Discriminated union narrowing.

---

## 7. Key Takeaways
- **Type Narrowing** is the process where TypeScript refines a broad type into a specific type by analyzing your JavaScript logic.
- It relies on **Control Flow Analysis** (reading your `if/else`, `switch`, and `return` paths).
- It allows you to safely access type-specific methods on a Union Type or an `unknown` value.
- The JavaScript expressions that trigger narrowing are called **Type Guards**.
