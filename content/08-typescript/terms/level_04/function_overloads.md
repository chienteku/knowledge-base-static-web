# Function Overloads

> **Level 4 — Functions**
> A powerful technique used when a single function can accept different types of arguments and return different types of data based on what was passed in. You define multiple "signatures" for a single implementation.

---

## 1. Prerequisites
- [Function Types](function_types.md) — The standard way to type functions.
- [Union Types (`|`)](../level_05/union_types.md) — The underlying mechanic that handles the implementation.

---

## 2. Term Category
- **TypeScript Advanced Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine a highly flexible utility function `formatData`. 
- If you pass it a `string`, it returns a `string`.
- If you pass it an `array`, it returns an `array`.

You could type this using Union types: `function formatData(data: string | string[]): string | string[]`.
The problem? If you pass a `string`, TypeScript still thinks the return value is `string | string[]`. It loses the specific 1-to-1 relationship. You won't be able to call `.toUpperCase()` on the result because TS thinks it might be an array!
**Function Overloads** solve this by allowing you to write specific, strict rules for the function.

### (2) Writing Overloads
An overload consists of two parts:
1. **The Overload Signatures:** The strict rules (no function body).
2. **The Implementation Signature:** The actual function body (typed very loosely to handle all cases).

```typescript
// 1. The Overload Signatures (The rules the developer sees)
function formatData(data: string): string;
function formatData(data: string[]): string[];

// 2. The Implementation (What actually runs. Hidden from the user)
function formatData(data: unknown): unknown {
  if (typeof data === "string") {
    return data.trim();
  } else if (Array.isArray(data)) {
    return data.map(item => item.trim());
  }
}

// ✅ TS knows exactly what the return types are!
const a = formatData(" Hello ");       // TS knows `a` is strictly a `string`
const b = formatData([" A ", " B "]);  // TS knows `b` is strictly a `string[]`
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Making the implementation signature too strict

**The mistake:** A developer writes the overloads, but tries to strictly type the implementation:
```typescript
function get(id: number): User;
function get(name: string): User;
function get(idOrName: number | string): User { ... } // Compiler error!
```

**Why it's wrong:** The implementation signature MUST be loose enough to satisfy ALL of the overload signatures above it. If you add an overload later, you might break the implementation signature.
**Golden Rule:** The implementation signature is completely invisible to the person calling the function. Therefore, it is often best to type the implementation parameters as loosely as possible (e.g., `any` or `unknown`) and rely on your runtime `if` checks. The safety comes from the Overload Signatures above it.

---



### Mistake 2: Calling Function Implementation Signature directly instead of Overload Signatures

**The mistake:** Expecting callers to be able to use parameter types specified ONLY in the implementation signature.

**Why it's wrong:** The implementation signature is NOT visible to external callers! Only overload signatures above the implementation are exposed.

*Incorrect:*
```typescript
function combine(a: string, b: string): string;
function combine(a: number, b: number): number;
function combine(a: any, b: any): any { return a + b; }
// combine(true, false); // ❌ Overload signature matching failed, despite 'any' implementation signature!
```

*Fix:*
```typescript
function combine(a: boolean, b: boolean): boolean; // Add explicit overload signature
function combine(a: string, b: string): string;
function combine(a: number, b: number): number;
function combine(a: any, b: any): any { return a + b; }
```

### Mistake 3: Writing Incompatible Implementation Signatures

**The mistake:** Writing an implementation signature that cannot accept parameter types defined in overload signatures.

**Why it's wrong:** The implementation signature must be broad enough to accommodate every preceding overload signature.

*Incorrect:*
```typescript
function parse(x: string): number;
function parse(x: number): string;
// function parse(x: string): any {} // ❌ Implementation signature is not compatible with overload 2
```

*Fix:*
```typescript
function parse(x: string): number;
function parse(x: number): string;
function parse(x: string | number): any {} // Accepts all overload variants
```

## 6. Practice Exercises

### Exercise 1: The Invisible Implementation

**Problem:** If you hover over the `formatData` function call in your IDE, how many signatures will it show you? Will it show you the implementation signature?

**Expected output:**
> [!check]- Answer
> ```text
> It will show you exactly TWO signatures (1/2: string -> string, and 2/2: string[] -> string[]).
> It will completely hide the implementation signature from the IDE tooltip. The implementation is just the "engine"; the overloads are the "interface".
> ```
> - Overloads exist to create a clean developer experience.

---



### Exercise 2: Single vs Multi-Argument Overloads

**Problem:** Create overloads for `makeList(item: string): string[]` and `makeList(items: string[]): string[]`.

**Expected output:**
> [!check]- Answer
> ```text
> Overload signatures created
> ```
> ```typescript
> function makeList(item: string): string[];
> function makeList(items: string[]): string[];
> function makeList(arg: string | string[]): string[] {
>   return Array.isArray(arg) ? arg : [arg];
> }
> console.log("Overload signatures created");
> ```
>
> **Explanation:** Function overloads specify precise input/output mapping contracts.

---

### Exercise 3: Overload Order Precedence

**Problem:** Explain why specific overload signatures must be ordered BEFORE generic overload signatures.

**Expected output:**
> [!check]- Answer
> ```text
> TypeScript evaluates overload signatures in top-to-bottom order
> ```
> ```typescript
> console.log("TypeScript evaluates overload signatures in top-to-bottom order");
> ```
>
> **Explanation:** TS matches the first compatible overload signature from top to bottom.

## 7. Related Terms
- [Function Types](function_types.md) — What you are overloading.
- [Union Types (`|`)](../level_05/union_types.md) — What you use inside the implementation body.

---

## 8. Key Takeaways
- **Function Overloads** allow a single function to have multiple distinct type signatures.
- They are used when the Return Type changes based specifically on the Parameter Type.
- You define Overloads by writing multiple function signatures (without bodies) stacked on top of an Implementation signature (with a body).
- The IDE autocomplete only shows the Overload signatures; the implementation signature is hidden from the user.
