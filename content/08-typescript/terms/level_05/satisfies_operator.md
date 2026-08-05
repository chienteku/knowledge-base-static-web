# `satisfies` Operator

> **Level 5 — Union & Intersection Types**
> A type operator (introduced in TS 4.9) that validates a value conforms to a target type structure *without* widening or altering the specific inferred type of the value.

---

## 1. Prerequisites
- [Type Assertions (`as`)](type_assertions.md) — Overriding default types.
- [Literal Types](literal_types.md) — Specific values as types.
- [Type Widening](../level_01/type_widening.md) — How types lose specific literal definitions.
---

## 2. Term Category
- **Type Operator**

---

## 3. Environment Context
- **Build-time** (The `satisfies` operator is compile-time validation syntax and does not emit any code to the runtime JS bundle).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing configurations or maps in TypeScript, developers face a frustrating dilemma. 

Suppose you are building a custom palette config:
```typescript
type Color = string | { r: number; g: number; b: number };
interface Palette {
  primary: Color;
  secondary: Color;
}
```

If you explicitly annotate your variable, you get structure checks, but you lose specific type details:
```typescript
const palette: Palette = {
  primary: 'red',
  secondary: { r: 0, g: 255, b: 0 }
};

// Error: Property 'toUpperCase' does not exist on type 'Color'!
// TypeScript forgot that primary is specifically 'red' (a string)
palette.primary.toUpperCase(); 
```

If you do *not* annotate, you keep the specific types, but you lose validation:
```typescript
const palette = {
  primary: 'red',
  secndary: { r: 0, g: 255, b: 0 } // Typo "secndary" goes undetected!
};
```

TypeScript designed the **`satisfies`** operator to resolve this trade-off. It validates that an object matches a contract *without* widening or losing the object's specific inferred type details.

### (2) Core Mechanics
The `satisfies` operator is placed after a value: `value satisfies Type`.

It performs two operations in sequence:
1. **Validation:** Checks if `value` can be assigned to `Type`. If there are typos, missing fields, or invalid types, compilation fails.
2. **Type Retention:** If validation passes, TypeScript ignores the general `Type` contract for downstream inference. It keeps the exact, narrowest inferred type of `value` (retaining specific literal strings and exact object shapes).

```typescript
const palette = {
  primary: 'red',
  secondary: { r: 0, g: 255, b: 0 }
} satisfies Palette; // Validates against Palette!

// Retains specific types! primary is known to be string, secondary is object
palette.primary.toUpperCase(); // Works perfectly!
console.log(palette.secondary.r); // Works perfectly!
```

### (3) Real-World Application
Validating strict dictionary maps (like routes, themes, or locales) while keeping keys and values fully typed.

```typescript
type RouteConfig = { path: string; children?: RouteConfig[] };
const routes = {
  HOME: { path: '/' },
  ADMIN: { path: '/admin', children: [{ path: '/users' }] }
} satisfies Record<string, RouteConfig>;

// TypeScript knows ADMIN.children is defined (no optional undefined checks needed!)
routes.ADMIN.children.forEach(c => console.log(c.path));
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `satisfies` with Type Assertions (`as`)

**The mistake:** Expecting `satisfies` to coerce or override types.

**Why it's wrong:** A type assertion (`as`) forces the compiler to trust you, silencing errors even if the value is incorrect. The `satisfies` operator is the opposite: it **fails** compilation if the value does not match the contract.

*Incorrect:*
```typescript
interface Info {
  name: string;
}

// Compiler error! satisfies will NOT allow wrong structures
const data = { age: 30 } satisfies Info; 
```

*Fix:* Correct the object property to match the contract, or use a type assertion if you are intentionally casting values.
```typescript
const data = { name: 'Alice' } satisfies Info; // Correct!
```

**Golden Rule:** Use `as` to override the compiler's judgment; use `satisfies` to validate a value without losing its exact inferred type.

---



### Mistake 2: Confusing `satisfies` with Type Annotations `: Type`

**The mistake:** Using `: Config` when exact property literal inference needs to be preserved.

**Why it's wrong:** Type annotations `: Config` widen properties to the declared interface types. `satisfies Config` validates shape compatibility while preserving specific property literal types.

*Incorrect:*
```typescript
type Palette = Record<string, string | number[]>;
const theme: Palette = { red: "#ff0000", green: [0, 255, 0] };
// theme.red.toUpperCase(); // ❌ Property 'toUpperCase' does not exist on type 'string | number[]'
```

*Fix:*
```typescript
type Palette = Record<string, string | number[]>;
const theme = { red: "#ff0000", green: [0, 255, 0] } satisfies Palette;
theme.red.toUpperCase(); // Correct! Inferred exact type as string
```

### Mistake 3: Expecting `satisfies` to Mutate or Cast Runtime Values

**The mistake:** Expecting `satisfies` to perform runtime coercion or add missing default properties.

**Why it's wrong:** `satisfies` is a compile-time check only. It validates compatibility without altering the underlying expression value.

*Incorrect:*
```typescript
const obj = { a: 1 } satisfies Record<string, number>; // Does not modify obj at runtime
```

*Fix:*
```typescript
const obj = { a: 1 } satisfies Record<string, number>; // Pure compile-time verification
```

## 6. Practice Exercises

### Exercise 1: Validating Locales

**Problem:** You are building a translation catalog. The catalog keys can be nested values or simple strings. You want to validate that the catalog matches a general type contract while retaining access to the specific nested keys. Complete the code using the `satisfies` operator.

```typescript
type Translation = string | Record<string, string>;

interface Locale {
  welcome: Translation;
  errors: Translation;
}

// Complete the assignment using satisfies Locale
const en = {
  welcome: 'Hello User',
  errors: {
    notFound: 'Page not found',
    server: 'Server crash'
  }
} satisfies Locale;

// This should compile without errors:
console.log(en.errors.notFound.toUpperCase());
```

**Expected output:**
> [!check]- Answer
> ```text
> The compiler compiles the script without warnings. It knows errors is specifically a Record and accepts the .notFound key.
> ```
> - If you annotated `en: Locale`, `en.errors.notFound` would fail because the compiler would think `errors` could be a simple `string`.
> - Append `satisfies Locale` after the object definition instead of using annotation.

---



### Exercise 2: Preserving Literal Types with `satisfies`

**Problem:** Validate object against `Record<string, unknown>` using `satisfies` while retaining method types.

**Expected output:**
> [!check]- Answer
> ```text
> Literal types preserved
> ```
> ```typescript
> const config = {
>   host: "localhost",
>   port: 8080
> } satisfies Record<string, unknown>;
> console.log(config.host.toUpperCase()); // Works!
> console.log("Literal types preserved");
> ```
>
> **Explanation:** `satisfies` validates against target types without losing specific inferred literal types.

---

### Exercise 3: Catching Missing Required Properties with `satisfies`

**Problem:** Demonstrate `satisfies User` flagging missing `id: number` property at compile time.

**Expected output:**
> [!check]- Answer
> ```text
> Compile error: Property 'id' is missing
> ```
> ```typescript
> console.log("Compile error: Property 'id' is missing");
> ```
>
> **Explanation:** `satisfies` ensures object expressions fulfill all required interface contract fields.

## 7. Related Terms
- [Type Assertions (`as`)](type_assertions.md) — Overriding default compile type checking.
- [Const Assertions (`as const`)](../level_11/const_assertions.md) — Making object properties readonly literals.
- [Type Widening](../level_01/type_widening.md) — The process that `satisfies` avoids.
- [Type Inference](../level_01/type_inference.md) — Preserving inferred types.
---

## 8. Key Takeaways
- The **`satisfies`** operator validates that an object matches a contract structure without widening its type.
- Preserves the specific, narrowest type details (such as string literals and exact sub-object structures) for downstream operations.
- Avoids the loss of detail associated with type annotations.
- Avoids the safety hazards associated with type assertions (`as`).
- Available in projects using TypeScript version 4.9 or higher.
