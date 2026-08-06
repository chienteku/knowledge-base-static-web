# Structural Typing / Duck Typing

> **Level 1 — Core Concepts & Environment Setup**
> The foundational type checking paradigm in TypeScript where type compatibility and assignment are determined solely by the shape and properties of the values, rather than their explicit names or declarations.

---

## 1. Prerequisites
- [TypeScript](typescript.md) — The language introduction.
- [Static Typing vs Dynamic Typing](static_dynamic_typing.md) — The difference between compile-time and runtime checks.

---

## 2. Term Category

**Type System Fundamental** (Structural Duck Typing Engine): Structural typing verifies compatibility based on object shape and member property structure rather than explicit nominal class declarations.



---

## 3. Explanation

### Environment Context
- **Build-time** (Compatibility checks are performed entirely by the compiler; runtime JavaScript is oblivious to these structural types).

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Structural Compatibility of Object Shapes

**Scenario:**
Demonstrate structural duck typing by passing an object with extra properties into a function expecting a narrower interface.

**Requirements:**
1. Define `Point2D` interface.
2. Pass object containing `x`, `y`, and `z` properties.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Point2D {
>   x: number;
>   y: number;
> }

function logPoint(point: Point2D) {
  console.log(`Point: (${point.x}, ${point.y})`);
}

const point3D = { x: 10, y: 20, z: 30 };

// Valid! point3D satisfies the structural shape of Point2D (contains x and y).
logPoint(point3D);
```

> #### Technical Explanation
>
> 1. TypeScript uses structural typing (duck typing), comparing objects by their member shape rather than explicit class names.
> 2. `point3D` is structurally compatible with `Point2D` because it possesses required `x` and `y` properties.
> 3. Extra properties (`z`) are allowed when passing variable references.

---

### Exercise 2: Strict Object Literal Excess Property Checks

**Scenario:**
Fix a compile error caused by direct inline object literal excess property checking.

**Requirements:**
1. Fix inline object literal assignment error.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface User {
>   id: number;
>   name: string;
> }

// ❌ FAILS due to Excess Property Checks on direct object literals:
// const user: User = { id: 1, name: "Alice", role: "admin" };

// ✅ CORRECT (Assign to intermediate variable or extend interface):
const userData = { id: 1, name: "Alice", role: "admin" };
const user: User = userData; // Allowed structurally!
```

> #### Technical Explanation
>
> 1. Fresh inline object literals undergo strict "Excess Property Checks" to catch typos (`role` in `User`).
> 2. Assigning the object literal to an intermediate variable (`userData`) bypasses fresh excess property checks.
> 3. Keeps structural typing rules consistent while preventing inline typo mistakes.

---

### Exercise 3: Structural vs Nominal Type Systems

**Scenario:**
Formulate an architectural comparison matrix contrasting Structural Typing (TypeScript) against Nominal Typing (Java/C#).

**Requirements:**
1. Contrast shape matching vs explicit class inheritance declarations.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Structural vs Nominal Matrix:
> - Structural Typing (TypeScript): Compatibility is based on object shape (members & types). Two distinct types with identical shapes are assignable to each other.
> - Nominal Typing (Java / C#): Compatibility is based on explicit class name declarations and class hierarchy (implements / extends).
> ```

> #### Technical Explanation
>
> 1. Nominal type systems require explicit inheritance relationships (`class Car implements Vehicle`).
> 2. Structural type systems allow any object matching required properties to satisfy interface contracts.
> 3. Aligns perfectly with idiomatic JavaScript object manipulation patterns.

---



## 6. Related Terms
- [Interfaces](../level_03/interfaces.md) — Defining structured object shapes.
- [Generic Constraints (`extends`)](../level_07/generic_constraints.md) — Restricting generics based on structural shapes.
- [`implements` Keyword](../level_10/implements.md) — Asserting that a class shape matches an interface.
- [Branded / Nominal Types](../level_09/branded_nominal_types.md) — Related concept: Branded / Nominal Types.
- [Type Aliases (`type`)](../level_05/type_aliases.md) — Type aliases.
- [Excess Property Checks](../level_03/excess_property_checks.md) — Excess property checks.
- [TypeScript](typescript.md) — Related concept: TypeScript.

---

## 7. Key Takeaways
- **Structural Typing** compares types by their properties and methods (their shape), not their names.
- This aligns with JavaScript's native dynamic "duck typing" execution model.
- An object is compatible with a type if it has *at least* the properties defined in that type.
- This shape-matching logic is evaluated purely at build time; types do not exist in the compiled JavaScript bundle.
- If you need explicit name-based protection, use nominal branding techniques.
