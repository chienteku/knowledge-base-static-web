# Design Patterns (Module, Singleton, Observer, Factory)

> **Level 9 — Advanced Concepts & Patterns**
> Reusable solution templates in JS.

---

## 1. Prerequisites
- [Closure](../level_03/closure.md) — The function scope scope pattern.
- [IIFE](iife.md) — Immediately Invoked Function Expressions used for module isolation.
- [Object](../level_02/object.md) — The base key-value dictionary structure.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When writing applications, developers repeatedly face identical architectural challenges: "How do we hide internal variables?" or "How do we guarantee that only one configuration manager ever exists?" or "How do we notify multiple components when a state updates?"

Instead of rewriting custom solutions every time, we employ **Design Patterns**—reusable, standardized blueprint templates that solve common software design challenges. 

We will cover four core patterns heavily used in JavaScript:

---

### (2) The Four Core Patterns

#### 1. The Module Pattern
Uses closures and IIFEs to encapsulate private variables and methods, exposing only a clean, public API object. This was the standard method for writing modular code before ES Modules were built into the language.
- **Metaphor:** A locked safe. It has complex mechanisms inside, but you can only interact with it by turning the key and pulling the handle on the outside.

#### 2. The Singleton Pattern
Restricts a class from being instantiated more than once. It constructs a single instance and caches it; any future constructor calls return that same cached reference. Perfect for shared services like Database Connection Pools or global Config Managers.
- **Metaphor:** A company President. There is only one President. If you request a meeting with the President, you get the exact same person every time; a new President is never created.

#### 3. The Observer Pattern (Pub/Sub)
A design where an object (the "Subject" or "Publisher") maintains a list of dependents ("Observers" or "Subscribers") and automatically notifies them of state changes (typically by executing their callback functions).
- **Metaphor:** Subscribing to an email newsletter. When the publisher drafts a new post, they automatically broadcast email updates to all active readers on their subscription list.

#### 4. The Factory Pattern
Exposes a generic interface/function to create objects without specifying the exact constructor classes directly, leaving object creation logic hidden.
- **Metaphor:** A car factory assembly line. You press a button: `"Create Sedan"` or `"Create SUV"`. The factory handles all the engine-mounting and welding behind the scenes, rolling the finished vehicle out to you.

---

### (3) JavaScript Code Examples

#### Module and Singleton Implementations
```javascript
// ==========================================
// 1. The Module Pattern (IIFE + Closure)
// ==========================================
const counterModule = (function() {
  let privateCounter = 0; // Hidden private variable
  
  return {
    increment() { privateCounter++; },
    getValue() { return privateCounter; }
  };
})();

counterModule.increment();
console.log(counterModule.getValue()); // 1
// console.log(counterModule.privateCounter); // undefined (Hidden!)


// ==========================================
// 2. The Singleton Pattern (Class approach)
// ==========================================
class DatabaseConnection {
  constructor() {
    // If the static instance already exists, return it!
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    
    this.connectionId = Math.random();
    DatabaseConnection.instance = this; // Cache instance
  }
  
  connect() { console.log(`Connected with ID: ${this.connectionId}`); }
}

const conn1 = new DatabaseConnection();
const conn2 = new DatabaseConnection();

console.log(conn1 === conn2); // true (Both point to the same exact instance!)
conn1.connect(); // "Connected with ID: 0.1234..."
conn2.connect(); // "Connected with ID: 0.1234..." (Same ID!)
```

#### The Observer Pattern (Publisher/Subscriber)
```javascript
// ==========================================
// 3. The Observer Pattern
// ==========================================
class Subject {
  constructor() {
    this.observers = []; // List of subscriber callbacks
  }

  subscribe(fn) {
    this.observers.push(fn);
  }

  unsubscribe(fn) {
    this.observers = this.observers.filter(sub => sub !== fn);
  }

  notify(data) {
    // Execute all subscriber callbacks with the updated data
    this.observers.forEach(fn => fn(data));
  }
}

const clickSubject = new Subject();

// Register observers
const updateSidebar = (data) => console.log("Sidebar updated with:", data);
const updateHeader = (data) => console.log("Header updated with:", data);

clickSubject.subscribe(updateSidebar);
clickSubject.subscribe(updateHeader);

// Trigger notification
clickSubject.notify({ buttonClicked: "submit" });
// Logs:
// "Sidebar updated with: { buttonClicked: 'submit' }"
// "Header updated with: { buttonClicked: 'submit' }"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Misunderstanding Design Patterns Scope and Variable Hoisting

**The mistake:** Assuming variables or functions declared within Design Patterns blocks behave identically regardless of `var`, `let`, or `const` keyword usage.

**Why it's wrong:** `var` declarations are function-scoped and hoisted with an initial value of `undefined`. `let` and `const` are block-scoped and enter a Temporal Dead Zone (TDZ) before declaration, throwing a `ReferenceError` if accessed prematurely.

*Incorrect:*
```javascript
console.log(value); // ❌ Throws ReferenceError due to Temporal Dead Zone!
let value = "design_patterns";
```

*Fix:*
```javascript
let value = "design_patterns";
console.log(value); // Correct: Variable initialized prior to reading
```

### Mistake 2: Losing Context Binding (`this`) in Design Patterns Callbacks

**The mistake:** Passing methods from Design Patterns instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "design_patterns",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "design_patterns",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Design Patterns Operations

**The mistake:** Executing asynchronous operations within Design Patterns without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/design_patterns"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/design_patterns");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in design_patterns: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Build a Factory

**Problem:** Complete the `toyFactory` function to return a new object depending on the `type` parameter.

```javascript
function toyFactory(type, name) {
  // If type is "car", return { name, roll() { return "Vroom!"; } }
  // If type is "doll", return { name, speak() { return "Hello!"; } }
}

const toy1 = toyFactory("car", "Speedy");
const toy2 = toyFactory("doll", "Barbie");

console.log(toy1.roll()); // "Vroom!"
console.log(toy2.speak()); // "Hello!"
```

> [!check]- Answer
> - Use an `if/else` or `switch` check on `type` to return the appropriate object literal structure.

---

### Exercise 2: Singleton Pattern with Static Instance

**Problem:** Implement a Singleton `DatabaseConnection` class returning a single shared instance.

**Expected output:**
> [!check]- Answer
> ```text
> true
> ```
> ```javascript
> class DatabaseConnection {
>   static instance;
>   constructor() {
>     if (DatabaseConnection.instance) return DatabaseConnection.instance;
>     DatabaseConnection.instance = this;
>   }
> }
> console.log(new DatabaseConnection() === new DatabaseConnection());
> ```
>
> **Explanation:** Singletons guarantee that only one instance of a class exists across applications.

---

### Exercise 3: Observer Pub/Sub Pattern

**Problem:** Create a `EventEmitter` supporting `.on(event, cb)` and `.emit(event, data)`.

**Expected output:**
> [!check]- Answer
> ```text
> Event data: 42
> ```
> ```javascript
> class EventEmitter {
>   events = {};
>   on(evt, cb) { (this.events[evt] ||= []).push(cb); }
>   emit(evt, data) { this.events[evt]?.forEach(cb => cb(data)); }
> }
> const ee = new EventEmitter();
> ee.on("test", d => console.log(`Event data: ${d}`));
> ee.emit("test", 42);
> ```
>
> **Explanation:** Observer/PubSub patterns decouple event producers from event consumers.


---

## 7. Related Terms
- [Class](../level_07/class.md) — The object-oriented blueprint wrapper.

---

## 8. Key Takeaways
- Design Patterns are reusable solutions to recurring software architecture challenges.
- The Module Pattern uses closures to seal private state, exposing a public API object.
- The Singleton Pattern locks a class to exactly one instance throughout execution.
- The Observer Pattern (Pub/Sub) establishes 1-to-many subscription broadcasts for event triggers.
- The Factory Pattern delegates object instantiation, keeping creation logic hidden.
