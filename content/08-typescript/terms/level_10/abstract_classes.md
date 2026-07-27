# Abstract Classes

> **Level 10 — Classes & OOP in TypeScript**
> A special type of Class that acts as a foundational blueprint. It cannot be instantiated directly with `new`; it exists *only* to be inherited by other classes. 

---

## 1. Prerequisites
- [Classes Overview](../level_10/classes.md) — The standard class structure.
- [Interfaces](../level_03/interfaces.md) — A similar concept used for blueprinting.

---

## 2. Term Category
- **TypeScript OOP Architecture**

---

## 3. Environment Context
- **Compile-Time (Compiles to standard JS Classes)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building a game. You create a `Character` class with health, speed, and a `move()` method.
You create `Player` and `Enemy` classes that inherit from `Character`.
But what happens if a junior developer writes `const c = new Character()`? What is a raw "Character"? It makes no sense in the game world. It should only be a Player or an Enemy.
**Abstract Classes** solve this. You mark `Character` as `abstract`. Now, it contains all the shared code, but the compiler forbids anyone from instantiating it directly.

### (2) The `abstract` Keyword
You place `abstract` before the `class` keyword.

```typescript
abstract class Character {
  constructor(public name: string, public health: number) {}

  takeDamage(amount: number) {
    this.health -= amount;
  }
}

// ❌ Error: Cannot create an instance of an abstract class.
const char = new Character("Base", 100); 

// ✅ Valid: We inherit from the abstract class
class Player extends Character {
  jump() { console.log("Jumping!"); }
}

const p = new Player("Hero", 100);
p.takeDamage(10); // Inherited from the abstract class!
```

### (3) Abstract Methods
The true superpower of Abstract Classes is **Abstract Methods**. 
You can define a method signature *without a body*, forcing all child classes to write their own custom implementation for that method!

```typescript
abstract class Character {
  // We don't know HOW a character attacks, but we mandate that they MUST have an attack method!
  abstract attack(): void; 
}

// ❌ Error: Non-abstract class 'Player' does not implement inherited abstract member 'attack' from class 'Character'.
class Player extends Character { } 

// ✅ Valid: Player implements the mandated method!
class Enemy extends Character {
  attack() { console.log("Enemy bites!"); }
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Abstract Classes instead of Interfaces

**The mistake:** A developer writes a massive Abstract Class with 10 abstract methods and 0 actual implementation code, just to act as a shape guide.

**Why it's wrong:** If your Abstract Class contains no actual logic (no standard methods or properties with values), you are just writing an Interface! Abstract Classes compile into real JavaScript code (they cost bytes in your bundle). Interfaces are erased completely at compile time (0 cost). 
**Golden Rule:** If you only need to define a *shape*, use an `interface`. If you need to share *actual logic/code* (like the `takeDamage` method above) AND mandate specific shapes, use an `abstract class`.

---



### Mistake 2: Attempting Direct Instantiation of Abstract Classes via `new`

**The mistake:** Writing `const instance = new AbstractClass();` (TS2511).

**Why it's wrong:** Abstract classes serve strictly as base contracts for derived subclasses. TypeScript forbids direct instantiation of abstract classes.

*Incorrect:*
```typescript
abstract class Logger { abstract log(msg: string): void; }
// const logger = new Logger(); // ❌ Cannot create an instance of an abstract class
```

*Fix:*
```typescript
abstract class Logger { abstract log(msg: string): void; }
class ConsoleLogger extends Logger { log(msg: string) { console.log(msg); } }
const logger = new ConsoleLogger(); // Instantiate concrete subclass
```

### Mistake 3: Omitting Abstract Method Implementations in Concrete Subclasses

**The mistake:** Extending an abstract class without implementing all declared abstract methods.

**Why it's wrong:** Concrete subclasses MUST implement every abstract method inherited from parent abstract classes.

*Incorrect:*
```typescript
abstract class Base { abstract render(): void; }
// class Child extends Base {} // ❌ Non-abstract class 'Child' does not implement inherited abstract member 'render'
```

*Fix:*
```typescript
abstract class Base { abstract render(): void; }
class Child extends Base { render() { /* Concrete implementation */ } }
```



### Mistake 4: Attempting Direct Instantiation of Abstract Classes via `new`

**The mistake:** Writing `const instance = new AbstractClass();` (TS2511).

**Why it's wrong:** Abstract classes serve strictly as base contracts for derived subclasses. TypeScript forbids direct instantiation of abstract classes.

*Incorrect:*
```typescript
abstract class Logger { abstract log(msg: string): void; }
// const logger = new Logger(); // ❌ Cannot create an instance of an abstract class
```

*Fix:*
```typescript
abstract class Logger { abstract log(msg: string): void; }
class ConsoleLogger extends Logger { log(msg: string) { console.log(msg); } }
const logger = new ConsoleLogger(); // Instantiate concrete subclass
```

### Mistake 5: Omitting Abstract Method Implementations in Concrete Subclasses

**The mistake:** Extending an abstract class without implementing all declared abstract methods.

**Why it's wrong:** Concrete subclasses MUST implement every abstract method inherited from parent abstract classes.

*Incorrect:*
```typescript
abstract class Base { abstract render(): void; }
// class Child extends Base {} // ❌ Non-abstract class 'Child' does not implement inherited abstract member 'render'
```

*Fix:*
```typescript
abstract class Base { abstract render(): void; }
class Child extends Base { render() { /* Concrete implementation */ } }
```

## 6. Practice Exercises

### Exercise 1: Abstract Properties

**Problem:** Can you mark a class *property* as abstract, forcing the child class to provide a value for it?

**Expected output:**
```typescript
// Yes!
abstract class Component {
  abstract templateName: string; // Forces children to declare this property
}

class Button extends Component {
  templateName = "btn-template"; // Implemented!
}
```

> [!check]- Answer
> - The syntax is exactly the same as abstract methods.

---



### Exercise 2: Abstract Class Template Method Pattern

**Problem:** Create `abstract class Shape` with `abstract getArea(): number` and concrete `printArea()` method.

**Expected output:**
```text
Abstract template method pattern implemented
```

> [!check]- Answer
> ```typescript
> abstract class Shape {
>   abstract getArea(): number;
>   printArea() { console.log(`Area: ${this.getArea()}`); }
> }
> class Square extends Shape {
>   constructor(private size: number) { super(); }
>   getArea() { return this.size * this.size; }
> }
> new Square(5).printArea();
> console.log("Abstract template method pattern implemented");
> ```
>
> **Explanation:** Abstract classes combine concrete shared methods with abstract subclass contract hooks.

### Exercise 3: Abstract Constructor Type Annotation

**Problem:** Type a factory parameter expecting abstract class constructor `type ShapeCtor = abstract new (...args: any[]) => Shape`.

**Expected output:**
```text
Abstract constructor type defined
```

> [!check]- Answer
> ```typescript
> type ShapeCtor = abstract new (...args: any[]) => Shape;
> console.log("Abstract constructor type defined");
> ```
>
> **Explanation:** `abstract new` syntax describes constructor function types of abstract classes.



### Exercise 4: Abstract Class Template Method Pattern

**Problem:** Create `abstract class Shape` with `abstract getArea(): number` and concrete `printArea()` method.

**Expected output:**
```text
Abstract template method pattern implemented
```

> [!check]- Answer
> ```typescript
> abstract class Shape {
>   abstract getArea(): number;
>   printArea() { console.log(`Area: ${this.getArea()}`); }
> }
> class Square extends Shape {
>   constructor(private size: number) { super(); }
>   getArea() { return this.size * this.size; }
> }
> new Square(5).printArea();
> console.log("Abstract template method pattern implemented");
> ```
>
> **Explanation:** Abstract classes combine concrete shared methods with abstract subclass contract hooks.

### Exercise 5: Abstract Constructor Type Annotation

**Problem:** Type a factory parameter expecting abstract class constructor `type ShapeCtor = abstract new (...args: any[]) => Shape`.

**Expected output:**
```text
Abstract constructor type defined
```

> [!check]- Answer
> ```typescript
> type ShapeCtor = abstract new (...args: any[]) => Shape;
> console.log("Abstract constructor type defined");
> ```
>
> **Explanation:** `abstract new` syntax describes constructor function types of abstract classes.

## 7. Related Terms
- [Interfaces](../level_03/interfaces.md) — The zero-cost alternative for pure shape blueprinting.
- [`implements` Keyword](../level_10/implements.md) — How you apply an Interface to a class (similar to how you `extends` an abstract class).

---

## 8. Key Takeaways
- **Abstract Classes** are base classes that cannot be instantiated directly (`new AbstractClass()` is illegal).
- They exist solely to be extended by other classes.
- They allow you to share concrete logic (standard methods) with subclasses.
- They allow you to define **Abstract Methods** (methods without bodies), which forces the subclass to implement their own version of that method.
- Prefer `interface` if you do not need to share concrete logic.
