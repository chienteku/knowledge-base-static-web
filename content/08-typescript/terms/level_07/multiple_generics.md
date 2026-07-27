# Multiple Generics

> **Level 7 — Generics**
> The practice of defining more than one Generic type parameter (e.g., `<T, U, V>`) for a single function or interface, allowing for complex relationships between different inputs.

---

## 1. Prerequisites
- [Generics Overview](../level_07/generics.md) — The base syntax.
- [Generic Constraints](../level_07/generic_constraints.md) — Often used to link multiple generics together.

---

## 2. Term Category
- **TypeScript Advanced Mechanics**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes a function deals with two completely unrelated types of data at the same time. 
For example, a function that merges an Object A with an Object B. If you only have one Generic `<T>`, you're forcing Object B to be the exact same type as Object A.
**Multiple Generics** allow you to track completely separate types simultaneously and define the mathematical relationship between them.

### (2) The Syntax
You declare multiple Generics by separating them with commas inside the angle brackets. By convention, developers use `T` (Type), `U`, `V`, `K` (Key), and `V` (Value).

```typescript
// T is the type of obj1. U is the type of obj2.
// The return type is an Intersection of both! (T & U)
function mergeObjects<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const merged = mergeObjects({ name: "Alice" }, { age: 28 });
// TS knows `merged` has both `.name` and `.age`!
```

### (3) Linking Generics Together (The `keyof` operator)
The most powerful use of Multiple Generics is constraining one generic *based on the other*.
Imagine a `getProperty(object, key)` function. You want to ensure the `key` actually exists on the `object`.

```typescript
// 1. T is the Object.
// 2. K is the Key. We constrain K so it MUST be a valid key of T!
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

const user = { name: "Alice", age: 28 };

getProperty(user, "name"); // ✅ Valid
getProperty(user, "email"); // ❌ Error: Argument of type '"email"' is not assignable to parameter of type '"name" | "age"'.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Terrible Naming Conventions in Complex Code

**The mistake:** A developer writes a massive architecture system: `class Manager<T, U, V, X, Y> { ... }`.

**Why it's wrong:** While `T` and `U` are standard conventions for simple functions, using single letters for complex, heavily generic architecture makes the code completely unreadable. 
**Golden Rule:** Just like standard variables, if a Generic has a specific semantic purpose, give it a real name! `class Manager<ConfigType, StateType, EventType>`. (Often, developers prefix them with 'T', e.g., `TConfig`, `TState`).

---



### Mistake 2: Mixing Up Argument Position Ordering in Multi-Generic Invocation

**The mistake:** Calling `pair<number, string>("a", 1)` when parameters expect `(first: T, second: U)`.

**Why it's wrong:** Explicit generic type argument ordering (`<T, U>`) MUST strictly match function parameter ordering `(first: T, second: U)`.

*Incorrect:*
```typescript
function pair<T, U>(a: T, b: U) {}
// pair<number, string>("hello", 42); // ❌ Argument of type 'string' is not assignable to 'number'
```

*Fix:*
```typescript
pair<string, number>("hello", 42); // Correct matching order
```

### Mistake 3: Creating Too Many Unconstrained Multi-Generic Parameters (`<T, U, V, W, X>`)

**The mistake:** Declaring functions with 5+ unconstrained generic type parameters.

**Why it's wrong:** Excessive generic parameters degrade compiler performance, pollute diagnostic messages, and render function signatures unreadable.

*Incorrect:*
```typescript
function complex<T, U, V, W>(a: T, b: U, c: V, d: W) {}
```

*Fix:*
```typescript
type ComplexInput<T, U> = { a: T; b: U };
function simple<T, U>(input: ComplexInput<T, U>) {}
```

## 6. Practice Exercises

### Exercise 1: The Map Function

**Problem:** The built-in Array `.map()` function takes an array of one type, and returns an array of a *potentially different* type. How many generics do you think the `.map()` method uses under the hood?

**Expected output:**
```text
It uses Two! 
1. The type of the items currently in the Array (let's call it `T`).
2. The type of the items being returned by the callback function (let's call it `U`).
`map<U>(callbackfn: (value: T) => U): U[]`
```

> [!check]- Answer
> - Think about `[1, 2, 3].map(n => n.toString())`. Input is number, output is string.

---



### Exercise 2: Generic Map Function Signature

**Problem:** Write `mapArray<T, U>(arr: T[], fn: (item: T) => U): U[]`.

**Expected output:**
```text
[2, 4, 6]
```

> [!check]- Answer
> ```typescript
> function mapArray<T, U>(arr: T[], fn: (item: T) => U): U[] {
>   return arr.map(fn);
> }
> console.log(mapArray([1, 2, 3], x => x * 2));
> ```
>
> **Explanation:** Multi-generics `<T, U>` transform input array element types `T` into output array element types `U`.

### Exercise 3: Pair Tuple Construction

**Problem:** Write `makePair<K, V>(key: K, val: V): [K, V]`.

**Expected output:**
```text
["id", 100]
```

> [!check]- Answer
> ```typescript
> function makePair<K, V>(key: K, val: V): [K, V] {
>   return [key, val];
> }
> console.log(makePair("id", 100));
> ```
>
> **Explanation:** Multi-generics construct strongly-typed tuple key-value pairs.

## 7. Related Terms
- [`keyof` Operator](../level_09/keyof.md) — The operator used to link `K extends keyof T`.
- [Generic Constraints](../level_07/generic_constraints.md) — How you relate `U` to `T`.

---

## 8. Key Takeaways
- You can declare **Multiple Generics** using comma-separated syntax: `<T, U, V>`.
- It is used when a function or class manages multiple independent types simultaneously.
- You can constrain one Generic using another Generic (e.g., `<T, K extends keyof T>`), which is how TypeScript achieves perfect autocomplete for dynamic object property access.
- For complex code, abandon single-letter variables (`T`, `U`) and use descriptive names (`TState`, `TConfig`).
