# Union Types (`|`)

> **Level 5 — Union & Intersection Types**
> A syntax that allows a value to be one of several different types. It essentially means "OR" in the TypeScript type system.

---

## 1. Prerequisites
- [Primitive Types](../level_02/primitive_types.md) — The building blocks often used inside Unions.
- [Type Narrowing](../level_06/type_narrowing.md) — How you safely interact with a Union Type.
---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, a function parameter often handles different data shapes gracefully. For example, a `printId(id)` function might accept `123` (a number) or `"ABC-123"` (a string). 
If TypeScript only allowed you to pick one strict type, you would have to write two different functions (`printStringId` and `printNumberId`). 
**Union Types** allow you to say: *"This variable is allowed to be a string OR a number."*

### (2) The `|` Syntax
You create a Union Type by separating types with the pipe `|` character.

```typescript
function printId(id: number | string) {
  // `id` is a Union of number OR string
  console.log("Your ID is: " + id);
}

printId(101);     // ✅ Valid
printId("202");   // ✅ Valid
printId({id: 1}); // ❌ Error: Argument of type '{ id: number; }' is not assignable to parameter of type 'string | number'.
```

### (3) The Overlap Rule
If a variable is a Union Type, TypeScript will **ONLY** let you use methods that are shared by *all* types in the union.
```typescript
function getLength(data: string | string[]) {
  // ✅ Valid: BOTH string and Array have a `.length` property!
  return data.length; 
}

function printId(id: number | string) {
  // ❌ Error: Property 'toUpperCase' does not exist on type 'string | number'.
  // Even though string has it, number does NOT. So TS bans it.
  console.log(id.toUpperCase());
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to access type-specific methods without Narrowing

**The mistake:** A developer writes the `printId` function above and gets frustrated that TS won't let them call `.toUpperCase()` when they *know* they just passed a string in.

**Why it's wrong:** TypeScript is pessimistic. If it's a Union, it could be a number, and calling `.toUpperCase()` on a number crashes the browser.
**Golden Rule:** If you need to use a method that only exists on ONE half of the Union, you MUST use an `if` statement to "Narrow" the type first. `if (typeof id === "string") { id.toUpperCase(); }`

---



### Mistake 2: Attempting Property Access Unique to One Union Variant without Type Narrowing

**The mistake:** Calling `res.data` on union `type Res = { data: string } | { error: string }`.

**Why it's wrong:** TypeScript permits accessing ONLY properties common to ALL variants of a union until the union is narrowed using guards or discriminators.

*Incorrect:*
```typescript
type Res = { data: string } | { error: string };
function handle(r: Res) {
    // return r.data; // ❌ Property 'data' does not exist on type '{ error: string }'
}
```

*Fix:*
```typescript
type Res = { data: string } | { error: string };
function handle(r: Res) {
    if ("data" in r) return r.data; // Safely narrowed via 'in' operator
}
```

### Mistake 3: Confusing Union Types `A | B` with Intersection Types `A & B`

**The mistake:** Expecting variable of type `string | number` to accept values containing both string and number attributes simultaneously.

**Why it's wrong:** `A | B` means value is EITHER type `A` OR type `B`.

*Incorrect:*
```typescript
let val: string | number;
val = "hello"; // Valid
val = 42; // Valid
```

*Fix:*
```typescript
let val: string | number; // Represents a value that can be either string or number
```

## 6. Practice Exercises

### Exercise 1: Nullable Types

**Problem:** How do you type a User object where the `age` property might be a number, but it could also be `null` because they haven't set it yet?

**Expected output:**
> [!check]- Answer
> ```typescript
> interface User {
>   // You use a Union with null!
>   age: number | null;
> }
> ```
> - `null` is a valid type in TypeScript!

---



### Exercise 2: Discriminated Union Variant Access

**Problem:** Narrow `type State = { status: "loading" } | { status: "success"; data: string }` using `s.status === "success"`.

**Expected output:**
> [!check]- Answer
> ```text
> State narrowed to success
> ```
> ```typescript
> type State = { status: "loading" } | { status: "success"; data: string };
> function render(s: State) {
>   if (s.status === "success") console.log(s.data);
> }
> render({ status: "success", data: "State narrowed to success" });
> ```
>
> **Explanation:** Discriminant properties (`status`) enable clean control flow type narrowing.

---

### Exercise 3: Array Union Precedence

**Problem:** Difference between `string | number[]` (string OR array of numbers) vs `(string | number)[]` (array of strings/numbers).

**Expected output:**
> [!check]- Answer
> ```text
> (string | number)[] specifies array containing string or number items
> ```
> ```typescript
> console.log("(string | number)[] specifies array containing string or number items");
> ```
>
> **Explanation:** Parentheses establish binding operator precedence in array union definitions.

## 7. Related Terms
- [Intersection Types (`&`)](intersection_types.md) — The exact opposite (AND instead of OR).
- [Type Narrowing](../level_06/type_narrowing.md) — The mandatory step required to actually *use* Union types safely.
- [Arrays & Tuples](../level_02/arrays_tuples.md) — Related concept: Arrays & Tuples.
- [Function Overloads](../level_04/function_overloads.md) — Related concept: Function Overloads.
- [Literal Types](literal_types.md) — Related concept: Literal Types.
- [Type Aliases (`type`)](type_aliases.md) — Related concept: Type Aliases (`type`).
- [`Exclude` / `Extract` / `NonNullable`](../level_08/exclude_extract_nonnullable.md) — Related concept: `Exclude` / `Extract` / `NonNullable`.
- [`Pick<T>` & `Omit<T>`](../level_08/pick_omit.md) — Related concept: `Pick<T>` & `Omit<T>`.
- [`Record<Keys, Type>`](../level_08/record.md) — Related concept: `Record<Keys, Type>`.
- [Discriminated Unions](../level_06/discriminated_unions.md) — Discriminated unions.
---

## 8. Key Takeaways
- **Union Types** use the `|` (pipe) operator to allow a variable to be one of multiple types (Type A OR Type B).
- It is frequently used for IDs (string or number) or nullable values (string or null).
- You can only directly access properties/methods that exist on ALL members of the union.
- To access specific methods, you must perform "Type Narrowing" (checking the type with an `if` statement).
