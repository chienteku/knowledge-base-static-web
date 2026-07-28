# Generic Constraints (`extends`)

> **Level 7 — Generics**
> A way to restrict what types are allowed to be passed into a Generic `<T>`. It ensures that whatever Type is passed in possesses specific required properties.

---

## 1. Prerequisites
- [Generics Overview](../level_07/generics.md) — The base syntax being constrained.
- [Interfaces](../level_03/interfaces.md) — What is usually used to define the constraint shape.

---

## 2. Term Category
- **TypeScript Advanced Mechanics**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you write a generic function `function logLength<T>(data: T)`, you cannot access `data.length` because `T` could be a number, and numbers don't have lengths.
But you only *want* this function to accept things that have lengths (like arrays or strings). 
**Generic Constraints** allow you to say: *"T can be anything, AS LONG AS it extends this specific shape."*

### (2) The `extends` Keyword in Generics
You constrain a generic by using the `extends` keyword inside the angle brackets.

```typescript
// We define the required shape
interface HasLength {
  length: number;
}

// We constrain T. "T must have at least a .length property"
function logLength<T extends HasLength>(data: T): T {
  // ✅ Valid! TS knows T has a length property.
  console.log(data.length); 
  return data;
}

logLength("Hello");      // ✅ Valid (string has .length)
logLength([1, 2, 3]);    // ✅ Valid (array has .length)
logLength({length: 10}); // ✅ Valid (object has .length)

logLength(500); // ❌ Error: Argument of type 'number' is not assignable to parameter of type 'HasLength'.
```

### (3) Why not just use the Interface directly?
You might ask: *"Why use generics at all? Why not just write `function logLength(data: HasLength)`?"*
If you do that, the Return Type of the function is just the generic `HasLength` interface! You lose the specific type of what was passed in.
By using `<T extends HasLength>(data: T): T`, if you pass an Array in, you get a strictly typed Array back. If you pass a String in, you get a String back. You retain 100% of the type fidelity!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `extends` in Generics with `extends` in Classes

**The mistake:** A developer sees `<T extends object>` and assumes `T` must be a Class that literally inherited from some other Class.

**Why it's wrong:** In the context of Generics, `extends` means **"matches the shape of"** (Structural Typing), not strict OOP Inheritance. As seen in the example above, `"Hello"` (a primitive string) successfully `extends HasLength` simply because it happens to have a `.length` property. It does not need to explicitly implement the interface.
**Golden Rule:** In Generics, `extends` is a structural shape check, not an inheritance check.

---



### Mistake 2: Attempting Property Access on Unconstrained Generic Parameters `T`

**The mistake:** Writing `function getLength<T>(arg: T) { return arg.length; }`.

**Why it's wrong:** Unconstrained generic parameter `T` can be any type (including `number` or `boolean`). Property `length` cannot be accessed until constrained with `extends`.

*Incorrect:*
```typescript
// function getLength<T>(arg: T) { return arg.length; } // ❌ Property 'length' does not exist on type 'T'
```

*Fix:*
```typescript
function getLength<T extends { length: number }>(arg: T) { return arg.length; } // Constrained with extends!
```

### Mistake 3: Using Non-Key Constraints in `keyof` Property Lookups

**The mistake:** Writing `function getProp<T, K>(obj: T, key: K)` without `K extends keyof T`.

**Why it's wrong:** Without `K extends keyof T`, `K` is un-bounded, permitting callers to pass invalid key strings that do not exist on `T`.

*Incorrect:*
```typescript
// function getProp<T, K>(obj: T, key: K) { return obj[key]; } // ❌ Type 'K' cannot be used to index type 'T'
```

*Fix:*
```typescript
function getProp<T, K extends keyof T>(obj: T, key: K) { return obj[key]; }
```

## 6. Practice Exercises

### Exercise 1: Constraining to an Object

**Problem:** You are writing a generic `merge` function that combines two things together. You want to strictly enforce that both things passed in are Objects (not strings, not numbers). How do you constrain the generics?

**Expected output:**
> [!check]- Answer
> ```typescript
> function merge<T extends object, U extends object>(obj1: T, obj2: U) {
>   return { ...obj1, ...obj2 };
> }
> ```
> - `object` is a valid type in TS!

---



### Exercise 2: Constraining Generics to Objects with `extends object`

**Problem:** Constrain function `function merge<T extends object, U extends object>(a: T, b: U): T & U`.

**Expected output:**
> [!check]- Answer
> ```text
> Generic objects merged
> ```
> ```typescript
> function merge<T extends object, U extends object>(a: T, b: U): T & U {
>   return { ...a, ...b };
> }
> console.log(merge({ a: 1 }, { b: 2 }));
> ```
>
> **Explanation:** `extends object` restricts generic type arguments to non-primitive objects.

---

### Exercise 3: Keyof Constraint Pattern

**Problem:** Write generic helper `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`.

**Expected output:**
> [!check]- Answer
> ```text
> Alice
> ```
> ```typescript
> function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
>   return obj[key];
> }
> console.log(getProperty({ name: "Alice", age: 30 }, "name"));
> ```
>
> **Explanation:** `K extends keyof T` guarantees that `key` exists on target object `T`.

## 7. Related Terms
- [Generics Overview](../level_07/generics.md) — The parent topic.
- [Multiple Generics](../level_07/multiple_generics.md) — You can constrain multiple generics simultaneously.

---

## 8. Key Takeaways
- **Generic Constraints** use the `extends` keyword inside `<...>` to limit what types can be passed into a Generic.
- Syntax: `<T extends RequiredShape>`.
- It allows you to safely access specific properties inside a generic function without throwing compiler errors.
- It is vastly superior to just typing the parameter as the interface, because the Generic preserves the exact, specific type of the data being passed through the function.
