# Optional Properties (`?`)

> **Level 3 — Object Types & Interfaces**
> A syntax modifier that marks a specific property inside an object as non-mandatory. The object is valid whether the property is present or missing.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — Where optional properties are usually defined.

---

## 2. Term Category
- **TypeScript Type Modifier**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In real-world applications, data is often incomplete. A `User` object might always have an `email` and a `password`, but their `phoneNumber` might be blank because they skipped that step during signup.
If you define `interface User { phoneNumber: string }`, TypeScript will throw a fatal error every time you try to create a User without a phone number. We need a way to tell the compiler: *"This property might be here, but it's okay if it isn't."*

### (2) The `?` Syntax
You make a property optional by placing a question mark `?` immediately before the colon `:`.

```typescript
interface User {
  id: number;
  email: string;
  phoneNumber?: string; // Optional!
}

// ✅ Valid (Missing phoneNumber is fine)
const u1: User = { id: 1, email: "a@a.com" };

// ✅ Valid (Providing phoneNumber is fine)
const u2: User = { id: 2, email: "b@b.com", phoneNumber: "555-1234" };
```

### (3) The Type Implication of `?`
Under the hood, adding `?` does two things:
1. It tells the compiler that the key does not need to exist.
2. It automatically adds `| undefined` to the property's type. In the example above, `phoneNumber` is technically `string | undefined`.

Because it might be `undefined`, TypeScript will aggressively force you to check if the property exists before you try to use it!
```typescript
function dial(user: User) {
  // ❌ Error: Object is possibly 'undefined'
  console.log(user.phoneNumber.length); 

  // ✅ Good: We checked first!
  if (user.phoneNumber) {
    console.log(user.phoneNumber.length);
  }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `?` with `| undefined`

**The mistake:** A developer defines `interface User { phone: string | undefined }`. They try to create the user: `const u: User = { email: "a@a.com" }`. TS throws an error: `Property 'phone' is missing`.

**Why it's wrong:**
- `phone?: string` means the key `phone` doesn't even need to be in the object.
- `phone: string | undefined` means the key `phone` MUST be in the object, and you MUST explicitly set it to `undefined` (e.g., `{ email: "a", phone: undefined }`).
**Golden Rule:** Always use `?` when a property is truly optional.

---



### Mistake 2: Confusing Optional Property `prop?: string` with `prop: string | undefined`

**The mistake:** Expecting `{ prop: string | undefined }` to allow omitting key `prop` entirely.

**Why it's wrong:** `prop?: string` allows omitting key `prop`. `prop: string | undefined` REQUIRES key `prop` to be present in object literal, even if set to `undefined`.

*Incorrect:*
```typescript
type A = { key: string | undefined };
// const obj: A = {}; // ❌ Property 'key' is missing in type '{}' but required
```

*Fix:*
```typescript
type B = { key?: string };
const obj: B = {}; // Allowed! Key can be omitted entirely
```

### Mistake 3: Calling Methods on Optional Properties Without Optional Chaining or Guarding

**The mistake:** Writing `user.bio.toUpperCase()` when `bio?: string` is optional.

**Why it's wrong:** Optional properties evaluate to `undefined` when omitted, causing runtime crashes.

*Incorrect:*
```typescript
type User = { bio?: string }
function logBio(u: User) { return u.bio.toUpperCase(); } // ❌ Object is possibly 'undefined'
```

*Fix:*
```typescript
type User = { bio?: string }
function logBio(u: User) { return u.bio?.toUpperCase(); }
```

## 6. Practice Exercises

### Exercise 1: Optional Chaining

**Problem:** Instead of writing a bulky `if (user.phoneNumber)` block, what is the modern ES2020/TypeScript operator used to safely access optional properties in a single line?

**Expected output:**
> [!check]- Answer
> ```typescript
> // The Optional Chaining operator (?.)
> const length = user.phoneNumber?.length;
> // If phoneNumber is undefined, the whole expression safely evaluates to undefined, avoiding a crash!
> ```
> - It shares the same symbol as the Optional Property modifier!

---



### Exercise 2: Exact Optional Property Types (`exactOptionalPropertyTypes`)

**Problem:** What tsconfig flag prevents assigning explicit `undefined` to `prop?: string`?

**Expected output:**
> [!check]- Answer
> ```text
> exactOptionalPropertyTypes: true
> ```
> ```typescript
> console.log("exactOptionalPropertyTypes: true");
> ```
>
> **Explanation:** `exactOptionalPropertyTypes` distinguishes omitted keys from keys assigned `undefined`.

---

### Exercise 3: Destructuring Optional Properties with Defaults

**Problem:** Destructure `const { role = "guest" } = user` for `role?: string`.

**Expected output:**
> [!check]- Answer
> ```text
> guest
> ```
> ```typescript
> type User = { role?: string };
> const user: User = {};
> const { role = "guest" } = user;
> console.log(role);
> ```
>
> **Explanation:** Destructuring default initializers handle missing optional properties gracefully.

## 7. Related Terms
- [Interfaces](../level_03/interfaces.md) — The parent structure.
- [Type Narrowing](../level_06/type_narrowing.md) — How you safely interact with an optional property.

---

## 8. Key Takeaways
- **Optional Properties** (denoted by `?`) allow an object to be valid even if that specific property is missing.
- The property's type is invisibly expanded to include `| undefined`.
- TypeScript will force you to verify the property exists (via `if` statements or Optional Chaining `?.`) before you attempt to access methods on it.
- `key?: type` is significantly different from `key: type | undefined` (the latter forces the key to exist).
