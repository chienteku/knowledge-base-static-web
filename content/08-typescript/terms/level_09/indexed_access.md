# Indexed Access Types

> **Level 9 — Advanced Types**
> A way to look up the specific type of a property on another type using bracket notation, exactly like accessing a property on a JavaScript object.

---

## 1. Prerequisites
- [Object Types](../level_03/object_types.md) — The structures you are accessing properties from.

---

## 2. Term Category
TypeScript Advanced Type Feature

---

## 3. Core Definition
An **Indexed Access Type** (also known as a "Lookup Type") allows you to retrieve the type of a specific property from an interface or type alias. You do this using bracket notation: `MyType['property']`.

This is incredibly useful for keeping your types DRY. If you have a massive `User` interface and you need a function that just takes the user's `address` object, you can look up the address type directly from the `User` interface instead of copying and pasting the address type definition.

---

## 4. Key Characteristics / Rules
- **Bracket Notation Only:** You cannot use dot notation (`User.address`). You must use brackets (`User['address']`).
- **Union Lookups:** You can pass a union type into the brackets to extract multiple property types at once (e.g., `User['name' | 'age']`).

---

## 5. Typical Usage / Common Patterns

### Looking up a Nested Property
```typescript
interface User {
  id: number;
  name: string;
  address: {
    street: string;
    city: string;
    zipCode: number;
  };
}

// Extract the type of the 'address' property
type AddressType = User['address'];

// AddressType is now { street: string; city: string; zipCode: number; }
const myAddress: AddressType = {
  street: "123 Main St",
  city: "New York",
  zipCode: 10001
};
```

---

## 6. Common Pitfalls
- **Using Values instead of Types:** You cannot use an Indexed Access Type to look up a property on a JavaScript *variable*. It only works on TypeScript *types* or *interfaces*.

---

## 5. Common Mistakes & Pitfalls



### Mistake 1: Using Dot Notation in Indexed Access Types instead of Square Brackets

**The mistake:** Writing `type Age = User.age;`.

**Why it's wrong:** Type-level indexed access REQUIRES square bracket syntax (`User["age"]`). Dot notation is for runtime JavaScript object property lookups.

*Incorrect:*
```typescript
interface User { age: number }
// type Age = User.age; // ❌ Cannot use dot notation in type lookup
```

*Fix:*
```typescript
interface User { age: number }
type Age = User["age"]; // Correct square bracket indexed access
```

### Mistake 2: Indexing Object Types with Non-Existent Key Strings

**The mistake:** Writing `User["invalid_key"]`.

**Why it's wrong:** Indexed access type keys MUST be assignable to `keyof T`.

*Incorrect:*
```typescript
interface User { id: number }
// type Bad = User["missing"]; // ❌ Property 'missing' does not exist on type 'User'
```

*Fix:*
```typescript
interface User { id: number }
type Good = User["id"]; // Valid key lookup
```

### Mistake 3: Indexing Arrays with Hardcoded Numeric Indices for General Element Extraction

**The mistake:** Writing `type Element = MyArray[0]` expecting it to differ from `MyArray[number]`.

**Why it's wrong:** In tuple types, `Tuple[0]` accesses element at index 0. For general arrays `T[]`, `T[number]` extracts the array element type.

*Incorrect:*
```typescript
type StrArray = string[];
type Element = StrArray[0]; // Works, but StrArray[number] is idiomatic
```

*Fix:*
```typescript
type StrArray = string[];
type Element = StrArray[number]; // Idiomatic array element extraction
```

## 6. Practice Exercises



### Exercise 1: Extracting Nested Property Types

**Problem:** Extract `City` type from `interface Person { address: { city: string } }`.

**Expected output:**
```text
string
```

> [!check]- Answer
> ```typescript
> interface Person { address: { city: string } }
> type City = Person["address"]["city"];
> console.log("string");
> ```
>
> **Explanation:** Chained indexed access `Type["k1"]["k2"]` unwraps deeply nested object properties.

### Exercise 2: Tuple Element Extraction with Indexed Access

**Problem:** Extract first item type from tuple `type Pair = [boolean, number]` using `Pair[0]`.

**Expected output:**
```text
boolean
```

> [!check]- Answer
> ```typescript
> type Pair = [boolean, number];
> type First = Pair[0];
> console.log("boolean");
> ```
>
> **Explanation:** Indexing tuples with numeric literal types (`0`, `1`) extracts exact positional types.

### Exercise 3: Union Property Type Extraction

**Problem:** Extract return values for `User["id" | "name"]` from `{ id: number; name: string }`.

**Expected output:**
```text
number | string
```

> [!check]- Answer
> ```typescript
> interface User { id: number; name: string }
> type Values = User["id" | "name"];
> console.log("number | string");
> ```
>
> **Explanation:** Indexing with a union of keys produces a union of corresponding property value types.

## 7. Related Terms
- [`keyof` Operator](../level_09/keyof.md) — Often used inside the brackets of an Indexed Access Type to dynamically grab all property types (e.g., `User[keyof User]`).

---
