# Decorators

> **Level 10 — Classes & OOP in TypeScript**
> Annotations prefixed with `@` that wrap classes, methods, properties, or parameters to dynamically inspect, modify, or add metadata to Object-Oriented class definitions.

---

## 1. Prerequisites
- [Classes](../level_10/classes.md) — The blueprints of object structures.
- [Parameter Properties](../level_10/parameter_properties.md) — Declaring fields inside constructor arguments.

---

## 2. Term Category
- **OOP**

---

## 3. Environment Context
- **Both** (Requires enabling compiler configuration flags at build-time, and executes wrapper functions at runtime when class definitions load).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In large-scale enterprise frameworks (such as Angular, NestJS, or database ORMs like TypeORM), classes often require cross-cutting metadata or shared behavior:
- Mapping a class to a database table (`@Entity`).
- Declaring a class as an API endpoint (`@Controller('/users')`).
- Declaring a property needs email validation (`@IsEmail()`).
- Injecting service dependencies.

Manually writing boilerplate wrappers or setup functions around every class and method is repetitive and error-prone. 

**Decorators** provide a clean, declarative syntax to attach metadata and behavior. By placing a `@` annotation above class elements, developers can automatically wrap class functions, inject parameters, or store configuration tags.

### (2) Core Mechanics
TypeScript supports two decorator paradigms:
1. **Experimental Decorators:** The historical standard used by NestJS, TypeORM, and Angular, which requires setting `"experimentalDecorators": true` in `tsconfig.json`.
2. **ES Decorators:** The standard JavaScript ECMAScript proposal supported natively in TypeScript 5.0+ without compiler flags.

#### Decorator Evaluation
Decorators execute **once at runtime when the class is first defined** (when the JavaScript engine parses the file), **not** when instances of the class are instantiated.

```typescript
// 1. Simple Class Decorator
function Freeze(constructor: Function) {
  Object.freeze(constructor);
  Object.freeze(constructor.prototype);
}

@Freeze
class Configuration {
  apiUrl = 'https://api.site.com';
}

// Config class is frozen at load time! Cannot add fields at runtime.
```

#### Decorator Factories
To pass parameters to a decorator, you use a Decorator Factory—a function that accepts configuration parameters and returns the actual decorator function.

```typescript
// A Decorator Factory
function Route(path: string) {
  return function (constructor: Function) {
    constructor.prototype.routePath = path; // Attach metadata
  };
}

@Route('/admin')
class AdminController {}

const ctrl = new AdminController();
console.log((ctrl as any).routePath); // Inferred: "/admin"
```

### (3) Real-World Application
Declaring routing controllers and dependency injection configurations in backend APIs.

```typescript
// Example method decorator to log calls
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`[Log] Calling method "${propertyKey}" with args:`, args);
    return originalMethod.apply(this, args); // Execute original
  };
}

class Calculator {
  @Log
  add(a: number, b: number) {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(5, 7); // Logs: "[Log] Calling method "add" with args: [5, 7]"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Assuming decorators execute when class instances are instantiated

**The mistake:** Expecting decorators to perform actions (like validating values or tracking user context) dynamically every time `new MyClass()` is called.

**Why it's wrong:** Decorators execute only once when the script file loads. If a decorator modifies a value in its scope without attaching getters/setters to the class prototype, that value remains static across all instances.

*Incorrect:*
```typescript
function Timestamp(target: any, key: string) {
  // Executed ONCE when class defines. Every class instance shares the same timestamp!
  target[key] = new Date().toISOString(); 
}

class RequestLogs {
  @Timestamp createdTime!: string;
}
```

*Fix:* Implement getters or intercept functions dynamically inside constructor hooks or prototypes.

**Golden Rule:** Decorators configure and attach metadata to class prototypes once when files load. To execute instance-specific code, decorators must return wrapper constructors or define property getter/setter traps.

---



### Mistake 2: Forgetting to Enable `experimentalDecorators: true` in `tsconfig.json` for Legacy Decorators

**The mistake:** Using Stage 2 legacy `@decorator` syntax without enabling `experimentalDecorators` flag.

**Why it's wrong:** TypeScript requires explicit compiler flag `experimentalDecorators: true` when using legacy Stage 2 decorators.

*Incorrect:*
```typescript
// tsconfig.json
// "experimentalDecorators": false // ❌ Experimental support for decorators is a feature that is subject to change
```

*Fix:*
```typescript
// tsconfig.json
{ "compilerOptions": { "experimentalDecorators": true } }
```

### Mistake 3: Confusing Stage 3 Modern Decorators with Legacy Stage 2 Decorators

**The mistake:** Applying legacy decorator signature parameter arguments to Stage 3 decorators.

**Why it's wrong:** Stage 3 decorators (TS 5.0+) use a standardized `(target, context)` signature, differing from legacy 3-argument metadata signatures.

*Incorrect:*
```typescript
function legacyDec(target: any, propertyKey: string, descriptor: PropertyDescriptor) {}
```

*Fix:*
```typescript
function modernDec(target: Input, context: ClassMethodDecoratorContext) {} // Stage 3 standard
```



### Mistake 4: Forgetting to Enable `experimentalDecorators: true` in `tsconfig.json` for Legacy Decorators

**The mistake:** Using Stage 2 legacy `@decorator` syntax without enabling `experimentalDecorators` flag.

**Why it's wrong:** TypeScript requires explicit compiler flag `experimentalDecorators: true` when using legacy Stage 2 decorators.

*Incorrect:*
```typescript
// tsconfig.json
// "experimentalDecorators": false // ❌ Experimental support for decorators is a feature that is subject to change
```

*Fix:*
```typescript
// tsconfig.json
{ "compilerOptions": { "experimentalDecorators": true } }
```

### Mistake 5: Confusing Stage 3 Modern Decorators with Legacy Stage 2 Decorators

**The mistake:** Applying legacy decorator signature parameter arguments to Stage 3 decorators.

**Why it's wrong:** Stage 3 decorators (TS 5.0+) use a standardized `(target, context)` signature, differing from legacy 3-argument metadata signatures.

*Incorrect:*
```typescript
function legacyDec(target: any, propertyKey: string, descriptor: PropertyDescriptor) {}
```

*Fix:*
```typescript
function modernDec(target: Input, context: ClassMethodDecoratorContext) {} // Stage 3 standard
```

## 6. Practice Exercises

### Exercise 1: Experimental Setup

**Problem:** You are starting a NestJS backend project. The compiler is throwing the following warning:
`Experimental support for decorators is a feature that is subject to change in a future release.`
Modify this `tsconfig.json` block to resolve the compiler warning.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    // Complete this:
    "experimentalDecorators": true
  }
}
```

**Expected output:**
> [!check]- Answer
> ```text
> The compiler compiles files containing decorators without throwing experimental warnings.
> ```
> - NestJS relies on experimental legacy decorators.
> - Add `"experimentalDecorators": true` to the `compilerOptions` field.

---



### Exercise 2: Class Method Decorator Signature

**Problem:** Write method decorator `log(target: any, key: string, descriptor: PropertyDescriptor)`.

**Expected output:**
> [!check]- Answer
> ```text
> Method decorator created
> ```
> ```typescript
> function log(target: any, key: string, descriptor: PropertyDescriptor) {
>   const orig = descriptor.value;
>   descriptor.value = function(...args: any[]) {
>     console.log(`Calling ${key}`);
>     return orig.apply(this, args);
>   };
> }
> console.log("Method decorator created");
> ```
>
> **Explanation:** Method decorators intercept and wrap target function executions.

---

### Exercise 3: Decorator Evaluation Order

**Problem:** State evaluation order when multiple decorators `@g @f x` are applied to a single target (Right to left / Bottom to top).

**Expected output:**
> [!check]- Answer
> ```text
> Evaluated right-to-left (f then g)
> ```
> ```typescript
> console.log("Evaluated right-to-left (f then g)");
> ```
>
> **Explanation:** Decorators compose in right-to-left mathematical function composition order.

---

### Exercise 4: Class Method Decorator Signature

**Problem:** Write method decorator `log(target: any, key: string, descriptor: PropertyDescriptor)`.

**Expected output:**
> [!check]- Answer
> ```text
> Method decorator created
> ```
> ```typescript
> function log(target: any, key: string, descriptor: PropertyDescriptor) {
>   const orig = descriptor.value;
>   descriptor.value = function(...args: any[]) {
>     console.log(`Calling ${key}`);
>     return orig.apply(this, args);
>   };
> }
> console.log("Method decorator created");
> ```
>
> **Explanation:** Method decorators intercept and wrap target function executions.

---

### Exercise 5: Decorator Evaluation Order

**Problem:** State evaluation order when multiple decorators `@g @f x` are applied to a single target (Right to left / Bottom to top).

**Expected output:**
> [!check]- Answer
> ```text
> Evaluated right-to-left (f then g)
> ```
> ```typescript
> console.log("Evaluated right-to-left (f then g)");
> ```
>
> **Explanation:** Decorators compose in right-to-left mathematical function composition order.

## 7. Related Terms
- [Classes](../level_10/classes.md) — The structures decorated.
- [Access Modifiers](../level_10/access_modifiers.md) — Visibility bounds of fields.
- [Static Members](../level_10/static_members.md) — Class-level properties.

---

## 8. Key Takeaways
- **Decorators** are functions prefixed with `@` used to modify classes, methods, accessors, properties, or parameters.
- They execute once at runtime when class definitions are parsed by the JS engine, not when class instances are instantiated.
- Legacy/NestJS decorator support requires enabling `"experimentalDecorators": true` in `tsconfig.json`.
- Decorator Factories allow configuration parameters (such as route paths or database column specs) to be passed into annotations.
- Frequently used for Dependency Injection (DI) and metadata serialization systems.
