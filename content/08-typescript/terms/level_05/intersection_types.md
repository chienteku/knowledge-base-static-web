# Intersection Types (`&`)

> **Level 5 — Union & Intersection Types**
> A syntax that allows you to combine multiple types into a single, massive type. It essentially means "AND" in the TypeScript type system.

---

## 1. Prerequisites
- [Union Types (`|`)](union_types.md) — The exact opposite concept.
- [Object Types](../level_03/object_types.md) — What Intersection Types are almost exclusively used for.

---

## 2. Term Category

**TypeScript Core Syntax** (Type Intersection Operator): Intersection types (`T & U`) combine multiple object or contract types into a single unified type containing all merged properties.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Merging Multiple Object Types with `&`

**Scenario:**
Combine a base `Timestamps` object type with a `User` type using an intersection `User & Timestamps`.

**Requirements:**
1. Create `Timestamps` type (`createdAt`, `updatedAt`).
2. Create `UserWithTimestamps` using `&`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Timestamps = {
>   createdAt: Date;
>   updatedAt: Date;
> };

type User = {
  id: string;
  name: string;
};

type UserRecord = User & Timestamps;

const record: UserRecord = {
  id: "usr_100",
  name: "Alice",
  createdAt: new Date(),
  updatedAt: new Date()
};
```

> #### Technical Explanation
>
> 1. Intersection types (`T & U`) construct a type containing ALL properties from both constituent types.
> 2. `UserRecord` requires all properties from `User` AND `Timestamps`.
> 3. Idiomatic method for composing object shapes without interface inheritance.

---

### Exercise 2: Auditing Impossible Primitive Intersections

**Scenario:**
Demonstrate what happens when intersecting incompatible primitive types like `string & number`.

**Requirements:**
1. Show why `string & number` evaluates to `never`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type Impossible = string & number; // Evaluates to 'never'

// ❌ Compile Error: Type 'string' is not assignable to type 'never'.
// const val: Impossible = "test";
```

> #### Technical Explanation
>
> 1. Primitive types are disjoint sets; no single value can be simultaneously a `string` AND a `number`.
> 2. Intersecting disjoint primitive types evaluates automatically to `never`.
> 3. Signals an impossible type contract to the compiler.

---

### Exercise 3: Comparative Analysis: Intersections (`&`) vs Unions (`|`)

**Scenario:**
Formulate an architectural comparison matrix contrasting Type Intersections (`&`) against Type Unions (`|`).

**Requirements:**
1. Contrast logical operations (AND vs OR), property accessibility, and assignability rules.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Intersection (&) vs Union (|) Matrix:
> - Intersection (T & U): Logical AND. Object must possess ALL properties of T AND U. Accessing any property from T or U is allowed.
> - Union (T | U): Logical OR. Object can be of type T OR U. Only properties COMMON to both T and U can be accessed without type narrowing.
> ```

> #### Technical Explanation
>
> 1. Intersections combine properties, broadening property accessibility.
> 2. Unions combine candidate types, restricting direct property access to common members.
> 3. Core set theory operations in TypeScript's type system.

---



## 6. Related Terms
- [Union Types (`|`)](union_types.md) — The OR operator.
- [Interfaces](../level_03/interfaces.md) — The alternative way to combine object shapes (using `extends`).
- [Branded / Nominal Types](../level_09/branded_nominal_types.md) — Related concept: Branded / Nominal Types.

---

## 7. Key Takeaways
- **Intersection Types** use the `&` (ampersand) operator to combine multiple types together (Type A AND Type B).
- The resulting type must possess all properties from all intersected types.
- It is primarily used to merge Object Types or Interfaces together.
- Intersecting mutually exclusive primitives (like `string & number`) results in the `never` type.
