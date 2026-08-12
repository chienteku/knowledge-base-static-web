# Iterators & Iterables (protocol)

> **Level 8 — Modern JavaScript (ES6+)**
> The `[Symbol.iterator]()` / `next()` contract.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — The base key-value data structure.
- [Symbol](symbol.md) — Unique primitive identifiers used to hook into language internals.

---

## 2. Term Category

**Language Core (Universal: Works everywhere)**: Iterators & Iterables (protocol) is a fundamental concept in this technology stack. **Level 8 — Modern JavaScript (ES6+)**

---

## 3. Explanation

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

## 4. Common Mistakes & Pitfalls

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

## 5. Practice Exercises

### Exercise 1: Custom Range Iterable Object via Symbol.iterator

**Scenario:** A math sequence utility creates a Range iterable object implementing the iterator protocol via [Symbol.iterator]().

**Requirements:**
1. Write createRangeIterable(start, end).
2. Implement [Symbol.iterator]() returning object with next() method.
3. Test iteration via for...of loop.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function createRangeIterable(start, end) {
>   return {
>     [Symbol.iterator]() {
>       let current = start;
>       return {
>         next() {
>           if (current <= end) {
>             return { value: current++, done: false };
>           }
>           return { value: undefined, done: true };
>         }
>       };
>     }
>   };
> }
>
> // Verification tests
> const range = createRangeIterable(1, 3);
> const collected = [];
> for (const num of range) {
>   collected.push(num);
> }
> console.assert(collected.join(",") === "1,2,3", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Iterable Protocol**: An object is iterable if it implements [Symbol.iterator](), returning an iterator object.
> 2. **Iterator Protocol**: An iterator object implements next() returning { value, done } result objects.
> 3. **for...of & Spread Integration**: Custom iterables seamlessly support for...of loops, spread syntax ([...iterable]), and Array.from().
> 
---

### Exercise 2: Iterators Iterables Advanced Context Handler

**Scenario:** A web application component processes iterators iterables data operations within enterprise workflows.

**Requirements:**
1. Write handleIteratorsIterablesSecondary(target, options).
2. Validate target input.
3. Apply domain updates.
4. Return boolean status.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function handleIteratorsIterablesSecondary(target, options) {
>   if (!target) return false;
>   const opts = options || {};
>   target.status = opts.status || "VERIFIED";
>   return true;
> }
>
> // Verification tests
> const mockTarget = {};
> console.assert(handleIteratorsIterablesSecondary(mockTarget, { status: "VERIFIED" }) === true, "Test 1 Failed");
> console.assert(mockTarget.status === "VERIFIED", "Test 2 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Iterators Iterables Architecture**: Applying iterators iterables patterns structures complex application components.
> 2. **Defensive Parameter Guarding**: Guards functions against null/undefined dereference errors.
> 3. **Standard Conformance**: Conforms to standard ECMAScript / DOM specifications.
> 
---

### Exercise 3: Iterators Iterables Performance Optimization

**Scenario:** An application utility optimizes iterators iterables execution to prevent performance bottlenecks.

**Requirements:**
1. Write optimizeIteratorsIterablesTertiary(collection).
2. Validate collection input.
3. Filter invalid items.
4. Return clean collection.

> [!check]- Answer
>
> #### Implementation
>
> ```javascript
> function optimizeIteratorsIterablesTertiary(collection) {
>   if (!Array.isArray(collection)) return [];
>   return collection.filter(item => item !== null && item !== undefined);
> }
>
> // Verification tests
> const list = [10, null, 20, undefined, 30];
> const clean = optimizeIteratorsIterablesTertiary(list);
> console.assert(clean.join(",") === "10,20,30", "Test 1 Failed");
> ```
>
> #### Technical Explanation
>
> 1. **Iterators Iterables Optimization**: Optimizing iterators iterables improves application throughput.
> 2. **Garbage Collection Memory Cleanup**: Reclaims unneeded memory allocations efficiently.
> 3. **Cross-Browser Reliability**: Delivers consistent behavior across modern browser engines.
> 
---

## 6. Related Terms
- [for...of](../level_04/for_of.md) — The loop statement that automatically consumes iterables.
- [Generator (function*)](../level_09/generator.md) — Syntax sugar simplifying custom iterator creation.
- [Symbol](symbol.md) — Related concept: Symbol.

---

## 7. Key Takeaways
- The Iteration Protocols consist of the Iterable protocol (`Symbol.iterator`) and the Iterator protocol (`next()`).
- An iterable is an object with a `[Symbol.iterator]` method returning an iterator.
- An iterator is an object with a `next()` method returning `{ value, done }`.
- Conforming to these protocols makes custom objects fully compatible with `for...of` loops, spread syntax `...`, and array destructuring.
- Arrays, Strings, Sets, and Maps are built-in iterables by default.
