# Function Overloads

> **Level 4 — Functions**
> A powerful technique used when a single function can accept different types of arguments and return different types of data based on what was passed in. You define multiple "signatures" for a single implementation.

---

## 1. Prerequisites
- [Function Types](function_types.md) — The standard way to type functions.
- [Union Types (`|`)](../level_05/union_types.md) — The underlying mechanic that handles the implementation.

---

## 2. Term Category

**TypeScript Core Syntax** (Multiple Function Signature Polymorphism): Function overloads define multiple candidate parameter/return signatures for a single function implementation.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Authoring Polymorphic Function Overloads

**Scenario:**
Create function overloads for a `formatDate` utility that accepts either a `Date` object or a `number` timestamp, returning a `string`.

**Requirements:**
1. Declare two overload signatures.
2. Author single implementation signature.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // Overload signatures:
> function formatDate(date: Date): string;
> function formatDate(timestamp: number): string;
> 
> // Implementation signature:
> function formatDate(input: Date | number): string {
>   if (input instanceof Date) {
>     return input.toISOString();
>   }
>   return new Date(input).toISOString();
> }
> 
> const s1 = formatDate(new Date());
> const s2 = formatDate(1700000000000);
> ```

> #### Technical Explanation
>
> 1. Overload signatures specify valid argument combinations available to external callers.
> 2. The implementation signature must accept the union of all overload parameters (`Date | number`).
> 3. Callers see only the distinct overload signatures in IDE autocomplete tooltips.

---

### Exercise 2: Differing Return Types Based on Input Overloads

**Scenario:**
Create overloaded `createElement` signatures returning `HTMLImageElement` when tag is `"img"` and `HTMLHeadingElement` when tag is `"h1"`.

**Requirements:**
1. Return specific HTML element subtypes for specific string literal tags.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function createElement(tag: "img"): HTMLImageElement;
> function createElement(tag: "h1"): HTMLHeadingElement;
> function createElement(tag: string): HTMLElement {
>   return document.createElement(tag);
> }
> 
> const img = createElement("img"); // Typed as HTMLImageElement!
> const h1 = createElement("h1");   // Typed as HTMLHeadingElement!
> ```

> #### Technical Explanation
>
> 1. Literal string parameter overloads map specific input values directly to distinct return subtypes.
> 2. Avoids manual type assertions (`as HTMLImageElement`) at call sites.
> 3. Standard DOM library typing pattern.

---

### Exercise 3: Overload Signature Order Rules Audit

**Scenario:**
Explain why more specific overload signatures must precede more general overload signatures.

**Requirements:**
1. Demonstrate incorrect overload ordering bug.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // ❌ INCORRECT (General signature shadows specific signature):
> // function process(val: any): any;
> // function process(val: string): string;

// ✅ CORRECT (Specific signatures come FIRST):
function process(val: string): string;
function process(val: number): number;
function process(val: unknown): unknown {
  return val;
}
```

> #### Technical Explanation
>
> 1. TypeScript matches overloads sequentially from top to bottom.
> 2. Placing a broad/general overload first causes it to intercept all caller invocations, masking more specific signatures below it.
> 3. Always declare specific overload signatures above generic fallbacks.

---



## 6. Related Terms
- [Function Types](function_types.md) — What you are overloading.
- [Union Types (`|`)](../level_05/union_types.md) — What you use inside the implementation body.

---

## 7. Key Takeaways
- **Function Overloads** allow a single function to have multiple distinct type signatures.
- They are used when the Return Type changes based specifically on the Parameter Type.
- You define Overloads by writing multiple function signatures (without bodies) stacked on top of an Implementation signature (with a body).
- The IDE autocomplete only shows the Overload signatures; the implementation signature is hidden from the user.
