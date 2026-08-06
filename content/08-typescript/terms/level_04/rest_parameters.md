# Rest Parameters (`...`)

> **Level 4 — Functions**
> A syntax that allows a function to accept an infinite number of arguments as an array. In TypeScript, Rest Parameters must always be typed as an Array.

---

## 1. Prerequisites
- [Function Types](function_types.md) — The context where rest parameters are used.
- [Arrays & Tuples](../level_02/arrays_tuples.md) — The type you must apply to a rest parameter.

---

## 2. Term Category

**TypeScript Core Syntax** (Variadic Rest Parameter Typing): Rest parameters (`...args: T[]`) capture variable numbers of trailing function arguments into a type-safe array or tuple.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Typing Variadic Functions with Rest Parameters

**Scenario:**
Create a `sumNumbers` utility function accepting a variable number of numeric arguments.

**Requirements:**
1. Annotate rest parameter `...numbers: number[]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function sumNumbers(...numbers: number[]): number {
>   return numbers.reduce((acc, curr) => acc + curr, 0);
> }
> 
> const total1 = sumNumbers(10, 20, 30);       // 60
> const total2 = sumNumbers(5, 15, 25, 35, 45); // 125
> ```
> 
> #### Technical Explanation
>
> 1. Rest parameters (`...numbers: number[]`) gather all remaining call arguments into a type-safe array.
> 2. Must be the last parameter in the function declaration.
> 3. Enforces element type consistency across variable argument lists.
> 
---

### Exercise 2: Tuple Rest Parameters for Leading Parameter Typing

**Scenario:**
Use tuple rest parameters to require a string action name followed by a variable tuple of payload parameters.

**Requirements:**
1. Annotate tuple rest parameters `...args: [action: string, ...data: number[]]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type ActionTuple = [action: string, ...payload: number[]];
> 
> function dispatchAction(...[action, ...data]: ActionTuple) {
>   console.log(`Action: ${action}, Data Count: ${data.length}`);
> }
> 
> dispatchAction("ADD", 10, 20, 30);
> ```
> 
> #### Technical Explanation
>
> 1. Rest elements in tuples (`[string, ...number[]]`) allow defining exact leading argument types followed by dynamic trailing arguments.
> 2. Enables type-safe tuple destructuring in variadic function signatures.
> 3. Advanced parameter typing pattern.
> 
---

### Exercise 3: Spreading Readonly Tuples into Rest Parameters

**Scenario:**
Spread a `const` tuple into a function expecting rest parameters using `as const`.

**Requirements:**
1. Pass `[10, 20]` tuple into function using spread operator `...args`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function multiply(a: number, b: number): number {
>   return a * b;
> }
> 
> const tuple = [5, 4] as const; // Inferred as readonly [5, 4] tuple
> 
> // Valid spread invocation:
> const result = multiply(...tuple);
> ```
> 
> #### Technical Explanation
>
> 1. Spreading a mutable array (`number[]`) into positional arguments fails because array length is unbounded.
> 2. Marking the tuple `as const` informs TypeScript of its exact fixed length (2 elements).
> 3. Allows type-safe parameter spreading into positional arguments.
> 
---



## 6. Related Terms
- [Arrays & Tuples](../level_02/arrays_tuples.md) — The type required for Rest parameters.
- [Function Types](function_types.md) — The parent topic.

---

## 7. Key Takeaways
- **Rest Parameters** (`...args`) allow a function to accept an infinite number of positional arguments.
- Under the hood, JS gathers these arguments into an Array.
- Therefore, in TypeScript, you MUST type the Rest parameter as an array (e.g., `...args: string[]`).
- The Rest parameter must always be the very last parameter in the function signature.
