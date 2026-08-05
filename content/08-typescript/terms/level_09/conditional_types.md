# Conditional Types

> **Level 9 — Advanced Types**
> The `if / else` statement of the TypeScript type system. It allows you to resolve a type to Type A or Type B based on a logical condition evaluated at compile-time.

---

## 1. Prerequisites
- [Generics Overview (`<T>`)](../level_07/generics.md) — Conditional Types are almost exclusively used with Generics.
- [Generic Constraints (`extends`)](../level_07/generic_constraints.md) — The `extends` keyword is used as the evaluation condition.
---

## 2. Term Category
- **TypeScript Advanced Mechanics**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes, the return type of a function drastically changes depending on the input type. 
For example, if you pass a string into a function, it returns an Array of strings. If you pass a number, it returns a boolean.
You cannot type this cleanly with basic Generics. You need a way to tell the compiler: *"IF the generic `T` is a string, THEN the type is `string[]`. ELSE, the type is `boolean`."*
**Conditional Types** provide this logic.

### (2) The Syntax
It looks exactly like a standard JavaScript Ternary Operator (`condition ? trueResult : falseResult`), but it uses the `extends` keyword for the condition.

```typescript
// "If T matches the shape of string, resolve to string[]. Else resolve to boolean."
type DynamicOutput<T> = T extends string ? string[] : boolean;

// Resolves to: string[]
type A = DynamicOutput<"Hello">;

// Resolves to: boolean
type B = DynamicOutput<100>;
```

### (3) Inferring within Conditions (`infer` keyword)
The most advanced use of Conditional Types is the `infer` keyword. It allows you to create a new temporary generic variable *during* the evaluation process.
This is exactly how the `ReturnType<T>` utility works!

```typescript
// The source code for `ReturnType<T>`!
// "If T is a function that returns ANY type (infer R)..."
// "...then resolve to R. Else, resolve to any."
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

---

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: The Exclude Utility

**Problem:** The built-in Utility Type `Exclude<T, U>` removes elements from a Union. For example, `Exclude<"A" | "B" | "C", "A">` resolves to `"B" | "C"`. How do you write this using a Distributive Conditional Type?

**Expected output:**
> [!check]- Answer
> ```typescript
> type MyExclude<T, U> = T extends U ? never : T;
> 
> // How it works under the hood for `Exclude<"A" | "B", "A">`:
> // 1. "A" extends "A"? Yes -> resolve to `never`
> // 2. "B" extends "A"? No -> resolve to "B"
> // 3. Union the results: `never | "B"` === `"B"`!
> ```
> - What type represents "nothing" in a Union? (`never`)

---



### Exercise 2: TypeName Extract Utility

**Problem:** Create conditional type `TypeName<T>` returning `"string"` | `"number"` | `"boolean"` | `"object"`.

**Expected output:**
> [!check]- Answer
> ```text
> TypeName utility created
> ```
> ```typescript
> type TypeName<T> =
>   T extends string ? "string" :
>   T extends number ? "number" :
>   T extends boolean ? "boolean" : "object";
> console.log("TypeName utility created");
> ```
>
> **Explanation:** Chained conditional types inspect type identity at compile time.

---

### Exercise 3: Disabling Distributive Conditional Behavior

**Problem:** How to disable distributive evaluation in generic conditional types? (Wrap `[T]` in tuple brackets).

**Expected output:**
> [!check]- Answer
> ```text
> Wrap generic parameter in tuple brackets [T]
> ```
> ```typescript
> console.log("Wrap generic parameter in tuple brackets [T]");
> ```
>
> **Explanation:** Tuple brackets `[T] extends [U]` prevent conditional distribution over union members.

## 7. Related Terms
- [Utility Types Overview](../level_08/utility_types.md) — Many advanced utilities (`Exclude`, `Extract`, `ReturnType`) are built entirely on Conditional Types.
- [Generics Overview (`<T>`)](../level_07/generics.md) — The inputs to a Conditional Type.
- [The `infer` Keyword](infer.md) — Capturing dynamic types inside conditional statements.
- [`Exclude` / `Extract` / `NonNullable`](../level_08/exclude_extract_nonnullable.md) — Related concept: `Exclude` / `Extract` / `NonNullable`.
- [`Parameters` / `ConstructorParameters` / `Awaited`](../level_08/parameters_awaited.md) — Related concept: `Parameters` / `ConstructorParameters` / `Awaited`.
- [Template Literal Types](template_literal_types.md) — Template literal types.
- [Mapped Types](mapped_types.md) — Mapped types.
---

## 8. Key Takeaways
- **Conditional Types** are the `if / else` statements of the Type system.
- Syntax: `T extends Condition ? TrueType : FalseType`.
- They are used to dynamically resolve complex types based on Generic inputs.
- When you pass a Union into a Conditional Type, it acts "Distributively" (it evaluates each part of the Union individually and combines the results).
- The `infer` keyword can be used inside a condition to extract and name a specific part of the type (like extracting the return value from a function signature).
