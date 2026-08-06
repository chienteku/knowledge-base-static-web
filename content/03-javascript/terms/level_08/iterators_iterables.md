# Iterators & Iterables (protocol)

> **Level 8 — Modern JavaScript (ES6+)**
> The `[Symbol.iterator]()` / `next()` contract.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Symbol](symbol.md) — Unique primitive identifiers used to hook into language internals.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
How do built-in JavaScript features—such as `for...of` loops, spread syntax (`...`), and destructuring—know how to step through data collections (like Arrays, Strings, Sets, or Maps) one-by-one? 

To standardise iteration, ES6 introduced the **Iteration Protocols**. This contract allows any custom JavaScript object to become loopable by conforming to two protocols:

#### 1. The Iterable Protocol
An object is **iterable** if it defines a method key-named **`Symbol.iterator`**.
- This method takes no arguments and must return an **Iterator** object.
- Syntax: `[Symbol.iterator]() { ... }`

#### 2. The Iterator Protocol
An object is an **iterator** if it implements a method named **`next()`**.
- The `next()` method must return a status object containing:
  - **`value`**: The current value in the iteration sequence.
  - **`done`**: A boolean (`true` if the sequence is finished, `false` if more values remain).
- When the sequence ends, `next()` should return `{ value: undefined, done: true }`.

By hooking into `Symbol.iterator`, you can teach custom objects (like a range builder or database cursor) to stream data sequentially.

### (2) Reality Metaphor
Imagine a physical book.
- The **Iterable** is the book itself. The book is a static container. It has a ribbon bookmark (**`Symbol.iterator`** method). If you grab this ribbon, it assigns a dedicated reading guide (**the Iterator**).
- The **Iterator** is the reading guide. Each time you say, `"Next"` (calling the `.next()` method), the guide reads the next page text (**`value`**) and tells you if you have reached the back cover (**`done: false`**). When they read the last page and you say `"Next"` again, they close the book and say, `"Done: true."`

### (3) JavaScript Code Examples

#### Creating a Custom Range Iterable
```javascript
// A factory function creating a custom range object (e.g. 1 to 3)
function createRange(start, end) {
  return {
    start,
    end,
    
    // 1. The Iterable Protocol: define the Symbol.iterator method
    [Symbol.iterator]() {
      let current = this.start;
      const limit = this.end;
      
      // 2. The Iterator Protocol: return an object containing a next() method
      return {
        next() {
          if (current <= limit) {
            return { value: current++, done: false }; // Emit value and advance
          } else {
            return { value: undefined, done: true };  // Complete iteration
          }
        }
      };
    }
  };
}

const range = createRange(1, 3);

// 3. Custom objects can now be looped over using for...of!
for (const num of range) {
  console.log(num); 
}
// Logs:
// 1
// 2
// 3

// 4. Custom objects can also use spread syntax (...)
const rangeArray = [...range];
console.log(rangeArray); // [ 1, 2, 3 ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Returning the wrong structure from `Symbol.iterator`

**The mistake:** Defining `Symbol.iterator` but returning an object that lacks a `next` method, or returning a non-object value.

**Why it's wrong:** The JavaScript engine expects a compliant iterator. If the `next` method is missing, attempting to loop over the object throws a `TypeError`.

*Incorrect:*
```javascript
const badIterable = {
  [Symbol.iterator]() {
    return 100; // Returns number, not an iterator!
  }
};

for (const x of badIterable) {} // TypeError: badIterable is not iterable
```

*Fix:*
```javascript
const goodIterable = {
  [Symbol.iterator]() {
    return {
      next() {
        return { value: "done", done: true };
      }
    };
  }
};
```

---

### Mistake 2: Losing Context Binding (`this`) in Iterators Iterables Callbacks

**The mistake:** Passing methods from Iterators Iterables instances as standalone callbacks to timers or event listeners without explicitly binding `this`.

**Why it's wrong:** Extracting object methods disassociates them from their target parent instance, causing `this` to resolve to `undefined` (in strict mode) or `window`/`globalThis` at runtime.

*Incorrect:*
```javascript
const obj = {
    name: "iterators_iterables",
    log() { console.log(this.name); }
};
setTimeout(obj.log, 100); // ❌ Output: undefined (loses object context)
```

*Fix:*
```javascript
const obj = {
    name: "iterators_iterables",
    log() { console.log(this.name); }
};
setTimeout(() => obj.log(), 100); // Correct: Arrow function captures lexical context
```

### Mistake 3: Unhandled Asynchronous Failures in Iterators Iterables Operations

**The mistake:** Executing asynchronous operations within Iterators Iterables without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/iterators_iterables"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/iterators_iterables");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in iterators_iterables: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Custom Even Numbers Iterator

**Problem:** Complete the code to make `evenNumbers` iterable, yielding even numbers starting from `2` up to `max`.

```javascript
function makeEvenIterable(max) {
  return {
    max,
    [Symbol.iterator]() {
      let current = 2;
      const limit = this.max;
      return {
        next() {
          // Write iterator check here
        }
      };
    }
  };
}

const evens = makeEvenIterable(6);
console.log([...evens]); 
```

**Expected output:**
> [!check]- Answer
> ```text
> [ 2, 4, 6 ]
> ```
> - Inside the `next()` method, check if `current <= limit`. If true, return `{ value: current, done: false }` and increment `current` by `2`. Else, return `{ done: true }`.
> 
---

### Exercise 2: Implementing Custom Iterable with `Symbol.iterator`

**Problem:** Implement `Symbol.iterator` on an object yielding numbers `1` to `3`.

**Expected output:**
> [!check]- Answer
> ```text
> 1
> 2
> 3
> ```
> ```javascript
> const range = {
>   [Symbol.iterator]() {
>     let curr = 1;
>     return {
>       next() {
>         return curr <= 3 ? { value: curr++, done: false } : { done: true };
>       }
>     };
>   }
> };
> for (const val of range) console.log(val);
> ```
>
> **Explanation:** Objects implementing `[Symbol.iterator]()` protocol can be iterated via `for...of` loops.
> 
---

### Exercise 3: Generator Functions as Iterable Iterators

**Problem:** Write a generator function `function* numGen()` yielding `10` and `20`.

**Expected output:**
> [!check]- Answer
> ```text
> 10
> 20
> ```
> ```javascript
> function* numGen() {
>   yield 10;
>   yield 20;
> }
> for (const n of numGen()) console.log(n);
> ```
>
> **Explanation:** Generators return iterator objects complying with iterator/iterable protocols.
> 
> 
---

## 7. Related Terms
- [for...of](../level_04/for_of.md) — The loop statement that automatically consumes iterables.
- [Generator (function*)](../level_09/generator.md) — Syntax sugar simplifying custom iterator creation.
- [Symbol](symbol.md) — Related concept: Symbol.

---

## 8. Key Takeaways
- The Iteration Protocols consist of the Iterable protocol (`Symbol.iterator`) and the Iterator protocol (`next()`).
- An iterable is an object with a `[Symbol.iterator]` method returning an iterator.
- An iterator is an object with a `next()` method returning `{ value, done }`.
- Conforming to these protocols makes custom objects fully compatible with `for...of` loops, spread syntax `...`, and array destructuring.
- Arrays, Strings, Sets, and Maps are built-in iterables by default.
