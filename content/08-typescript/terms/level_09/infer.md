# The `infer` Keyword

> **Level 9 — Advanced Types**
> A compiler keyword used exclusively inside the `extends` clause of Conditional Types to declare a temporary type placeholder variable that the compiler automatically extracts from a matched type pattern.

---

## 1. Prerequisites
- [Conditional Types](../level_09/conditional_types.md) — The type-level `if/else` checks.
- [Generics](../level_07/generics.md) — Parametric type declarations.

---

## 2. Term Category
- **Advanced Type**

---

## 3. Environment Context
- **Build-time** (Like all type-level calculations, `infer` variables exist only during compilation and have zero runtime overhead).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Conditional Types allow you to check if a type matches a specific pattern: `T extends string ? true : false`.

However, you often want to do more than just verify compatibility—you want to **unpack** and **extract** a nested type from a structure. For example, if a type `T` is an array of strings (`string[]`), you might want to extract the inner element type (`string`). If `T` is a Promise (`Promise<User>`), you want to extract the inner resolved value type (`User`).

Since you cannot pass these inner types as generic parameters in advance (because the type being checked is passed dynamically), you need a way to tell the compiler: "Inspect this shape, find what type is sitting in this specific position, capture it, and let me use it."

TypeScript designed the **`infer`** keyword to solve this. It acts as a type capture variable during pattern-matching checks.

### (2) Core Mechanics
The `infer` keyword can **only** be used inside the `extends` clause of a conditional type. 

You write `infer U` (where `U` is a name you choose) inside a type pattern. If the type matches the pattern, the compiler binds the matched type to `U`, making `U` available for use in the "true" branch of the conditional type.

#### Unpacking an Array Element Type
```typescript
type ElementType<T> = T extends (infer U)[] ? U : never;

type StringArray = string[];
type Extracted = ElementType<StringArray>; // Type: string

type NonArray = number;
type Extracted2 = ElementType<NonArray>; // Type: never (doesn't match array pattern)
```

#### Unpacking a Promise Value
```typescript
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

type ResponsePromise = Promise<{ status: number }>;
type Data = UnpackPromise<ResponsePromise>; // Type: { status: number }
```

### (3) Real-World Application
Writing a custom utility type to extract the returning state payload from asynchronous API actions.

```typescript
type ApiCall = (id: string) => Promise<{ name: string; age: number }>;

// Extract the inner resolved data type from any API function signature!
type ApiData<T> = T extends (...args: any[]) => Promise<infer Payload> ? Payload : never;

type UserPayload = ApiData<ApiCall>; // Type: { name: string; age: number }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use `infer` outside of a conditional `extends` clause

**The mistake:** Declaring an `infer` variable inside a generic type parameter list or standard object type.

**Why it's wrong:** The `infer` keyword is strictly a pattern-matching operator. It has no meaning outside of a conditional type statement.

*Incorrect:*
```typescript
// Error: 'infer' declarations are only permitted in the 'extends' clause of a conditional type.
type Logger<infer T> = { log: (val: T) => void }; 
```

*Fix:* Declare `T` as a standard generic parameter.
```typescript
type Logger<T> = { log: (val: T) => void };
```

**Golden Rule:** The `infer` keyword can only be written after `extends` inside a conditional type. The captured type variable is only accessible in the "true" (left) branch of the conditional ternary.

---



### Mistake 2: Using `infer` Outside Conditional Type `extends` Clauses

**The mistake:** Writing `type Unpack<T> = infer U;` (TS1338).

**Why it's wrong:** The `infer` keyword can ONLY be declared within the `extends` evaluation clause of a conditional type.

*Incorrect:*
```typescript
// type Bad<T> = infer U; // ❌ 'infer' declarations are only permitted in the 'extends' clause of a conditional type
```

*Fix:*
```typescript
type Unpack<T> = T extends (infer U)[] ? U : T; // Correct infer declaration
```

### Mistake 3: Declaring Duplicate `infer` Identifiers in the Same Conditional Clause

**The mistake:** Re-using the same `infer R` variable name in incompatible positions without union intent.

**Why it's wrong:** Re-using the same `infer R` identifier across multiple covariant positions creates union inference, whereas contravariant positions create intersection inference.

*Incorrect:*
```typescript
type Overloaded<T> = T extends (a: infer R, b: infer R) => void ? R : never;
```

*Fix:*
```typescript
type Overloaded<T> = T extends (a: infer A, b: infer B) => void ? [A, B] : never;
```

## 6. Practice Exercises

### Exercise 1: Extracting First Function Parameter

**Problem:** Create a utility type called `FirstParameter<T>` that extracts the type of the first argument of any function. If the function has no arguments, or if `T` is not a function, return `never`.

```typescript
// Complete the definition using conditional types and infer:
type FirstParameter<T> = T extends (first: infer P, ...args: any[]) => any ? P : never;

type Callback = (id: number, active: boolean) => void;
type Target = FirstParameter<Callback>; // Target should evaluate to number
```

**Expected output:**
```text
Target evaluates to number.
```

> [!check]- Answer
> - The function pattern is `(first: infer P, ...args: any[]) => any`.
> - Check if `T` extends this pattern; if it does, return `P`, otherwise return `never`.

---



### Exercise 2: Extracting Promise Inner Type with `infer`

**Problem:** Implement `UnwrapPromise<T> = T extends Promise<infer U> ? U : T`.

**Expected output:**
```text
UnwrapPromise utility created
```

> [!check]- Answer
> ```typescript
> type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
> type Result = UnwrapPromise<Promise<number>>;
> console.log("UnwrapPromise utility created");
> ```
>
> **Explanation:** `infer U` captures type parameters from generic wrapper structures.

### Exercise 3: Inferring Function First Parameter

**Problem:** Implement `FirstParam<T> = T extends (first: infer P, ...args: any[]) => any ? P : never`.

**Expected output:**
```text
FirstParam utility created
```

> [!check]- Answer
> ```typescript
> type FirstParam<T> = T extends (first: infer P, ...args: any[]) => any ? P : never;
> type Param = FirstParam<(name: string, age: number) => void>;
> console.log("FirstParam utility created");
> ```
>
> **Explanation:** Pattern matching with `infer` extracts specific function parameter types.

## 7. Related Terms
- [Conditional Types](../level_09/conditional_types.md) — The ternary structure that hosts `infer`.
- [ReturnType](../level_08/returntype.md) — The utility type powered by `infer`.
- [Parameters / ConstructorParameters / Awaited](../level_08/parameters_awaited.md) — Standard library utilities built using `infer`.

---

## 8. Key Takeaways
- The **`infer`** keyword declares a type placeholder variable that the compiler resolves dynamically.
- It can only be used inside the `extends` clause of a conditional type.
- The inferred variable is only in scope inside the "true" branch of the conditional ternary.
- Used to construct complex, recursive extraction utilities (like `Awaited`, `Parameters`, or custom framework types).
- Enables clean, type-safe reflection on functional and object properties.
