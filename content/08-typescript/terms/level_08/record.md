# `Record<Keys, Type>`

> **Level 8 — Utility Types**
> A built-in Utility Type used to quickly construct an object type whose property keys are a specific type, and whose property values are a specific type. It is the cleanest way to define Dictionaries/Maps.

---

## 1. Prerequisites
- [Index Signatures](../level_03/index_signatures.md) — The raw syntax that `Record` abstracts away.
- [Literal Types](../level_05/literal_types.md) — Often used as the `Keys` in a Record.
---

## 2. Term Category
- **TypeScript Standard Library**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to type an object that acts as a dictionary (e.g., mapping usernames to ages), you can use an Index Signature: `{ [username: string]: number }`.
However, Index Signatures are bulky to write, and they don't play well when you want to enforce *specific* keys (like an Enum).
**`Record<K, V>`** provides a clean, generic, highly readable alternative that is the industry standard for typing dictionaries.

### (2) The Generic Dictionary
The most common use of `Record` is to map any `string` to a specific value type.

```typescript
// The keys can be any string. The values MUST be numbers.
const scores: Record<string, number> = {
  Alice: 100,
  Bob: 85,
};

scores.Charlie = 90; // ✅ Valid
scores.Dave = "winner"; // ❌ Error: Type 'string' is not assignable to type 'number'
```

### (3) Enforcing Specific Keys (The Superpower)
Unlike raw Index Signatures, `Record` allows you to pass a Union of Literal Types as the Keys. This forces the object to possess exactly those keys, acting like an exhaustiveness check!

```typescript
type Environment = "development" | "staging" | "production";

// We force the object to have exactly these 3 keys.
const apiEndpoints: Record<Environment, string> = {
  development: "http://localhost:3000",
  staging: "https://staging.api.com",
  // ❌ ERROR: Property 'production' is missing!
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: The `undefined` runtime trap

**The mistake:** You define `const cache: Record<string, User> = {}`. You access `const u = cache["alice"]`. TypeScript says `u` is strictly a `User`. You do `u.name`. The app crashes because `"alice"` isn't in the cache!

**Why it happens:** `Record<string, Type>` is dangerously optimistic. It assumes that if you ask for a key, the value exists. 
**Golden Rule:** When using `Record` with generic `string` keys, you should often type the value as `Type | undefined` (e.g., `Record<string, User | undefined>`) so TypeScript forces you to check if the value actually exists before using it. Alternatively, enable the `noUncheckedIndexedAccess` flag in `tsconfig.json`.

---



### Mistake 2: Assuming `Record<string, T>` Guarantees Runtime Key Existence

**The mistake:** Reading `map["key"].toUpperCase()` on `Record<string, string>` without checking for `undefined`.

**Why it's wrong:** `Record<string, string>` tells TS that ANY string lookup returns a `string`, but missing runtime keys return `undefined`.

*Incorrect:*
```typescript
const map: Record<string, string> = {};
// console.log(map["missing"].toUpperCase()); // 💥 Runtime TypeError!
```

*Fix:*
```typescript
const map: Record<string, string | undefined> = {};
console.log(map["missing"]?.toUpperCase());
```

### Mistake 3: Using Invalid Key Types in `Record<K, V>`

**The mistake:** Writing `Record<boolean, string>` or `Record<object, string>`.

**Why it's wrong:** Key type parameter `K` in `Record<K, V>` must extend `string | number | symbol` (`PropertyKey`).

*Incorrect:*
```typescript
// type Bad = Record<object, string>; // ❌ Type 'object' does not satisfy constraint 'PropertyKey'
```

*Fix:*
```typescript
type Good = Record<string, string>; // Valid PropertyKey type
```

## 6. Practice Exercises

### Exercise 1: The Empty Object

**Problem:** How do you type an object that is completely empty and is not allowed to have any properties assigned to it?

**Expected output:**
> [!check]- Answer
> ```typescript
> // The built-in Record type can achieve this using `never`!
> const empty: Record<never, never> = {};
> 
> // Alternatively, the most common way is:
> const empty2: Record<string, never> = {};
> ```
> - Think about the type that represents "impossible".

---



### Exercise 2: Mapping Union Enums to Record Values

**Problem:** Create `RolePermissions` mapping `"admin" | "user"` to `string[]`.

**Expected output:**
> [!check]- Answer
> ```text
> Record mapping created
> ```
> ```typescript
> type Role = "admin" | "user";
> type RolePermissions = Record<Role, string[]>;
> const perms: RolePermissions = {
>   admin: ["read", "write"],
>   user: ["read"]
> };
> console.log("Record mapping created");
> ```
>
> **Explanation:** `Record<K, V>` enforces that all keys in union `K` are present in object definitions.

---

### Exercise 3: Dictionary Records with Number Keys

**Problem:** Define `Record<number, string>` for HTTP status message lookups.

**Expected output:**
> [!check]- Answer
> ```text
> HTTP 200: OK
> ```
> ```typescript
> const httpMessages: Record<number, string> = {
>   200: "OK",
>   404: "Not Found"
> };
> console.log(`HTTP 200: ${httpMessages[200]}`);
> ```
>
> **Explanation:** `Record<number, V>` models number-indexed lookup maps.

## 7. Related Terms
- [Index Signatures](../level_03/index_signatures.md) — The raw syntax equivalent to `Record<string, Type>`.
- [Union Types (`|`)](../level_05/union_types.md) — What you pass into `Record` to enforce specific keys.
- [Mapped Types](../level_09/mapped_types.md) — Related concept: Mapped Types.
- [Utility Types Overview](utility_types.md) — Related concept: Utility Types Overview.
---

## 8. Key Takeaways
- **`Record<Keys, Type>`** is the cleanest way to type dictionaries and maps in TypeScript.
- It accepts two arguments: the type of the Keys, and the type of the Values.
- You can pass a Union of literal strings as the Keys, forcing the resulting object to implement exactly those keys.
- Be careful with `Record<string, Type>`, as accessing a missing key at runtime will result in `undefined`, which TS might not warn you about.
