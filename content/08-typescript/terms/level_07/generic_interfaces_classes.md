# Generic Interfaces & Classes

> **Level 7 — Generics**
> Applying the `<T>` Generic syntax to structural blueprints (Interfaces and Classes) rather than just standalone functions. This allows you to build highly reusable data structures (like Arrays or API Wrappers).

---

## 1. Prerequisites
- [Generics Overview (`<T>`)](generics.md) — The core concept.
- [Interfaces](../level_03/interfaces.md) — One of the structures being made generic.

---

## 2. Term Category

**TypeScript Advanced Type** (Generic Object & Class Contracts): Generic interfaces and classes instantiate parametric type parameters across methods, properties, and instance state.



---

## 3. Explanation

### Environment Context
- **Compile-Time**

### (1) Generic Interfaces
Imagine building a standard API Response wrapper. Every single API response returns `{ status: 200, data: ??? }`. 
The `data` changes depending on the endpoint. Instead of creating 50 different interfaces, you create ONE Generic Interface.

```typescript
// The Interface requires a Type <T> to be provided when used!
interface ApiResponse<T> {
  status: number;
  data: T; // The data is whatever Type was passed in
}

// Usage:
const userResponse: ApiResponse<User> = { status: 200, data: { name: "Alice" } };
const listResponse: ApiResponse<string[]> = { status: 200, data: ["A", "B"] };
```

### (2) Generic Classes
The exact same concept applies to Classes. The most famous example is the built-in `Array<T>` or `Map<K, V>`.
You define the Generic on the Class name, and then you can use that Generic anywhere inside the class properties or methods.

```typescript
class DataStore<T> {
  private items: T[] = [];

  addItem(item: T) {
    this.items.push(item);
  }

  getItems(): T[] {
    return this.items;
  }
}

// We instantiate the class and lock its Type to `number`
const numberStore = new DataStore<number>();
numberStore.addItem(100);
numberStore.addItem("Hello"); // ❌ Error: Argument of type 'string' is not assignable to parameter of type 'number'.
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to pass the Generic Argument

**The mistake:** A developer writes the `ApiResponse<T>` interface above. Then in another file, they type a variable as: `const res: ApiResponse = ...`

**Why it's wrong:** Unlike generic functions (where TS can automatically *infer* the generic from the arguments you pass), Generic Interfaces **strictly require** you to manually provide the Type Argument. `ApiResponse` by itself is incomplete. You must provide `ApiResponse<Something>`.
**Golden Rule:** If an Interface or Type Alias is defined with a `<T>`, you must always provide the `<T>` when using it, unless it has a [Default Type](../level_07/default_generics.md) — How to provide a fallback if the user forgets to pass a generic type.

---



### Mistake 2: Referencing Class Generic Parameters in Static Members

**The mistake:** Writing `static defaultValue: T;` inside `class Container<T>` (TS2302).

**Why it's wrong:** Static members belong to the class constructor itself, NOT class instances. Class generic parameter `T` is instantiated per instance, so static members cannot access `T`.

*Incorrect:*
```typescript
class Box<T> {
    // static item: T; // ❌ Static members cannot reference class type parameters!
}
```

*Fix:*
```typescript
class Box<T> {
    item!: T; // Instance property correctly accesses generic T
    static createBox<U>(val: U): Box<U> { return new Box<U>(); } // Static method with own generic U
}
```

### Mistake 3: Omitting Generic Type Arguments on Interface Implementation

**The mistake:** Writing `class StringList implements List` without providing generic argument `List<string>`.

**Why it's wrong:** Generic interfaces require type arguments when being implemented by concrete classes.

*Incorrect:*
```typescript
interface Repository<T> { find(): T }
// class UserRepo implements Repository {} // ❌ Generic type 'Repository<T>' requires 1 type argument(s)
```

*Fix:*
```typescript
interface Repository<T> { find(): T }
class UserRepo implements Repository<string> { find() { return "user"; } }
```

## 5. Practice Exercises

### Exercise 1: Authoring Generic Repository Interfaces

**Scenario:**
Define a generic `Repository<T>` interface for database CRUD operations.

**Requirements:**
1. Declare generic interface `Repository<T>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface Repository<T> {
>   findById(id: string): Promise<T | null>;
>   save(entity: T): Promise<void>;
>   findAll(): Promise<T[]>;
> }

interface Product { id: string; title: string; price: number; }

class ProductRepository implements Repository<Product> {
  async findById(id: string): Promise<Product | null> {
    return { id, title: "Laptop", price: 999 };
  }
  async save(entity: Product): Promise<void> {}
  async findAll(): Promise<Product[]> { return []; }
}
```

> #### Technical Explanation
>
> 1. `interface Repository<T>` parameterizes CRUD method signatures over arbitrary domain entities.
> 2. Implementing `Repository<Product>` locks `T` to `Product` across all class methods.
> 3. Standard enterprise data access layer architecture.

---

### Exercise 2: Implementing Generic Stack Data Structures

**Scenario:**
Create a generic `Stack<T>` class supporting `push`, `pop`, and `peek` operations.

**Requirements:**
1. Define class `Stack<T>`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> class Stack<T> {
>   private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
}

const numberStack = new Stack<number>();
numberStack.push(10);
numberStack.push(20);
console.log(numberStack.pop()); // 20
```

> #### Technical Explanation
>
> 1. `class Stack<T>` manages internal state (`items: T[]`) of type `T`.
> 2. Instantiating `new Stack<number>()` enforces number element types across all stack operations.
> 3. High performance, type-safe data structure implementation.

---

### Exercise 3: Generic Interface Method Inheritance

**Scenario:**
Extend a generic parent interface into a generic child interface (`interface PaginatedResponse<T> extends ApiResponse<T[]>`).

**Requirements:**
1. Extend generic interface.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> interface ApiResponse<T> {
>   data: T;
>   status: number;
> }

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  totalPages: number;
}

const response: PaginatedResponse<string> = {
  data: ["item1", "item2"],
  status: 200,
  page: 1,
  totalPages: 5
};
```

> #### Technical Explanation
>
> 1. Generic interfaces can extend other generic interfaces (`extends ApiResponse<T[]>`).
> 2. Substitutes type parameter `T[]` into parent interface definitions cleanly.
> 3. Reusable API response design.

---



## 6. Related Terms
- [Type Aliases (`type`)](../level_05/type_aliases.md) — Can also be Generic (`type MyType<T> = ...`).
- [Classes Overview](../level_10/classes.md) — The OOP structures being made generic.
- [Generics Overview (`<T>`)](generics.md) — Related concept: Generics Overview (`<T>`).

---

## 7. Key Takeaways
- **Generic Interfaces and Classes** allow you to create reusable data structures where the internal data payload can be anything.
- The `<T>` is declared immediately after the interface or class name.
- It is the standard architectural pattern for API Responses, State Management Wrappers, and Data Collections (like Stacks, Queues, Maps).
- You must explicitly provide the Type Argument (e.g., `<string>`) when using a Generic Interface.
