# Type Widening

> **Level 1 — Core Concepts & Environment Setup**
> The compiler process where TypeScript automatically expands a highly specific literal type (like `"hello"` or `42`) to its broader base type (like `string` or `number`) when inferring mutable variables.

---

## 1. Prerequisites
- [Type Inference](type_inference.md) — How the compiler determines types when they are not explicitly declared.
- [Literal Types](../level_05/literal_types.md) — Custom types representing exact primitive values.

---

## 2. Term Category

**Type System Fundamental** (Literal Type Widening Mechanics): Type widening automatically expands narrow literal types (`"GET"`, `42`) to broader primitive types (`string`, `number`) during mutable `let` declarations.



---

## 3. Explanation

### Environment Context
- **Build-time** (Inference and widening are compile-time operations used to generate warnings before transpilation).

### (1) Design Motivation — "Why did we design this?"
In JavaScript, variables are declared as either mutable (`let`, `var`) or immutable (`const`). 

If you write:
```javascript
const user = 'Alice'
```
JavaScript guarantees that `user` will always hold the value `'Alice'`. It cannot change. Therefore, TypeScript can infer a highly specific type: the literal type `'Alice'`.

However, if you write:
```javascript
let role = 'admin'
```
You are explicitly telling JavaScript that you plan to change `role` later. If TypeScript inferred `role` as the literal type `'admin'`, then trying to write `role = 'moderator'` on the next line would trigger a compiler error because `'moderator'` does not fit in the type `'admin'`.

To make JavaScript development intuitive, TypeScript designed **Type Widening**. When you declare a mutable variable without an explicit type, the compiler automatically widens the inferred type from the literal value to its parent primitive type (e.g. `'admin'` becomes `string`, `42` becomes `number`).

### (2) Core Mechanics
Type widening is triggered based on the mutability of the variable container:

- **Primitive Constants (`const`):** Do not widen. The literal value is locked.
  ```typescript
  const count = 10; // Inferred type: 10
  ```
- **Primitive Variables (`let`/`var`):** Automatically widen to their base type.
  ```typescript
  let count = 10; // Inferred type: number
  ```
- **Objects and Arrays:** Regardless of `const`, object and array properties can be mutated. Therefore, their property types are automatically widened by default.
  ```typescript
  const config = {
    port: 8080 // Inferred type: number (not 8080)
  };
  config.port = 9000; // Allowed because port is widened to number
  ```

If you want to prevent widening on objects or arrays, you must use a **Const Assertion** (`as const`), which forces all properties to become readonly literals.

### (3) Real-World Application
Widening helps coordinate dynamic configurations and function inputs. It ensures that variables can be updated with any compatible value of their general class.

```typescript
// Function expects a union of specific strings
type Theme = 'light' | 'dark' | 'system';
function setTheme(theme: Theme) {
  console.log(`Setting theme: ${theme}`);
}

// Case 1: Constant - No Widening
const myTheme = 'dark'; // Type: 'dark'
setTheme(myTheme); // Works!

// Case 2: Variable - Widened!
let activeTheme = 'dark'; // Type: string
// setTheme(activeTheme); // Error: Argument of type 'string' is not assignable to 'Theme'
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Declaring a literal variable with `let` and passing it to a strict type config

**The mistake:** Using `let` to declare a parameter variable that is later passed to a function requiring a union of literal types.

**Why it's wrong:** The variable is widened to `string` or `number` upon creation, making it too broad for the strict literal check.

*Incorrect:*
```typescript
let responseMode = 'json'; // Inferred type: string

function handleResponse(mode: 'json' | 'xml') {
  console.log(mode);
}

handleResponse(responseMode); // Error: string is not assignable to 'json' | 'xml'
```

*Fix:* Declare the variable with `const`, or provide an explicit type annotation if it must remain a mutable variable.
```typescript
const responseMode = 'json'; // Type: 'json' (no widening)
// OR
let responseMode: 'json' | 'xml' = 'json'; // Type: 'json' | 'xml'

handleResponse(responseMode); // Works!
```

**Golden Rule:** If a value must match a strict literal union, declare it with `const`, type it explicitly, or cast it with `as const`.

---



### Mistake 2: Unexpected Type Widening on Reassignable Object Properties

**The mistake:** Creating `const config = { env: "production" };` expecting `config.env` to be literal type `"production"`.

**Why it's wrong:** Because object properties are mutable, TS widens string property initializers to `string`. Use `as const` to freeze property literal types.

*Incorrect:*
```typescript
const config = { env: "production" }; // config.env is string!
```

*Fix:*
```typescript
const config = { env: "production" } as const; // config.env is "production"
```

### Mistake 3: Implicit `any` Widening in Uninitialized `let` Bindings

**The mistake:** Declaring `let x;` without initialization or explicit type annotation.

**Why it's wrong:** Uninitialized `let` bindings widen to evolving `any` type, reducing type safety until assigned.

*Incorrect:*
```typescript
let x; // Inferred as evolving any!
x = 10; x = "hello";
```

*Fix:*
```typescript
let x: number;
x = 10; // Enforces number type
```

## 5. Practice Exercises

### Exercise 1: Understanding Mutable `let` Type Widening

**Scenario:**
Demonstrate literal type widening when assigning string literals to `let` vs `const` variables.

**Requirements:**
1. Compare `let x = "GET"` vs `const y = "GET"`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> let methodLet = "GET"; // Inferred as type 'string' (Widened!)
> const methodConst = "GET"; // Inferred as literal type '"GET"' (Not Widened!)
> 
> methodLet = "POST"; // Valid! Re-assignable to any string.
> // methodConst = "POST"; // ❌ Compile Error: Cannot assign to 'methodConst' because it is a constant.
> ```

> #### Technical Explanation
>
> 1. Variables declared with `let` undergo type widening from literal types (`"GET"`) to primitive types (`string`).
> 2. Widening occurs because `let` variables can be re-assigned to different string values later.
> 3. Variables declared with `const` preserve narrow literal types because their values cannot mutate.

---

### Exercise 2: Preventing Type Widening with `as const` Assertions

**Scenario:**
Prevent object property type widening using `as const` (const assertions).

**Requirements:**
1. Apply `as const` to configuration object literal.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Without 'as const': method is inferred as type 'string'
> const configMutable = {
>   endpoint: "/api/users",
>   method: "GET"
> };
> 
> // With 'as const': properties become readonly literal types!
> const configReadonly = {
>   endpoint: "/api/users",
>   method: "GET"
> } as const;
> 
> // configReadonly.method is typed strictly as '"GET"' (readonly)!
> ```

> #### Technical Explanation
>
> 1. `as const` locks object properties into deeply `readonly` literal types.
> 2. Prevents TypeScript from widening property types (`"GET"` -> `string`).
> 3. Essential technique for passing configuration objects into functions expecting strict literal union types.

---

### Exercise 3: Controlling Explicit Union Type Narrowing

**Scenario:**
Prevent widening of a mutable variable by providing an explicit union type annotation.

**Requirements:**
1. Annotate variable with `HTTPMethod` union type (`'GET' | 'POST'`).

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";

// Explicit type annotation prevents widening to general 'string':
let activeMethod: HTTPMethod = "GET";

activeMethod = "POST"; // Valid!
// activeMethod = "INVALID"; // ❌ Compile Error: Type '"INVALID"' is not assignable to type 'HTTPMethod'.
```

> #### Technical Explanation
>
> 1. Providing an explicit type annotation (`: HTTPMethod`) overrides default variable type widening.
> 2. Constrains variable re-assignment to valid union members only.
> 3. Idiomatic method for maintaining strict state flags.

---



## 6. Related Terms
- [Type Inference](type_inference.md) — The mechanism that triggers widening.
- [Literal Types](../level_05/literal_types.md) — The specific types that are widened.
- [Const Assertions (`as const`)](../level_11/const_assertions.md) — The syntax used to opt-out of widening on objects and arrays.
- [`satisfies` Operator](../level_05/satisfies_operator.md) — Related concept: `satisfies` Operator.

---

## 7. Key Takeaways
- **Type Widening** is the automatic conversion of a literal type to its general primitive type.
- It prevents type-checking errors when mutable variables (`let`) are updated with new values.
- Immutable variables (`const`) do not trigger widening for primitive values.
- Object and array values are always widened by default because their properties remain mutable.
- Use explicit annotations, `const`, or `as const` to freeze type widening.
