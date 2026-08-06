# Generic Constraints (`extends`)

> **Level 7 — Generics**
> A way to restrict what types are allowed to be passed into a Generic `<T>`. It ensures that whatever Type is passed in possesses specific required properties.

---

## 1. Prerequisites
- [Generics Overview (`<T>`)](generics.md) — The base syntax being constrained.
- [Interfaces](../level_03/interfaces.md) — What is usually used to define the constraint shape.

---

## 2. Term Category

**TypeScript Advanced Type** (Generic Constraint Bounds): Generic constraints (`<T extends Constraint>`) restrict candidate generic type parameters to subtypes matching specific structural interfaces.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Design Motivation — "Why did we design this?"
If you write a generic function `function logLength<T>(data: T)`, you cannot access `data.length` because `T` could be a number, and numbers don't have lengths.
But you only *want* this function to accept things that have lengths (like arrays or strings). 
**Generic Constraints** allow you to say: *"T can be anything, AS LONG AS it extends this specific shape."*

### (2) The `extends` Keyword in Generics
You constrain a generic by using the `extends` keyword inside the angle brackets.

```typescript
// We define the required shape
interface HasLength {
  length: number;
}

// We constrain T. "T must have at least a .length property"
function logLength<T extends HasLength>(data: T): T {
  // ✅ Valid! TS knows T has a length property.
  console.log(data.length); 
  return data;
}

logLength("Hello");      // ✅ Valid (string has .length)
logLength([1, 2, 3]);    // ✅ Valid (array has .length)
logLength({length: 10}); // ✅ Valid (object has .length)

logLength(500); // ❌ Error: Argument of type 'number' is not assignable to parameter of type 'HasLength'.
```

### (3) Why not just use the Interface directly?
You might ask: *"Why use generics at all? Why not just write `function logLength(data: HasLength)`?"*
If you do that, the Return Type of the function is just the generic `HasLength` interface! You lose the specific type of what was passed in.
By using `<T extends HasLength>(data: T): T`, if you pass an Array in, you get a strictly typed Array back. If you pass a String in, you get a String back. You retain 100% of the type fidelity!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing `extends` in Generics with `extends` in Classes

**The mistake:** A developer sees `<T extends object>` and assumes `T` must be a Class that literally inherited from some other Class.

**Why it's wrong:** In the context of Generics, `extends` means **"matches the shape of"** (Structural Typing), not strict OOP Inheritance. As seen in the example above, `"Hello"` (a primitive string) successfully `extends HasLength` simply because it happens to have a `.length` property. It does not need to explicitly implement the interface.
**Golden Rule:** In Generics, `extends` is a structural shape check, not an inheritance check.

---



### Mistake 2: Attempting Property Access on Unconstrained Generic Parameters `T`

**The mistake:** Writing `function getLength<T>(arg: T) { return arg.length; }`.

**Why it's wrong:** Unconstrained generic parameter `T` can be any type (including `number` or `boolean`). Property `length` cannot be accessed until constrained with `extends`.

*Incorrect:*
```typescript
// function getLength<T>(arg: T) { return arg.length; } // ❌ Property 'length' does not exist on type 'T'
```

*Fix:*
```typescript
function getLength<T extends { length: number }>(arg: T) { return arg.length; } // Constrained with extends!
```

### Mistake 3: Using Non-Key Constraints in `keyof` Property Lookups

**The mistake:** Writing `function getProp<T, K>(obj: T, key: K)` without `K extends keyof T`.

**Why it's wrong:** Without `K extends keyof T`, `K` is un-bounded, permitting callers to pass invalid key strings that do not exist on `T`.

*Incorrect:*
```typescript
// function getProp<T, K>(obj: T, key: K) { return obj[key]; } // ❌ Type 'K' cannot be used to index type 'T'
```

*Fix:*
```typescript
function getProp<T, K extends keyof T>(obj: T, key: K) { return obj[key]; }
```

## 5. Practice Exercises

### Exercise 1: Constraining Generics to Objects with Length Properties

**Scenario:**
Create a generic `logLength<T extends { length: number }>(arg: T)` function enforcing that inputs possess a `.length` property.

**Requirements:**
1. Add `<T extends { length: number }>` constraint.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function logLength<T extends { length: number }>(arg: T): T {
>   console.log(`Length: ${arg.length}`);
>   return arg;
> }

logLength("Hello World");   // Valid! (strings have length)
logLength([1, 2, 3, 4]);     // Valid! (arrays have length)
logLength({ length: 10 });  // Valid! (objects with length property)

// logLength(12345);        // ❌ Compile Error: Argument of type 'number' is not assignable to '{ length: number }'.
```

> #### Technical Explanation
>
> 1. `<T extends Structure>` restricts generic parameter `T` to types satisfying the structural contract.
> 2. Permits accessing `.length` safely inside the function body without runtime errors.
> 3. Retains the specific return type `T` (e.g. returns `string` or `number[]`).

---

### Exercise 2: Using `keyof` Constraints in Property Lookups

**Scenario:**
Create a type-safe `getProperty<T, K extends keyof T>(obj: T, key: K)` utility.

**Requirements:**
1. Constrain `K` using `K extends keyof T`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
>   return obj[key];
> }

const user = { id: 1, name: "Alice", isMember: true };

const name = getProperty(user, "name"); // Inferred as string
const id = getProperty(user, "id");     // Inferred as number

// getProperty(user, "invalidKey");    // ❌ Compile Error: Argument of type '"invalidKey"' is not assignable to keyof User.
```

> #### Technical Explanation
>
> 1. `K extends keyof T` constrains parameter `K` to valid key strings existing on object type `T`.
> 2. `T[K]` returns the exact indexed access property type corresponding to key `K`.
> 3. Standard type-safe property extraction utility.

---

### Exercise 3: Multiple Intersected Generic Constraints

**Scenario:**
Constrain a generic type parameter to implement both `Nameable` and `Identifiable` interfaces (`T extends Nameable & Identifiable`).

**Requirements:**
1. Combine constraints with `&`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Identifiable { id: string; }
> interface Nameable { name: string; }

function printEntity<T extends Identifiable & Nameable>(entity: T) {
  console.log(`[${entity.id}] ${entity.name}`);
}

printEntity({ id: "e100", name: "Widget", price: 19.99 });
```

> #### Technical Explanation
>
> 1. Using `&` inside generic constraints (`T extends A & B`) requires `T` to satisfy both interfaces simultaneously.
> 2. Structural typing allows extra properties (`price`) while guaranteeing required contract keys (`id`, `name`).
> 3. Flexible multi-interface constraint pattern.

---



## 6. Related Terms
- [Generics Overview (`<T>`)](generics.md) — The parent topic.
- [Multiple Generics](multiple_generics.md) — You can constrain multiple generics simultaneously.
- [Structural Typing / Duck Typing](../level_01/structural_typing.md) — Related concept: Structural Typing / Duck Typing.
- [Generic Default Types (`=`)](default_generics.md) — Related concept: Generic Default Types (`=`).
- [`keyof` Operator](../level_09/keyof.md) — keyof constraints.

---

## 7. Key Takeaways
- **Generic Constraints** use the `extends` keyword inside `<...>` to limit what types can be passed into a Generic.
- Syntax: `<T extends RequiredShape>`.
- It allows you to safely access specific properties inside a generic function without throwing compiler errors.
- It is vastly superior to just typing the parameter as the interface, because the Generic preserves the exact, specific type of the data being passed through the function.
