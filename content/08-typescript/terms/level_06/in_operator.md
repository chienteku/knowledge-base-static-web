# `in` Operator Narrowing

> **Level 6 — Type Narrowing & Guards**
> A Type Guard used to narrow down an object's type by checking if a specific property key exists inside that object.

---

## 1. Prerequisites
- [Type Narrowing](type_narrowing.md) — The process this operator triggers.
- [Object Types](../level_03/object_types.md) — The structures being narrowed.

---

## 2. Term Category

**TypeScript Type Operator** (Property Existence Type Guard): The `in` operator checks whether a specific property exists on an object, narrowing union types based on property presence.



---

## 3. Explanation

### Environment Context
- **Runtime (Analyzed at Compile-Time)**

### (1) Design Motivation — "Why did we design this?"
You have a union of two simple Interfaces:
```typescript
interface Bird { fly(): void }
interface Fish { swim(): void }

function move(animal: Bird | Fish) { ... }
```
You cannot use `typeof animal` (they are both `"object"`).
You cannot use `animal instanceof Bird` (because `Bird` is an interface, and is erased at compile-time).
How do you narrow this union? You check if the unique property exists! In standard JavaScript, the `"propertyName" in object` syntax returns a boolean. TypeScript recognizes this as a valid Type Guard.

### (2) How it works
If you check for a property that only exists on one side of the Union, TypeScript immediately narrows the type to that specific side.

```typescript
function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    // Narrowed strictly to Bird!
    animal.fly();
  } else {
    // Narrowed strictly to Fish!
    animal.swim();
  }
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: The `in` operator with Optional Properties

**The mistake:** You have two interfaces: `interface Car { wheels: number }` and `interface Boat { sails?: number }`. You write `if ("sails" in vehicle) { ... }`.

**Why it's tricky:** If the vehicle is a Boat, it *might* have sails, but because `sails?` is optional, a valid Boat might NOT have sails. 
If `"sails" in vehicle` is true, TypeScript successfully narrows it to `Boat`.
But if `"sails" in vehicle` is false, TypeScript CANNOT safely narrow it to `Car`! It might just be a Boat without sails! 
**Golden Rule:** The `in` operator works best when checking for *required* properties that perfectly distinguish the two types. If you rely on optional properties, your `else` blocks will fail to narrow cleanly.

---



### Mistake 2: Using `in` Guard Checks on Primitive Types

**The mistake:** Writing `if ("length" in val)` when `val` can be a primitive string or number.

**Why it's wrong:** The `in` operator throws a runtime `TypeError: Cannot use 'in' operator to search for 'length' in primitive` when right-hand operand is primitive.

*Incorrect:*
```typescript
function check(val: string | number) {
    // if ("length" in val) {} // 💥 Runtime TypeError if val is number!
}
```

*Fix:*
```typescript
function check(val: object) {
    if ("length" in val) { /* Safe object property check */ }
}
```

### Mistake 3: Expecting `in` Checks to Narrow Non-Object Union Members

**The mistake:** Using `in` checks without verifying that the target value is a non-null object first.

**Why it's wrong:** Right-hand operands of `in` MUST be object types. Ensure value is non-null object before performing `in` checks.

*Incorrect:*
```typescript
function process(val: unknown) {
    // if ("id" in val) {} // ❌ Object is of type 'unknown'
}
```

*Fix:*
```typescript
function process(val: unknown) {
    if (typeof val === "object" && val !== null && "id" in val) {
        console.log(val.id); // Safely narrowed
    }
}
```

## 5. Practice Exercises

### Exercise 1: Narrowing Object Unions with the `in` Operator

**Scenario:**
Differentiate between an `AdminUser` (has `permissions: string[]`) and a `StandardUser` (has `email: string`) using `in`.

**Requirements:**
1. Use `"permissions" in user` condition.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface AdminUser {
>   id: string;
>   permissions: string[];
> }

interface StandardUser {
  id: string;
  email: string;
}

type User = AdminUser | StandardUser;

function processUser(user: User) {
  if ("permissions" in user) {
    console.log("Admin permissions:", user.permissions.join(", "));
  } else {
    console.log("Standard user email:", user.email);
  }
}
```

> #### Technical Explanation
>
> 1. `"property" in object` checks if a property exists on an object or its prototype chain.
> 2. TypeScript automatically narrows `user` to `AdminUser` inside the `if` block.
> 3. Effective for narrowing object unions that do not share a explicit discriminant tag.

---

### Exercise 2: Checking Optional Property Existence with `in`

**Scenario:**
Check for the presence of optional property `metadata` on a configuration object.

**Requirements:**
1. Narrow optional property using `"metadata" in config`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Config {
>   title: string;
>   metadata?: { author: string };
> }

function logAuthor(config: Config) {
  if ("metadata" in config && config.metadata) {
    console.log("Author:", config.metadata.author);
  }
}
```

> #### Technical Explanation
>
> 1. `"metadata" in config` verifies that the property key exists on the target object.
> 2. Combined with truthiness checks, it safely narrows optional properties.
> 3. Prevents property access errors on un-initialized optional keys.

---

### Exercise 3: Auditing Prototype Property Checks with `in`

**Scenario:**
Explain why `"toString" in obj` evaluates to `true` for all JavaScript objects due to prototype inheritance.

**Requirements:**
1. Detail prototype chain property inspection behavior of `in`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> const obj = {};

// Evaluates to true because toString exists on Object.prototype!
if ("toString" in obj) {
  console.log("toString exists!");
}
```

> #### Technical Explanation
>
> 1. The `in` operator checks both instance properties AND inherited prototype properties.
> 2. Checking for common prototype methods (`toString`, `valueOf`) does not narrow custom domain object types effectively.
> 3. Use `in` strictly with custom property names unique to target interface variants.

---



## 6. Related Terms
- [`typeof` & `instanceof` Guards](typeof_instanceof.md) — The alternative guards for primitives and classes.
- [Discriminated Unions](discriminated_unions.md) — A more powerful pattern that often replaces the `in` operator.
- [Custom Type Guards (`is`)](custom_type_guards.md) — Related concept: Custom Type Guards (`is`).

---

## 7. Key Takeaways
- The **`in` operator** (`"key" in object`) is used to narrow Object Unions based on whether a specific property exists.
- It is the primary way to narrow between different `interface` or `type` alias objects, because `instanceof` cannot be used on interfaces.
- It works perfectly with TypeScript's Structural (Duck) Typing system.
- Be careful when using the `in` operator to check for *optional* properties, as the `else` block will not narrow predictably.
