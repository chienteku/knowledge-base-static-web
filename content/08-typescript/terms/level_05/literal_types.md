# Literal Types

> **Level 5 — Union & Intersection Types**
> A feature where exact, specific values (like the exact string `"success"`) are used as types themselves, rather than using generic categories (like `string`).

---

## 1. Prerequisites
- [Primitive Types](../level_02/primitive_types.md) — Literal types are ultra-specific versions of primitives.
- [Union Types (`|`)](union_types.md) — Literal types are almost always combined using Unions.
---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: `const` vs `let`

**Problem:** If you write `const a = "Hello"`, what is the inferred type? If you write `let b = "Hello"`, what is the inferred type?

**Expected output:**
> [!check]- Answer
> ```text
> `const a` is inferred as the Literal Type `"Hello"`. Because it's a const, it can never be any other string!
> `let b` is inferred as the generic Primitive Type `string`. Because it's a let, you could reassign it to "World" later.
> ```
> - Think about mutability!

---



### Exercise 2: Numeric and Boolean Literals

**Problem:** Define literal type `DiceRoll = 1 | 2 | 3 | 4 | 5 | 6`.

**Expected output:**
> [!check]- Answer
> ```text
> DiceRoll type created
> ```
> ```typescript
> type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
> const roll: DiceRoll = 6;
> console.log("DiceRoll type created");
> ```
>
> **Explanation:** Literal types restrict variables to specific exact values.

---

### Exercise 3: Template Literal Union Combinations

**Problem:** Combine `"top" | "bottom"` with `"left" | "right"` into `Position` type.

**Expected output:**
> [!check]- Answer
> ```text
> "top-left" | "top-right" | "bottom-left" | "bottom-right"
> ```
> ```typescript
> type V = "top" | "bottom";
> type H = "left" | "right";
> type Position = `${V}-${H}`;
> console.log("\"top-left\" | \"top-right\" | \"bottom-left\" | \"bottom-right\"");
> ```
>
> **Explanation:** Template literal types distribute over unions to construct dynamic combinations.

## 7. Related Terms
- [Union Types (`|`)](union_types.md) — The glue that makes Literal Types useful.
- [Type Inference](../level_01/type_inference.md) — How TS decides between a string and a literal string.
- [Type Widening](../level_01/type_widening.md) — Related concept: Type Widening.
- [Discriminated Unions](../level_06/discriminated_unions.md) — Related concept: Discriminated Unions.
- [Template Literal Types](../level_09/template_literal_types.md) — Related concept: Template Literal Types.
- [Enums](../level_11/enums.md) — Related concept: Enums.
---

## 8. Key Takeaways
- **Literal Types** use exact, specific values (like `"GET"`, `0`, or `false`) as the type definition.
- They are almost always combined with Unions (`"GET" | "POST"`) to create strict allowed-value sets.
- They are significantly safer than generic primitives because they prevent invalid data completely.
- Variables declared with `const` infer Literal Types, while `let` infers generic Primitive Types.
