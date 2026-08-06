# Index Signatures

> **Level 3 — Object Types & Interfaces**
> A syntax used when you don't know the exact *names* of the properties an object will have, but you do know the *types* of the keys and the values. Often used for dictionaries or maps.

---

## 1. Prerequisites
- [Interfaces](interfaces.md) — The structure this syntax is used within.
- [Object Types](object_types.md) — Defining dynamic object key-value properties.

---

## 2. Term Category

**TypeScript Core Syntax** (Dynamic Key-Value Map Annotations): Index signatures (`[key: string]: T`) define explicit types for objects with dynamic or unknown property names.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
Sometimes you build objects that act as dynamic dictionaries or caches. 
For example, you want to store user scores by their username: `const scores = { "Alice": 100, "Bob": 85 }`.
You cannot write an interface for this because you don't know the names of the users in advance!
```typescript
// ❌ Impossible. We don't know who will play the game!
interface Scores {
  Alice: number;
  Bob: number;
}
```
TypeScript provides **Index Signatures** to say: *"I don't know the keys, but whatever the key is, the value must be X."*

### (2) The Syntax
You define an Index Signature using square brackets `[keyName: type]`.

```typescript
interface ScoreDictionary {
  // The key must be a string. The value must be a number.
  [username: string]: number;
}

const scores: ScoreDictionary = {};

scores["Alice"] = 100; // ✅ Valid
scores.Bob = 85;       // ✅ Valid (Dot notation works too)

scores["Charlie"] = "winner"; // ❌ Error: Type 'string' is not assignable to type 'number'
```

### (3) Mixing Known and Unknown Keys
You can mix explicit properties with an Index Signature, but there is a strict rule: **All explicit properties MUST match the type of the Index Signature.**

```typescript
interface UserCache {
  version: number;          // ✅ Valid: number matches number
  [userId: string]: number; // The index signature
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The `undefined` trap in Strict Mode

**The mistake:** You have `const scores: ScoreDictionary = { Alice: 100 }`. You access `const s = scores["Charlie"]`. TypeScript infers `s` is a `number`, and allows you to do `s.toFixed()`. At runtime, the app crashes because `Charlie` doesn't exist, so `s` is actually `undefined`!

**Why it happens:** By default, TypeScript assumes that if you access an Index Signature, the value *exists* and perfectly matches the type. It is dangerously optimistic.
**Golden Rule:** In modern TypeScript, you should enable the `noUncheckedIndexedAccess` flag in `tsconfig.json`. This forces TS to treat all Index Signature accesses as `number | undefined`, forcing you to write `if (s)` checks, preventing runtime crashes.

---



### Mistake 2: Assuming Index Signatures Guarantee Runtime Property Existence

**The mistake:** Reading `dict["non_existent"].toUpperCase()` on `{ [key: string]: string }` without null checks.

**Why it's wrong:** Index signature lookup returns type `string`, but at runtime non-existent keys return `undefined`, causing `TypeError: Cannot read properties of undefined`.

*Incorrect:*
```typescript
interface Dict { [key: string]: string }
const d: Dict = {};
// const val = d["missing"].toUpperCase(); // 💥 Runtime TypeError!
```

*Fix:*
```typescript
interface Dict { [key: string]: string | undefined }
// Enable `noUncheckedIndexedAccess: true` in tsconfig.json
const d: Dict = {};
const val = d["missing"]?.toUpperCase();
```

### Mistake 3: Declaring Incompatible Explicit Properties Alongside Broad Index Signatures

**The mistake:** Declaring `id: number;` inside `{ [key: string]: string }`.

**Why it's wrong:** All explicit object properties must conform to the return type defined by the index signature.

*Incorrect:*
```typescript
interface Bad {
    [key: string]: string;
    // id: number; // ❌ Property 'id' of type 'number' is not assignable to 'string' index type
}
```

*Fix:*
```typescript
interface Good {
    [key: string]: string | number;
    id: number;
}
```

## 5. Practice Exercises

### Exercise 1: Typing Dynamic Dictionary Maps

**Scenario:**
Create a type-safe dynamic dictionary storing user scores keyed by string usernames (`Record<string, number>` or index signature).

**Requirements:**
1. Use `[username: string]: number` index signature.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface UserScores {
>   [username: string]: number;
> }

const scores: UserScores = {
  alice: 95,
  bob: 88,
  charlie: 92
};

scores["david"] = 100;
```

> #### Technical Explanation
>
> 1. Index signatures (`[key: string]: number`) declare that any string property key maps to a `number` value.
> 2. Ideal for modeling dynamic hash maps or dictionary data structures.
> 3. Enforces value type consistency across dynamic object keys.

---

### Exercise 2: Combining Explicit Properties with Index Signatures

**Scenario:**
Combine explicit fixed properties (`id: string`) with a dynamic string index signature.

**Requirements:**
1. Enforce that all properties conform to index signature value type.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Dictionary {
>   name: string; // Explicit property
>   [key: string]: string; // All additional properties MUST also be string!
> }

const dict: Dictionary = {
  name: "English Terms",
  description: "Standard terminology",
  category: "Language"
};
```

> #### Technical Explanation
>
> 1. Explicit properties (`name: string`) must have types compatible with the index signature value type (`string`).
> 2. Setting `[key: string]: string | number` allows explicit properties of type `number` or `string`.
> 3. Ensures strict key-value type guarantees across the entire object.

---

### Exercise 3: Safely Handling Missing Keys with `undefined`

**Scenario:**
Configure index signatures to return `T | undefined` when accessing arbitrary keys (`"noUncheckedIndexedAccess": true`).

**Requirements:**
1. Show how `"noUncheckedIndexedAccess": true` forces checking for `undefined` on index lookups.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Cache {
>   [key: string]: string;
> }

function getCachedValue(cache: Cache, key: string): string {
  const val = cache[key]; // Under noUncheckedIndexedAccess, val is string | undefined!
  if (val !== undefined) {
    return val.toUpperCase();
  }
  return "MISSING";
}
```

> #### Technical Explanation
>
> 1. By default, index signature lookups return `T` without checking if the key actually exists at runtime.
> 2. `"noUncheckedIndexedAccess": true` automatically unions index signature return types with `undefined`.
> 3. Prevents runtime `TypeError` crashes on missing dictionary keys.

---



## 6. Related Terms
- [Interfaces](interfaces.md) — Where index signatures live.
- [Utility Types Overview](../level_08/utility_types.md) — The `Record` type is the generic equivalent of this.
- [Excess Property Checks](excess_property_checks.md) — Related concept: Excess Property Checks.
- [`Record<Keys, Type>`](../level_08/record.md) — Related concept: `Record<Keys, Type>`.

---

## 7. Key Takeaways
- **Index Signatures** are used to type objects acting as dynamic dictionaries/maps where the property names are unknown ahead of time.
- Syntax: `[key: string]: number`.
- If an interface has an index signature, all other explicitly named properties in that interface must be compatible with the index signature's value type.
- By default, accessing dynamic keys is dangerously optimistic. Enable `noUncheckedIndexedAccess` in TS 4.1+ for true safety.
- `Record<K, V>` is the modern, shorter equivalent to using an Index Signature.
