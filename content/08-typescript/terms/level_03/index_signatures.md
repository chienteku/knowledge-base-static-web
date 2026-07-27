# Index Signatures

> **Level 3 — Object Types & Interfaces**
> A syntax used when you don't know the exact *names* of the properties an object will have, but you do know the *types* of the keys and the values. Often used for dictionaries or maps.

---

## 1. Prerequisites
- [Interfaces](../level_03/interfaces.md) — The structure this syntax is used within.

---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Record Utility Type

**Problem:** Writing `[key: string]: number` in an interface every time is slightly tedious. What is the built-in Generic Utility Type that accomplishes the exact same thing in a single line?

**Expected output:**
```typescript
const scores: Record<string, number> = {};
// Record<KeyType, ValueType> is the exact same thing as an Index Signature!
```

> [!check]- Answer
> - It starts with 'R'.

---



### Exercise 2: Configuring `noUncheckedIndexedAccess`

**Problem:** What tsconfig compiler option automatically adds `| undefined` to index signature lookups?

**Expected output:**
```text
noUncheckedIndexedAccess: true
```

> [!check]- Answer
> ```typescript
> console.log("noUncheckedIndexedAccess: true");
> ```
>
> **Explanation:** `noUncheckedIndexedAccess` forces index lookups to include `undefined` in their return types.

### Exercise 3: Symbol and Number Index Signatures

**Problem:** Can number index signatures be assignable to string index signatures? (Yes)

**Expected output:**
```text
Yes, number keys convert to strings in JS object indexing
```

> [!check]- Answer
> ```typescript
> console.log("Yes, number keys convert to strings in JS object indexing");
> ```
>
> **Explanation:** JS coerces numeric index keys to strings during property lookups.

## 7. Related Terms
- [Interfaces](../level_03/interfaces.md) — Where index signatures live.
- [Utility Types](../level_08/utility_types.md) — The `Record` type is the generic equivalent of this.

---

## 8. Key Takeaways
- **Index Signatures** are used to type objects acting as dynamic dictionaries/maps where the property names are unknown ahead of time.
- Syntax: `[key: string]: number`.
- If an interface has an index signature, all other explicitly named properties in that interface must be compatible with the index signature's value type.
- By default, accessing dynamic keys is dangerously optimistic. Enable `noUncheckedIndexedAccess` in TS 4.1+ for true safety.
- `Record<K, V>` is the modern, shorter equivalent to using an Index Signature.
