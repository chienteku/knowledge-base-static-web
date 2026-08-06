# Abstract Classes

> **Level 10 — Classes & OOP in TypeScript**
> A special type of Class that acts as a foundational blueprint. It cannot be instantiated directly with `new`; it exists *only* to be inherited by other classes. 

---

## 1. Prerequisites
- [Classes Overview](classes.md) — The standard class structure.
- [Interfaces](../level_03/interfaces.md) — A similar concept used for blueprinting.

---

## 2. Term Category

**Object-Oriented Programming** (Abstract Class Base Contracts): Abstract classes (`abstract class`) define partial base class implementations with un-implemented abstract methods that subclasses must implement.



---

## 3. Explanation

### Environment Context
- **Compile-Time (Compiles to standard JS Classes)**

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

## 4. Common Mistakes & Pitfalls

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



## 5. Practice Exercises

### Exercise 1: Authoring Abstract Base Classes

**Scenario:**
Define an `abstract class Logger` with a concrete `log(msg)` method and an `abstract write(msg)` method.

**Requirements:**
1. Declare `abstract class Logger`.
2. Extend `Logger` in `ConsoleLogger`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> abstract class Logger {
>   log(msg: string): void {
>     const timestamp = new Date().toISOString();
>     this.write(`[${timestamp}] ${msg}`);
>   }
> 
>   abstract write(formattedMsg: string): void;
> }

class ConsoleLogger extends Logger {
  write(formattedMsg: string): void {
    console.log(formattedMsg);
  }
}

const logger = new ConsoleLogger();
logger.log("System initialized");
```

> #### Technical Explanation
>
> 1. `abstract class` cannot be instantiated directly with `new Logger()`.
> 2. `abstract write()` forces derived subclasses (`ConsoleLogger`) to supply concrete implementations.
> 3. Shared method logic (`log`) is reused across all subclass implementations.

---

### Exercise 2: Auditing Direct Abstract Instantiation Errors

**Scenario:**
Demonstrate compile error when attempting to instantiate an abstract class with `new`.

**Requirements:**
1. Show compile error on `new AbstractClass()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> abstract class Animal {
>   abstract makeSound(): void;
> }

// ❌ Compile Error: Cannot create an instance of an abstract class!
// const a = new Animal();

class Dog extends Animal {
  makeSound(): void { console.log("Woof!"); }
}

const d = new Dog(); // Valid!
```

> #### Technical Explanation
>
> 1. Abstract classes serve strictly as architectural base blueprints.
> 2. TypeScript prevents direct instantiation of un-implemented abstract classes at compile time.
> 3. Enforces object inheritance hierarchy design.

---

### Exercise 3: Comparative Analysis: `abstract class` vs `interface`

**Scenario:**
Formulate an architectural selection matrix comparing `abstract class` against `interface`.

**Requirements:**
1. Contrast runtime JavaScript output, concrete code sharing, and inheritance limits.

> [!check]- Answer
>
> #### Implementation
>
> ```text
> Abstract Class vs Interface Selection Matrix:
> - abstract class: Preserved in transpiled JS output as a class. Supports shared concrete code execution and constructor state. Class can extend ONLY ONE abstract class (single inheritance).
> - interface: Erased completely in transpiled JS output (0 bytes). Pure type contract (zero executable code). Class can implement MULTIPLE interfaces (multiple inheritance).
> ```

> #### Technical Explanation
>
> 1. Abstract classes are suitable when sharing reusable code logic across related subclasses.
> 2. Interfaces are suitable for pure type contracts and multi-interface class capability composition.
> 3. Fundamental OOP architectural choice.

---



## 6. Related Terms
- [Interfaces](../level_03/interfaces.md) — The zero-cost alternative for pure shape blueprinting.
- [`implements` Keyword](implements.md) — How you apply an Interface to a class (similar to how you `extends` an abstract class).
- [Classes Overview](classes.md) — Related concept: Classes Overview.

---

## 7. Key Takeaways
- **Abstract Classes** are base classes that cannot be instantiated directly (`new AbstractClass()` is illegal).
- They exist solely to be extended by other classes.
- They allow you to share concrete logic (standard methods) with subclasses.
- They allow you to define **Abstract Methods** (methods without bodies), which forces the subclass to implement their own version of that method.
- Prefer `interface` if you do not need to share concrete logic.
