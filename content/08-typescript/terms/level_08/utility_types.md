# Utility Types Overview

> **Level 8 — Utility Types**
> A suite of built-in global types provided by TypeScript out-of-the-box. They act like functions that take an existing type as an input and spit out a brand new, modified type as the output.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — What you are usually modifying.
- [Generics Overview (`<T>`)](../level_07/generics.md) — The `<T>` syntax used to pass inputs into Utility Types.
---

## 2. Term Category
- **TypeScript Standard Library**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In a large application, you often have a massive core interface (e.g., `interface User`). 
But what if you need an API endpoint that only returns a *piece* of that user? Or what if you have an Update form where every field in the `User` is optional?
If you manually create `interface PartialUser` or `interface UserPreview`, you are violating DRY (Don't Repeat Yourself). If you add a field to `User`, you have to remember to add it to all the other interfaces!
**Utility Types** solve this by mathematically deriving new types from existing types. If the core type changes, the Utility Types automatically update!

### (2) How they look
Utility Types always use the Generic `<T>` syntax. You can think of the word before the `<` as the function name, and the type inside the `<...>` as the argument.

```typescript
interface Todo {
  title: string;
  description: string;
}

// "I want a Todo, but I want all the properties to be optional"
type OptionalTodo = Partial<Todo>; 

// "I want a Todo, but I ONLY want the title"
type TitleOnly = Pick<Todo, "title">;
```

### (3) The Core Toolkit
TypeScript provides dozens of built-in Utility Types. The most heavily used in modern applications are:
- Transformation: `Partial`, `Required`, `Readonly`
- Slicing: `Pick`, `Omit`
- Dictionaries: `Record`
- Function extraction: `Parameters`, `ReturnType`
- Union extraction: `Exclude`, `Extract`, `NonNullable`

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not realizing Utility Types are just Type Aliases under the hood

**The mistake:** A developer thinks Utility Types are magical C++ level compiler instructions that they could never write themselves.

**Why it's wrong:** Almost every single Utility Type is just a standard Type Alias written using Mapped Types and Conditional Types in the global `lib.d.ts` file! You can cmd+click on `Partial` in your IDE and literally read the 3 lines of TypeScript code that makes it work. 
**Golden Rule:** Utility Types are not magic. They are just highly reusable helper types provided by the TS team so you don't have to write them yourself.

---



### Mistake 2: Writing Custom Utility Types when Standard TS Built-In Utilities Exist

**The mistake:** Writing custom mapped types for `Partial`, `Readonly`, or `Pick` from scratch.

**Why it's wrong:** Built-in utility types (`Partial`, `Required`, `Readonly`, `Record`, `Pick`, `Omit`, `Exclude`, `Extract`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`) are optimized, standard, and built directly into TS.

*Incorrect:*
```typescript
type CustomPartial<T> = { [K in keyof T]?: T[K] }; // Redundant custom re-implementation
```

*Fix:*
```typescript
type StandardPartial<T> = Partial<T>; // Standard built-in utility type
```

### Mistake 3: Combining Incompatible Utility Types

**The mistake:** Writing `Pick<Partial<User>, "id">` expecting `id` to be required.

**Why it's wrong:** `Partial<User>` makes ALL properties optional before `Pick` selects `id`, leaving `id` optional.

*Incorrect:*
```typescript
interface User { id: number; name: string }
type Bad = Pick<Partial<User>, "id">; // id is still optional!
```

*Fix:*
```typescript
interface User { id: number; name: string }
type Good = Required<Pick<User, "id">>; // id is explicitly required
```

## 6. Practice Exercises

### Exercise 1: Readability over Complexity

**Problem:** You can nest Utility Types indefinitely. `type X = Readonly<Partial<Pick<User, "name" | "age">>>`. Why might a Senior developer reject this in a code review?

**Expected output:**
> [!check]- Answer
> ```text
> Because it is almost impossible to read at a glance!
> While Utility Types are great, chaining 3 or 4 of them together creates a massive cognitive load for the next developer reading the code. If your derived type is that complex, it is often better to just explicitly write out a new interface, even if it slightly violates DRY principles.
> ```
> - Just because you *can* do math, doesn't mean you *should*.

---



### Exercise 2: Utility Types Combination Challenge

**Problem:** Create `UpdateUserDTO` making `id` required and all other `User` fields optional.

**Expected output:**
> [!check]- Answer
> ```text
> UpdateUserDTO created
> ```
> ```typescript
> interface User { id: number; name: string; age: number }
> type UpdateUserDTO = Pick<User, "id"> & Partial<Omit<User, "id">>;
> const u: UpdateUserDTO = { id: 1, age: 26 }; // Valid!
> console.log("UpdateUserDTO created");
> ```
>
> **Explanation:** Combining `Pick`, `Omit`, and `Partial` models precise update payload DTOs.

---

### Exercise 3: Built-In Utility Types Categorization

**Problem:** List 3 object manipulation utility types (`Partial`, `Required`, `Readonly`, `Pick`, `Omit`).

**Expected output:**
> [!check]- Answer
> ```text
> Partial, Pick, Omit
> ```
> ```typescript
> console.log("Partial, Pick, Omit");
> ```
>
> **Explanation:** Built-in utilities transform object shapes, unions, and function signatures.

## 7. Related Terms
- [`Partial<T>` & `Required<T>`](partial_required.md) — Modifying optional flags.
- [`Pick<T>` & `Omit<T>`](pick_omit.md) — Slicing object shapes.
- [Index Signatures](../level_03/index_signatures.md) — Related concept: Index Signatures.
- [Readonly Properties (`readonly`)](../level_03/readonly.md) — Related concept: Readonly Properties (`readonly`).
- [Generics Overview (`<T>`)](../level_07/generics.md) — Related concept: Generics Overview (`<T>`).
- [`Exclude` / `Extract` / `NonNullable`](exclude_extract_nonnullable.md) — Related concept: `Exclude` / `Extract` / `NonNullable`.
- [Conditional Types](../level_09/conditional_types.md) — Related concept: Conditional Types.
- [`Record<Keys, Type>`](record.md) — Record utility type.
---

## 8. Key Takeaways
- **Utility Types** are globally available, built-in types that transform an existing type into a new type.
- They are used to prevent duplicating interfaces across your codebase (DRY principle).
- They use the `<T>` Generic syntax to accept the "input" type.
- If the original input type is updated, all Utility Types relying on it automatically recalculate, ensuring your whole app stays perfectly in sync.
