# Intersection Types (`&`)

> **Level 5 — Union & Intersection Types**
> A syntax that allows you to combine multiple types into a single, massive type. It essentially means "AND" in the TypeScript type system.

---

## 1. Prerequisites
- [Union Types](../level_05/union_types.md) — The exact opposite concept.
- [Object Types](../level_03/object_types.md) — What Intersection Types are almost exclusively used for.

---

## 2. Term Category
- **TypeScript Core Syntax**

---

## 3. Environment Context
- **Compile-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sometimes you have two completely separate Object Types, but you need a new object that contains all the properties from *both* of them combined.
Instead of copying and pasting properties, you use an **Intersection Type**. It forces an object to satisfy Type A **AND** Type B simultaneously.

### (2) The `&` Syntax
You create an Intersection Type by separating types with the ampersand `&` character.

```typescript
interface ErrorHandling {
  success: boolean;
  error?: string;
}

interface ArtworksData {
  artworks: { title: string }[];
}

// Combine them using `&`
type ArtworksResponse = ArtworksData & ErrorHandling;

// This object MUST have properties from BOTH interfaces
const response: ArtworksResponse = {
  success: true,
  artworks: [{ title: "Mona Lisa" }]
};
```

### (3) Intersection vs Extends
Intersection Types (`A & B`) achieve a very similar outcome to Interface Inheritance (`interface A extends B`). 
However, Intersections are usually used with `type` aliases, and they handle conflicting properties slightly differently (Intersections merge conflicting properties into unions/never, while `extends` throws an error).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Intersecting Primitives

**The mistake:** A developer writes: `type Impossible = string & number;`

**Why it's wrong:** What value is simultaneously a `string` AND a `number`? None. It is mathematically impossible.
If you try to intersect primitive types that have no overlap, TypeScript will silently resolve the resulting type to [`never`](../level_02/void_never.md). You will never be able to assign a value to it.
**Golden Rule:** Almost exclusively use Intersection Types (`&`) to combine Object shapes, never primitives. If you are dealing with primitives, you almost certainly want a Union (`|`).

---



### Mistake 2: Intersecting Incompatible Primitive Types Resulting in `never`

**The mistake:** Creating `type Bad = string & number;` expecting a combined primitive type.

**Why it's wrong:** No single runtime value can simultaneously be both a `string` AND a `number`. Intersecting primitive types evaluates to `never`.

*Incorrect:*
```typescript
type Impossible = string & number; // Evaluates to type 'never'!
```

*Fix:*
```typescript
type Acceptable = string | number; // Use Union type for either string OR number
```

### Mistake 3: Confusing Structural Intersections with Class Inheritance

**The mistake:** Intersecting objects with conflicting non-optional property types.

**Why it's wrong:** Intersecting `{ a: string } & { a: number }` merges property `a` to `string & number` (`never`), rendering the entire object un-instantiable.

*Incorrect:*
```typescript
type A = { id: string };
type B = { id: number };
type AB = A & B; // AB.id is 'never'!
```

*Fix:*
```typescript
type A = { id: string };
type B = { id: string; extra: number };
type AB = A & B; // Compatible property types merge safely
```

## 6. Practice Exercises

### Exercise 1: Identifying the Operator

**Problem:** Read the following code. Is `User` allowed to be an object that ONLY has `name`?
`type User = { name: string } & { age: number }`

**Expected output:**
> [!check]- Answer
> ```text
> No!
> Because it uses the Intersection (`&`) operator, the object MUST satisfy BOTH sides simultaneously. 
> It must look like: `{ name: "Alice", age: 28 }`. 
> (If it used `|`, it could be just `{ name: "Alice" }`).
> ```
> - Does `&` mean AND or OR?

---



### Exercise 2: Merging Object Types with Intersection

**Problem:** Create type `UserWithRole` by intersecting `User` (`name: string`) and `Role` (`role: string`).

**Expected output:**
> [!check]- Answer
> ```text
> UserWithRole merged
> ```
> ```typescript
> type User = { name: string };
> type Role = { role: string };
> type UserWithRole = User & Role;
> const u: UserWithRole = { name: "Alice", role: "admin" };
> console.log("UserWithRole merged");
> ```
>
> **Explanation:** Intersection `A & B` combines properties from all member object types.

---

### Exercise 3: Function Overload Intersections

**Problem:** Intersect two function signature types `((x: string) => void) & ((x: number) => void)`.

**Expected output:**
> [!check]- Answer
> ```text
> Creates overloaded function signature
> ```
> ```typescript
> console.log("Creates overloaded function signature");
> ```
>
> **Explanation:** Intersecting function types creates an overloaded function signature.

## 7. Related Terms
- [Union Types](../level_05/union_types.md) — The OR operator.
- [Interfaces](../level_03/interfaces.md) — The alternative way to combine object shapes (using `extends`).

---

## 8. Key Takeaways
- **Intersection Types** use the `&` (ampersand) operator to combine multiple types together (Type A AND Type B).
- The resulting type must possess all properties from all intersected types.
- It is primarily used to merge Object Types or Interfaces together.
- Intersecting mutually exclusive primitives (like `string & number`) results in the `never` type.
