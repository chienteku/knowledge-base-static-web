# Multiple Generics

> **Level 7 — Generics**
> The practice of defining more than one Generic type parameter (e.g., `<T, U, V>`) for a single function or interface, allowing for complex relationships between different inputs.

---

## 1. Prerequisites
- [Generics Overview (`<T>`)](generics.md) — The base syntax.
- [Generic Constraints (`extends`)](generic_constraints.md) — Often used to link multiple generics together.

---

## 2. Term Category

**TypeScript Advanced Type** (Multi-Type Parameter Generics): Multiple generic type parameters (`<T, U, V>`) instantiate multiple independent parametric type variables within functions, classes, or interfaces.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Mapping Key-Value Pairs with Dual Generics

**Scenario:**
Create a `Pair<K, V>` interface representing key-value tuple pairs with distinct generic parameters.

**Requirements:**
1. Declare `<K, V>` in `Pair`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Pair<K, V> {
>   key: K;
>   value: V;
> }
> 
> const entry: Pair<string, number> = { key: "age", value: 30 };
> const flag: Pair<number, boolean> = { key: 1, value: true };
> ```
> 
> #### Technical Explanation
>
> 1. Multiple generic parameters (`<K, V>`) allow functions or interfaces to handle multiple independent types.
> 2. `key` is bound to `K` while `value` is bound to `V` independently.
> 3. Standard structure for dictionary entries and key-value mapping tuples.
> 
---

### Exercise 2: Mapping Tuple Transformation Functions

**Scenario:**
Create a generic `mapPair<T, U, R>` function that takes a pair `[T, U]` and a mapper function `(t: T, u: U) => R`.

**Requirements:**
1. Declare three generic parameters `<T, U, R>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function mapPair<T, U, R>(
>   pair: [T, U],
>   mapper: (first: T, second: U) => R
> ): R {
>   return mapper(pair[0], pair[1]);
> }
> 
> const formatted = mapPair([10, "apples"], (qty, item) => `${qty} ${item}`);
> console.log(formatted); // "10 apples" (inferred as string)
> ```
> 
> #### Technical Explanation
>
> 1. `T` and `U` represent input tuple element types, while `R` represents the mapped return type.
> 2. TypeScript automatically infers `T=number`, `U=string`, and `R=string` from function arguments.
> 3. Advanced functional composition utility.
> 
---

### Exercise 3: Naming Conventions for Multiple Generics Audit

**Scenario:**
Explain standard naming conventions for multiple generic type parameters (`T`, `U`, `V`, `K`, `V`, `E`).

**Requirements:**
1. List standard generic parameter naming rules.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Generic Parameter Naming Conventions:
> - T: Type (Default generic choice)
> - U, V: Subsequent generic types following T
> - K, V: Key and Value (used in dictionaries / maps)
> - E: Element (used in collections / arrays)
> - P: Property / Props (used in React / Component frameworks)
> - R: Return type (used in function wrappers)
> ```
> 
> #### Technical Explanation
>
> 1. Single uppercase letters are traditional conventions for short generic type variables.
> 2. For complex domain logic, descriptive multi-letter generic names (e.g. `<TEntity, TResponse>`) can be used for clarity.
> 3. Promotes readable codebase conventions.
> 
---



## 6. Related Terms
- [`keyof` Operator](../level_09/keyof.md) — The operator used to link `K extends keyof T`.
- [Generic Constraints (`extends`)](generic_constraints.md) — How you relate `U` to `T`.

---

## 7. Key Takeaways
- You can declare **Multiple Generics** using comma-separated syntax: `<T, U, V>`.
- It is used when a function or class manages multiple independent types simultaneously.
- You can constrain one Generic using another Generic (e.g., `<T, K extends keyof T>`), which is how TypeScript achieves perfect autocomplete for dynamic object property access.
- For complex code, abandon single-letter variables (`T`, `U`) and use descriptive names (`TState`, `TConfig`).
