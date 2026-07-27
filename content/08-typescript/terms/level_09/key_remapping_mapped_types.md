# Key Remapping in Mapped Types (`as`)

> **Level 9 — Advanced Types**
> An advanced mapping operator (introduced in TS 4.1) that uses the `as` clause inside Mapped Types to rename, transform, or filter out object property keys during type generation.

---

## 1. Prerequisites
- [Mapped Types](../level_09/mapped_types.md) — Iterating over object keys to create new types.
- [Template Literal Types](../level_09/template_literal_types.md) — Rebuilding string patterns in type space.

---

## 2. Term Category
- **Advanced Type**

---

## 3. Environment Context
- **Build-time** (Key remapping operations run entirely during compilation to construct new interfaces, compiling down to normal JS objects).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Standard Mapped Types let you iterate over the properties of an object to modify their accessibility or value types. For example, you can make every property optional or convert their values to promises:
```typescript
type Options<T> = { [K in keyof T]?: T[K] };
```
However, standard mapped types have a strict limitation: **the keys of the new type must match the original keys exactly.** You cannot rename `'name'` to `'getName'`, nor can you delete specific keys during iteration.

This made it difficult to model common JavaScript design patterns, such as automatically generating getters and setters for configuration fields:
```javascript
// Map properties to getter method signatures:
// { name: string } -> { getName: () => string }
```
TypeScript introduced **Key Remapping** using the `as` clause to allow developers to rename or filter property keys during mapped type iteration.

### (2) Core Mechanics
The syntax adds an `as` clause after the loop declaration: 
`{ [K in keyof T as NewKeyType]: T[K] }`

The compiler runs the loop for key `K`, but names the property in the final object type using whatever type `NewKeyType` resolves to.

#### Renaming Keys
You can combine key remapping with **Template Literal Types** to capitalize and rename property keys.

```typescript
type Getters<T> = {
  // We intersect K with string (K & string) to make sure TS knows it is a string key
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K]
};

interface User {
  name: string;
  age: number;
}

type UserGetters = Getters<User>;
/* Result:
   {
     getName: () => string;
     getAge: () => number;
   }
*/
```

#### Filtering Keys
If the `NewKeyType` resolves to **`never`**, that property is completely omitted from the final object type. This allows you to write conditional filters on object keys.

```typescript
// Keep only properties of T whose value matches type ValueType
type FilterByValue<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K]
};

interface Profile {
  username: string;
  avatarUrl: string;
  followers: number;
}

type StringPropsOnly = FilterByValue<Profile, string>;
// Result: { username: string; avatarUrl: string } (followers is omitted!)
```

### (3) Real-World Application
Extracting API payload configurations or wrapping event emitter callbacks from state models.

```typescript
interface AppState {
  theme: 'light' | 'dark';
  volume: number;
  sidebarOpen: boolean;
}

// Generate an events listener interface for changes
type StateChangeEvents = {
  [K in keyof AppState as `on${Capitalize<K & string>}Change`]: (value: AppState[K]) => void;
};

const listener: StateChangeEvents = {
  onThemeChange: (theme) => console.log(theme), // theme is light | dark
  onVolumeChange: (vol) => console.log(vol),     // vol is number
  onSidebarOpenChange: (open) => console.log(open) // open is boolean
};
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting symbol or number keys during string mapping

**The mistake:** Passing a key `K` directly to string template helpers like `Capitalize<K>` without narrowing.

**Why it's wrong:** The keys of an object (`keyof T`) can technically be string literals, numbers, or symbols. Capitalize only accepts strings. Passing symbol keys directly triggers a compiler error.

*Incorrect:*
```typescript
type StringifyKeys<T> = {
  [K in keyof T as `key_${Capitalize<K>}`]: T[K]; // Error: K is not assignable to string
};
```

*Fix:* Intersect `K` with `string` (`K & string`) to filter out symbols and numbers, keeping only valid string keys.
```typescript
type StringifyKeys<T> = {
  [K in keyof T as `key_${Capitalize<K & string>}`]: T[K]; // Works!
};
```

**Golden Rule:** Always intersect key loops with `string` (`K & string`) when performing string template formatting transformations.

---



### Mistake 2: Remapping Property Keys to `never` without Understanding Property Removal

**The mistake:** Remapping property keys using `as (K extends 'id' ? never : K)` expecting error diagnostics.

**Why it's wrong:** Remapping a mapped type key to `never` filters and removes that property key entirely from the output type.

*Incorrect:*
```typescript
type RemoveId<T> = { [K in keyof T as K extends "id" ? never : K]: T[K] }; // Removes key 'id'
```

*Fix:*
```typescript
type RemoveId<T> = { [K in keyof T as K extends "id" ? never : K]: T[K] }; // Idiomatic key remapping filter
```

### Mistake 3: Omitting Template Literal Backticks in Key Remapping Expressions

**The mistake:** Writing `[K in keyof T as "get" + K]` without template literal type syntax.

**Why it's wrong:** Key remapping string concatenation requires template literal type backticks `${...}`.

*Incorrect:*
```typescript
// type Getters<T> = { [K in keyof T as "get" + K]: () => T[K] }; // ❌ Syntax error
```

*Fix:*
```typescript
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
```

## 6. Practice Exercises

### Exercise 1: Stripping Function Keys

**Problem:** You are saving configuration state to LocalStorage. You want to strip any function/methods off the configuration object since they cannot be serialized. Write a utility type called `DataPropertiesOnly<T>` that filters out any property that is a function.

```typescript
type DataPropertiesOnly<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K]
};

interface UserSession {
  token: string;
  userId: number;
  saveSession: () => void;
}

type CleanSession = DataPropertiesOnly<UserSession>;
```

**Expected output:**
```text
CleanSession matches the type structure: { token: string; userId: number; }
```

> [!check]- Answer
> - Loop using `K in keyof T as T[K] extends Function ? never : K`.
> - If the value of key `T[K]` extends `Function`, return `never` to exclude it, otherwise return its key `K`.

---



### Exercise 2: Getter Method Key Remapping

**Problem:** Remap object `{ name: string }` to getter methods `{ getName: () => string }` using `as` remapping.

**Expected output:**
```text
Getters remapped
```

> [!check]- Answer
> ```typescript
> type Getters<T> = {
>   [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
> };
> type UserGetters = Getters<{ name: string }>;
> console.log("Getters remapped");
> ```
>
> **Explanation:** Key remapping with `as` and `Capitalize` generates type-safe getter signatures.

### Exercise 3: Filtering Property Keys with `never`

**Problem:** Remap mapped type keys to filter out properties starting with `_`.

**Expected output:**
```text
Private keys filtered
```

> [!check]- Answer
> ```typescript
> type PublicOnly<T> = {
>   [K in keyof T as K extends `_${string}` ? never : K]: T[K]
> };
> type Clean = PublicOnly<{ _secret: number; name: string }>;
> console.log("Private keys filtered");
> ```
>
> **Explanation:** Remapping mapped type keys to `never` removes matching property keys.

## 7. Related Terms
- [Mapped Types](../level_09/mapped_types.md) — The loop mechanism that `as` extends.
- [Template Literal Types](../level_09/template_literal_types.md) — Constructing the renamed key strings.
- [Exclude / Extract / NonNullable](../level_08/exclude_extract_nonnullable.md) — The basic set operation logic.

---

## 8. Key Takeaways
- **Key Remapping** uses the `as` keyword inside mapped types to rename or filter property keys.
- Integrates with Template Literal Types to dynamically adjust casing (`Capitalize`, `Uppercase`) and format names.
- Filters keys out of object types when mapping key names to `never`.
- Essential for generating complex derivative API layers, event emitter bounds, or validation contracts.
- Intersect keys with `string` (`K & string`) during string manipulations to avoid compiler type conflicts.
