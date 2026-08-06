# `keyof` Operator

> **Level 9 — Advanced Types**
> A type operator that takes an Object Type and extracts all of its keys into a Union of Literal Strings.

---

## 1. Prerequisites
- [Object Types](../level_03/object_types.md) — What this operator reads from.
- [Union Types (`|`)](../level_05/union_types.md) — The output format this operator generates.

---

## 2. Term Category

**TypeScript Type Operator** (Property Name Union Operator): The `keyof` operator produces a string or numeric literal union of all known public property keys of an object type.



---

## 3. Explanation

### Environment Context
- **Compile-Time**



---

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Extracting Interface Property Keys with `keyof`

**Scenario:**
Extract the key union type of a `User` interface using `keyof User`.

**Requirements:**
1. Define `type UserKeys = keyof User`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: number;
>   name: string;
>   email: string;
> }
> 
> type UserKeys = keyof User; // "id" | "name" | "email"
> 
> const validKey: UserKeys = "email";
> // const invalidKey: UserKeys = "password"; // ❌ Compile Error!
> ```
> 
> #### Technical Explanation
>
> 1. `keyof T` produces a string or numeric literal union of all public property keys of type `T`.
> 2. Keeps key unions synchronized if new properties are added to `User` in the future.
> 3. Essential operator for type-safe object property iteration and lookups.
> 
---

### Exercise 2: Type-Safe Property Access Utility Functions

**Scenario:**
Create a type-safe `getValue<T, K extends keyof T>(obj: T, key: K)` utility.

**Requirements:**
1. Constrain `key` using `keyof T`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
>   return obj[key];
> }
> 
> const car = { make: "Toyota", year: 2022, isElectric: false };
> 
> const year = getValue(car, "year"); // Inferred as number
> const make = getValue(car, "make"); // Inferred as string
> ```
> 
> #### Technical Explanation
>
> 1. `K extends keyof T` ensures callers can pass ONLY valid property keys existing on `obj`.
> 2. `T[K]` returns the exact property return type corresponding to key `K`.
> 3. Prevents accessing non-existent keys at compile time.
> 
---

### Exercise 3: Auditing `keyof` Behavior on Index Signatures

**Scenario:**
Explain why `keyof Record<string, number>` evaluates to `string | number` while `keyof any[]` includes array methods (`"length" | "push" | ...`).

**Requirements:**
1. Detail `keyof` evaluation on index signatures and arrays.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type DictKeys = keyof Record<string, number>; // string | number (JS coerces obj[1] to obj["1"])
> type ArrayKeys = keyof string[];             // number | "length" | "push" | "map" | ...
> ```
> 
> #### Technical Explanation
>
> 1. For string index signatures (`Record<string, V>`), `keyof` returns `string | number` because JavaScript coerces numeric object keys to strings at runtime.
> 2. For arrays, `keyof` produces a union of numeric indices (`number`) AND prototype array method names.
> 3. Foundational rule of `keyof` type operations.
> 
---



## 6. Related Terms
- [Mapped Types](mapped_types.md) — The advanced feature that relies entirely on `keyof`.
- [Multiple Generics](../level_07/multiple_generics.md) — Related concept: Multiple Generics.
- [Indexed Access Types](indexed_access.md) — Related concept: Indexed Access Types.
- [Template Literal Types](template_literal_types.md) — Related concept: Template Literal Types.
- [`typeof` Operator](typeof.md) — Related concept: `typeof` Operator.
- [Generic Constraints (`extends`)](../level_07/generic_constraints.md) — Related concept: Generic Constraints (`extends`).

---

## 7. Key Takeaways
- **`keyof`** is a Compile-Time operator that extracts the keys from an Object Type.
- It returns a Union of String Literal Types (e.g., `"name" | "age"`).
- It is incredibly useful for typing dynamic property accessors (`obj[key]`).
- It is heavily used alongside Generics (`<T, K extends keyof T>`).
- It only works on Types. To use it on a JS variable, combine it with `typeof` (`keyof typeof myVar`).
