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

**TypeScript Type Operator** (Type Validation Without Widening): The `satisfies` operator validates that an expression conforms to a type interface without altering or widening its inferred literal type.



---

## 3. Explanation

### Environment Context
- **Build-time** (The `satisfies` operator is compile-time validation syntax and does not emit any code to the runtime JS bundle).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Validating Configuration Objects with `satisfies`

**Scenario:**
Validate a theme configuration object against a `Record<string, string | RGB>` interface while preserving specific property type inference.

**Requirements:**
1. Use `satisfies` operator on `palette` object.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type RGB = [r: number, g: number, b: number];
> type Palette = Record<string, string | RGB>;

const palette = {
  red: "#ff0000",
  green: [0, 255, 0],
  blue: "#0000ff"
} satisfies Palette;

// Property types are PRESERVED (not widened to string | RGB)!
palette.red.toUpperCase(); // Valid! Compiler knows red is string!
palette.green.map((x) => x); // Valid! Compiler knows green is RGB array!
```

> #### Technical Explanation
>
> 1. `satisfies` validates that an object matches a target type contract WITHOUT altering or widening its inferred literal type.
> 2. Traditional type annotations (`const palette: Palette = ...`) widen all values to `string | RGB`, losing specific member methods.
> 3. Preserves exact string/array type inference for autocomplete and method access.

---

### Exercise 2: Catching Property Typos with `satisfies`

**Scenario:**
Catch property name typos in a route config object using `satisfies`.

**Requirements:**
1. Show compile error when invalid property key is passed.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Routes = "home" | "about" | "contact";

// ❌ Compile Error: 'profile' is not assignable to type Routes!
// const config = {
//   home: "/",
//   about: "/about",
//   profile: "/user"
// } satisfies Record<Routes, string>;
```

> #### Technical Explanation
>
> 1. `satisfies` verifies that all required properties of the target contract are present and correctly typed.
> 2. Flags invalid keys or missing properties immediately during compilation.
> 3. Ensures strict object schema compliance while keeping narrow key inferences.

---

### Exercise 3: Comparative Analysis: Type Annotation (`: T`) vs `satisfies T`

**Scenario:**
Formulate an architectural comparison matrix contrasting Type Annotations (`: T`) against the `satisfies T` operator.

**Requirements:**
1. Contrast type validation, literal widening, property access, and usage scenarios.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Type Annotation (: T) vs satisfies T Matrix:
> - Type Annotation (: T): Forces variable type to T. Widens literal properties to T's broader types. Loses narrow specific type information.
> - satisfies T: Validates expression against T. Preserves the exact inferred narrow types of individual properties for autocomplete.
> Rule: Use : T for variable boundaries; use satisfies T for configuration objects where narrow property access is needed.
> ```

> #### Technical Explanation
>
> 1. Type annotations enforce contract boundaries at the cost of type widening.
> 2. `satisfies` enforces contract boundaries while retaining precise expression types.
> 3. Significant feature introduced in TypeScript 4.9.

---



## 6. Related Terms
- [Type Assertions (`as`)](type_assertions.md) — Overriding default compile type checking.
- [Const Assertions (`as const`)](../level_11/const_assertions.md) — Making object properties readonly literals.
- [Type Widening](../level_01/type_widening.md) — The process that `satisfies` avoids.
- [Type Inference](../level_01/type_inference.md) — Preserving inferred types.

---

## 7. Key Takeaways
- The **`satisfies`** operator validates that an object matches a contract structure without widening its type.
- Preserves the specific, narrowest type details (such as string literals and exact sub-object structures) for downstream operations.
- Avoids the loss of detail associated with type annotations.
- Avoids the safety hazards associated with type assertions (`as`).
- Available in projects using TypeScript version 4.9 or higher.
