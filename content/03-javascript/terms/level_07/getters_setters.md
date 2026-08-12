# Getters & Setters

> **Level 7 — Objects & Prototypes**
> Accessor properties (`get`/`set`) that run on access.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Property Access (dot vs bracket notation)](../level_02/property_access.md) — Reading and writing object properties.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Getters & Setters is a fundamental concept in this technology stack. **Level 7 — Objects & Prototypes**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Normally, object properties are passive containers of data (known as "data properties"). If you write `user.age = 25`, the engine simply stores `25` inside that property field. It cannot validate that the age is a number or check if it's negative. 

To run computations, formatting, or validation checks on property read/write actions, we could write separate methods—such as `user.getFormattedName()` or `user.setAge(val)`. However, this makes our object APIs verbose.

To solve this, JavaScript supports **Getters & Setters (Accessor Properties)**:
- **Getter (`get prop()`)**: A function that runs automatically when a property is **read** (e.g. accessing `user.fullName`).
- **Setter (`set prop(val)`)**: A function that runs automatically when a property is **written** (e.g. assigning `user.age = 30`).

Accessor properties act as methods wrapped in property syntax: to the outside user, they look like standard, passive fields, but behind the scenes they run active execution code.

### (2) Critical Trap: Infinite Recursion
A common mistake when writing setters is attempting to write directly to the property name: `set age(val) { this.age = val; }`. Because `this.age = val` is a write action on `age`, it immediately triggers the setter function again, resulting in an infinite recursion loop that crashes the stack (`RangeError: Maximum call stack size exceeded`). 

To prevent this, setters must store values inside a separate **backing property**—by convention, named with a leading underscore (e.g., `_age`).

### (3) Reality Metaphor
- A **standard property** is like an open cardboard box on a table. If you want to drop a stone inside, you drop it. If you want to check if it's there, you look.
- A **getter/setter property** is like a smart vending machine slot. When you slide a coin inside (**Setter**), the machine tests the coin's dimensions and weight to validate it, rejecting fake coins. When you press the coin return button (**Getter**), the machine counts the coins and drops the change into your hand.

### (4) JavaScript Code Examples

#### Dynamic Getters and Validated Setters
```javascript
const userProfile = {
  firstName: "Brendan",
  lastName: "Eich",
  _age: 30, // Backing property storing the actual value

  // 1. Getter: Dynamically calculates full name on the fly
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },

  // 2. Getter: Returns the value of the backing property
  get age() {
    return this._age;
  },

  // 3. Setter: Validates age before updating backing property
  set age(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new TypeError("Age must be a number.");
    }
    if (value < 0 || value > 120) {
      throw new RangeError("Age must be between 0 and 120.");
    }
    console.log(`Setting age from ${this._age} to ${value}...`);
    this._age = value; // Update backing property safely
  }
};

// Reading getter: looks like a property, not a function call!
console.log(userProfile.fullName); // "Brendan Eich"

// Writing setter: runs validation checks automatically
userProfile.age = 45; // "Setting age from 30 to 45..."
console.log(userProfile.age);  // 45

try {
  userProfile.age = -5; // Throws RangeError!
} catch (error) {
  console.warn("Write rejected:", error.message);
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Triggering Infinite Recursion Stack Overflows

**The mistake:** Reading or writing to the accessor property name *inside* its own getter or setter function.

*Incorrect:*
```javascript
const person = {
  set name(val) {
    // Triggers this setter again recursively! Infinite Loop!
    this.name = val; 
  }
};

person.name = "Alice"; // RangeError: Maximum call stack size exceeded
```

*Fix:*
```javascript
const person = {
  set name(val) {
    // Save to a private backing property prefixed with '_'
    this._name = val; 
  },
  get name() {
    return this._name;
  }
};

person.name = "Alice"; // Safe
console.log(person.name); // "Alice"
```

---

### Mistake 2: Losing Context Binding (`this`) in Getters Setters Callbacks

**The mistake:** Passing methods from Getters Setters instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "getters_setters",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "getters_setters",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Getters Setters Operations

**The mistake:** Executing asynchronous operations within Getters Setters without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/getters_setters"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/getters_setters");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in getters_setters: ${err.message}`);
        return null;
    }
}
```

## 5. Practice Exercises

### Exercise 1: Encapsulated Temperature Unit Converter with Getters/Setters

**Scenario:** An IoT device library implements a Thermostat class using getter and setter methods to automatically convert between Celsius and Fahrenheit.

**Requirements:**
1. Define class Thermostat.
2. Internal private/underscore property _celsius.
3. Implement get celsius(), set celsius(val), and get fahrenheit().
4. Verify conversion.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> class Thermostat {
>   constructor(celsius = 0) {
>     this._celsius = celsius;
>   }
>
>   get celsius() {
>     return this._celsius;
>   }
>
>   set celsius(val) {
>     if (typeof val === "number") {
>       this._celsius = val;
>     }
>   }
>
>   get fahrenheit() {
>     return (this._celsius * 9 / 5) + 32;
>   }
> }
>
> // Verification tests
> const t = new Thermostat(25);
> console.assert(t.celsius === 25, "Test 1 Failed");
> console.assert(t.fahrenheit === 77, "Test 2 Failed: (25*9/5)+32 = 77");
> t.celsius = 0;
> console.assert(t.fahrenheit === 32, "Test 3 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Getters & Setters Syntax**: get prop() and set prop(val) define accessor methods that behave syntactically like object properties.
> 2. **Encapsulation & Validation**: Setters allow validating inputs before mutating internal state.
> 3. **Computed Virtual Properties**: Getters enable computing dynamic values on the fly without storing redundant state.
> 
---

### Exercise 2: Getters Setters Advanced Context Handler

**Scenario:** A web application component processes getters setters data operations within enterprise workflows.

**Requirements:**
1. Write handleGettersSettersSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleGettersSettersSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleGettersSettersSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Getters Setters Architecture**: Applying getters setters patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Getters Setters Performance Optimization

**Scenario:** An application utility optimizes getters setters execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeGettersSettersTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeGettersSettersTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeGettersSettersTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Getters Setters Optimization**: Optimizing getters setters improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [Class](class.md) — Constructor syntax that heavily employs getter/setter accessors.
- [Computed Property Names](computed_property_names.md) — Dynamic object keys.
- [Private Class Fields (#)](private_class_fields.md) — Related concept: Private Class Fields (#).

---

## 7. Key Takeaways
- Getters and setters (accessor properties) execute function code disguised as property access.
- Use a getter (`get key()`) to dynamically format or calculate values on read operations.
- Use a setter (`set key(val)`) to validate, log, or restrict values on write operations.
- **Never** read or write to the accessor property itself inside its getter/setter body; use a backing property (typically prefixed with `_`) to avoid stack overflow recursion crashes.
