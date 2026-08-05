# `Pick<T>` & `Omit<T>`

> **Level 8 — Utility Types**
> Two built-in Utility Types used to slice a smaller object type out of a larger object type by explicitly selecting or rejecting specific keys.

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The core concept.
- [Literal Types](../level_05/literal_types.md) — How you specify which keys to pick or omit.
---

## 2. Term Category
- **TypeScript Standard Library**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) `Pick<Type, Keys>`
Creates a new type by picking a specific set of properties from an existing type.
**Design Motivation:** You have a massive `DatabaseUser` interface. You need to send a preview of that user to the frontend UI, and the UI only needs the `id` and `username`. You use `Pick` to safely extract just those two fields.

```typescript
interface DatabaseUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

// We ONLY want id and username. 
// We pass a Union of Literal string keys!
type UserPreview = Pick<DatabaseUser, "id" | "username">;

/* UserPreview is now exactly:
{
  id: string;
  username: string;
}
*/
```

### (2) `Omit<Type, Keys>`
The exact opposite. Creates a new type by taking all properties from an existing type, and explicitly deleting a specific set of properties.
**Design Motivation:** You have the same `DatabaseUser` interface. You want to send the entire object to the frontend, EXCEPT for the `passwordHash`. Writing `Pick` with 40 keys would be painful. Writing `Omit` with 1 key is easy.

```typescript
// We want everything EXCEPT the password
type PublicUser = Omit<DatabaseUser, "passwordHash">;

/* PublicUser is now exactly:
{
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}
*/
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Spelling mistakes in `Omit`

**The mistake:** A developer writes `type Public = Omit<User, "paswordHash">`. (Notice the typo in password).

**Why it's dangerous:** In many versions of TypeScript, `Pick` strictly checks that the keys you provide actually exist on the parent object. However, because of how `Omit` is mathematically constructed under the hood, it historically did NOT throw an error if you provided a typo! It would just quietly omit nothing, accidentally exposing the `passwordHash` to your public API!
**Golden Rule:** (Prior to TS 4.3 improvements) `Pick` was often considered safer than `Omit` because `Pick` forces strict key checking. Always double-check your spelling when using `Omit` on sensitive data boundaries.

---



### Mistake 2: Passing Non-Existent Property Keys to `Pick<T, K>`

**The mistake:** Writing `Pick<User, "non_existent">`.

**Why it's wrong:** Key argument `K` in `Pick<T, K>` is constrained to `extends keyof T`. Passing un-listed property keys triggers a compile error.

*Incorrect:*
```typescript
interface User { id: number; name: string }
// type Bad = Pick<User, "invalid">; // ❌ Type '"invalid"' is not assignable to type 'keyof User'
```

*Fix:*
```typescript
interface User { id: number; name: string }
type Good = Pick<User, "name">; // Correct property key
```

### Mistake 3: Confusing `Omit<T, K>` with Union Exclude `Exclude<T, U>`

**The mistake:** Using `Omit` to filter union types like `"a" | "b" | "c"`.

**Why it's wrong:** `Omit<T, K>` operates on object interfaces. `Exclude<T, U>` operates on union types.

*Incorrect:*
```typescript
type Union = "a" | "b" | "c";
// type Bad = Omit<Union, "a">; // ❌ Omit expects object type
```

*Fix:*
```typescript
type Union = "a" | "b" | "c";
type Good = Exclude<Union, "a">; // Result: "b" | "c"
```

## 6. Practice Exercises

### Exercise 1: Pick vs Omit

**Problem:** You have an interface with 10 properties. You need a new type with 8 of those properties. Should you use `Pick` or `Omit`?

**Expected output:**
> [!check]- Answer
> ```text
> You should almost certainly use `Omit<Type, "key1" | "key2">`.
> Writing out 8 keys for `Pick` is tedious and harder to read. Always use whichever one results in typing fewer literal keys.
> ```
> - Which one requires less typing?

---



### Exercise 2: Constructing DTOs with `Pick`

**Problem:** Construct `UserPreview` picking `id` and `name` from `User` interface.

**Expected output:**
> [!check]- Answer
> ```text
> Pick DTO created
> ```
> ```typescript
> interface User { id: number; name: string; email: string; passwordHash: string }
> type UserPreview = Pick<User, "id" | "name">;
> const preview: UserPreview = { id: 1, name: "Alice" };
> console.log("Pick DTO created");
> ```
>
> **Explanation:** `Pick<T, K>` constructs object types containing specified subset keys.

---

### Exercise 3: Stripping Sensitive Fields with `Omit`

**Problem:** Omit `passwordHash` from `User` interface.

**Expected output:**
> [!check]- Answer
> ```text
> Omit sanitized interface created
> ```
> ```typescript
> interface User { id: number; name: string; passwordHash: string }
> type SafeUser = Omit<User, "passwordHash">;
> const safe: SafeUser = { id: 1, name: "Alice" };
> console.log("Omit sanitized interface created");
> ```
>
> **Explanation:** `Omit<T, K>` creates object types excluding specified keys.

## 7. Related Terms
- [`Partial<T>` & `Required<T>`](partial_required.md) — The utilities that modify the `?` flag instead of the properties themselves.
- [Union Types (`|`)](../level_05/union_types.md) — What you use to pass multiple keys into Pick/Omit (e.g. `"id" | "name"`).
- [Utility Types Overview](utility_types.md) — Related concept: Utility Types Overview.
---

## 8. Key Takeaways
- **`Pick<T, K>`** creates a new object type containing ONLY the specified keys from the original type.
- **`Omit<T, K>`** creates a new object type containing ALL keys from the original type EXCEPT the specified keys.
- You pass the keys as a Union of Literal strings (`"key1" | "key2"`).
- They are incredibly useful for deriving DTOs (Data Transfer Objects) and API responses from core database interfaces.
