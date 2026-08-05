# Assertion Functions (`asserts`)

> **Level 6 — Type Narrowing & Guards**
> A type operator (introduced in TS 3.7) used to declare functions that validate a value and throw an error on failure, narrowing the value's type for the remainder of the containing block scope on success.

---

## 1. Prerequisites
- [Custom Type Guards (`is`)](custom_type_guards.md) — Narrowing types via boolean checks (`is`).
- [Type Narrowing](type_narrowing.md) — The process of refining union types inside code blocks.
---

## 2. Term Category
- **Type Operator**

---

## 3. Environment Context
- **Build-time** (The type signature validates the compiler's inference, compiling down to standard, throwing check logic in the runtime JS bundle).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Custom Type Guards are the standard way to narrow types in TypeScript. They work by returning a boolean:
```typescript
function isString(val: unknown): val is string {
  return typeof val === 'string';
}
```
You can use this inside a conditional: `if (isString(x)) { x.toUpperCase() }`.

However, in many real-world architectures—particularly validation suites, testing frameworks, or assertion utilities—you write functions that check a value and **throw an error** immediately if the value is invalid rather than returning `false`. For example:
```typescript
function assertIsString(val: unknown) {
  if (typeof val !== 'string') throw new TypeError('Not a string!');
}
```
If you call `assertIsString(x)`, you know that if the code moves past that line without crashing, `x` is guaranteed to be a string. 

But historically, TypeScript did not understand this. It would keep the type of `x` as `unknown` on subsequent lines, forcing developers to write redundant type assertions or type guard blocks. 

To solve this, TypeScript introduced **Assertion Functions** via the `asserts` keyword.

### (2) Core Mechanics
You declare an assertion function by appending the `asserts` prefix to its return type signature:

```typescript
// Tells compiler: if this returns, "val" is guaranteed to be a string
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new TypeError('Value must be a string');
  }
}
```

Unlike boolean type guards (which only narrow inside an `if` block), calling an assertion function narrows the variable's type **for the entire subsequent code path** inside the current block.

```typescript
let data: unknown = fetchInput();

// 1. Compiler blocks: data is unknown
// data.toUpperCase(); 

// 2. Call assertion function
assertIsString(data);

// 3. Success! data is now known to be string for all following lines
data.toUpperCase(); 
```

You can also use a generic boolean assertion:
```typescript
function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
```

### (3) Real-World Application
Validating API response payload formats before processing them in application controllers.

```typescript
interface User {
  id: string;
  role: 'admin' | 'user';
}

function assertIsUser(obj: any): asserts obj is User {
  if (!obj || typeof obj !== 'object') throw new Error('Not an object');
  if (typeof obj.id !== 'string') throw new Error('Invalid ID');
  if (obj.role !== 'admin' && obj.role !== 'user') throw new Error('Invalid role');
}

function processUserData(payload: unknown) {
  // Validate and narrow payload from unknown to User in one line!
  assertIsUser(payload);
  
  // payload is now fully typed!
  console.log(`Processing user: ${payload.id} (${payload.role.toUpperCase()})`);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Returning a value instead of throwing an error

**The mistake:** Declaring a function with the `asserts` signature but returning `false` on check failures instead of throwing an exception.

**Why it's wrong:** The compiler assumes that if the function returns *normally* (even if it returns false), the assertion holds true. Failing to throw will cause silent type inaccuracies at runtime.

*Incorrect:*
```typescript
function assertIsNumber(val: unknown): asserts val is number {
  if (typeof val !== 'number') {
    return; // WRONG: Does not throw! TS thinks val is now a number.
  }
}

const input: unknown = 'hello';
assertIsNumber(input); 
// Compile thinks input is number: compiles! But crashes at runtime!
console.log(input.toFixed(2)); 
```

*Fix:* Physically throw an error when validation fails.
```typescript
function assertIsNumber(val: unknown): asserts val is number {
  if (typeof val !== 'number') {
    throw new TypeError('Expected number');
  }
}
```

**Golden Rule:** Assertion functions must throw an error when their condition is not met. Returning normally signifies to the compiler that the value matches the type.

---



### Mistake 2: Omitting `asserts condition` Return Annotation on Assertion Functions

**The mistake:** Writing `function assertString(val: any) { if (typeof val !== 'string') throw new Error(); }` without `asserts val is string`.

**Why it's wrong:** Without the `asserts` signature modifier, TS cannot infer that calling the function narrows subsequent code lines.

*Incorrect:*
```typescript
function assertStr(val: any) {
    if (typeof val !== "string") throw new Error();
}
// assertStr(x); // x is still 'any' below!
```

*Fix:*
```typescript
function assertStr(val: any): asserts val is string {
    if (typeof val !== "string") throw new Error();
}
// assertStr(x); // x is narrowed to 'string' below!
```

### Mistake 3: Using Assertion Functions with Arrow Function Expressions without Type Annotations

**The mistake:** Writing assertion functions as un-annotated arrow functions.

**Why it's wrong:** Assertion function return type annotations `asserts val is T` must be declared explicitly on function signatures.

*Incorrect:*
```typescript
const assertNum = (val: any) => { if (typeof val !== "number") throw new Error(); };
```

*Fix:*
```typescript
const assertNum: (val: any) => asserts val is number = (val) => {
    if (typeof val !== "number") throw new Error();
};
```

## 6. Practice Exercises

### Exercise 1: Asserting Optional Fields

**Problem:** You are parsing dynamic settings configurations. Write an assertion function called `assertHasTheme` that asserts an object has a `theme` property typed as `'light' | 'dark'`.

```typescript
interface Config {
  theme: 'light' | 'dark';
}

// Complete the assertion function signature and code:
function assertHasTheme(obj: any): asserts obj is Config {
  if (!obj || typeof obj !== 'object') throw new Error('Not an object');
  if (obj.theme !== 'light' && obj.theme !== 'dark') {
    throw new Error('Missing or invalid theme');
  }
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The assertion function is written with the corrects asserts obj is Config return signature and throws on invalid properties.
> ```
> - The return type must use `asserts obj is Config`.
> - Check `obj.theme` using an `if` conditional and throw an `Error` on invalid values.

---



### Exercise 2: Custom `assertDefined` Helper

**Problem:** Write assertion function `assertDefined<T>(val: T): asserts val is NonNullable<T>`.

**Expected output:**
> [!check]- Answer
> ```text
> assertDefined signature created
> ```
> ```typescript
> function assertDefined<T>(val: T): asserts val is NonNullable<T> {
>   if (val === null || val === undefined) throw new Error("Value is nullish");
> }
> console.log("assertDefined signature created");
> ```
>
> **Explanation:** Assertion functions guarantee non-nullish state after invocation.

---

### Exercise 3: Assertion Function Execution Guarantee

**Problem:** State what happens if an assertion function condition evaluates to false at runtime (Throws error).

**Expected output:**
> [!check]- Answer
> ```text
> Throws explicit runtime exception
> ```
> ```typescript
> console.log("Throws explicit runtime exception");
> ```
>
> **Explanation:** Assertion functions halt control flow by throwing errors if assertions fail.

## 7. Related Terms
- [Custom Type Guards (`is`)](custom_type_guards.md) — The boolean version of type narrowing.
- [Type Narrowing](type_narrowing.md) — The core process of refining types.
- [Non-null Assertion Operator (`!`)](../level_05/non_null_assertion.md) — Direct, line-level null type bypass.
---

## 8. Key Takeaways
- **Assertion Functions** validate types by throwing exceptions when validation checks fail.
- Declared using the **`asserts value is Type`** return type signature.
- Unlike boolean type guards, they narrow types for the entire subsequent scope block once called.
- They must throw an error on check failure; returning normally signals validation success.
- Commonly used in unit tests and payload parser validation steps.
