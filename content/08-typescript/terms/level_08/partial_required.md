# `Partial<T>` & `Required<T>`

> **Level 8 — Utility Types**
> Two built-in Utility Types that take an object type and flip all of its properties to either be optional (`?`) or mandatory.

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The core concept.
- [Optional Properties (`?`)](../level_03/optional_properties.md) — The `?` syntax these utilities add or remove.
---

## 2. Term Category
- **TypeScript Standard Library**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) `Partial<Type>`
Takes an existing interface or object type and makes **every single property inside it optional**.
**Design Motivation:** The absolute most common use case for `Partial` is the HTTP `PATCH` or `PUT` request (Update API). When updating a database record, a user might only send 1 field to update, or they might send all 10 fields. You don't know!

```typescript
interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl: string;
}

// A user is updating their profile. They only want to change their name.
// We use Partial so that they don't have to provide the ID or email again.
function updateUser(updates: Partial<UserProfile>) {
  // `updates` is typed as: { id?: number, name?: string, email?: string, avatarUrl?: string }
  // ... update database
}

updateUser({ name: "Alice" }); // ✅ Valid
updateUser({ email: "a@a.com", avatarUrl: "http..." }); // ✅ Valid
```

### (2) `Required<Type>`
The exact opposite. Takes an existing interface and strips away the `?` modifier, making **every single property mandatory**.
**Design Motivation:** Often used when reading configuration files. The user's input might be optional, but once it passes through your internal system, default values are assigned, meaning internally the object is strictly required.

```typescript
interface AppConfig {
  port?: number;
  verboseLogging?: boolean;
}

// User provides optional config
const userConfig: AppConfig = { port: 8080 };

// Our internal system applies defaults and returns a strictly required config
const internalConfig: Required<AppConfig> = {
  port: userConfig.port || 3000,
  verboseLogging: userConfig.verboseLogging || false
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Deep/Nested Partials

**The mistake:** A developer writes `type Update = Partial<User>` where `User` contains a nested object `address: { street: string, zip: string }`. They expect to be able to do `update({ address: { street: "Main" } })`. It throws an error: `zip is missing in type...`.

**Why it's wrong:** Both `Partial<T>` and `Required<T>` are **shallow** operations. They only affect the top-level properties of the object. They do not recursively dig into nested objects. The top-level `address` became optional (`address?`), but the `zip` *inside* address did not!
**Golden Rule:** If you need a Deep Partial (common in Redux or large form state), you cannot use the built-in `Partial<T>`. You must write a custom recursive mapped type (or use a library like `type-fest`'s `DeepPartial`).

---



### Mistake 2: Assuming `Partial<T>` Performs Deep Recursive Property Optionality

**The mistake:** Expecting `Partial<{ user: { name: string } }>` to make `user.name` optional.

**Why it's wrong:** `Partial<T>` is shallow by default. Nested object properties remain required.

*Incorrect:*
```typescript
type Config = { db: { host: string } };
type Patch = Partial<Config>;
// const p: Patch = { db: {} }; // ❌ Property 'host' is missing in type '{}' but required
```

*Fix:*
```typescript
type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> }; // Recursive deep partial utility
```

### Mistake 3: Confusing `Required<T>` with Non-Nullable Property Values

**The mistake:** Expecting `Required<{ name: string | null }>` to remove `null` from property types.

**Why it's wrong:** `Required<T>` removes optional modifiers `?`. It does NOT strip explicit `null` from property value unions.

*Incorrect:*
```typescript
type User = { name?: string | null };
type Req = Required<User>; // Req.name is 'string | null', NOT 'string'!
```

*Fix:*
```typescript
type User = { name?: string | null };
type StrictUser = { [K in keyof User]-?: NonNullable<User[K]> }; // Strips optionality and nullish types
```

## 6. Practice Exercises

### Exercise 1: Readonly

**Problem:** There is a third utility type that acts exactly like `Partial` and `Required`, but instead of modifying the `?` symbol, it modifies the `readonly` keyword. What is it called?

**Expected output:**
> [!check]- Answer
> ```typescript
> // Readonly<T>
> // It takes all properties and locks them down so they cannot be reassigned!
> type ImmutableUser = Readonly<UserProfile>;
> ```
> - It shares its name with the keyword!

---



### Exercise 2: Creating Patch Update Types with `Partial`

**Problem:** Create update type `UserPatch` from `interface User { id: number; name: string; age: number }`.

**Expected output:**
> [!check]- Answer
> ```text
> Partial user properties created
> ```
> ```typescript
> interface User { id: number; name: string; age: number }
> type UserPatch = Partial<User>;
> const update: UserPatch = { age: 31 }; // Allowed!
> console.log("Partial user properties created");
> ```
>
> **Explanation:** `Partial<T>` makes all top-level properties optional for patch updates.

---

### Exercise 3: Enforcing All Properties with `Required`

**Problem:** Convert `interface Config { host?: string; port?: number }` to require all keys.

**Expected output:**
> [!check]- Answer
> ```text
> Required<Config> forces host and port presence
> ```
> ```typescript
> interface Config { host?: string; port?: number }
> type StrictConfig = Required<Config>;
> const cfg: StrictConfig = { host: "localhost", port: 8080 };
> console.log("Required<Config> forces host and port presence");
> ```
>
> **Explanation:** `Required<T>` removes `?` optional modifiers from all properties.

## 7. Related Terms
- [Optional Properties (`?`)](../level_03/optional_properties.md) — What `Partial` applies.
- [`Pick<T>` & `Omit<T>`](pick_omit.md) — The other half of the object utility toolkit.
- [Utility Types Overview](utility_types.md) — Related concept: Utility Types Overview.
- [Mapped Types](../level_09/mapped_types.md) — Related concept: Mapped Types.
---

## 8. Key Takeaways
- **`Partial<T>`** converts all properties in an object to be optional (`?`). Perfect for Update APIs.
- **`Required<T>`** converts all properties in an object to be mandatory, stripping away any `?`. Perfect for finalized configuration objects.
- Both of these utility types are **shallow**; they do not affect nested objects.
