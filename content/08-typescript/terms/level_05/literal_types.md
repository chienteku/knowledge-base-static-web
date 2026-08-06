# Literal Types

> **Level 5 — Union & Intersection Types**
> A feature where exact, specific values (like the exact string `"success"`) are used as types themselves, rather than using generic categories (like `string`).

---

## 1. Prerequisites
- [Primitive Types](../level_02/primitive_types.md) — Literal types are ultra-specific versions of primitives.
- [Union Types (`|`)](union_types.md) — Literal types are almost always combined using Unions.

---

## 2. Term Category

**Type System Fundamental** (Exact Value Types): Literal types constrain variable values to specific exact string, number, or boolean literal primitives.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
Imagine a UI Button component. It accepts a `size` property. 
If you type it as `size: string`, a developer could pass `size="gigantic"`, and your CSS would break.
You don't want just *any* string. You want exactly `"small"`, `"medium"`, or `"large"`. 
**Literal Types** allow you to use specific values as the type itself!

### (2) Combining Literals with Unions
Literal Types are rarely used on their own. They are almost always combined into a Union Type to create a strict set of allowed values (acting like a lightweight Enum).

```typescript
// The type is not 'string'. It is exactly these three strings.
type ButtonSize = "small" | "medium" | "large";

function renderButton(size: ButtonSize) { ... }

renderButton("small");    // ✅ Valid
renderButton("gigantic"); // ❌ Error: Argument of type '"gigantic"' is not assignable.
```

### (3) Number and Boolean Literals
You can do the exact same thing with numbers or booleans.
```typescript
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

const roll: DiceRoll = 7; // ❌ Error!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Literal Inference mismatch with `let`

**The mistake:** A developer defines `type Method = "GET" | "POST"`. They then write:
```typescript
let reqMethod = "GET"; 
makeRequest(reqMethod); // ❌ Error!
```

**Why it's wrong:** Because you used `let`, TypeScript infers that `reqMethod` might change in the future. Therefore, it infers the type as generic `string`, not the literal `"GET"`. When you pass a generic `string` into a function that strictly requires `"GET" | "POST"`, TS throws an error.
**Golden Rule:** If you want TS to infer a literal type, you must declare the variable with `const` (so it can never change), or explicitly cast it using `as const`.

---



### Mistake 2: Expecting `let` Variable Declarations to Infer Literal Types

**The mistake:** Writing `let mode = "read";` expecting `mode` to have type `"read"`.

**Why it's wrong:** `let` variables undergo type widening to `string`. Use `const`, explicit annotations `: "read"`, or `as const`.

*Incorrect:*
```typescript
let mode = "read"; // Inferred as string, allowing unexpected string values!
```

*Fix:*
```typescript
const mode = "read"; // Inferred as literal type "read"
```

### Mistake 3: Passing Widened String Variables to Literal Type Parameters

**The mistake:** Passing a `string` variable into a function expecting strict literal union `"GET" | "POST"`.

**Why it's wrong:** A general `string` type is broader than specific string literal types.

*Incorrect:*
```typescript
type Method = "GET" | "POST";
function req(m: Method) {}
let verb = "GET";
// req(verb); // ❌ Argument of type 'string' is not assignable to 'Method'
```

*Fix:*
```typescript
let verb: Method = "GET";
req(verb); // Explicit literal union type annotation
```

## 5. Practice Exercises

### Exercise 1: Constraining Inputs with String Literal Unions

**Scenario:**
Create a `ButtonTheme` union type restricting valid themes to `"primary"`, `"secondary"`, or `"danger"`.

**Requirements:**
1. Define `type ButtonTheme = "primary" | "secondary" | "danger"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type ButtonTheme = "primary" | "secondary" | "danger";
> 
> function renderButton(theme: ButtonTheme) {
>   console.log(`Rendering ${theme} button`);
> }
> 
> renderButton("primary");
> // renderButton("warning"); // ❌ Compile Error: Argument of type '"warning"' is not assignable to parameter of type 'ButtonTheme'.
> ```
> 
> #### Technical Explanation
>
> 1. String literal types constrain string parameters to precise allowed string values.
> 2. Provides IDE autocomplete suggestions for literal options.
> 3. Replaces magic string constants with compile-time checked type definitions.
> 
---

### Exercise 2: Defining Numeric Literal Unions

**Scenario:**
Constrain HTTP status code parameters to exact numeric literal values (`200 | 404 | 500`).

**Requirements:**
1. Define `type HttpStatus = 200 | 404 | 500`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type HttpStatus = 200 | 404 | 500;
> 
> function handleStatus(status: HttpStatus) {
>   if (status === 200) console.log("OK");
>   else if (status === 404) console.log("Not Found");
>   else console.log("Server Error");
> }
> 
> handleStatus(200);
> // handleStatus(201); // ❌ Compile Error: Type '201' is not assignable to type 'HttpStatus'.
> ```
> 
> #### Technical Explanation
>
> 1. Numeric literal types restrict numbers to explicit allowed values.
> 2. Prevents passing arbitrary invalid integer values to functions.
> 3. Ideal pattern for status flags and configuration codes.
> 
---

### Exercise 3: Combining Boolean Literals and Discriminants

**Scenario:**
Define a `Result<T>` discriminated union using boolean literal discriminants `success: true` vs `success: false`.

**Requirements:**
1. Create `SuccessResult` and `ErrorResult` using boolean literals.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type SuccessResult<T> = { success: true; data: T };
> type ErrorResult = { success: false; error: string };
> type Result<T> = SuccessResult<T> | ErrorResult;
> 
> function handleResult(res: Result<number>) {
>   if (res.success) {
>     console.log("Data:", res.data); // res.data is accessible!
>   } else {
>     console.log("Error:", res.error); // res.error is accessible!
>   }
> }
> ```
> 
> #### Technical Explanation
>
> 1. Boolean literal types (`success: true`) act as precise type discriminants.
> 2. TypeScript automatically narrows union branches inside `if (res.success)` blocks.
> 3. Standard pattern for return type error handling.
> 
---



## 6. Related Terms
- [Union Types (`|`)](union_types.md) — The glue that makes Literal Types useful.
- [Type Inference](../level_01/type_inference.md) — How TS decides between a string and a literal string.
- [Type Widening](../level_01/type_widening.md) — Related concept: Type Widening.
- [Discriminated Unions](../level_06/discriminated_unions.md) — Related concept: Discriminated Unions.
- [Template Literal Types](../level_09/template_literal_types.md) — Related concept: Template Literal Types.
- [Enums](../level_11/enums.md) — Related concept: Enums.

---

## 7. Key Takeaways
- **Literal Types** use exact, specific values (like `"GET"`, `0`, or `false`) as the type definition.
- They are almost always combined with Unions (`"GET" | "POST"`) to create strict allowed-value sets.
- They are significantly safer than generic primitives because they prevent invalid data completely.
- Variables declared with `const` infer Literal Types, while `let` infers generic Primitive Types.
