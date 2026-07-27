# Const Assertions (`as const`)

> **Level 11 — Modules, Declaration Files & Configuration**
> A powerful TypeScript feature that locks down the types of arrays and objects, converting them into deeply immutable, perfectly literal types.

---

## 1. Prerequisites
- [Literal Types](../level_05/literal_types.md) — The specific, exact types that `as const` generates.
- [Enums](../level_11/enums.md) — The legacy feature that `as const` is rapidly replacing.

---

## 2. Term Category
TypeScript Type Assertion

---

## 3. Core Definition
When you declare an object in TypeScript, the compiler assumes you might want to change its values later, so it widens the types. For example, `{ method: "GET" }` is inferred as `{ method: string }`.

By appending **`as const`** to the end of your object or array, you tell the compiler: *"This data will never change. Lock it down completely."*
TypeScript will immediately recursively convert all properties to `readonly`, and lock all strings and numbers into their exact Literal Types (e.g., `{ readonly method: "GET" }`).

---

## 4. Key Characteristics / Rules
- **Deep Immutability:** Unlike the `const` keyword in JavaScript (which only stops variable reassignment but allows object mutation), `as const` makes the object structurally immutable at the type level.
- **Replaces Enums:** Because `as const` creates perfectly typed JavaScript objects without injecting any weird, proprietary code into the final output, it is the modern community standard for defining constants over TypeScript Enums.

---

## 5. Typical Usage / Common Patterns

### Freezing an Array
```typescript
// Without 'as const': Type is string[]
const routes = ["/home", "/about", "/contact"];

// With 'as const': Type is readonly ["/home", "/about", "/contact"]
const routesLocked = ["/home", "/about", "/contact"] as const;
```

### The Enum Replacement
```typescript
// Define standard JS object and lock it with 'as const'
const Colors = {
  Red: "#FF0000",
  Green: "#00FF00",
  Blue: "#0000FF"
} as const;

// Extract the types dynamically using 'keyof' and 'typeof'
type ColorValue = typeof Colors[keyof typeof Colors];
// ColorValue is now exactly: "#FF0000" | "#00FF00" | "#0000FF"

function paintWall(color: ColorValue) {
  // ...
}
paintWall(Colors.Red); // Perfect autocompletion!
```

---

## 6. Common Pitfalls
- **Confusing JS `const` with TS `as const`:** `const` is a JavaScript runtime instruction that stops you from using the `=` sign to reassign the variable. `as const` is a TypeScript compile-time instruction that stops you from mutating the internal properties of the object itself.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Expecting `as const` Assertions to Enforce Runtime Object Immutability

**The mistake:** Expecting `const config = { env: "prod" } as const;` to prevent runtime modifications in raw JavaScript.

**Why it's wrong:** `as const` is a compile-time assertion that narrows types to literal types and marks properties as `readonly`. It does NOT call `Object.freeze()` at runtime.

*Incorrect:*
```typescript
const cfg = { port: 8080 } as const;
(cfg as any).port = 9090; // 💥 Mutates object at runtime despite 'as const' assertion!
```

*Fix:*
```typescript
const cfg = Object.freeze({ port: 8080 } as const); // Enforces runtime immutability alongside type narrowing
```

### Mistake 2: Using `as const` on Non-Literal Dynamic Variable Expressions

**The mistake:** Writing `const val = (a + b) as const;` where `a` and `b` are non-literal dynamic variables.

**Why it's wrong:** `as const` can only narrow literal expressions (strings, numbers, booleans, arrays, object literals).

*Incorrect:*
```typescript
let x = 10;
// const val = x as const; // ❌ Does not convert dynamic variable into a compile-time constant
```

*Fix:*
```typescript
const x = 10; // Inferred as literal 10 directly
```

### Mistake 3: Confusing `as const` Array Assertions with Mutable Array Types

**The mistake:** Attempting to pass `const arr = [1, 2] as const;` into a parameter typed `number[]`.

**Why it's wrong:** `as const` on an array literal yields a `readonly [1, 2]` tuple, which cannot be assigned to mutable `number[]`.

*Incorrect:*
```typescript
const nums = [1, 2] as const;
function mutate(arr: number[]) { arr.push(3); }
// mutate(nums); // ❌ Type 'readonly [1, 2]' is 'readonly' and cannot be assigned to mutable type 'number[]'
```

*Fix:*
```typescript
function read(arr: readonly number[]) { console.log(arr.length); }
read(nums); // Readonly parameter permits const asserted arrays
```

## 6. Practice Exercises



### Exercise 1: Constructing Readonly Enum-Like Objects with `as const`

**Problem:** Create object `Colors` with properties `RED = "#ff0000"` and `BLUE = "#0000ff"` using `as const`.

**Expected output:**
```text
Colors object created with as const
```

> [!check]- Answer
> ```typescript
> const Colors = {
>   RED: "#ff0000",
>   BLUE: "#0000ff"
> } as const;
> type Color = typeof Colors[keyof typeof Colors];
> console.log("Colors object created with as const");
> ```
>
> **Explanation:** `as const` creates type-safe immutable value maps as alternatives to Enums.

### Exercise 2: Extracting Tuple Union Types from `as const` Arrays

**Problem:** Extract literal union `"a" | "b"` from `const items = ["a", "b"] as const`.

**Expected output:**
```text
"a" | "b"
```

> [!check]- Answer
> ```typescript
> const items = ["a", "b"] as const;
> type Item = typeof items[number];
> console.log("\"a\" | \"b\"");
> ```
>
> **Explanation:** Indexing `typeof items[number]` extracts a union of tuple literal element types.

### Exercise 3: `as const` Object Property Narrowing

**Problem:** What is the inferred type of property `env` in `const cfg = { env: "dev" } as const`?

**Expected output:**
```text
"dev" (string literal type)
```

> [!check]- Answer
> ```typescript
> console.log("\"dev\" (string literal type)");
> ```
>
> **Explanation:** `as const` prevents property type widening to general primitive types.

## 7. Related Terms
- [Type Assertions](../level_05/type_assertions.md) — `as const` is a specialized form of the standard `as Type` syntax.

---
