# Indexed Access Types

> **Level 9 — Advanced Types**
> A way to look up the specific type of a property on another type using bracket notation, exactly like accessing a property on a JavaScript object.

---

## 1. Prerequisites
- [Object Types](../level_03/object_types.md) — The structures you are accessing properties from.
- [`keyof` Operator](keyof.md) — Extracting property keys using keyof operator.

---

## 2. Term Category

**TypeScript Type Operator** (Object Property Lookup Types): Indexed access types (`T[K]`) look up the exact type of a specific property or element from an object or array type.

---

## 3. Explanation



---



## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing Value Variables Instead of Types to Index Brackets

```typescript
const keyName = "role";
// ❌ INCORRECT: type UserRole = User[keyName];

// ✅ CORRECT:
type UserRole = User[typeof keyName];
```

**Why it's wrong:** Indexed access types accept ONLY type parameters or literal types inside `T[K]`. Runtime variables must be converted to types via `typeof` first.

**Golden Rule:** Always pass type parameters or `typeof variable` into indexed access brackets `T[K]`.

---

### Mistake 2: Assuming Index Access Removes `undefined` from Optional Keys

```typescript
interface User {
  bio?: string;
}

// ❌ INCORRECT: Assuming User["bio"] is strictly 'string'
// const bio: User["bio"] = "developer";

// ✅ CORRECT: User["bio"] is 'string | undefined'
const bio: User["bio"] = undefined;
```

**Why it's wrong:** Optional properties (`bio?: string`) implicitly union their declared type with `undefined`. Indexed access `User["bio"]` evaluates to `string | undefined`.

**Golden Rule:** Remember that indexing optional properties returns `Type | undefined`.

---

### Mistake 3: Indexing Private or Non-Existent Interface Keys

```typescript
interface Account {
  id: string;
}

// ❌ INCORRECT: Indexing a non-existent property key
// type Secret = Account["secret"]; // Compile Error: Property 'secret' does not exist!
```

**Why it's wrong:** Indexed access types require the index key to be assignable to `keyof T`.

**Golden Rule:** Ensure index keys satisfy `K extends keyof T`.





## 5. Practice Exercises

### Exercise 1: Extracting Property Types with `T[K]`

**Scenario:**
Extract property types from a `User` interface using indexed access notation (`User["role"]`, `User["address"]["city"]`).

**Requirements:**
1. Extract property types using indexed access.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: number;
>   role: "admin" | "user";
>   address: {
>     city: string;
>     zip: number;
>   };
> }
> 
> type UserRole = User["role"];       // "admin" | "user"
> type UserCity = User["address"]["city"]; // string
> ```
> 
> #### Technical Explanation
>
> 1. Indexed access types `T[K]` look up the exact type of property `K` on type `T`.
> 2. Keeps extracted types synchronized if `User["role"]` changes in the interface definition later.
> 3. Supports nested property lookups (`User["address"]["city"]`).
> 
---

### Exercise 2: Inferring Array Element Types with `number` Indexing

**Scenario:**
Extract the element type of an array using `ArrayType[number]`.

**Requirements:**
1. Apply `MyArray[number]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const AppLanguages = ["en", "fr", "es", "de"] as const;
> 
> type LanguageList = typeof AppLanguages; // readonly ["en", "fr", "es", "de"]
> type Language = LanguageList[number];     // "en" | "fr" | "es" | "de"
> 
> const activeLang: Language = "en";
> ```
> 
> #### Technical Explanation
>
> 1. Indexing an array type with `[number]` returns the union of all array element types.
> 2. Combined with `as const`, `ArrayType[number]` extracts a string literal union from a tuple array.
> 3. Standard technique for generating union types from runtime constant arrays.
> 
---

### Exercise 3: Auditing Invalid Dynamic Property Lookups

**Scenario:**
Explain why passing a variable identifier instead of a type literal to indexed access types causes a compile error (`User[key]` vs `User[typeof key]`).

**Requirements:**
1. Show compile error when using value variable in indexed access type.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User { name: string; age: number; }
> const propKey = "name";
> 
> // ❌ Compile Error: 'propKey' refers to a value, but is being used as a type here!
> // type Wrong = User[propKey];
> 
> // ✅ CORRECT (Use typeof or literal type):
> type Correct = User[typeof propKey]; // string
> ```
> 
> #### Technical Explanation
>
> 1. Indexed access types accept ONLY type parameters or literal types inside brackets `T[K]`.
> 2. Value variables (`propKey`) must be converted to types using `typeof propKey` first.
> 3. Key distinction between value-space and type-space syntax.
> 
---



## 6. Related Terms
- [`keyof` Operator](keyof.md) — Often used inside the brackets of an Indexed Access Type to dynamically grab all property types (e.g., `User[keyof User]`).

---


## 7. Key Takeaways

- Indexed access types (`T[K]`) look up specific property or element types dynamically.
- `T[keyof T]` yields the union of all property value types on type `T`.
- Array element types can be extracted using `ArrayType[number]`.
- Always pass types or `typeof variable` into bracket index expressions.
