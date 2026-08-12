# Static Methods & Properties

> **Level 7 — Objects & Prototypes**
> Class members on the class itself, not instances.

---

## 1. Prerequisites
- [Class](class.md) — Syntactic sugar blueprint over prototypal inheritance.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Static Methods & Properties is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In object-oriented programming, class fields and methods are normally instantiated on individual objects created with the `new` keyword (known as "instance members"). For example, every `User` object has its own unique `name` and calls `greet()`. 

However, some properties or behaviors are universal to the class classification rather than any single instance—such as a tracker of how many users have logged in, a database connection URL, or utility math functions (like `Math.max()`).

To declare these, JavaScript classes support the **`static`** keyword:
- **Static Properties:** Belongs directly to the Class constructor function itself. They are not copied or inherited by instance objects.
- **Static Methods:** Utility functions invoked directly on the Class name.
- **Static Context (`this`):** Crucially, inside a static method, the `this` keyword refers to the **Class constructor function itself**, not an instance of the class.

### (2) Reality Metaphor
Imagine a car manufacturing factory.
- An **instance property** is the paint color or the gas pedal. Each individual car rolled off the production line has its own color and its own gas pedal.
- A **static property** is the factory's counter tracking the total number of cars produced. The counter belongs to the factory building (the Class) itself. You cannot ask a single car driving on the road: "Car, what is the total number of cars produced in the factory?" You must ask the factory headquarters directly: `Factory.totalCars`.

### (3) JavaScript Code Examples

#### Class Counter and Utility Helpers
```javascript
class User {
  // 1. Static property on the class to count instances
  static userCount = 0;

  constructor(username) {
    this.username = username; // Instance property
    
    // Increment the static counter on the class constructor!
    User.userCount++; 
  }

  // 2. Static method: a helper utility
  static formatUsername(rawName) {
    return rawName.trim().toLowerCase();
  }

  // 3. Static method accessing static properties using 'this'
  static printTotalCount() {
    // Inside static methods, 'this' refers to the User class constructor
    console.log(`Total users registered: ${this.userCount}`);
  }
}

// Accessing static utilities directly on the class
const cleanName = User.formatUsername("  BrendanEich  ");
console.log(cleanName); // "brendaneich"

// Creating instances
const user1 = new User("Alice");
const user2 = new User("Bob");

// Check the static counter
User.printTotalCount(); // "Total users registered: 2"
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to access static members from instance objects

**The mistake:** Instantiating an object and trying to read a static property or method directly from the instance variable.

**Why it's wrong:** Static properties are bound to the class constructor function, not the instance object's prototype. The instance object does not possess the property, returning `undefined` or throwing a TypeError.

*Incorrect:*
```javascript
const user = new User("Alice");
console.log(user.userCount); // undefined!
user.printTotalCount();      // TypeError: user.printTotalCount is not a function
```

*Fix:*
```javascript
const user = new User("Alice");

// Option A: Access via Class name directly (Recommended)
console.log(User.userCount); 

// Option B: Access via constructor property
console.log(user.constructor.userCount); 
```

---

### Mistake 2: Losing Context Binding (`this`) in Static Methods Properties Callbacks

**The mistake:** Passing methods from Static Methods Properties instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "static_methods_properties",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "static_methods_properties",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Static Methods Properties Operations

**The mistake:** Executing asynchronous operations within Static Methods Properties without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/static_methods_properties"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/static_methods_properties");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in static_methods_properties: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Factory Static Methods & Constant Fields on Classes

**Scenario:** A math library defines a class with static methods (MathUtils.add) and static fields (MathUtils.PI).

**Requirements:**
1. Define class MathUtils.
2. Declare static field static PI = 3.14159.
3. Declare static method static add(a, b).
4. Verify access via MathUtils.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class MathUtils {
>   static PI = 3.14159;
>
>   static add(a, b) {
>     return a + b;
>   }
>
>   static createCircle(radius) {
>     return { radius, area: MathUtils.PI * radius * radius };
>   }
> }
>
> // Verification tests
> console.assert(MathUtils.PI === 3.14159, "Test 1 Failed");
> console.assert(MathUtils.add(10, 20) === 30, "Test 2 Failed");
> const circle = MathUtils.createCircle(2);
> console.assert(Math.round(circle.area) === 13, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **static Keyword**: The static keyword defines properties or methods belonging to the class constructor itself, rather than instance objects.
> 2. **No Instance 'this'**: Static methods are called on the class name (Class.method()) and do not have access to instance 'this'.
> 3. **Factory Design Pattern**: Static methods frequently act as factory initializers constructing class instances.
> 
---

### Exercise 2: Static Methods Properties Advanced Context Handler

**Scenario:** A web application component processes static methods properties data operations within enterprise workflows.

**Requirements:**
1. Write handleStaticMethodsPropertiesSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleStaticMethodsPropertiesSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleStaticMethodsPropertiesSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Static Methods Properties Architecture**: Applying static methods properties patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Static Methods Properties Performance Optimization

**Scenario:** An application utility optimizes static methods properties execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeStaticMethodsPropertiesTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeStaticMethodsPropertiesTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeStaticMethodsPropertiesTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Static Methods Properties Optimization**: Optimizing static methods properties improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [new Keyword](new_keyword.md) — The operator that instantiates objects, triggering class constructors.
- [extends](extends.md) — Class inheritance, which also inherits static properties.

---

## 7. Key Takeaways
- Static properties and methods are defined on the Class itself, not on instance objects.
- Prefix declarations with the `static` keyword inside a class block.
- Invoke static members directly on the class name (e.g. `Class.staticProperty`).
- Inside static methods, the `this` keyword points to the Class constructor function.
- Instance variables cannot access static properties or methods directly.
