# Arrays & Tuples

> **Level 2 — Basic Types**
> TypeScript's way of typing lists of data. **Arrays** are lists of infinite length containing a specific type. **Tuples** are lists of a *fixed* length where each specific position has a specific type.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — What is usually placed inside these lists.

---

## 2. Term Category

**TypeScript Core Syntax** (Homogeneous & Fixed-Length Collections): Arrays (`T[]`) store homogeneous element sequences, whereas Tuples (`[T, U]`) enforce fixed length and element type positions.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
In JavaScript, an array can hold anything: `[1, "apple", true, {}]`. This flexibility is a nightmare for predictability. If you loop over this array and try to call `.toUpperCase()`, the program will crash when it hits the number `1`.
TypeScript forces you to declare exactly what is allowed inside the array. 

### (2) Arrays (Infinite length, single type)
You can type an array by taking a base type and appending `[]`. 
Alternatively, you can use the Generic syntax `Array<type>`.
```typescript
// Both of these mean the exact same thing: A list of text.
const names: string[] = ["Alice", "Bob"];
const jobs: Array<string> = ["Engineer", "Designer"];

names.push("Charlie"); // ✅ Allowed
names.push(5);         // ❌ Error: Argument of type 'number' is not assignable to parameter of type 'string'.
```

### (3) Tuples (Fixed length, positional types)
Sometimes, you want an array to act like a strict data record. For example, a coordinate pair `[X, Y]` must *always* have exactly two numbers. Or a React `useState` hook always returns exactly two things: `[value, setterFunction]`.
This is a **Tuple**. You define it using square brackets containing the exact types in the exact order.
```typescript
// A Tuple: Exactly a string, followed by exactly a number.
const userRecord: [string, number] = ["Alice", 28];

const badRecord: [string, number] = [28, "Alice"]; // ❌ Error: Order matters!
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating Tuples via Push

**The mistake:** A developer defines a strict Tuple `const point: [number, number] = [10, 20];`. They then write `point.push(30);`.

**Why it's wrong:** Historically, due to limitations in how TypeScript models JavaScript arrays, calling `.push()` on a Tuple did NOT throw a compilation error in older TS versions! It would mutate the fixed-length tuple at runtime.
**Golden Rule:** Tuples are meant to be fixed-length data structures. Treat them as immutable. If you need to add items, use a standard Array `number[]`. (Note: In very recent TS versions, tuple pushing behavior has been made safer, but mutating them is still an anti-pattern).

---



### Mistake 2: Using `.push()` on Tuples Bypassing Defined Element Count Restrictions

**The mistake:** Calling `tuple.push(3)` on tuple type `[number, string]`.

**Why it's wrong:** TypeScript tuple types enforce fixed element types by position, but underlying JS arrays permit `.push()`, causing tuple array length mutations.

*Incorrect:*
```typescript
const pair: [number, string] = [1, "a"];
pair.push(100); // ❌ Compiles due to array prototype methods, mutating tuple length!
```

*Fix:*
```typescript
const pair: readonly [number, string] = [1, "a"];
// pair.push(100); // ❌ Readonly tuple prevents push mutations
```

### Mistake 3: Confusing Array Union Types with Tuple Position Types

**The mistake:** Writing `const items: (number | string)[]` expecting element 0 to be number and element 1 to be string.

**Why it's wrong:** ` (number | string)[]` is an array containing numbers or strings in ANY position. Tuple `[number, string]` enforces exact positional types.

*Incorrect:*
```typescript
const point: (number | number)[] = [10, 20]; // Plain array
```

*Fix:*
```typescript
const point: [number, number] = [10, 20]; // Positional fixed tuple
```

## 5. Practice Exercises

### Exercise 1: Defining Fixed-Length Tuples

**Scenario:**
Create a tuple type representing an HTTP response status code and message pair `[number, string]`.

**Requirements:**
1. Define tuple type `HttpResponse`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type HttpResponse = [statusCode: number, message: string];
> 
> const successResponse: HttpResponse = [200, "OK"];
> const notFoundResponse: HttpResponse = [404, "Not Found"];
> 
> // const invalid: HttpResponse = ["OK", 200]; // ❌ Compile Error: Type positions swapped!
> ```
> 
> #### Technical Explanation
>
> 1. Tuples enforce exact array length and element types at specific index positions.
> 2. Labeled tuple elements (`statusCode: number`) improve code readability and IDE tooltips.
> 3. Standard structure for returning fixed pairs or triples from functions.
> 
---

### Exercise 2: Creating Readonly Tuples with `as const`

**Scenario:**
Define a immutable coordinate tuple `[x, y]` using `readonly` tuples or `as const`.

**Requirements:**
1. Prevent array mutation methods (`push`, `pop`) on coordinate tuples.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const origin = [0, 0] as const; // Inferred as readonly [0, 0]
> 
> // origin.push(1); // ❌ Compile Error: Property 'push' does not exist on type 'readonly [0, 0]'.
> // origin[0] = 5;  // ❌ Compile Error: Cannot assign to read-only property!
> ```
> 
> #### Technical Explanation
>
> 1. Standard arrays allow mutation operations (`push`, `pop`) even on fixed types.
> 2. `readonly` tuples or `as const` freeze tuple length and element immutability at compile time.
> 3. Protects constant tuple configurations from accidental mutation.
> 
---

### Exercise 3: Array Union Types vs Tuple Types

**Scenario:**
Formulate an architectural comparison matrix contrasting Array Types (`(string | number)[]`) against Tuple Types (`[string, number]`).

**Requirements:**
1. Contrast element ordering constraints, variable array length, and access type safety.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Array vs Tuple Matrix:
> - Array ((string | number)[]): Variable length, elements can appear in any order at any index.
> - Tuple ([string, number]): Fixed length (2 elements), index 0 MUST be string, index 1 MUST be number.
> ```
> 
> #### Technical Explanation
>
> 1. Arrays represent unbounded homogeneous or union collections.
> 2. Tuples represent fixed-structure heterogeneous records.
> 3. Core distinction for data structure representation in TypeScript.
> 
---



## 6. Related Terms
- [Primitive Types](primitive_types.md) — The building blocks of arrays.
- [Union Types (`|`)](../level_05/union_types.md) — Used to allow multiple different types inside a single array.
- [Rest Parameters (`...`)](../level_04/rest_parameters.md) — Related concept: Rest Parameters (`...`).
- [Readonly Properties (`readonly`)](../level_03/readonly.md) — Readonly tuples and arrays.

---

## 7. Key Takeaways
- **Arrays** (`string[]` or `Array<string>`) represent a list of infinite length where every item must match the specified type.
- **Tuples** (`[string, number]`) represent a list of a *strict fixed length*, where each specific index has a specific required type.
- Tuples are heavily used in modern frameworks for returning multiple values from a function (like React hooks or Vue composables).
