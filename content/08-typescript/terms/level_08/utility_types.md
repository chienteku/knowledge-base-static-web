# Utility Types Overview

> **Level 8 — Utility Types**
> A suite of built-in global types provided by TypeScript out-of-the-box. They act like functions that take an existing type as an input and spit out a brand new, modified type as the output.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — What you are usually modifying.
- [Generics Overview (`<T>`)](../level_07/generics.md) — The `<T>` syntax used to pass inputs into Utility Types.

---

## 2. Term Category

**TypeScript Utility Type** (Built-in Generic Type Transformations): Utility types are built-in global generic helpers that transform and manipulate existing TypeScript object and union types.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Composing Multiple Utility Types

**Scenario:**
Create a type that makes all properties optional EXCEPT `id` using a combination of `Partial`, `Pick`, and `Omit`.

**Requirements:**
1. Combine `Pick<User, "id"> & Partial<Omit<User, "id">>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: string;
>   name: string;
>   email: string;
>   age: number;
> }

type UpdateUserPayload = Pick<User, "id"> & Partial<Omit<User, "id">>;

const update: UpdateUserPayload = {
  id: "usr_100", // Required!
  email: "newemail@example.com" // Optional!
};
```

> #### Technical Explanation
>
> 1. Combining utility types with intersections (`&`) allows building custom type transformations.
> 2. `Pick<User, "id">` keeps `id` required.
> 3. `Partial<Omit<User, "id">>` makes all remaining fields optional.

---

### Exercise 2: Making Specific Properties Readonly with `Readonly<T>`

**Scenario:**
Freeze an entire state object using `Readonly<T>`.

**Requirements:**
1. Apply `Readonly<AppState>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface AppState {
>   theme: string;
>   sidebarOpen: boolean;
> }

const state: Readonly<AppState> = {
  theme: "dark",
  sidebarOpen: true
};

// state.theme = "light"; // ❌ Compile Error: Cannot assign to 'theme' because it is a read-only property.
```

> #### Technical Explanation
>
> 1. `Readonly<T>` constructs a type with all properties set to `readonly`.
> 2. Prevents property mutation at compile time.
> 3. Ideal for freezing state objects in Redux or Zustand stores.

---

### Exercise 3: Built-In String Manipulation Utilities

**Scenario:**
Demonstrate built-in string manipulation utility types (`Uppercase<T>`, `Lowercase<T>`, `Capitalize<T>`).

**Requirements:**
1. Apply string utility types.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Event = "click" | "hover";

type UpperEvent = Uppercase<Event>; // "CLICK" | "HOVER"
type CapEvent = Capitalize<Event>;   // "Click" | "Hover"
```

> #### Technical Explanation
>
> 1. Compiler intrinsic utility types (`Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`) manipulate template literal string types.
> 2. Executed directly within the TypeScript compiler engine.
> 3. Essential for building string-based event names and action types.

---



## 6. Related Terms
- [`Partial<T>` & `Required<T>`](partial_required.md) — Modifying optional flags.
- [`Pick<T>` & `Omit<T>`](pick_omit.md) — Slicing object shapes.
- [Index Signatures](../level_03/index_signatures.md) — Related concept: Index Signatures.
- [Readonly Properties (`readonly`)](../level_03/readonly.md) — Related concept: Readonly Properties (`readonly`).
- [Generics Overview (`<T>`)](../level_07/generics.md) — Related concept: Generics Overview (`<T>`).
- [`Exclude` / `Extract` / `NonNullable`](exclude_extract_nonnullable.md) — Related concept: `Exclude` / `Extract` / `NonNullable`.
- [Conditional Types](../level_09/conditional_types.md) — Related concept: Conditional Types.
- [`Record<Keys, Type>`](record.md) — Record utility type.

---

## 7. Key Takeaways
- **Utility Types** are globally available, built-in types that transform an existing type into a new type.
- They are used to prevent duplicating interfaces across your codebase (DRY principle).
- They use the `<T>` Generic syntax to accept the "input" type.
- If the original input type is updated, all Utility Types relying on it automatically recalculate, ensuring your whole app stays perfectly in sync.
