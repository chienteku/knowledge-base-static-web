# `keyof` Operator

> **Level 9 — Advanced Types**
> A type operator that takes an Object Type and extracts all of its keys into a Union of Literal Strings.

---

## 1. Prerequisites
- [Object Types](../level_03/object_types.md) — What this operator reads from.
- [Union Types](../level_05/union_types.md) — The output format this operator generates.

---

## 2. Term Category
- **TypeScript Type Operator**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
You have a `User` interface with 20 properties. You write a function `getProperty(user, key)`. 
How do you type the `key` parameter? You could write `key: "id" | "name" | "email" ...`, but you'd have to type all 20 keys manually. If you add a new property to `User` later, you have to remember to update this union!
The **`keyof`** operator mathematically derives the union of keys for you automatically.

### (2) The Syntax
You place `keyof` directly in front of a Type.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// TS automatically generates: "id" | "name" | "email"
type UserKeys = keyof User; 

function getProperty(user: User, key: UserKeys) {
  return user[key];
}

getProperty(user, "name"); // ✅ Valid
getProperty(user, "password"); // ❌ Error: Argument of type '"password"' is not assignable to type '"id" | "name" | "email"'.
```

### (3) Using `keyof` with Generics
The most powerful use of `keyof` is inside Generic Constraints, allowing you to write highly dynamic, strictly typed helper functions.

```typescript
// K MUST be a valid key of whatever Object T is passed in!
function getProp<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `keyof` on a value instead of a Type

**The mistake:** A developer writes:
```typescript
const config = { port: 8080, host: "localhost" };
type Keys = keyof config; // ❌ Error
```

**Why it's wrong:** `keyof` operates exclusively in the Type space. `config` is a runtime JavaScript variable (a value). You cannot use `keyof` directly on a value.
**Golden Rule:** If you want to extract the keys from a JavaScript object, you must first convert the object into a Type using `typeof`. 
`type Keys = keyof typeof config;`

---



### Mistake 2: Using `keyof` on Values instead of Types

**The mistake:** Writing `keyof myObj` passing raw JavaScript object value `myObj`.

**Why it's wrong:** `keyof` is a type operator expecting a TYPE parameter! Use `keyof typeof myObj`.

*Incorrect:*
```typescript
const user = { id: 1, name: "Alice" };
// type Keys = keyof user; // ❌ 'user' refers to a value, but is being used as a type
```

*Fix:*
```typescript
const user = { id: 1, name: "Alice" };
type Keys = keyof typeof user; // Yields 'id' | 'name'
```

### Mistake 3: Expecting `keyof any` to Return Object Key Strings Only

**The mistake:** Expecting `keyof any` to evaluate to `string`.

**Why it's wrong:** In TypeScript, valid object keys (`PropertyKey`) include `string | number | symbol`.

*Incorrect:*
```typescript
type Keys = keyof any; // Yields string | number | symbol, not just string!
```

*Fix:*
```typescript
type StringKeysOnly<T> = Extract<keyof T, string>;
```

## 6. Practice Exercises

### Exercise 1: `keyof` with Index Signatures

**Problem:** You have an interface with an Index Signature: `interface Dictionary { [key: string]: number; }`. What is the result of `type DictKeys = keyof Dictionary;`?

**Expected output:**
> [!check]- Answer
> ```text
> The result is `string | number`.
> Because the object can accept ANY string as a key, `keyof` simply returns `string`. (It also returns `number` because JS allows you to access object properties via numbers, like `arr[0]`, which are coerced to strings).
> ```
> - If the keys are infinite, the result must represent infinity!

---



### Exercise 2: Extracting Interface Keys with `keyof`

**Problem:** Extract key union from `interface User { id: number; name: string }` using `keyof User`.

**Expected output:**
> [!check]- Answer
> ```text
> "id" | "name"
> ```
> ```typescript
> interface User { id: number; name: string }
> type UserKeys = keyof User;
> console.log("\"id\" | \"name\"");
> ```
>
> **Explanation:** `keyof T` returns a union of string/number/symbol key literal types.

---

### Exercise 3: Safely Accessing Property Values with `keyof`

**Problem:** Write `function getProp<T>(obj: T, key: keyof T)`.

**Expected output:**
> [!check]- Answer
> ```text
> Type-safe property access verified
> ```
> ```typescript
> function getProp<T>(obj: T, key: keyof T) {
>   return obj[key];
> }
> console.log("Type-safe property access verified");
> ```
>
> **Explanation:** `keyof T` constrains parameter keys to valid property names of object `T`.

## 7. Related Terms
- [`typeof` Operator (Type Context)](../../../03-javascript/terms/level_01/typeof.md) — Used alongside `keyof` to read JS objects.
- [Mapped Types](../level_09/mapped_types.md) — The advanced feature that relies entirely on `keyof`.

---

## 8. Key Takeaways
- **`keyof`** is a Compile-Time operator that extracts the keys from an Object Type.
- It returns a Union of String Literal Types (e.g., `"name" | "age"`).
- It is incredibly useful for typing dynamic property accessors (`obj[key]`).
- It is heavily used alongside Generics (`<T, K extends keyof T>`).
- It only works on Types. To use it on a JS variable, combine it with `typeof` (`keyof typeof myVar`).
