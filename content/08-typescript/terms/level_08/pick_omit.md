# `Pick<T>` & `Omit<T>`

> **Level 8 — Utility Types**
> Two built-in Utility Types used to slice a smaller object type out of a larger object type by explicitly selecting or rejecting specific keys.

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The core concept.
- [Literal Types](../level_05/literal_types.md) — How you specify which keys to pick or omit.

---

## 2. Term Category

**TypeScript Utility Type** (Object Key Selection & Exclusions): `Pick<T, K>` creates object types by selecting specific keys, whereas `Omit<T, K>` creates object types by stripping specific keys.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Picking Specific Fields with `Pick<T, K>`

**Scenario:**
Create a `UserPreview` type containing only `id` and `name` from a full `User` entity using `Pick`.

**Requirements:**
1. Define `type UserPreview = Pick<User, "id" | "name">`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: string;
>   name: string;
>   email: string;
>   hashedPassword: string;
>   createdAt: Date;
> }
> 
> type UserPreview = Pick<User, "id" | "name">;
> 
> const preview: UserPreview = { id: "u1", name: "Alice" };
> ```
> 
> #### Technical Explanation
>
> 1. `Pick<T, K>` constructs a type by selecting specific keys `K` from `T`.
> 2. Keeps `UserPreview` synchronized with `User` if `name` or `id` types change in the future.
> 3. Ideal for modeling lightweight UI projection types.
> 
---

### Exercise 2: Omitting Sensitive Fields with `Omit<T, K>`

**Scenario:**
Create a public user profile type by stripping sensitive fields (`hashedPassword`, `ssn`) using `Omit`.

**Requirements:**
1. Define `type PublicUser = Omit<User, "hashedPassword" | "ssn">`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface UserAccount {
>   id: string;
>   email: string;
>   hashedPassword: string;
>   ssn: string;
> }
> 
> type PublicUser = Omit<UserAccount, "hashedPassword" | "ssn">;
> 
> const publicInfo: PublicUser = { id: "u100", email: "user@example.com" };
> ```
> 
> #### Technical Explanation
>
> 1. `Omit<T, K>` constructs a type by picking all properties from `T` and then removing keys matching `K`.
> 2. Implemented internally as `Pick<T, Exclude<keyof T, K>>`.
> 3. Prevents exposing sensitive data fields in API response types.
> 
---

### Exercise 3: Comparative Decision Matrix: `Pick` vs `Omit`

**Scenario:**
Formulate an architectural selection matrix comparing `Pick<T, K>` against `Omit<T, K>`.

**Requirements:**
1. Contrast maintainability when new properties are added to `T`.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Pick vs Omit Selection Matrix:
> - Pick<T, K>: Explicit whitelist. Selecting a small subset of known keys. Resilient to new properties added to T later.
> - Omit<T, K>: Explicit blacklist. Excluding a small subset of unwanted keys. DANGER: New properties added to T later are AUTOMATICALLY INCLUDED in Omit!
> Rule: Prefer Pick for API DTOs and public boundaries to avoid accidentally leaking newly added internal fields.
> ```
> 
> #### Technical Explanation
>
> 1. `Pick` acts as a whitelist, requiring explicit opting-in for new fields.
> 2. `Omit` acts as a blacklist, automatically inheriting un-listed future fields.
> 3. Critical security and maintainability distinction.
> 
---



## 6. Related Terms
- [`Partial<T>` & `Required<T>`](partial_required.md) — The utilities that modify the `?` flag instead of the properties themselves.
- [Union Types (`|`)](../level_05/union_types.md) — What you use to pass multiple keys into Pick/Omit (e.g. `"id" | "name"`).
- [Utility Types Overview](utility_types.md) — Related concept: Utility Types Overview.

---

## 7. Key Takeaways
- **`Pick<T, K>`** creates a new object type containing ONLY the specified keys from the original type.
- **`Omit<T, K>`** creates a new object type containing ALL keys from the original type EXCEPT the specified keys.
- You pass the keys as a Union of Literal strings (`"key1" | "key2"`).
- They are incredibly useful for deriving DTOs (Data Transfer Objects) and API responses from core database interfaces.
