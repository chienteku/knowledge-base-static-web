# Arrays & Tuples

> **Level 2 — Basic Types**
> TypeScript's way of typing lists of data. **Arrays** are lists of infinite length containing a specific type. **Tuples** are lists of a *fixed* length where each specific position has a specific type.

---

## 1. Prerequisites
- [Primitive Types](../level_02/primitive_types.md) — What is usually placed inside these lists.

---

## 2. Term Category
- **TypeScript Type Annotation**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Union Array

**Problem:** You have an array that needs to hold *both* strings and numbers, in any order, with no fixed length. e.g., `["Alice", 5, "Bob", 10]`. How do you type this array?

**Expected output:**
> [!check]- Answer
> ```typescript
> // You use a Union Type wrapped in parentheses!
> const mixedData: (string | number)[] = ["Alice", 5, "Bob"];
> ```
> - How do you say "string OR number"?

---



### Exercise 2: Defining Named Tuple Types

**Problem:** Define a named tuple type `type Response = [status: number, message: string]`.

**Expected output:**
> [!check]- Answer
> ```text
> Named tuple type defined
> ```
> ```typescript
> type Response = [status: number, message: string];
> const res: Response = [200, "OK"];
> console.log("Named tuple type defined");
> ```
>
> **Explanation:** Named tuple labels improve IDE readability and documentation clarity.

---

### Exercise 3: Readonly Tuple Protection

**Problem:** Create a readonly tuple `readonly [x: number, y: number]`.

**Expected output:**
> [!check]- Answer
> ```text
> Readonly tuple prevents mutations
> ```
> ```typescript
> const point: readonly [number, number] = [10, 20];
> console.log("Readonly tuple prevents mutations");
> ```
>
> **Explanation:** `readonly` tuple types disable array mutator methods like `push` or `pop`.

## 7. Related Terms
- [Primitive Types](../level_02/primitive_types.md) — The building blocks of arrays.
- [Union Types](../level_05/union_types.md) — Used to allow multiple different types inside a single array.

---

## 8. Key Takeaways
- **Arrays** (`string[]` or `Array<string>`) represent a list of infinite length where every item must match the specified type.
- **Tuples** (`[string, number]`) represent a list of a *strict fixed length*, where each specific index has a specific required type.
- Tuples are heavily used in modern frameworks for returning multiple values from a function (like React hooks or Vue composables).
