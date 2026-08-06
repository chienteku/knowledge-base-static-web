# Conditional Types

> **Level 9 — Advanced Types**
> The `if / else` statement of the TypeScript type system. It allows you to resolve a type to Type A or Type B based on a logical condition evaluated at compile-time.

---

## 1. Prerequisites
- [Generics Overview (`<T>`)](../level_07/generics.md) — Conditional Types are almost exclusively used with Generics.
- [Generic Constraints (`extends`)](../level_07/generic_constraints.md) — The `extends` keyword is used as the evaluation condition.

---

## 2. Term Category

**TypeScript Advanced Type** (Ternary Type Evaluation Engine): Conditional types (`T extends U ? X : Y`) evaluate type relationships at compile time using ternary branching logic.



---

## 3. Explanation

### Environment Context
- **Compile-Time**



---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Distributive Conditional Types confusion

**The mistake:** You pass a Union into a Conditional Type: `type Res = DynamicOutput<string | number>`. You expect the result to be `(string | number)[]`. Instead, the result is `string[] | boolean`.

**Why it happens:** When you pass a Union into a Conditional Type, TypeScript **distributes** the condition. It runs the logic on `string` first (getting `string[]`), then it runs the logic on `number` (getting `boolean`), and then it Unions the results together!
**Golden Rule:** Remember that Conditional Types are "Distributive". If you pass a Union in, you get a Union out. If you want to disable this behavior, you must wrap the condition in square brackets: `[T] extends [string] ? ...`.

---



### Mistake 2: Unexpected Distributive Conditional Type Behavior on Generic Unions

**The mistake:** Writing `type IsString<T> = T extends string ? true : false;` expecting `IsString<string | number>` to evaluate to `false`.

**Why it's wrong:** Conditional types DISTRIBUTE automatically over naked generic parameter unions! `IsString<string | number>` evaluates to `IsString<string> | IsString<number>` -> `true | false`.

*Incorrect:*
```typescript
type IsString<T> = T extends string ? true : false;
type Result = IsString<string | number>; // Yields boolean (true | false) instead of single boolean!
```

*Fix:*
```typescript
type IsStringNonDist<T> = [T] extends [string] ? true : false; // Wrap in tuple [T] to disable distribution
```

### Mistake 3: Confusing Conditional Types with Runtime Ternary Expressions

**The mistake:** Attempting to execute runtime code expressions inside conditional type declarations.

**Why it's wrong:** Conditional types (`T extends U ? X : Y`) operate exclusively inside TypeScript type-level metaprogramming.

*Incorrect:*
```typescript
// type Bad<T> = T extends number ? Math.abs(T) : T; // ❌ Math.abs is a runtime value
```

*Fix:*
```typescript
type AbsNumber<T> = T extends number ? number : T; // Type-level conditional evaluation
```

## 5. Practice Exercises

### Exercise 1: Authoring Ternary Conditional Types

**Scenario:**
Create a conditional type `IsString<T>` that evaluates to `true` if `T` extends `string` and `false` otherwise.

**Requirements:**
1. Define `type IsString<T> = T extends string ? true : false`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type IsString<T> = T extends string ? true : false;

type T1 = IsString<string>;  // true
type T2 = IsString<number>;  // false
type T3 = IsString<"hello">; // true (literal string extends string)
```

> #### Technical Explanation
>
> 1. Conditional types (`T extends U ? X : Y`) evaluate type relationships at compile time using ternary branching logic.
> 2. Tests whether type `T` is assignable to candidate type `U`.
> 3. Fundamental building block for type-level computation.

---

### Exercise 2: Distributive Conditional Types over Unions

**Scenario:**
Demonstrate how conditional types distribute automatically over union inputs (`ToArray<string | number>`).

**Requirements:**
1. Define `type ToArray<T> = T extends any ? T[] : never`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type ToArray<T> = T extends any ? T[] : never;

type UnionResult = ToArray<string | number>;
// Distributes as: ToArray<string> | ToArray<number>
// Evaluates to: string[] | number[]
```

> #### Technical Explanation
>
> 1. When checked type parameter `T` is a naked type variable, conditional types distribute automatically across union members.
> 2. `ToArray<string | number>` is evaluated as `ToArray<string> | ToArray<number>`.
> 3. Enables powerful union type filtering and transformation.

---

### Exercise 3: Preventing Distributive Behavior with Tuple Wrapping

**Scenario:**
Prevent distributive union behavior in conditional types by wrapping generic parameters in tuples `[T] extends [any]`.

**Requirements:**
1. Contrast `ToArray<T>` vs `NonDistributiveToArray<T>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type NonDistributiveToArray<T> = [T] extends [any] ? T[] : never;

type SingleResult = NonDistributiveToArray<string | number>;
// Evaluates to: (string | number)[]
```

> #### Technical Explanation
>
> 1. Wrapping `[T]` in a tuple prevents automatic union distribution over conditional type branches.
> 2. `NonDistributiveToArray<string | number>` treats `string | number` as a single unified type, outputting `(string | number)[]`.
> 3. Crucial technique when union distribution is undesirable.

---



## 6. Related Terms
- [Utility Types Overview](../level_08/utility_types.md) — Many advanced utilities (`Exclude`, `Extract`, `ReturnType`) are built entirely on Conditional Types.
- [Generics Overview (`<T>`)](../level_07/generics.md) — The inputs to a Conditional Type.
- [The `infer` Keyword](infer.md) — Capturing dynamic types inside conditional statements.
- [`Exclude` / `Extract` / `NonNullable`](../level_08/exclude_extract_nonnullable.md) — Related concept: `Exclude` / `Extract` / `NonNullable`.
- [`Parameters` / `ConstructorParameters` / `Awaited`](../level_08/parameters_awaited.md) — Related concept: `Parameters` / `ConstructorParameters` / `Awaited`.
- [Template Literal Types](template_literal_types.md) — Template literal types.
- [Mapped Types](mapped_types.md) — Mapped types.

---

## 7. Key Takeaways
- **Conditional Types** are the `if / else` statements of the Type system.
- Syntax: `T extends Condition ? TrueType : FalseType`.
- They are used to dynamically resolve complex types based on Generic inputs.
- When you pass a Union into a Conditional Type, it acts "Distributively" (it evaluates each part of the Union individually and combines the results).
- The `infer` keyword can be used inside a condition to extract and name a specific part of the type (like extracting the return value from a function signature).
