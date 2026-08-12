# super

> **Level 7 — Objects & Prototypes**
> Keyword used to call the constructor or methods of an object's parent class.

---

## 1. Prerequisites
- [Class](class.md) — The ES6 blueprint.
- [extends](extends.md) — Used to create the parent-child relationship.

---

## 2. Term Category

**Language Core *(Introduced in ES6)* (Universal)**: super is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
When a child class `extends` a parent class, the child often needs its own custom `constructor` to handle specific data. However, the parent class *also* has a `constructor` that handles the base data! How do we run both?

The designers introduced the `super` keyword to solve this. `super` is a direct reference to the Parent Class. 
Inside the child's constructor, calling `super()` actually invokes the parent's constructor, ensuring the base setup is completed before the child adds its specific setup. Furthermore, you can use `super.methodName()` anywhere in the child class to explicitly call a function from the parent class.

### (2) Reality Metaphor
Imagine building a Custom Sports Car based on a standard Car chassis.
You are the engineer for the Custom Sports Car (the Child Class). Before you can install the turbo engine and racing tires, you MUST call the main factory floor (the `super` Parent Class) and say: "Please build the base chassis first." Once the factory finishes building the base chassis, they hand it to you, and you can add your custom parts.

### (3) JavaScript Code Examples

#### Short Snippet: The Constructor Rule
```javascript
class Animal {
  constructor(name) {
    this.name = name; // The base setup
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    // RULE: You MUST call super() before using 'this'!
    super(name); // Passes the name up to the Animal constructor
    
    this.breed = breed; // Now we can do Dog-specific setup
  }
}

const myDog = new Dog("Rex", "German Shepherd");
console.log(myDog.name); // "Rex"
```

#### Fuller Example: Calling Parent Methods
```javascript
class BankAccount {
  deposit(amount) {
    console.log(`Deposited $${amount} securely.`);
  }
}

class VIPAccount extends BankAccount {
  // We want to override the deposit method, but we STILL want 
  // the secure logic from the parent to run!
  deposit(amount) {
    console.log("VIP Bonus! Adding 10 extra dollars!");
    
    // We use super.methodName() to call the parent's version of the function!
    super.deposit(amount + 10);
  }
}

const vip = new VIPAccount();
vip.deposit(100); 
// Output: 
// "VIP Bonus! Adding 10 extra dollars!"
// "Deposited $110 securely."
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Accessing `this` before calling `super()`

**The mistake:** Writing `this.color = "red"` in a child class constructor *before* calling `super()`.

**Why it's wrong:** In JavaScript, the parent class is responsible for actually creating the `this` object! If you try to attach properties to `this` before calling `super()`, the `this` object physically does not exist yet. The engine will throw a `ReferenceError`.

*Incorrect:*
```javascript
class Car extends Vehicle {
  constructor(wheels) {
    this.wheels = wheels; // Crash! 'this' doesn't exist yet!
    super(); 
  }
}
```

*Fix:*
```javascript
class Car extends Vehicle {
  constructor(wheels) {
    super(); // Let the parent create 'this' first!
    this.wheels = wheels; // Safe to use.
  }
}
```

---

### Mistake 2: Losing Context Binding (`this`) in Super Callbacks

**The mistake:** Passing methods from Super instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "super",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "super",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Super Operations

**The mistake:** Executing asynchronous operations within Super without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/super"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/super");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in super: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Method Overriding & Base Method Augmentation via super

**Scenario:** A UI component hierarchy extends a base Element class, overriding render() while augmenting base behavior via super.render().

**Requirements:**
1. Define class BaseWidget with render().
2. Define class CustomWidget extends BaseWidget.
3. Override render() and call super.render().
4. Return combined render output.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class BaseWidget {
>   render() {
>     return "<div>Widget</div>";
>   }
> }
>
> class CustomWidget extends BaseWidget {
>   render() {
>     const baseHtml = super.render();
>     return `<section>${baseHtml}</section>`;
>   }
> }
>
> // Verification tests
> const widget = new CustomWidget();
> console.assert(widget.render() === "<section><div>Widget</div></section>", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **super Keyword**: The super keyword is used to access and call functions on an object's parent class.
> 2. **super.method() Augmentation**: Invoking super.method() allows child methods to extend base class functionality without duplicating logic.
> 3. **Lexical Binding of super**: super calls are bound lexically to the class declaration hierarchy.
> 
---

### Exercise 2: Super Advanced Context Handler

**Scenario:** A web application component processes super data operations within enterprise workflows.

**Requirements:**
1. Write handleSuperSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleSuperSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleSuperSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Super Architecture**: Applying super patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Super Performance Optimization

**Scenario:** An application utility optimizes super execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeSuperTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeSuperTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeSuperTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Super Optimization**: Optimizing super improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [extends](extends.md) — The keyword that creates the relationship requiring `super`.
- [Class](class.md) — The parent structure.

---

## 7. Key Takeaways
- `super` is used to access and call functions on an object's parent.
- If a child class has a `constructor`, it MUST call `super()` before it is allowed to use the `this` keyword.
- `super()` calls the parent's constructor.
- `super.methodName()` calls a specific method on the parent, which is very useful when overriding methods.
