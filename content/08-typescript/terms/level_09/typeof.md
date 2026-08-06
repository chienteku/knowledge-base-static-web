# `typeof` Operator

> **Level 9 — Advanced Types**
> A TypeScript operator used in a "Type Context" to extract the exact TypeScript type signature from a runtime JavaScript variable or object.

---

## 1. Prerequisites
- [typeof](../../../03-javascript/terms/level_01/typeof.md) — The runtime version of this keyword.
- [Type Aliases (`type`)](../level_05/type_aliases.md) — Creating type aliases from JavaScript values.

---

## 2. Term Category

**TypeScript Type Operator** (Value-to-Type Extraction Operator): The type-level `typeof` operator extracts the TypeScript type signature of an existing JavaScript variable or constant reference.

---

## 3. Explanation



---



## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying Type Aliases or Interfaces with `typeof`

```typescript
interface User {
  id: number;
}

// ❌ INCORRECT (Attempting typeof on a TypeScript interface):
// type UserType = typeof User; // Compile Error!

// ✅ CORRECT (Query runtime variables directly):
const userObj = { id: 101 };
type UserType = typeof userObj;
```

**Why it's wrong:** The type-level `typeof` operator operates ONLY on value-space JavaScript variables, constants, or functions. Interfaces exist strictly in type-space.

**Golden Rule:** Use `typeof` only on runtime JavaScript identifiers.

---

### Mistake 2: Expecting `typeof` on Arrays to Return Element Types

```typescript
const colors = ["red", "green", "blue"];

// ❌ INCORRECT: type ColorsType = typeof colors; // Inferred as string[], NOT string!

// ✅ CORRECT (Use indexed access [number] to extract element type):
type ElementType = (typeof colors)[number]; // string
```

**Why it's wrong:** `typeof colors` queries the type of the array variable itself (`string[]`), not its individual element type.

**Golden Rule:** Combine `(typeof array)[number]` to extract element types from arrays.

---

### Mistake 3: Confusing Value-Space `typeof` with Type-Space `typeof`

```typescript
const data = "hello";

// Value-space typeof (runs at runtime in JS):
if (typeof data === "string") {
  console.log("Runtime string check");
}

// Type-space typeof (compiles at build time in TS):
type DataType = typeof data; // string
```

**Why it's wrong:** Confusing runtime `typeof` evaluation inside `if` statements with compile-time `typeof` type queries creates syntax errors.

**Golden Rule:** Value-space `typeof` evaluates to JS type strings at runtime; type-space `typeof` queries TS type signatures at build time.





## 5. Practice Exercises

### Exercise 1: Extracting Type Signatures from Constant Objects

**Scenario:**
Extract the type signature of a default configuration object `defaultConfig` using `typeof`.

**Requirements:**
1. Define `type Config = typeof defaultConfig`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const defaultConfig = {
>   host: "localhost",
>   port: 8080,
>   debug: true
> };

type Config = typeof defaultConfig;
// Inferred as: { host: string; port: number; debug: boolean; }

const customConfig: Config = {
  host: "127.0.0.1",
  port: 3000,
  debug: false
};
```

> #### Technical Explanation
>
> 1. Type-level `typeof` queries the static TypeScript type of a value-space variable or constant.
> 2. Erases the need to manually maintain separate interface declarations for default config objects.
> 3. Ensures single source of truth between runtime values and compile-time types.

---

### Exercise 2: Extracting Function Signature Types

**Scenario:**
Extract the function signature of a utility function using `typeof`.

**Requirements:**
1. Extract type of `function log(msg: string): void`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function calculateTotal(price: number, tax: number): number {
>   return price * (1 + tax);
> }

type CalculatorFn = typeof calculateTotal;
// Inferred as: (price: number, tax: number) => number

const myCalc: CalculatorFn = (p, t) => p + t;
```

> #### Technical Explanation
>
> 1. `typeof functionName` obtains the function signature type `(params) => returnType`.
> 2. Allows typing function variables or higher-order callbacks based on existing implementation functions.
> 3. Clean type extraction pattern.

---

### Exercise 3: Comparative Analysis: Value-Space `typeof` vs Type-Space `typeof`

**Scenario:**
Formulate an architectural comparison matrix contrasting JavaScript's runtime `typeof` operator against TypeScript's type-level `typeof` operator.

**Requirements:**
1. Contrast execution context, output values, and compilation behavior.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Value-Space typeof vs Type-Space typeof Matrix:
> - Value-Space typeof (if (typeof x === "string")): Executes at RUNTIME. Evaluates value to a JS primitive string ("string", "number", "object").
> - Type-Space typeof (type T = typeof x): Executes at COMPILE-TIME. Queries the static TypeScript type signature of identifier x. Erased completely in JS output.
> ```

> #### Technical Explanation
>
> 1. Value-space `typeof` appears in executable JavaScript code (inside `if` statements).
> 2. Type-space `typeof` appears in type annotations (`type T = typeof val`).
> 3. Fundamental distinction between runtime evaluation and type-system queries.

---



## 6. Related Terms
- [`keyof` Operator](keyof.md) — Often combined with `typeof` to extract a union of all keys from a JavaScript object (`type Keys = keyof typeof myConfig`).

---

---

## 7. Key Takeaways

- Type-space `typeof` queries the static TypeScript type of a JavaScript variable, constant, or function.
- Erased completely during compilation; adds zero bytes to runtime JavaScript output.
- `(typeof array)[number]` extracts array element types from constant arrays.
- Operates strictly on runtime value identifiers, not interfaces or type aliases.
