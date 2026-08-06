# `null`, `undefined` & `strictNullChecks`

> **Level 2 — Basic Types**
> The modeling of value absence in TypeScript using the distinct `null` and `undefined` types, enforced by the `strictNullChecks` compiler flag to prevent runtime "null pointer" crashes.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — The basic values of JavaScript.
- [`void` & `never`](void_never.md) — Representing no return or unreachable code.

---

## 2. Term Category

**Type System Fundamental** (Strict Null Handling): `null` and `undefined` represent absent values, strictly checked under `"strictNullChecks": true` to eliminate runtime null crashes.



---

## 3. Explanation

### Environment Context
- **Build-time** (The strict checking happens during compilation, compiling down to standard JavaScript value checks at runtime).

### (1) Design Motivation — "Why did we design this?"
In JavaScript, `null` (representing intentional absence of an object) and `undefined` (representing unintentional absence or uninitialized state) are core primitives.

Historically in TypeScript (and by default in standard JavaScript), `null` and `undefined` were considered compatible with **every other type**. You could write this without any compiler warning:
```typescript
let username: string = "Alice";
username = null; // Historically allowed!
```
At runtime, this led to the most common crash in web development:
`TypeError: Cannot read properties of null (reading 'toLowerCase')`
Tony Hoare, the inventor of the null reference, famously called this his "billion-dollar mistake."

To solve this, TypeScript introduced the **`strictNullChecks`** compiler flag (which is automatically turned on inside `"strict": true` in `tsconfig.json`). When enabled, `null` and `undefined` are extracted out of other types, forcing developers to declare nullability explicitly and handle it safely.

### (2) Core Mechanics
With `strictNullChecks` enabled:
1. `null` and `undefined` get their own distinct types. They are no longer assignable to `string`, `number`, or custom objects.
2. If a value can be absent, you must declare a **Union Type** (`T | null` or `T | undefined`).

```typescript
// 1. Compiler blocks this!
let user: string = null; 

// 2. Correct way: Union Type
let user: string | null = null; 
```

To call methods or read properties off a nullable variable, you must first perform **Type Narrowing** to prove to the compiler that the value is populated.

```typescript
let user: string | null = getActiveUser();

// Compiler blocks this: user might be null!
// user.toUpperCase(); 

// Correct: Narrow the type using a check
if (user !== null) {
  console.log(user.toUpperCase()); // Safe: Inferred as string here!
}
```

### (3) Real-World Application
Handling network payloads where fields may be empty or missing.

```typescript
interface UserProfile {
  name: string;
  avatarUrl?: string; // Opt-in undefined: avatarUrl is string | undefined
}

function renderAvatar(profile: UserProfile) {
  // Safe handling using optional chaining and nullish coalescing
  const url = profile.avatarUrl ?? '/images/default-avatar.png';
  return `<img src="${url}" />`;
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Bypassing strict checks using Non-null Assertions (`!`) lazily

**The mistake:** Appending `!` to ignore compiler alerts on nullable variables instead of verifying them.

**Why it's wrong:** The postfix `!` tells the compiler: "Ignore the check, I guarantee this isn't null." If the value actually turns out to be `null` at runtime, the code will crash.

*Incorrect:*
```typescript
let searchParams = new URLSearchParams(window.location.search);
let query = searchParams.get('q'); // Type: string | null

// Programmer bypasses check:
console.log(query!.toLowerCase()); // Crashes if '?q=' is missing from URL!
```

*Fix:* Perform a safe check.
```typescript
let searchParams = new URLSearchParams(window.location.search);
let query = searchParams.get('q');

if (query) {
  console.log(query.toLowerCase()); // Safe
}
```

**Golden Rule:** Never use `!` to bypass a null warning unless you can mathematically prove the element is already mounted/populated. Always prefer type guards or optional chaining (`?.`).

---



### Mistake 2: Accessing Properties on Potentially `null` or `undefined` Values

**The mistake:** Writing `user.address.city` when `user.address` can be `undefined`.

**Why it's wrong:** With `strictNullChecks: true`, TS flags property reads on optional fields. Use optional chaining `?.` or guard checks.

*Incorrect:*
```typescript
interface User { address?: { city: string } }
function getCity(u: User) { return u.address.city; } // ❌ Object is possibly undefined
```

*Fix:*
```typescript
interface User { address?: { city: string } }
function getCity(u: User) { return u.address?.city; }
```

### Mistake 3: Overusing Non-Null Assertion Operator `!`

**The mistake:** Writing `const val = getNullable()!` to suppress compiler null warnings without checking values.

**Why it's wrong:** Non-null assertion `!` bypasses compile-time checks without runtime checks. If the value is `null`, it crashes at runtime with `TypeError`.

*Incorrect:*
```typescript
const el = document.getElementById("missing")!; // 💥 Crashes at runtime if missing!
```

*Fix:*
```typescript
const el = document.getElementById("missing");
if (el) { /* Safely access el */ }
```

## 5. Practice Exercises

### Exercise 1: Narrowing Optional and Nullable Properties

**Scenario:**
Safely access optional user email properties under `"strictNullChecks": true` using optional chaining (`?.`) or null checking.

**Requirements:**
1. Handle `string | null | undefined` safely.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   name: string;
>   email?: string | null;
> }
> 
> function getEmailDomain(user: User): string {
>   // Optional chaining and nullish coalescing:
>   const email = user.email?.toLowerCase() ?? "no-email-provided";
>   return email;
> }
> ```
> 
> #### Technical Explanation
>
> 1. `"strictNullChecks": true` forces explicit handling of `null` and `undefined` types.
> 2. Optional chaining (`?.`) short-circuits to `undefined` if the receiver object is `null` or `undefined`.
> 3. Nullish coalescing (`??`) provides fallback defaults only for `null` or `undefined` values.
> 
---

### Exercise 2: Non-Null Assertion Operator Danger Audit

**Scenario:**
Audit the risks of using the non-null assertion operator (`!`) to bypass strict null checks.

**Requirements:**
1. Show how `user.email!` causes runtime crashes if `email` is `null`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Profile {
>   avatarUrl?: string;
> }
> 
> function renderAvatar(profile: Profile) {
>   // ⚠️ DANGEROUS: Suppresses compiler warning, but crashes if avatarUrl is undefined!
>   // const url: string = profile.avatarUrl!; 
> 
>   // ✅ SAFE (Explicit check or default fallback):
>   const url: string = profile.avatarUrl ?? "/default-avatar.png";
>   return url;
> }
> ```
> 
> #### Technical Explanation
>
> 1. The non-null assertion operator (`!`) tells the compiler to assume a value is not `null` or `undefined`.
> 2. Completely erased at compile time; provides zero runtime safety.
> 3. Prefer explicit runtime checks or fallback operators (`??`).
> 
---

### Exercise 3: Distinguishing `null` vs `undefined` Intent

**Scenario:**
Formulate a architectural distinction matrix comparing `null` against `undefined`.

**Requirements:**
1. Contrast explicit absence vs un-initialized/missing properties.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> null vs undefined Matrix:
> - undefined: Represents an un-initialized variable, missing object property, or omitted optional argument. Automatically assigned by JS engine.
> - null: Represents an explicit, intentional absence of object value or empty database reference. Set deliberately by developers.
> ```
> 
> #### Technical Explanation
>
> 1. `undefined` is the default JavaScript value for unassigned identifiers.
> 2. `null` is a deliberate value indicating "no value present".
> 3. Both are treated as distinct types under `strictNullChecks`.
> 
---



## 6. Related Terms
- [Primitive Types](primitive_types.md) — Basic data types.
- [`void` & `never`](void_never.md) — The other non-value types.
- [Strict Mode](../level_11/strict_mode.md) — The setting that turns on strict null checking.
- [Non-null Assertion Operator (`!`)](../level_05/non_null_assertion.md) — Related concept: Non-null Assertion Operator (`!`).

---

## 7. Key Takeaways
- `null` and `undefined` represent empty values in JavaScript.
- **`strictNullChecks`** forces developers to explicitly declare nullable values using Union Types (`T | null`).
- Enabling this flag eliminates a massive category of common runtime errors.
- You must use Type Guards, optional chaining (`?.`), or nullish coalescing (`??`) to unpack nullable variables.
- Keep `strictNullChecks` active on all modern projects to ensure type safety.
