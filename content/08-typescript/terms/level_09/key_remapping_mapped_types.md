# Key Remapping in Mapped Types (`as`)

> **Level 9 — Advanced Types**
> An advanced mapping operator (introduced in TS 4.1) that uses the `as` clause inside Mapped Types to rename, transform, or filter out object property keys during type generation.

---

## 1. Prerequisites
- [Mapped Types](mapped_types.md) — Iterating over object keys to create new types.
- [Template Literal Types](template_literal_types.md) — Rebuilding string patterns in type space.

---

## 2. Term Category

**TypeScript Advanced Type** (As-Clause Key Remapping): Key remapping using `as` in mapped types enables filtering, renaming, or transforming object property keys dynamically.



---

## 3. Explanation

### Environment Context
- **Build-time** (Key remapping operations run entirely during compilation to construct new interfaces, compiling down to normal JS objects).



---

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Prefixing Object Property Keys using `as`

**Scenario:**
Remap all keys of a `State` object to add a `get` prefix (`getTheme`, `getSidebarOpen`) using key remapping.

**Requirements:**
1. Use mapped type `[K in keyof T as `get${Capitalize<string & K>}`]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface State {
>   theme: string;
>   sidebarOpen: boolean;
> }
> 
> type Getters<T> = {
>   [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
> };
> 
> type StateGetters = Getters<State>;
> // Inferred as: { getTheme: () => string; getSidebarOpen: () => boolean; }
> ```
> 
> #### Technical Explanation
>
> 1. `[K in keyof T as NewKey]` remaps property key names dynamically during mapped type iteration.
> 2. Combined with template literal types (`get${Capitalize<string & K>}`), it generates getter method names automatically.
> 3. Standard pattern for building reactive state getters or store abstractions.
> 
---

### Exercise 2: Filtering Keys by Value Type with `never`

**Scenario:**
Create a utility `MethodsOnly<T>` that filters an object interface to keep ONLY property keys whose values are functions.

**Requirements:**
1. Remap non-function keys to `never`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type MethodsOnly<T> = {
>   [K in keyof T as T[K] extends Function ? K : never]: T[K];
> };
> 
> interface Service {
>   id: string;
>   name: string;
>   connect(): void;
>   disconnect(): void;
> }
> 
> type ServiceMethods = MethodsOnly<Service>;
> // Inferred as: { connect: () => void; disconnect: () => void; }
> ```
> 
> #### Technical Explanation
>
> 1. Remapping a key to `never` (`as T[K] extends Function ? K : never`) excludes that key from the resulting mapped object type.
> 2. Enables filtering object interfaces based on value types.
> 3. Advanced mapped type key filtering technique.
> 
---

### Exercise 3: Stripping Specific Key Prefixes

**Scenario:**
Strip the `_` prefix from private key names (`_id`, `_name`) using key remapping and template literals.

**Requirements:**
1. Remap `_` prefixed keys to un-prefixed keys.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> type UnprefixPrivate<T> = {
>   [K in keyof T as K extends `_${infer Rest}` ? Rest : K]: T[K];
> };
> 
> interface PrivateData {
>   _id: string;
>   _secret: number;
>   publicName: string;
> }
> 
> type PublicData = UnprefixPrivate<PrivateData>;
> // Inferred as: { id: string; secret: number; publicName: string; }
> ```
> 
> #### Technical Explanation
>
> 1. Key remapping combines template literal pattern matching (`K extends \`_${infer Rest}\``) with `as` clauses.
> 2. Strips leading underscore prefixes dynamically.
> 3. Powerful structural refactoring tool.
> 
---



## 6. Related Terms
- [Mapped Types](mapped_types.md) — The loop mechanism that `as` extends.
- [Template Literal Types](template_literal_types.md) — Constructing the renamed key strings.
- [`Exclude` / `Extract` / `NonNullable`](../level_08/exclude_extract_nonnullable.md) — The basic set operation logic.

---

## 7. Key Takeaways
- **Key Remapping** uses the `as` keyword inside mapped types to rename or filter property keys.
- Integrates with Template Literal Types to dynamically adjust casing (`Capitalize`, `Uppercase`) and format names.
- Filters keys out of object types when mapping key names to `never`.
- Essential for generating complex derivative API layers, event emitter bounds, or validation contracts.
- Intersect keys with `string` (`K & string`) during string manipulations to avoid compiler type conflicts.
