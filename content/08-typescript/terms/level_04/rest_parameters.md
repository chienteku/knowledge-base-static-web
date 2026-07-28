# Rest Parameters (`...`)

> **Level 4 — Functions**
> A syntax that allows a function to accept an infinite number of arguments as an array. In TypeScript, Rest Parameters must always be typed as an Array.

---

## 1. Prerequisites
- [Function Types](../level_04/function_types.md) — The context where rest parameters are used.
- [Arrays & Tuples](../level_02/arrays_tuples.md) — The type you must apply to a rest parameter.

---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you want a function to take an arbitrary number of arguments. For example, `Math.max(1, 5, 10, 2)` can take four numbers, or it can take four hundred numbers.
In ES6 JavaScript, we use the Rest operator (`...`) to gather all those loose arguments into a single Array inside the function. 
In TypeScript, because those arguments are gathered into an Array, you MUST type the Rest parameter as an Array.

### (2) Typing the Rest Parameter
You add the `...` before the parameter name, and you type it as `type[]`.

```typescript
// `numbers` will be an array of numbers
function sumAll(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

// ✅ Valid: passing 3 loose arguments
sumAll(10, 20, 30); 

// ✅ Valid: passing 0 arguments (numbers will be `[]`)
sumAll(); 
```

### (3) Mixing Regular and Rest Parameters
Just like optional parameters, the Rest parameter must be the **very last** parameter in the list. It gathers up whatever is "rest" (left over).

```typescript
function buildTeam(captain: string, ...members: string[]) {
  console.log(`Captain: ${captain}, Team: ${members.join(", ")}`);
}

buildTeam("Alice", "Bob", "Charlie", "Dave");
// captain = "Alice"
// members = ["Bob", "Charlie", "Dave"]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not typing it as an Array

**The mistake:** A developer writes: `function printAll(...items: string) {}`

**Why it's wrong:** The developer thinks "items are strings, so I type it as a string". But the `...` operator literally creates a JavaScript Array containing all the arguments. If you type it as a `string`, TypeScript will throw an error because a `string` is not an Array.
**Golden Rule:** A Rest parameter MUST be typed as an Array (`type[]` or `Array<type>`) or a Tuple.

---



### Mistake 2: Annotating Rest Parameters as Non-Array Types

**The mistake:** Writing `function sum(...nums: number)` (TS1014).

**Why it's wrong:** Rest parameters gather trailing arguments into an array. Their type annotation MUST be an array or tuple type (`number[]` or `Array<number>`).

*Incorrect:*
```typescript
// function sum(...nums: number) {} // ❌ A rest parameter must be of an array type
```

*Fix:*
```typescript
function sum(...nums: number[]) {} // Correct array annotation
```

### Mistake 3: Placing Rest Parameters Before Other Parameters

**The mistake:** Writing `function log(...tags: string[], msg: string)`.

**Why it's wrong:** Rest parameters MUST be the last parameter in function parameter lists.

*Incorrect:*
```typescript
// function log(...tags: string[], msg: string) {} // ❌ A rest parameter must be last
```

*Fix:*
```typescript
function log(msg: string, ...tags: string[]) {} // Correct position
```

## 6. Practice Exercises

### Exercise 1: Spreading an Array into a Rest Parameter

**Problem:** You have a function `function add(...nums: number[])`. You also have an array `const myNums = [1, 2, 3]`. How do you pass `myNums` into the `add` function?

**Expected output:**
> [!check]- Answer
> ```typescript
> // You use the Spread operator!
> add(...myNums);
> ```
> - The Spread operator is the exact opposite of the Rest operator, but it uses the exact same `...` syntax!

---



### Exercise 2: Tuple Rest Parameters

**Problem:** Define rest parameter using tuple type `...args: [name: string, age: number]`.

**Expected output:**
> [!check]- Answer
> ```text
> Tuple rest parameters verified
> ```
> ```typescript
> function createUser(...args: [name: string, age: number]) {
>   console.log(`${args[0]}, ${args[1]}`);
> }
> createUser("Alice", 30);
> console.log("Tuple rest parameters verified");
> ```
>
> **Explanation:** Rest tuple parameters enforce strong positional argument validation.

---

### Exercise 3: Rest Parameters in Function Type Aliases

**Problem:** Define type `type Handler = (...args: unknown[]) => void`.

**Expected output:**
> [!check]- Answer
> ```text
> Handler type created
> ```
> ```typescript
> type Handler = (...args: unknown[]) => void;
> const h: Handler = (a, b) => {};
> console.log("Handler type created");
> ```
>
> **Explanation:** `...args: unknown[]` permits functions taking arbitrary parameter lengths.

## 7. Related Terms
- [Arrays & Tuples](../level_02/arrays_tuples.md) — The type required for Rest parameters.
- [Function Types](../level_04/function_types.md) — The parent topic.

---

## 8. Key Takeaways
- **Rest Parameters** (`...args`) allow a function to accept an infinite number of positional arguments.
- Under the hood, JS gathers these arguments into an Array.
- Therefore, in TypeScript, you MUST type the Rest parameter as an array (e.g., `...args: string[]`).
- The Rest parameter must always be the very last parameter in the function signature.
