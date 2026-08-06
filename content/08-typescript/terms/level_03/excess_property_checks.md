# Excess Property Checks

> **Level 3 — Object Types & Interfaces**
> A compiler validation process in TypeScript that restricts fresh object literals from declaring properties not defined in the target type, catching typos and configuration errors.

---

## 1. Prerequisites
- [Object Types](object_types.md) — Enforcing structural requirements.
- [Interfaces](interfaces.md) — Extensible type contracts.

---

## 2. Term Category

**Type System Fundamental** (Literal Object Shape Checking): Excess property checks validate that fresh inline object literals do not contain un-declared properties missing from the target type.



---

## 3. Explanation

### Environment Context
- **Build-time** (Validations are strictly compile-time warnings, compiled down to normal JS values at runtime).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Bypassing Excess Property Checks with Variable References

**Scenario:**
Demonstrate how fresh object literals trigger excess property checks while intermediate variable references bypass them.

**Requirements:**
1. Pass fresh literal vs intermediate variable reference to function.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Config {
>   host: string;
>   port: number;
> }
> 
> function setupServer(config: Config) {
>   console.log(`Server starting on ${config.host}:${config.port}`);
> }
> 
> // ❌ FAILS: Direct object literal triggers Excess Property Check:
> // setupServer({ host: "localhost", port: 8080, debug: true });
> 
> // ✅ SUCCEEDS: Intermediate variable reference bypasses excess property checks:
> const options = { host: "localhost", port: 8080, debug: true };
> setupServer(options);
> ```
> 
> #### Technical Explanation
>
> 1. Fresh object literals undergo "Excess Property Checking" upon direct assignment to catch typos.
> 2. Assigning the literal to an intermediate variable (`options`) converts it to an existing reference.
> 3. Structural typing rules allow `options` because it satisfies the required `host` and `port` properties.
> 
---

### Exercise 2: Using Index Signatures to Allow Extra Properties

**Scenario:**
Configure an interface that permits additional arbitrary properties using an index signature.

**Requirements:**
1. Add `[key: string]: unknown` to interface.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface FlexConfig {
>   host: string;
>   port: number;
>   [key: string]: unknown; // Permits arbitrary additional properties
> }
> 
> // Valid direct literal assignment!
> const serverConfig: FlexConfig = {
>   host: "127.0.0.1",
>   port: 3000,
>   ssl: true,
>   environment: "production"
> };
> ```
> 
> #### Technical Explanation
>
> 1. Adding an index signature (`[key: string]: unknown`) explicitly informs the compiler that extra properties are intentional.
> 2. Disables excess property check errors for inline object literals.
> 3. Ideal pattern for open configuration objects.
> 
---

### Exercise 3: Auditing Typo Prevention via Excess Property Checks

**Scenario:**
Explain why excess property checks are essential for catching misspelled optional properties.

**Requirements:**
1. Show typo `collor` instead of `color`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface ButtonProps {
>   label: string;
>   color?: string;
> }
> 
> // ❌ Compile Error: 'collor' does not exist in type 'ButtonProps'. Did you mean 'color'?
> // const btn: ButtonProps = { label: "Click Me", collor: "blue" };
> ```
> 
> #### Technical Explanation
>
> 1. Without excess property checks, typos in optional properties (`collor`) would be silently ignored.
> 2. The compiler catches typos on fresh literals immediately.
> 3. Critical developer quality-of-life feature.
> 
---



## 6. Related Terms
- [Object Types](object_types.md) — Base objects structures.
- [Index Signatures](index_signatures.md) — Defining interfaces with dynamic key contracts.
- [Type Assertions (`as`)](../level_05/type_assertions.md) — Overriding compiler type decisions.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — Structural typing.

---

## 7. Key Takeaways
- **Excess Property Checks** block fresh object literals from declaring fields not defined in the target type.
- This is a special, strict validation designed to catch spelling typos.
- The check only applies to fresh object literals created inline.
- Assigning the object literal to a variable first removes freshness and bypasses the check.
- Adding an index signature (`[key: string]: any`) to the interface allows the type to accept arbitrary extra properties safely.
