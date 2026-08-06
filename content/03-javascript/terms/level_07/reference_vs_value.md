# Reference vs Value (copy semantics)

> **Level 7 — Objects & Prototypes**
> Primitives copy by value; objects/arrays by reference.

---

## 1. Prerequisites
- [Primitive Types](../level_01/primitive_types.md) — The basic, immutable data types in JavaScript.
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
To write bug-free code, developers must understand how JavaScript stores and copies data in system memory. The language uses two separate copy behaviors depending on the type of data being handled:

1. **Copy by Value (Primitives):** Primitive data types (String, Number, Boolean, null, undefined, Symbol, BigInt) are stored directly inside the stack memory slot of the variable. When you copy a primitive variable, JavaScript creates a completely independent **duplicate copy** of the value. Modifying the new copy has zero effect on the original variable.
2. **Copy by Reference (Objects & Arrays):** Reference types (Objects, Arrays, Functions) are larger and have dynamic sizes, so they are stored in heap memory. The variable on the stack does not contain the actual object data; it holds a **memory reference** (a pointer address) pointing to the object's location in the heap. When you assign one object variable to another, JavaScript only copies the **pointer address**, not the physical data. Both variables now point to the exact same object in memory.

### (2) Object Comparison Behavior
Because objects are handled by reference, the strict equality operator (`===`) compares their **memory addresses**, not their internal properties. Two separate object literals look identical: `const a = {}; const b = {};`, but `a === b` evaluates to `false` because they reside at different locations in heap memory.

### (3) Reality Metaphors
- **Copy by Value** is like duplicating a physical file using a copy machine. You hand the paper copy to a friend. If your friend takes a red pen and scribbles on their sheet, your original paper remains clean and untouched.
- **Copy by Reference** is like emailing a Google Docs sharing link to a colleague. You are not creating a new document; you are copying the access pointer (address). If your colleague opens the link and deletes a paragraph, when you look at the document, the paragraph is gone for you too.

### (4) JavaScript Code Examples

#### Short Snippet
```javascript
// 1. Primitive copy (by value)
let scoreA = 100;
let scoreB = scoreA; // A new number copy is created
scoreB = 200;
console.log(scoreA); // 100 (Unchanged!)

// 2. Object copy (by reference)
const playerA = { name: "Brendan", score: 100 };
const playerB = playerA; // Copies the pointer address, not the object!
playerB.score = 200;
console.log(playerA.score); // 200 (Mutated!)
```

#### Fuller Example
```javascript
// Side effects of passing objects to functions
function registerCourseCompletion(student) {
  // student parameter receives the memory pointer to the studentProfile object
  student.completed = true; // Mutates the original object outside!
}

const studentProfile = { name: "Alice", completed: false };
console.log("Before:", studentProfile.completed); // false

registerCourseCompletion(studentProfile);
console.log("After:", studentProfile.completed);  // true (Mutated by reference!)

// Demonstrating reference equality comparison
const carInfoA = { brand: "Tesla" };
const carInfoB = { brand: "Tesla" };
const carInfoC = carInfoA; // Reference assignment

console.log(carInfoA === carInfoB); // false (Different addresses in heap memory!)
console.log(carInfoA === carInfoC); // true (Same exact address!)
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Unintended Side-effects from Function Arguments

**The mistake:** Passing a global object or array into a helper function, modifying its properties inside the function, and inadvertently breaking state elsewhere in the app.

**Why it's wrong:** Objects are passed by reference. Changes made inside the function permanently modify the original object in the parent scope.

*Incorrect:*
```javascript
const user = { name: "Bob", roles: ["user"] };

function addAdminRole(profile) {
  profile.roles.push("admin"); // Mutates the original user object!
  return profile;
}

addAdminRole(user);
console.log(user.roles); // [ 'user', 'admin' ] (User is now an admin globally!)
```

*Fix:*
```javascript
const user = { name: "Bob", roles: ["user"] };

function addAdminRole(profile) {
  // Create a copy first (e.g. using spread syntax)
  const copiedProfile = { ...profile, roles: [...profile.roles] };
  copiedProfile.roles.push("admin");
  return copiedProfile;
}

const updatedUser = addAdminRole(user);
console.log(user.roles);        // [ 'user' ] (Original remains untouched!)
console.log(updatedUser.roles); // [ 'user', 'admin' ]
```

---

### Mistake 2: Losing Context Binding (`this`) in Reference Vs Value Callbacks

**The mistake:** Passing methods from Reference Vs Value instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "reference_vs_value",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "reference_vs_value",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Reference Vs Value Operations

**The mistake:** Executing asynchronous operations within Reference Vs Value without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/reference_vs_value"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/reference_vs_value");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in reference_vs_value: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Reference Mutation Check

**Problem:** Predict the outputs of the log statements.

```javascript
let arr1 = [1, 2, 3];
let arr2 = arr1;
arr2.push(4);

let num1 = 10;
let num2 = num1;
num2 = num2 + 5;

console.log("arr1 length:", arr1.length);
console.log("num1 value:", num1);
```

**Expected output:**
> [!check]- Answer
> ```text
> arr1 length: 4
> num1 value: 10
> ```
> - Arrays copy by reference; pushing to `arr2` updates the shared array.
> - Numbers copy by value; changing `num2` leaves `num1` untouched.
> 
---

### Exercise 2: Primitive Copy by Value Trace

**Problem:** Trace primitive values `let x = 10; let y = x; y = 20;`.

**Expected output:**
> [!check]- Answer
> ```text
> x: 10, y: 20
> ```
> ```javascript
> let x = 10;
> let y = x;
> y = 20;
> console.log(`x: ${x}, y: ${y}`);
> ```
>
> **Explanation:** Primitives are assigned by value, creating independent value copies.
> 
---

### Exercise 3: Object Mutation via Reference

**Problem:** Mutate object property via secondary reference `obj2.val = 99`.

**Expected output:**
> [!check]- Answer
> ```text
> obj1 val: 99
> ```
> ```javascript
> const obj1 = { val: 1 };
> const obj2 = obj1;
> obj2.val = 99;
> console.log(`obj1 val: ${obj1.val}`);
> ```
>
> **Explanation:** Object assignments copy reference pointers, allowing mutations to reflect across all references.
> 
> 
---

## 7. Related Terms
- [Shallow Copy vs Deep Copy](shallow_vs_deep_copy.md) — Solutions to duplicate objects safely.
- [Closure](../level_03/closure.md) — Preserving variable access scopes.
- [Primitive Types](../level_01/primitive_types.md) — Related concept: Primitive Types.

---

## 8. Key Takeaways
- Primitive types are stored and copied by value; copies are independent duplicates.
- Reference types (objects, arrays) are stored in heap memory; variables only store pointer addresses.
- Assigning an object variable copies the pointer address, causing both variables to refer to the same object.
- Functions that modify object parameters generate side-effects by modifying the outer original object.
- Strict comparison `===` on objects compares their memory addresses, not their key-value contents.
