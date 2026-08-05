# Excess Property Checks

> **Level 3 — Object Types & Interfaces**
> A compiler validation process in TypeScript that restricts fresh object literals from declaring properties not defined in the target type, catching typos and configuration errors.

---

## 1. Prerequisites
- [Object Types](object_types.md) — Enforcing structural requirements.
- [Interfaces](interfaces.md) — Extensible type contracts.
---

## 2. Term Category
- **Type System Fundamental**

---

## 3. Environment Context
- **Build-time** (Validations are strictly compile-time warnings, compiled down to normal JS values at runtime).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Because TypeScript is a **Structural Type System**, type compatibility is based on shape. An object is considered compatible with a target type if it has *at least* the properties defined in that target. 

For example, this object matches the target type:
```typescript
interface Point {
  x: number;
}
const myPoint = { x: 1, y: 2 }; // Compatible with Point because x is present!
```

This structural rule is powerful, but it has a major drawback when you write configuration options. If you write:
```typescript
interface ChartOptions {
  width: number;
  height: number;
}
function drawChart(options: ChartOptions) { ... }

// Developer typo: "heigth" instead of "height"
drawChart({ width: 100, heigth: 200 }); 
```
If TypeScript only checked structural rules, this code would compile, but it would crash at runtime because `height` is missing (and a useless `heigth` property was passed).

To prevent this, TypeScript designed **Excess Property Checks**. When you assign or pass an object literal directly, TypeScript triggers a stricter check: the object literal must **exactly** match the properties of the target type. No extra undeclared fields are allowed.

### (2) Core Mechanics
Excess property checking only applies to **fresh object literals**. A "fresh" literal is an object declared inline directly during assignment or function invocation. 

If an object literal is assigned to an intermediate variable first, it loses its "freshness". Standard structural typing rules take over, and excess properties are allowed.

```typescript
interface Box {
  size: number;
}

// 1. Fresh literal: fails check!
const box1: Box = { size: 10, color: 'blue' }; // Error: Object literal may only specify known properties

// 2. Variable assignment first: passes!
const temp = { size: 10, color: 'blue' };
const box2: Box = temp; // Allowed! (Structural rule holds)
```

Why the difference? If you declare `temp`, TypeScript assumes you might reuse `temp` elsewhere where `color` is needed. But if you write an inline literal, you are designing it *specifically* for that target type contract. Thus, any extra property is almost certainly a developer typo.

### (3) Real-World Application
Safeguarding configuration objects in frontend components or database connections.

```typescript
interface DatabaseConfig {
  host: string;
  port?: number; // Optional
}

function connect(config: DatabaseConfig) { ... }

// Catching a typo instantly
// Error: Object literal may only specify known properties. Did you mean 'port'?
connect({ host: 'localhost', prt: 3306 }); 
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Bypassing checks using type assertions instead of correcting definitions

**The mistake:** Using `as any` or `as TargetType` to force the compiler to accept a fresh literal with extra keys.

**Why it's wrong:** Asserting type removes the compiler's safety warnings, leaving actual spelling typos undetected.

*Incorrect:*
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Typo 'onClck' goes undetected because of 'as ButtonProps'!
const props = {
  label: 'Save',
  onClck: () => console.log('saved')
} as ButtonProps; 
```

*Fix:* Fix the typo, or if you need to allow custom extra parameters, add an **Index Signature** (`[key: string]: any`) to the target interface.
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  [extraProperty: string]: any; // Allows custom properties
}
```

**Golden Rule:** Excess Property Checks are designed to find typos. Never bypass them with variables or type assertions unless you are explicitly building a plugin system that requires dynamic keys.

---



### Mistake 2: Expecting Excess Property Checks on Indirect Intermediate Variable Assignments

**The mistake:** Expecting `const user: User = obj;` to reject extra properties when `obj` is assigned to a separate variable first.

**Why it's wrong:** TypeScript performs excess property checks ONLY on fresh object literals directly assigned to target types. Assigning via intermediate variables bypasses excess checks.

*Incorrect:*
```typescript
interface User { name: string; }
const raw = { name: "Alice", extra: 123 };
const user: User = raw; // ❌ Compiles without error due to structural subtyping!
```

*Fix:*
```typescript
interface User { name: string; }
const user: User = { name: "Alice" /*, extra: 123 */ }; // Direct literal triggers excess check
```

### Mistake 3: Bypassing Excess Property Checks with Type Assertions `as User`

**The mistake:** Using `as User` assertion to suppress extra property errors.

**Why it's wrong:** `as User` tells TS to skip excess checks, allowing typos in property names to pass quietly.

*Incorrect:*
```typescript
interface Config { port: number }
const cfg = { port: 8080, prot: "http" } as Config; // ❌ Hides typo 'prot'
```

*Fix:*
```typescript
interface Config { port: number }
const cfg: Config = { port: 8080 /* , prot: 'http' */ }; // Catches extra/misspelled properties
```

## 6. Practice Exercises

### Exercise 1: Bypass and Solve

**Problem:** Below is a compilation failure. Resolve the error in two ways:
1. By assigning it to an intermediate variable.
2. By modifying the `Car` interface to allow any additional string properties.

```typescript
interface Car {
  make: string;
  model: string;
}

const myCar: Car = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2022 // Error: Object literal may only specify known properties
};
```

**Expected output:**
> [!check]- Answer
> ```typescript
> // Solved via intermediate variable:
> const carData = { make: 'Toyota', model: 'Corolla', year: 2022 };
> const myCar: Car = carData;
> 
> // Solved via index signature:
> interface Car {
>   make: string;
>   model: string;
>   [key: string]: any;
> }
> ```
> - The intermediate variable loses literal freshness, so the compiler only checks that `make` and `model` are present.
> - An index signature looks like `[key: string]: any` or `[key: string]: unknown` inside the interface.

---



### Exercise 2: Fresh Object Literal Excess Property Check

**Problem:** Explain why `{ name: "Alice", age: 30 }` fails when directly assigned to `type Person = { name: string }`.

**Expected output:**
> [!check]- Answer
> ```text
> Direct object literal assignment triggers excess property check
> ```
> ```typescript
> console.log("Direct object literal assignment triggers excess property check");
> ```
>
> **Explanation:** Fresh object literals are checked for typos by rejecting unlisted extra properties.

---

### Exercise 3: Disabling Excess Property Warnings with Index Signatures

**Problem:** Add index signature `[key: string]: any` to interface to permit excess properties on direct literals.

**Expected output:**
> [!check]- Answer
> ```text
> Index signature permits excess properties
> ```
> ```typescript
> interface Flexible {
>   name: string;
>   [key: string]: any;
> }
> const obj: Flexible = { name: "Alice", extra: 123 }; // Allowed!
> console.log("Index signature permits excess properties");
> ```
>
> **Explanation:** Index signatures explicitly allow dynamic additional properties.

## 7. Related Terms
- [Object Types](object_types.md) — Base objects structures.
- [Index Signatures](index_signatures.md) — Defining interfaces with dynamic key contracts.
- [Type Assertions (`as`)](../level_05/type_assertions.md) — Overriding compiler type decisions.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — Structural typing.
---

## 8. Key Takeaways
- **Excess Property Checks** block fresh object literals from declaring fields not defined in the target type.
- This is a special, strict validation designed to catch spelling typos.
- The check only applies to fresh object literals created inline.
- Assigning the object literal to a variable first removes freshness and bypasses the check.
- Adding an index signature (`[key: string]: any`) to the interface allows the type to accept arbitrary extra properties safely.
