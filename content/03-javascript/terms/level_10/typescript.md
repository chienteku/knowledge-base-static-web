# TypeScript

> **Level 10 — Ecosystem & Tooling**
> A superset of JavaScript developed by Microsoft that adds optional static typing to the language.

---

## 1. Prerequisites
- [Primitive Types](../level_01/primitive_types.md) — The core concept TypeScript is enforcing.
- [Babel](babel.md)

---

## 2. Term Category
- **Language Extension / Tooling**

---

## 3. Environment Context
- **Development Environment** (Browsers cannot run TypeScript natively!)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is a **Dynamically Typed** language. This means a variable can hold a `Number`, and one second later, you can overwrite it with a `String`. A function `calculateTotal(price)` doesn't actually force you to pass in a number. If you accidentally pass in the string `"10"`, JavaScript won't stop you until the code runs and crashes in front of the user. In massive enterprise applications with hundreds of developers, this lack of strict rules causes thousands of bugs.

Microsoft created **TypeScript** to fix this. It is a "Superset" of JavaScript, meaning every valid JS file is a valid TS file, but TS adds extra syntax for **Static Typing**. You explicitly declare: "This variable is a Number, and this function MUST receive a String." 
If you break the rule, the TypeScript compiler screams at you with a red underline directly in your code editor *before you even run the code*. 

### (2) Reality Metaphor
Writing JavaScript is like driving a car with no seatbelts and no lane-departure warnings. You have total freedom to drift anywhere, but if you make a mistake, you crash hard.
Writing TypeScript is like driving a car with strict lane-assist and auto-braking. It forces you to stay in your lane (stick to your data types). If you try to drift out of your lane, the steering wheel vibrates and stops you instantly. It takes a bit more effort to drive, but it prevents fatal crashes.

### (3) JavaScript Code Examples

#### Example 1: The TypeScript Syntax (File must end in `.ts`)
```typescript
// 1. Variable Typing (Notice the : string)
let userName: string = "Alice";

// userName = 123; // ERROR: Type 'number' is not assignable to type 'string'.

// 2. Function Typing (Defining the inputs and the output)
// price MUST be a number, tax MUST be a number, and it MUST return a number!
function calculateTotal(price: number, tax: number): number {
  return price + (price * tax);
}

// calculateTotal("100", 0.05); // ERROR: Argument of type 'string' is not assignable...
```

#### Example 2: Interfaces
```typescript
// Interfaces allow you to define the exact shape an Object MUST have!
interface User {
  id: number;
  name: string;
  isAdmin: boolean;
}

// If we miss a property, or use the wrong type, TypeScript throws an error!
const myUser: User = {
  id: 101,
  name: "Bob",
  isAdmin: false
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Typescript Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Typescript blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "typescript";
```

*Fix:*
```javascript
let value = "typescript";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Typescript Callbacks

**The mistake:** Passing methods from Typescript instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "typescript",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "typescript",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Typescript Operations

**The mistake:** Executing asynchronous operations within Typescript without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/typescript"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/typescript");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in typescript: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Type Inference

**Problem:** If you write `let score = 100;` in TypeScript (without explicitly adding `: number`), what happens if you later try to write `score = "High Score";`?

**Expected output:**
> [!check]- Answer
> ```text
> It will throw an error! 
> TypeScript is incredibly smart. Even if you don't explicitly write the type, it uses **Type Inference** to guess what you meant. It saw you assign `100`, so it permanently locked the `score` variable to be a `number`.
> ```
> - TypeScript assumes you meant to be strict from the very first assignment.
> 
---

### Exercise 2: Defining Interfaces and Types

**Problem:** Define `interface User { id: number; name: string; }` and validate object declaration.

**Expected output:**
> [!check]- Answer
> ```text
> TypeScript Interface verified
> ```
> ```javascript
> console.log("TypeScript Interface verified");
> ```
>
> **Explanation:** Interfaces define structured compile-time shape contracts for objects.
> 
---

### Exercise 3: Type Narrowing with Type Guards

**Problem:** Demonstrate narrowing `unknown` input using `typeof val === 'string'`.

**Expected output:**
> [!check]- Answer
> ```text
> Type narrowed to string
> ```
> ```javascript
> function printString(val) {
>   if (typeof val === "string") {
>     console.log("Type narrowed to string");
>   }
> }
> printString("hello");
> ```
>
> **Explanation:** Control flow type guards narrow generic types into specific types safely.
> 
> 
---

## 7. Related Terms
- [Babel](babel.md) — Often used alongside TypeScript to compile the code for the browser.
- [Primitive Types](../level_01/primitive_types.md) — The building blocks of TypeScript's rules.
- [Alternative Runtimes (Deno / Bun)](alternative_runtimes.md) — Related concept: Alternative Runtimes (Deno / Bun).
- [Linter (ESLint) & Formatter (Prettier)](linter_formatter.md) — Related concept: Linter (ESLint) & Formatter (Prettier).
- [Runtime vs Compile Time](runtime_vs_compile_time.md) — Related concept: Runtime vs Compile Time.
- [ECMAScript](../level_01/ecmascript.md) — ECMAScript static typing.

---

## 8. Key Takeaways
- TypeScript is a superset of JavaScript that adds strict data typing.
- It catches type-related bugs in your code editor *before* the code ever runs.
- It uses syntax like `: string`, `: number`, and `interface`.
- Browsers cannot read TypeScript. It must be compiled (stripped of its types) into standard JavaScript before deployment.
```
