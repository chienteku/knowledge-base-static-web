# Getters & Setters

> **Level 7 — Objects & Prototypes**
> Accessor properties (`get`/`set`) that run on access.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Property Access (dot vs bracket notation)](../level_02/property_access.md) — Reading and writing object properties.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Temperature Converter

**Problem:** Complete the getter and setter in `thermometer` so that reading `tempFahrenheit` converts the backing Celsius value to Fahrenheit, and setting `tempFahrenheit` converts and writes the backing Celsius value.

*(Formula: Fahrenheit = Celsius * 1.8 + 32, Celsius = (Fahrenheit - 32) / 1.8)*

```javascript
const thermometer = {
  _celsius: 25,

  get tempFahrenheit() {
    // Write getter
  },

  set tempFahrenheit(f) {
    // Write setter to update backing celsius value
  }
};

console.log("Fahrenheit:", thermometer.tempFahrenheit); // should be 77
thermometer.tempFahrenheit = 32;
console.log("Celsius:", thermometer._celsius); // should be 0
```

> [!check]- Answer
> - Inside the getter, return `this._celsius * 1.8 + 32`.
> - Inside the setter, write `this._celsius = (f - 32) / 1.8`.

---

### Exercise 2: Backing Property Accessor Pattern

**Problem:** Define getter `get fullName()` returning `this.first + " " + this.last`.

**Expected output:**
> [!check]- Answer
> ```text
> Alice Smith
> ```
> ```javascript
> const user = {
>   first: "Alice",
>   last: "Smith",
>   get fullName() { return `${this.first} ${this.last}`; }
> };
> console.log(user.fullName);
> ```
>
> **Explanation:** Getters execute function logic seamlessly upon standard property reads (`user.fullName`).

---

### Exercise 3: Validating Input with Setters

**Problem:** Use setter `set age(val)` throwing Error if `val < 0`.

**Expected output:**
> [!check]- Answer
> ```text
> Age updated: 25
> ```
> ```javascript
> const person = {
>   _age: 0,
>   set age(val) {
>     if (val < 0) throw new Error("Invalid age");
>     this._age = val;
>   },
>   get age() { return this._age; }
> };
> person.age = 25;
> console.log(`Age updated: ${person.age}`);
> ```
>
> **Explanation:** Setters intercept property writes to validate data before updating backing state.


---

## 7. Related Terms
- [Class](class.md) — Constructor syntax that heavily employs getter/setter accessors.
- [Computed Property Names](computed_property_names.md) — Dynamic object keys.
- [Private Class Fields (#)](private_class_fields.md) — Related concept: Private Class Fields (#).

---

## 8. Key Takeaways
- Getters and setters (accessor properties) execute function code disguised as property access.
- Use a getter (`get key()`) to dynamically format or calculate values on read operations.
- Use a setter (`set key(val)`) to validate, log, or restrict values on write operations.
- **Never** read or write to the accessor property itself inside its getter/setter body; use a backing property (typically prefixed with `_`) to avoid stack overflow recursion crashes.
