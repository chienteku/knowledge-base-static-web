# Structural Typing / Duck Typing

> **Level 1 — Core Concepts & Environment Setup**
> The foundational type checking paradigm in TypeScript where type compatibility and assignment are determined solely by the shape and properties of the values, rather than their explicit names or declarations.

---

## 1. Prerequisites
- [TypeScript](typescript.md) — The language introduction.
- [Static Typing vs Dynamic Typing](static_dynamic_typing.md) — The difference between compile-time and runtime checks.
---

## 2. Term Category
- **Type System Fundamental**

---

## 3. Environment Context
- **Build-time** (Compatibility checks are performed entirely by the compiler; runtime JavaScript is oblivious to these structural types).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional statically typed languages like Java, C#, or C++, type systems are **nominal**. This means type equivalence is based on explicit names and declarations. If you have two classes with the exact same fields and methods but different names, you cannot assign an instance of one to a variable typed as the other. 

In JavaScript, however, code is written dynamically. Developers naturally write functions that accept any object as long as it has the properties the function needs to run. This is known as "duck typing" ("if it walks like a duck and quacks like a duck, it's a duck").

TypeScript was designed to build on top of JavaScript without breaking this natural behavior. Instead of forcing nominal constraints on developers, TypeScript implements a **Structural Type System**. It validates objects based on their properties (their shape), ensuring type safety while preserving the expressive, dynamic freedom of JavaScript.

### (2) Core Mechanics
Under a structural type system, two types are considered compatible if they have the same shape.

```typescript
interface Point2D {
  x: number;
  y: number;
}

class Vector2D {
  constructor(public x: number, public y: number) {}
}

function printPoint(point: Point2D) {
  console.log(`x: ${point.x}, y: ${point.y}`);
}

// 1. Works perfectly! Vector2D matches the shape of Point2D
const vec = new Vector2D(10, 20);
printPoint(vec); 
```

Furthermore, structural typing supports the **subtyping/subset** rule: an object is compatible with a target type if it contains *at least* the properties of the target type. It may contain additional properties.

```typescript
const point3D = { x: 1, y: 2, z: 3 };

// 2. Compatible because point3D has both x and y
printPoint(point3D); 
```

### (3) Real-World Application
Structural typing makes mocking and unit testing extremely simple. You do not need to implement mock interfaces or inherit from base classes. You can write a plain object containing only the properties your function uses, and pass it directly.

```typescript
// Interface matching database service
interface UserStorage {
  getUser(id: string): { name: string };
}

function welcomeUser(storage: UserStorage, id: string) {
  const user = storage.getUser(id);
  return `Welcome back, ${user.name}!`;
}

// In test environment, we pass a raw object directly as a mock
const mockStorage = {
  getUser: (id: string) => ({ name: 'Test User' })
};

console.log(welcomeUser(mockStorage, '123')); // Works seamlessly
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Expecting Nominal Type Protection

**The mistake:** Assuming two types representing different entities are isolated from each other because you named them differently.

**Why it's wrong:** If the shapes are identical, TypeScript will allow them to be mixed. This can cause domain logic bugs.

*Incorrect:*
```typescript
interface CustomerId {
  value: string;
}

interface OrderId {
  value: string;
}

function shipOrder(order: OrderId, customer: CustomerId) {
  console.log(`Shipping order ${order.value} to customer ${customer.value}`);
}

const customer: CustomerId = { value: 'cust_123' };
const order: OrderId = { value: 'ord_999' };

// Bug: Accidental swap! But TS allows it because both shapes are { value: string }
shipOrder(customer, order); 
```

*Fix:* Use **Branded Types** (nominal typing simulation) to distinguish shapes.
```typescript
interface CustomerId {
  value: string;
  __brand: 'Customer'; // Mock property to distinguish shapes
}

interface OrderId {
  value: string;
  __brand: 'Order';
}
```

**Golden Rule:** TypeScript verifies the structural shape of your data, not the class or interface label you assign to it.

---



### Mistake 2: Expecting Nominal Type Checking by Class or Interface Name

**The mistake:** Expecting TypeScript to reject an object `{ x: 10, y: 20 }` when passing it to a function expecting `Point2D`.

**Why it's wrong:** TypeScript uses structural typing ('duck typing'). If an object shape has all required properties with compatible types, TS considers it valid regardless of instance origin.

*Incorrect:*
```typescript
class Point2D { x!: number; y!: number; }
function draw(p: Point2D) {}
draw({ x: 10, y: 20, extra: true }); // Compiles because shape contains x and y!
```

*Fix:*
```typescript
class Point2D { x!: number; y!: number; }
// Use branded nominal types if strict brand isolation is needed
type BrandedPoint = Point2D & { __brand: "Point2D" };
```

### Mistake 3: Unintended Shape Compatibility in Empty Interfaces

**The mistake:** Defining `interface Empty {}` and expecting it to reject non-empty objects or primitives.

**Why it's wrong:** In structural typing, almost every non-nullish value is assignable to `{}` because every object satisfies having zero required properties.

*Incorrect:*
```typescript
interface Empty {}
const val: Empty = { a: 1, b: 2 }; // Compiles unexpectedly!
```

*Fix:*
```typescript
type StrictlyEmpty = Record<string, never>;
// const val: StrictlyEmpty = { a: 1 }; // ❌ Type Error: Type 'number' is not assignable to type 'never'
```

## 6. Practice Exercises

### Exercise 1: Structural Check

**Problem:** Review this code. Will the TypeScript compiler compile this successfully, or will it throw a build error?

```typescript
class Dog {
  bark() {
    return 'Woof!';
  }
}

class Cat {
  bark() {
    return 'Meow?'; // Cat has the same method name as Dog!
  }
}

const myDog: Dog = new Cat();
```

**Expected output:**
> [!check]- Answer
> ```text
> It will compile successfully! 
> Because both `Dog` and `Cat` have a shape containing a single method `bark(): string`, the TypeScript compiler considers their structures completely compatible, even though they represent different animals.
> ```
> - Does `Cat` possess every property and method shape declared in `Dog`?
> - Remember, the class name does not matter during structural type comparisons.

---



### Exercise 2: Structural Compatibility Verification

**Problem:** Verify whether `{ name: "Alice", age: 30, role: "admin" }` is assignable to `{ name: string }`.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```typescript
> type Named = { name: string };
> const user = { name: "Alice", age: 30, role: "admin" };
> const namedUser: Named = user; // Valid due to structural typing!
> console.log(true);
> ```
>
> **Explanation:** Structural typing requires target properties to exist, permitting extra properties on indirect object assignments.

---

### Exercise 3: Structural vs Nominal Typing

**Problem:** State whether TypeScript (Structural) or Java/C# (Nominal) matches types by shape rather than declared name.

**Expected output:**
> [!check]- Answer
> ```text
> TypeScript matches by shape (Structural)
> ```
> ```typescript
> console.log("TypeScript matches by shape (Structural)");
> ```
>
> **Explanation:** TypeScript checks compatible structure rather than nominal inheritance declarations.

## 7. Related Terms
- [Interfaces](../level_03/interfaces.md) — Defining structured object shapes.
- [Generic Constraints (`extends`)](../level_07/generic_constraints.md) — Restricting generics based on structural shapes.
- [`implements` Keyword](../level_10/implements.md) — Asserting that a class shape matches an interface.
- [Branded / Nominal Types](../level_09/branded_nominal_types.md) — Related concept: Branded / Nominal Types.
- [Type Aliases (`type`)](../level_05/type_aliases.md) — Type aliases.
- [Excess Property Checks](../level_03/excess_property_checks.md) — Excess property checks.
- [TypeScript](typescript.md) — Related concept: TypeScript.
---

## 8. Key Takeaways
- **Structural Typing** compares types by their properties and methods (their shape), not their names.
- This aligns with JavaScript's native dynamic "duck typing" execution model.
- An object is compatible with a type if it has *at least* the properties defined in that type.
- This shape-matching logic is evaluated purely at build time; types do not exist in the compiled JavaScript bundle.
- If you need explicit name-based protection, use nominal branding techniques.
