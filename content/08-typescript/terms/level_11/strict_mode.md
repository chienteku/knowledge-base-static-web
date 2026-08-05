# Strict Mode

> **Level 11 — Modules, Declaration Files & Configuration**
> The ultimate compiler flag in `tsconfig.json` that enables a comprehensive suite of rigorous type-checking rules, forcing you to write significantly safer and more explicit code.

---

## 1. Prerequisites
- [`tsconfig.json`](../level_01/tsconfig.md) — The configuration file where this flag is enabled.
---

## 2. Term Category
TypeScript Compiler Configuration

---

## 3. Core Definition
By default, the TypeScript compiler is actually very lenient. It allows variables to implicitly fall back to `any`, and it doesn't care if a value might be `null` or `undefined`. 

When you set `"strict": true` in your `tsconfig.json`, it acts as a master switch that simultaneously turns on over a half-dozen rigid checking flags (like `strictNullChecks`, `noImplicitAny`, and `strictBindCallApply`). 

---

## 4. Key Characteristics / Rules
- **The Industry Standard:** Starting a new TypeScript project without `"strict": true` is widely considered bad practice.
- **Future-Proof:** As the TypeScript team invents new, stricter rules in future updates, they are automatically added to the `strict` family.

---

## 5. Typical Usage / Common Patterns

### What "Strict Mode" Prevents: Implicit Any
Without strict mode, this compiles fine:
```typescript
// TS quietly assumes 'message' is of type 'any'
function logMessage(message) {
  console.log(message.toLowerCase());
}
```
With `strict: true` (specifically `noImplicitAny`), the compiler throws an error: `Parameter 'message' implicitly has an 'any' type.`

### What "Strict Mode" Prevents: Null Pointer Exceptions
Without strict mode, this compiles fine:
```typescript
const element = document.getElementById("my-btn");
// element could be null, but TS doesn't care!
element.click(); 
```
With `strict: true` (specifically `strictNullChecks`), the compiler throws an error: `Object is possibly 'null'.` You are forced to write an `if (element)` check before calling `.click()`.

---

## 6. Common Pitfalls
- **Migrating Old Projects:** Turning on `"strict": true` in a massive, legacy JavaScript project that was just converted to TypeScript will result in thousands of errors. In these cases, teams usually turn it off and manually enable specific flags (like `strictNullChecks`) one by one.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Disabling `strictNullChecks` in `tsconfig.json`

**The mistake:** Setting `"strictNullChecks": false` in `tsconfig.json`.

**Why it's wrong:** Disabling strict null checks allows `null` and `undefined` to be assigned to any type, re-introducing `undefined is not a function` runtime crashes.

*Incorrect:*
```typescript
// tsconfig.json
{ "compilerOptions": { "strictNullChecks": false } } // ❌ Sacrifices null safety
```

*Fix:*
```typescript
// tsconfig.json
{ "compilerOptions": { "strictNullChecks": true } } // Enforces nullish type isolation
```

### Mistake 2: Bypassing `noImplicitAny` by Omitting Parameter Annotations

**The mistake:** Writing `function process(data)` with `noImplicitAny: false`.

**Why it's wrong:** Allowing implicit `any` parameter types turns off type checking for functions, allowing invalid types to pass unchecked.

*Incorrect:*
```typescript
// function process(data) {} // ❌ Implicit any hides parameter bugs
```

*Fix:*
```typescript
function process(data: unknown) {} // Explicit parameter type annotation
```

### Mistake 3: Disabling `strictPropertyInitialization` in Classes with Unassigned Fields

**The mistake:** Setting `"strictPropertyInitialization": false` to avoid initializing class properties in constructors.

**Why it's wrong:** Disabling property initialization checks permits uninitialized class properties to be read as `undefined` at runtime.

*Incorrect:*
```typescript
// tsconfig.json
{ "compilerOptions": { "strictPropertyInitialization": false } }
```

*Fix:*
```typescript
// tsconfig.json
{ "compilerOptions": { "strictPropertyInitialization": true } }
```

## 6. Practice Exercises



### Exercise 1: Enabling `strict: true` Flag

**Problem:** Configure `"strict": true` in `tsconfig.json`.

**Expected output:**
> [!check]- Answer
> ```text
> Strict mode enabled
> ```
> ```typescript
> console.log("Strict mode enabled");
> ```
>
> **Explanation:** `"strict": true` activates all strict type checking flags in TypeScript.

---

### Exercise 2: Strict Flags Family Members

**Problem:** Name 3 strict flags activated by `"strict": true` (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`).

**Expected output:**
> [!check]- Answer
> ```text
> strictNullChecks, noImplicitAny, strictBindCallApply
> ```
> ```typescript
> console.log("strictNullChecks, noImplicitAny, strictBindCallApply");
> ```
>
> **Explanation:** `strict: true` turns on the full family of strict safety flags.

---

### Exercise 3: Strict Bind Call Apply Verification

**Problem:** Explain what `strictBindCallApply` checks (Verifies parameter types in `.call()`, `.apply()`, and `.bind()`).

**Expected output:**
> [!check]- Answer
> ```text
> Verifies argument types passed to call, apply, and bind
> ```
> ```typescript
> console.log("Verifies argument types passed to call, apply, and bind");
> ```
>
> **Explanation:** `strictBindCallApply` checks function invocation methods for argument parameter compatibility.

## 7. Related Terms
- [any](../level_02/any.md) — The dangerous "escape hatch" type that `strict` mode actively tries to prevent you from falling into accidentally.

---
