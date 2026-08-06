# Readonly Properties (`readonly`)

> **Level 3 — Object Types & Interfaces**
> A modifier that marks a property as immutable (read-only) after it is created. It prevents developers from accidentally overwriting critical data inside an object.

---

## 1. Prerequisites
- [Interfaces](interfaces.md) — Where `readonly` is usually applied.

---

## 2. Term Category

**TypeScript Core Syntax** (Readonly Property Modifiers): The `readonly` modifier marks object properties or array elements as immutable, preventing property re-assignment after object construction.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
In JavaScript, even if you declare an object using `const`, the properties *inside* the object can still be mutated!
```javascript
const user = { id: 1, name: "Alice" };
user.id = 999; // Totally allowed in JS!
```
Changing a database `id` or a critical configuration flag at runtime usually causes disastrous bugs. TypeScript provides the **`readonly`** modifier to lock down specific properties so they can never be reassigned after the object is initially created.

### (2) Applying `readonly`
You place the `readonly` keyword directly before the property name in an Interface or Object Type.

```typescript
interface DatabaseUser {
  readonly id: number;  // Locked!
  name: string;         // Mutable
}

const u: DatabaseUser = { id: 1, name: "Alice" };

u.name = "Bob"; // ✅ Allowed
u.id = 2;       // ❌ Error: Cannot assign to 'id' because it is a read-only property.
```

### (3) Readonly Arrays
You can also make entire arrays immutable using the `ReadonlyArray<T>` generic or the `readonly T[]` syntax. This removes mutating methods like `.push()` and `.pop()`.
```typescript
const numbers: readonly number[] = [1, 2, 3];
numbers.push(4); // ❌ Error: Property 'push' does not exist on type 'readonly number[]'.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Assuming `readonly` protects deep objects

**The mistake:** A developer writes `readonly config: { theme: string }`. They think the theme is safe. They write `user.config.theme = "dark"`. To their shock, the compiler allows it!

**Why it's wrong:** `readonly` is **shallow**. It only protects the exact property it is applied to. It prevents you from overwriting the *entire* `config` object (`user.config = {}`), but it does NOT protect the properties *inside* `config`.
**Golden Rule:** If you want an entire nested object to be completely immutable, you must use a utility type like `Readonly<T>` recursively, or apply `readonly` to every single nested property.

---



### Mistake 2: Assuming `readonly` Modifiers Enforce Runtime Immutability

**The mistake:** Expecting `readonly` to throw runtime errors if JavaScript mutates object fields.

**Why it's wrong:** `readonly` is purely a compile-time construct in TypeScript. It is erased during compilation and does NOT freeze runtime JS objects.

*Incorrect:*
```typescript
interface User { readonly name: string }
const u: User = { name: "Alice" };
(u as any).name = "Bob"; // 💥 Mutates object at runtime despite readonly annotation!
```

*Fix:*
```typescript
interface User { readonly name: string }
const u: User = Object.freeze({ name: "Alice" }); // Enforces runtime immutability
```

### Mistake 3: Assigning `ReadonlyArray<T>` to Mutable `T[]`

**The mistake:** Attempting to assign a `ReadonlyArray<number>` to a standard `number[]` variable.

**Why it's wrong:** Standard arrays allow mutator operations (`push`, `pop`), violating the readonly contract.

*Incorrect:*
```typescript
const ro: ReadonlyArray<number> = [1, 2];
// const arr: number[] = ro; // ❌ The type 'readonly number[]' is 'readonly' and cannot be assigned to mutable type 'number[]'
```

*Fix:*
```typescript
const ro: ReadonlyArray<number> = [1, 2];
const arr: number[] = [...ro]; // Create a mutable shallow copy
```

## 5. Practice Exercises

### Exercise 1: Protecting Object Properties with `readonly`

**Scenario:**
Define a `Configuration` interface where `apiKey` and `environment` properties cannot be modified after initialization.

**Requirements:**
1. Mark properties as `readonly`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Configuration {
>   readonly apiKey: string;
>   readonly environment: string;
>   port: number;
> }

const config: Configuration = {
  apiKey: "secret_123",
  environment: "production",
  port: 8080
};

config.port = 9090; // Valid!
// config.apiKey = "new_key"; // ❌ Compile Error: Cannot assign to 'apiKey' because it is a read-only property.
```

> #### Technical Explanation
>
> 1. `readonly` prevents property re-assignment after initial object creation.
> 2. Enforces immutability at compile time.
> 3. Protects sensitive settings from unintended mutation.

---

### Exercise 2: Creating Immutable Arrays with `ReadonlyArray<T>`

**Scenario:**
Pass an array into a function guaranteeing that the function will not mutate the array using `ReadonlyArray<T>` or `readonly T[]`.

**Requirements:**
1. Annotate array parameter as `readonly number[]`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function calculateSum(numbers: readonly number[]): number {
>   // numbers.push(10); // ❌ Compile Error: Property 'push' does not exist on type 'readonly number[]'.
>   // numbers[0] = 99;  // ❌ Compile Error: Index signature in type 'readonly number[]' only permits reading.
>   
>   return numbers.reduce((acc, curr) => acc + curr, 0);
> }
> ```

> #### Technical Explanation
>
> 1. `readonly T[]` strips array mutation methods (`push`, `pop`, `splice`, `sort`).
> 2. Guarantees pure, side-effect-free function execution.
> 3. Standard functional programming pattern in TypeScript.

---

### Exercise 3: Auditing `readonly` Compile-Time Shallow Protection

**Scenario:**
Explain why `readonly` provides SHALLOW immutability rather than deep immutability for nested objects.

**Requirements:**
1. Show how nested object properties can still be mutated inside a `readonly` outer object.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface State {
>   readonly user: {
>     name: string;
>   };
> }

const state: State = { user: { name: "Alice" } };

// state.user = { name: "Bob" }; // ❌ Compile Error: 'user' is readonly!
state.user.name = "Bob";        // ⚠️ SUCCEEDS! Readonly is SHALLOW!
```

> #### Technical Explanation
>
> 1. `readonly` modifier applies ONLY to the immediate property reference.
> 2. Nested objects (`state.user.name`) remain mutable unless nested properties are also marked `readonly`.
> 3. Use `Readonly<T>` utility type or `as const` for deep immutability needs.

---



## 6. Related Terms
- [Interfaces](interfaces.md) — The main place `readonly` is used.
- [Utility Types Overview](../level_08/utility_types.md) — Where the `Readonly<T>` global helper lives.
- [Arrays & Tuples](../level_02/arrays_tuples.md) — Related concept: Arrays & Tuples.

---

## 7. Key Takeaways
- **`readonly`** is a modifier that prevents a property from being reassigned after its initial creation.
- It is the property-level equivalent of the variable-level `const` keyword.
- It is **shallow**; it does not automatically make nested objects immutable.
- Like all TypeScript features, it exists only at Compile-Time. It does not physically freeze the object in the runtime JavaScript engine.
