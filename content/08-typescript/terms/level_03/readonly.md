# Readonly Properties (`readonly`)

> **Level 3 — Object Types & Interfaces**
> A modifier that marks a property as immutable (read-only) after it is created. It prevents developers from accidentally overwriting critical data inside an object.

---

## 1. Prerequisites
- [Interfaces](interfaces.md) — Where `readonly` is usually applied.
---

## 2. Term Category
- **TypeScript Type Modifier**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In JavaScript, even if you declare an object using `const`, the properties *inside* the object can still be mutated!
```javascript
const user = { id: 1, name: "Alice" };
user.id = 999; // Totally allowed in JS!
```
Changing a database `id` or a critical configuration flag at runtime usually causes disastrous bugs. TypeScript provides the **`readonly`** modifier to lock down specific properties so they can never be reassigned after the object is initially created.

### (2) Applying `readonly`
You place the `readonly` keyword directly before the property name in an Interface or Object Type.

```typescript
interface DatabaseUser {
  readonly id: number;  // Locked!
  name: string;         // Mutable
}

const u: DatabaseUser = { id: 1, name: "Alice" };

u.name = "Bob"; // ✅ Allowed
u.id = 2;       // ❌ Error: Cannot assign to 'id' because it is a read-only property.
```

### (3) Readonly Arrays
You can also make entire arrays immutable using the `ReadonlyArray<T>` generic or the `readonly T[]` syntax. This removes mutating methods like `.push()` and `.pop()`.
```typescript
const numbers: readonly number[] = [1, 2, 3];
numbers.push(4); // ❌ Error: Property 'push' does not exist on type 'readonly number[]'.
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming `readonly` protects deep objects

**The mistake:** A developer writes `readonly config: { theme: string }`. They think the theme is safe. They write `user.config.theme = "dark"`. To their shock, the compiler allows it!

**Why it's wrong:** `readonly` is **shallow**. It only protects the exact property it is applied to. It prevents you from overwriting the *entire* `config` object (`user.config = {}`), but it does NOT protect the properties *inside* `config`.
**Golden Rule:** If you want an entire nested object to be completely immutable, you must use a utility type like `Readonly<T>` recursively, or apply `readonly` to every single nested property.

---



### Mistake 2: Assuming `readonly` Modifiers Enforce Runtime Immutability

**The mistake:** Expecting `readonly` to throw runtime errors if JavaScript mutates object fields.

**Why it's wrong:** `readonly` is purely a compile-time construct in TypeScript. It is erased during compilation and does NOT freeze runtime JS objects.

*Incorrect:*
```typescript
interface User { readonly name: string }
const u: User = { name: "Alice" };
(u as any).name = "Bob"; // 💥 Mutates object at runtime despite readonly annotation!
```

*Fix:*
```typescript
interface User { readonly name: string }
const u: User = Object.freeze({ name: "Alice" }); // Enforces runtime immutability
```

### Mistake 3: Assigning `ReadonlyArray<T>` to Mutable `T[]`

**The mistake:** Attempting to assign a `ReadonlyArray<number>` to a standard `number[]` variable.

**Why it's wrong:** Standard arrays allow mutator operations (`push`, `pop`), violating the readonly contract.

*Incorrect:*
```typescript
const ro: ReadonlyArray<number> = [1, 2];
// const arr: number[] = ro; // ❌ The type 'readonly number[]' is 'readonly' and cannot be assigned to mutable type 'number[]'
```

*Fix:*
```typescript
const ro: ReadonlyArray<number> = [1, 2];
const arr: number[] = [...ro]; // Create a mutable shallow copy
```

## 6. Practice Exercises

### Exercise 1: Compile-Time vs Runtime

**Problem:** You use `readonly id: number` in your TypeScript interface. You compile the code and run it in the browser. In your browser's DevTools console, you manually execute `myUser.id = 999`. Will the browser throw an error?

**Expected output:**
> [!check]- Answer
> ```text
> No! The browser will NOT throw an error, and the ID will change to 999.
> `readonly` is purely a Compile-Time TypeScript feature. It is completely erased during compilation. It does not compile into `Object.freeze()`. It only protects you from writing mutating code in your IDE.
> ```
> - Remember the Erasure Concept from Level 1.

---



### Exercise 2: Deep Readonly Utility vs Shallow Readonly

**Problem:** Explain why `readonly` modifier on `{ readonly a: { b: number } }` allows mutating `obj.a.b = 2`.

**Expected output:**
> [!check]- Answer
> ```text
> readonly modifier is shallow by default
> ```
> ```typescript
> console.log("readonly modifier is shallow by default");
> ```
>
> **Explanation:** Standard `readonly` modifiers prevent reassigning top-level properties only.

---

### Exercise 3: Readonly Tuple Declaration

**Problem:** Declare a readonly tuple of `[number, string]`.

**Expected output:**
> [!check]- Answer
> ```text
> readonly [number, string]
> ```
> ```typescript
> const tuple: readonly [number, string] = [1, "a"];
> console.log("readonly [number, string]");
> ```
>
> **Explanation:** `readonly` prefix creates immutable tuple structures.

## 7. Related Terms
- [Interfaces](interfaces.md) — The main place `readonly` is used.
- [Utility Types Overview](../level_08/utility_types.md) — Where the `Readonly<T>` global helper lives.
- [Arrays & Tuples](../level_02/arrays_tuples.md) — Related concept: Arrays & Tuples.
---

## 8. Key Takeaways
- **`readonly`** is a modifier that prevents a property from being reassigned after its initial creation.
- It is the property-level equivalent of the variable-level `const` keyword.
- It is **shallow**; it does not automatically make nested objects immutable.
- Like all TypeScript features, it exists only at Compile-Time. It does not physically freeze the object in the runtime JavaScript engine.
