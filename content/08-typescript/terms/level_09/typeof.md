# `typeof` Operator

> **Level 9 — Advanced Types**
> A TypeScript operator used in a "Type Context" to extract the exact TypeScript type signature from a runtime JavaScript variable or object.

---

## 1. Prerequisites
- `typeof` Operator — The runtime version of this keyword.
---

## 2. Term Category
TypeScript Operator

---

## 3. Core Definition
In standard JavaScript, `typeof` is a runtime operator that returns strings like `"string"` or `"object"`. 
In TypeScript, if you use `typeof` inside a **Type Context** (where TypeScript expects a type annotation), it reads the shape of an existing JavaScript variable and converts it into a TypeScript interface/type automatically.

This is incredibly useful because it prevents you from having to manually type out massive interfaces for configuration objects that already exist in your JavaScript code.

---

## 4. Key Characteristics / Rules
- **DRY (Don't Repeat Yourself):** Allows you to derive types from values, keeping your code synced automatically.
- **Two Different Worlds:** If used in a value expression (`console.log(typeof x)`), it runs the JS version. If used in a type annotation (`type T = typeof x`), it runs the TS version.

---

## 5. Typical Usage / Common Patterns

### Deriving a Type from an Object
```typescript
const myConfig = {
  endpoint: "https://api.com",
  timeout: 5000,
  retries: 3
};

// Instead of manually writing an interface for myConfig, extract it!
type ConfigType = typeof myConfig;

// ConfigType is exactly:
// { endpoint: string; timeout: number; retries: number; }

function startApp(config: typeof myConfig) {
  // ...
}
```

---

## 6. Common Pitfalls
- **Confusing Value `typeof` with Type `typeof`:** A common mistake is trying to use `typeof` on a Type Alias instead of a variable, which will throw a compiler error. `typeof` only works on *runtime values*.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Confusing Type-Level `typeof` Operator with Runtime JavaScript `typeof` Operator

**The mistake:** Expecting type-level `type T = typeof myVar` to evaluate to runtime string `"object"`.

**Why it's wrong:** At the type level, `typeof myVar` extracts the TypeScript STATIC type of variable `myVar`! At runtime, `typeof myVar` returns a primitive string (`"object"`, `"string"`, etc.).

*Incorrect:*
```typescript
const config = { port: 8080 };
// type Bad = typeof config === "object"; // ❌ Cannot use runtime equality in type alias!
```

*Fix:*
```typescript
const config = { port: 8080 };
type ConfigType = typeof config; // Result: { port: number }
```

### Mistake 2: Using Type-Level `typeof` on Function Invocation Calls

**The mistake:** Writing `type T = typeof getData()`.

**Why it's wrong:** `typeof` operates on variable/function identifiers, NOT function invocation expressions. Use `ReturnType<typeof getData>`.

*Incorrect:*
```typescript
function getData() { return 42; }
// type Bad = typeof getData(); // ❌ Expression expected
```

*Fix:*
```typescript
function getData() { return 42; }
type Good = ReturnType<typeof getData>; // Result: number
```

### Mistake 3: Using Type-Level `typeof` on Un-instantiated Class Types

**The mistake:** Writing `type T = typeof UserClass` expecting `T` to be the instance type.

**Why it's wrong:** `typeof UserClass` extracts the type of the constructor function itself (including static methods). Use `InstanceType<typeof UserClass>` or `UserClass` directly for instance types.

*Incorrect:*
```typescript
class User { name!: string }
type ConstType = typeof User; // Type of constructor function, not User instance!
```

*Fix:*
```typescript
class User { name!: string }
type InstType = User; // Type of User instance
```

## 6. Practice Exercises



### Exercise 1: Extracting Object Shape with Type-Level `typeof`

**Problem:** Extract type `Config` from `const defaultConfig = { host: "localhost", port: 8080 }`.

**Expected output:**
> [!check]- Answer
> ```text
> { host: string; port: number }
> ```
> ```typescript
> const defaultConfig = { host: "localhost", port: 8080 };
> type Config = typeof defaultConfig;
> console.log("{ host: string; port: number }");
> ```
>
> **Explanation:** Type-level `typeof` extracts exact TypeScript type shapes from runtime variable initializers.

---

### Exercise 2: Extracting Enum Type Keys with `typeof`

**Problem:** Extract key type of enum `enum Status { OK, FAIL }` using `keyof typeof Status`.

**Expected output:**
> [!check]- Answer
> ```text
> "OK" | "FAIL"
> ```
> ```typescript
> enum Status { OK, FAIL }
> type StatusKeys = keyof typeof Status;
> console.log("\"OK\" | \"FAIL\"");
> ```
>
> **Explanation:** Combining `keyof typeof` extracts string key unions from enum objects.

---

### Exercise 3: Extracting Function Signature with `typeof`

**Problem:** Extract function type signature from `const log = (msg: string) => console.log(msg)`.

**Expected output:**
> [!check]- Answer
> ```text
> (msg: string) => void
> ```
> ```typescript
> const log = (msg: string) => console.log(msg);
> type LogFn = typeof log;
> console.log("(msg: string) => void");
> ```
>
> **Explanation:** `typeof` extracts function parameter and return signatures from function implementations.

## 7. Related Terms
- [`keyof` Operator](../level_09/keyof.md) — Often combined with `typeof` to extract a union of all keys from a JavaScript object (`type Keys = keyof typeof myConfig`).

---
