# `Exclude` / `Extract` / `NonNullable`

> **Level 8 — Utility Types**
> Built-in utility types that perform set operations on Union types by filtering out unwanted types (`Exclude`), selecting specific types (`Extract`), or stripping nullability (`NonNullable`).

---

## 1. Prerequisites
- [Utility Types Overview](utility_types.md) — The baseline standard utility overview.
- [Union Types (`|`)](../level_05/union_types.md) — Custom combined type options.
---

## 2. Term Category
- **Utility Type**

---

## 3. Environment Context
- **Build-time** (These utilities perform operations during compilation and are completely compiled away).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
TypeScript's primary utility types (like `Partial`, `Pick`, or `Omit`) are designed to operate on **Object** keys and structures. 

However, in many backend and frontend scenarios, you work with **Union Types** rather than objects. For example:
- A union of event strings: `'click' | 'scroll' | 'submit' | 'keydown'`.
- A union of statuses: `'idle' | 'loading' | 'success' | 'error'`.
- A union of types including nullable states: `string | number | null | undefined`.

If you wanted to create a new type representing only mouse-related events from your events union, or filter out nullable states, writing manual union declarations leads to duplicate lists. 

TypeScript introduced `Exclude`, `Extract`, and `NonNullable` to act as standard set operators for union types, allowing developers to filter, intersect, and clean unions programmatically.

### (2) Core Mechanics
These utilities leverage **Conditional Types** under the hood. When passed a union, they evaluate each member individually and assemble a new union from the results.

#### `Exclude<UnionType, ExcludedMembers>`
Removes specified members from a union.
- **Under the hood:** `type Exclude<T, U> = T extends U ? never : T;` (Because `never` represents the empty set, it is automatically discarded when TypeScript joins union outputs).
```typescript
type Events = 'click' | 'scroll' | 'submit';
type SilentEvents = Exclude<Events, 'click'>; // Type: 'scroll' | 'submit'
```

#### `Extract<UnionType, ExtractedMembers>`
Keeps only the members that match the second parameter (performs an intersection check).
- **Under the hood:** `type Extract<T, U> = T extends U ? T : never;`
```typescript
type Events = 'click' | 'scroll' | 'submit';
type Target = 'click' | 'hover';
type Shared = Extract<Events, Target>; // Type: 'click'
```

#### `NonNullable<Type>`
Strips `null` and `undefined` from any type.
- **Under the hood:** `type NonNullable<T> = T extends null | undefined ? never : T;`
```typescript
type Input = string | number | null | undefined;
type ValidInput = NonNullable<Input>; // Type: string | number
```

### (3) Real-World Application
Filtering action triggers or database records in large service architectures.

```typescript
type Action = 
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_USERS'; payload: number };

// Extract only actions that contain a payload property
type PayloadAction = Extract<Action, { payload: any }>;
// Result: { type: 'LOGIN'; payload: string } | { type: 'FETCH_USERS'; payload: number }
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `Exclude` or `Extract` to filter properties from an Object

**The mistake:** Passing an object interface directly to `Exclude` expecting it to act like `Omit`.

**Why it's wrong:** `Exclude` and `Extract` filter individual elements of a **Union**. They do not traverse keys of an object structure.

*Incorrect:*
```typescript
interface User {
  id: string;
  name: string;
  age: number;
}

// Error: Exclude does not filter keys! Type is still User.
type NoAgeUser = Exclude<User, 'age'>; 
```

*Fix:* Use `Omit` to remove properties off an object, or combine `Exclude` with `keyof` to filter object keys first before mapping.
```typescript
type NoAgeUser = Omit<User, 'age'>; // Correct object filtering
```

**Golden Rule:** Use `Omit` / `Pick` for Object structures. Use `Exclude` / `Extract` for Union types.

---



### Mistake 2: Passing Object Interface Types to `Exclude` instead of Union Types

**The mistake:** Writing `Exclude<{ a: 1, b: 2 }, "a">` expecting to omit key `"a"`.

**Why it's wrong:** `Exclude<T, U>` works on UNION types (`"a" | "b"`), NOT object property keys! Use `Omit<T, K>` for removing object properties.

*Incorrect:*
```typescript
type Bad = Exclude<{ a: number; b: string }, "a">; // ❌ Does not remove property 'a'!
```

*Fix:*
```typescript
type Good = Omit<{ a: number; b: string }, "a">; // Correct: Result is { b: string }
```

### Mistake 3: Confusing `Exclude<T, U>` with `Extract<T, U>`

**The mistake:** Using `Exclude` when attempting to keep matching union members.

**Why it's wrong:** `Exclude<T, U>` removes types matching `U`. `Extract<T, U>` keeps ONLY types matching `U`.

*Incorrect:*
```typescript
type Union = "a" | "b" | "c";
type KeepA = Exclude<Union, "a">; // Yields "b" | "c" (Opposite of intended!)
```

*Fix:*
```typescript
type Union = "a" | "b" | "c";
type KeepA = Extract<Union, "a">; // Yields "a"
```

## 6. Practice Exercises

### Exercise 1: Building a Custom Event Listener Filter

**Problem:** You are writing an API handler. The application supports 5 HTTP methods. You want to create a new type called `SafeMethod` that excludes `'DELETE'` and `'PATCH'` from the `HttpMethod` union. Fill in the definition.

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Complete the definition using Exclude:
type SafeMethod = Exclude<HttpMethod, 'DELETE' | 'PATCH'>;

const getHandler = (method: SafeMethod) => { ... };
// getHandler('DELETE'); // Should raise compiler warning!
```

**Expected output:**
> [!check]- Answer
> ```text
> SafeMethod evaluates to 'GET' | 'POST' | 'PUT'.
> ```
> - The second argument of `Exclude` can be a union of multiple items you want to remove.
> - Pass `'DELETE' | 'PATCH'` as the second argument.

---



### Exercise 2: Filtering Nullish Types with `NonNullable`

**Problem:** Filter `string | number | null | undefined` using `NonNullable<T>`.

**Expected output:**
> [!check]- Answer
> ```text
> string | number
> ```
> ```typescript
> type Raw = string | number | null | undefined;
> type Clean = NonNullable<Raw>;
> console.log("string | number");
> ```
>
> **Explanation:** `NonNullable<T>` excludes `null` and `undefined` from union `T`.

---

### Exercise 3: Extracting Action Types

**Problem:** Extract actions ending with success from `"click" | "load_success" | "save_success"` using `Extract`.

**Expected output:**
> [!check]- Answer
> ```text
> "load_success" | "save_success"
> ```
> ```typescript
> type Action = "click" | "load_success" | "save_success";
> type SuccessActions = Extract<Action, `${string}_success`>;
> console.log("\"load_success\" | \"save_success\"");
> ```
>
> **Explanation:** `Extract` retains union members assignable to pattern match types.

## 7. Related Terms
- [Union Types (`|`)](../level_05/union_types.md) — The target data structures.
- [Utility Types Overview](utility_types.md) — The collection of standard helper definitions.
- [Conditional Types](../level_09/conditional_types.md) — The type checking logic that powers union filtering.
- [Key Remapping in Mapped Types (`as`)](../level_09/key_remapping_mapped_types.md) — Related concept: Key Remapping in Mapped Types (`as`).
---

## 8. Key Takeaways
- **`Exclude`** removes matching members from a Union type.
- **`Extract`** keeps only matching members from a Union type, acting as a set intersection tool.
- **`NonNullable`** strips out `null` and `undefined` options.
- These utilities perform set operations on Unions; they do not filter keys off Object structures (use `Omit` / `Pick` instead).
- Under the hood, they iterate over union options using conditional types and strip matching entries using `never`.
