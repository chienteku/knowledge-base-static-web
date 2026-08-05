# `null`, `undefined` & `strictNullChecks`

> **Level 2 — Basic Types**
> The modeling of value absence in TypeScript using the distinct `null` and `undefined` types, enforced by the `strictNullChecks` compiler flag to prevent runtime "null pointer" crashes.

---

## 1. Prerequisites
- [Primitive Types](primitive_types.md) — The basic values of JavaScript.
- [`void` & `never`](void_never.md) — Representing no return or unreachable code.

---

## 2. Term Category
- **Type System Fundamental**

---

## 3. Environment Context
- **Build-time** (The strict checking happens during compilation, compiling down to standard JavaScript value checks at runtime).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Safe Input Check

**Problem:** The function below is rejected by the compiler. Correct it using a conditional type guard to satisfy `strictNullChecks`.

```typescript
function getLength(str: string | undefined): number {
  return str.length; // Error: str is possibly undefined
}
```

**Expected output:**
> [!check]- Answer
> ```typescript
> function getLength(str: string | undefined): number {
>   if (str === undefined) return 0;
>   return str.length;
> }
> // OR using ternary/nullish coalescing
> ```
> - The type of `str` inside the function is a union.
> - Use an `if` block checking `str === undefined` or `!str` to narrow the type to `string`.

---



### Exercise 2: Nullish Coalescing Fallbacks

**Problem:** Use `??` operator to supply default string `"Anonymous"` for `name: string | null`.

**Expected output:**
> [!check]- Answer
> ```text
> Anonymous
> ```
> ```typescript
> const name: string | null = null;
> console.log(name ?? "Anonymous");
> ```
>
> **Explanation:** `??` provides default values when expressions evaluate to `null` or `undefined`.

---

### Exercise 3: Strict Null Checks Flag Verification

**Problem:** Which tsconfig flag prevents implicit assignment of `null` to `string` variables?

**Expected output:**
> [!check]- Answer
> ```text
> strictNullChecks: true
> ```
> ```typescript
> console.log("strictNullChecks: true");
> ```
>
> **Explanation:** `strictNullChecks` treats `null` and `undefined` as distinct domain types.

## 7. Related Terms
- [Primitive Types](primitive_types.md) — Basic data types.
- [`void` & `never`](void_never.md) — The other non-value types.
- [Strict Mode](../level_11/strict_mode.md) — The setting that turns on strict null checking.
- [Non-null Assertion Operator (`!`)](../level_05/non_null_assertion.md) — Related concept: Non-null Assertion Operator (`!`).

---

## 8. Key Takeaways
- `null` and `undefined` represent empty values in JavaScript.
- **`strictNullChecks`** forces developers to explicitly declare nullable values using Union Types (`T | null`).
- Enabling this flag eliminates a massive category of common runtime errors.
- You must use Type Guards, optional chaining (`?.`), or nullish coalescing (`??`) to unpack nullable variables.
- Keep `strictNullChecks` active on all modern projects to ensure type safety.
