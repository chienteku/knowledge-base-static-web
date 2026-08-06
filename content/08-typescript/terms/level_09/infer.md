# The `infer` Keyword

> **Level 9 — Advanced Types**
> A compiler keyword used exclusively inside the `extends` clause of Conditional Types to declare a temporary type placeholder variable that the compiler automatically extracts from a matched type pattern.

---

## 1. Prerequisites
- [Conditional Types](conditional_types.md) — The type-level `if/else` checks.
- [Generics Overview (`<T>`)](../level_07/generics.md) — Parametric type declarations.

---

## 2. Term Category

**TypeScript Advanced Type** (Pattern Matching Type Variable Inference): The `infer` keyword introduces a temporary type variable within a conditional type branch to extract constituent types automatically.



---

## 3. Explanation

### Environment Context
- **Build-time** (Like all type-level calculations, `infer` variables exist only during compilation and have zero runtime overhead).



---

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Extracting Promise Inner Value Types with `infer`

**Scenario:**
Create a custom `UnwrapPromise<T>` conditional type using `infer` to extract the inner resolved value of a `Promise<T>`.

**Requirements:**
1. Define `type UnwrapPromise<T> = T extends Promise<infer U> ? U : T`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type R1 = UnwrapPromise<Promise<string>>; // string
type R2 = UnwrapPromise<Promise<number>>; // number
type R3 = UnwrapPromise<boolean>;         // boolean
```

> #### Technical Explanation
>
> 1. `infer U` introduces a type variable `U` within the `extends` clause of a conditional type.
> 2. If `T` matches `Promise<U>`, the compiler infers `U` and makes it available in the `true` branch.
> 3. Pattern matching mechanism for extracting generic inner types.

---

### Exercise 2: Extracting Array Element Types with `infer`

**Scenario:**
Extract the element type of an array using `ArrayElement<T>`.

**Requirements:**
1. Define `type ArrayElement<T> = T extends (infer E)[] ? E : T`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type ArrayElement<T> = T extends (infer E)[] ? E : T;

type E1 = ArrayElement<string[]>; // string
type E2 = ArrayElement<number[]>; // number
type E3 = ArrayElement<boolean>;  // boolean
```

> #### Technical Explanation
>
> 1. `T extends (infer E)[]` pattern matches array types and binds element type `E`.
> 2. Returns the unwrapped element type `E` for arrays, or the original type `T` for non-arrays.
> 3. Reusable structural pattern matching utility.

---

### Exercise 3: Extracting Function First Argument Types with `infer`

**Scenario:**
Extract the type of the first argument of any function using `FirstArgument<T>`.

**Requirements:**
1. Define `type FirstArgument<T> = T extends (first: infer F, ...args: any[]) => any ? F : never`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type FirstArgument<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;

function handler(id: number, message: string) {}

type TargetType = FirstArgument<typeof handler>; // number
```

> #### Technical Explanation
>
> 1. `infer F` pattern matches function parameter tuples, capturing the first parameter's type.
> 2. Returns `never` if `T` is not a function.
> 3. Advanced type meta-programming with `infer`.

---



## 6. Related Terms
- [Conditional Types](conditional_types.md) — The ternary structure that hosts `infer`.
- [`ReturnType<T>`](../level_08/returntype.md) — The utility type powered by `infer`.
- [`Parameters` / `ConstructorParameters` / `Awaited`](../level_08/parameters_awaited.md) — Standard library utilities built using `infer`.

---

## 7. Key Takeaways
- The **`infer`** keyword declares a type placeholder variable that the compiler resolves dynamically.
- It can only be used inside the `extends` clause of a conditional type.
- The inferred variable is only in scope inside the "true" branch of the conditional ternary.
- Used to construct complex, recursive extraction utilities (like `Awaited`, `Parameters`, or custom framework types).
- Enables clean, type-safe reflection on functional and object properties.
