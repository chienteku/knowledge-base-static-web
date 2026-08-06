# Optional Properties (`?`)

> **Level 3 — Object Types & Interfaces**
> A syntax modifier that marks a specific property inside an object as non-mandatory. The object is valid whether the property is present or missing.

---

## 1. Prerequisites
- [Interfaces](interfaces.md) — Where optional properties are usually defined.

---

## 2. Term Category

**TypeScript Core Syntax** (Optional Property Modifiers): Optional properties (`key?: T`) mark object fields as optional, implicitly unioning their declared type with `undefined`.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Defining Optional Properties with `?`

**Scenario:**
Create a `UserProfile` interface with optional `bio` and `avatarUrl` fields using `?`.

**Requirements:**
1. Use `?` modifier on optional properties.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface UserProfile {
>   username: string;
>   bio?: string;
>   avatarUrl?: string;
> }

const minimalUser: UserProfile = { username: "coder123" };
const fullUser: UserProfile = { username: "coder123", bio: "Full stack dev" };
```

> #### Technical Explanation
>
> 1. The `?` modifier marks a property as optional during object construction.
> 2. Automatically unions the declared type with `undefined` (`bio: string | undefined`).
> 3. Allows creating objects without specifying optional properties.

---

### Exercise 2: Safely Handling Optional Properties with Default Values

**Scenario:**
Destructure optional property parameters and provide fallback default values.

**Requirements:**
1. Destructure `options` with default property values.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface RenderOptions {
>   title: string;
>   theme?: "light" | "dark";
>   padding?: number;
> }

function renderWidget({ title, theme = "light", padding = 16 }: RenderOptions) {
  console.log(`Rendering ${title} with theme=${theme} padding=${padding}px`);
}
```

> #### Technical Explanation
>
> 1. Destructuring with default values (`theme = "light"`) converts `string | undefined` to a guaranteed `string` inside the function body.
> 2. Eliminates repetitive manual `if (options.theme)` checks.
> 3. Standard ES6 + TypeScript pattern for handling optional configuration parameters.

---

### Exercise 3: Auditing `exactOptionalPropertyTypes` Behavior

**Scenario:**
Explain the behavior difference of `bio?: string` under `"exactOptionalPropertyTypes": true`.

**Requirements:**
1. Detail `bio?: string` under `exactOptionalPropertyTypes`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Settings {
>   theme?: string;
> }

// Under exactOptionalPropertyTypes: true
const s1: Settings = {}; // ✅ Valid (Property omitted)
// const s2: Settings = { theme: undefined }; // ❌ Compile Error under exactOptionalPropertyTypes!
```

> #### Technical Explanation
>
> 1. By default, `key?: string` permits both omitting `key` AND explicitly setting `key: undefined`.
> 2. Enabling `"exactOptionalPropertyTypes": true` forbids setting `key: undefined` explicitly; properties can ONLY be omitted or set to `string`.
> 3. Ensures exact object key presence guarantees.

---



## 6. Related Terms
- [Interfaces](interfaces.md) — The parent structure.
- [Type Narrowing](../level_06/type_narrowing.md) — How you safely interact with an optional property.
- [Object Types](object_types.md) — Related concept: Object Types.
- [Optional & Default Parameters](../level_04/optional_default_parameters.md) — Related concept: Optional & Default Parameters.
- [`Partial<T>` & `Required<T>`](../level_08/partial_required.md) — Related concept: `Partial<T>` & `Required<T>`.

---

## 7. Key Takeaways
- **Optional Properties** (denoted by `?`) allow an object to be valid even if that specific property is missing.
- The property's type is invisibly expanded to include `| undefined`.
- TypeScript will force you to verify the property exists (via `if` statements or Optional Chaining `?.`) before you attempt to access methods on it.
- `key?: type` is significantly different from `key: type | undefined` (the latter forces the key to exist).
