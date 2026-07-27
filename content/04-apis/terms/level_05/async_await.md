# async / await

> **Level 5 — Fetching Data (Client-Side)**
> Syntactic sugar that allows developers to write asynchronous Promise-based code so it *looks* and reads like normal, synchronous code.

---

## 1. Prerequisites
- [Promises](../level_05/promises.md) — `async/await` is just a prettier way of writing `.then()`.
- [The `fetch()` API](../level_05/fetch.md) — The primary reason we need `async/await`.

---

## 2. Term Category
- **JavaScript Core Concept / Syntax**

---

## 3. Environment Context
- **Universal JavaScript** (ES2017+ standard).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
While Promises and `.then()` solved the problem of freezing the browser, they introduced a new problem: **Callback Hell**. 
If you need to fetch a user, and *then* fetch that user's posts, and *then* fetch the comments on those posts, you end up with deeply nested, hard-to-read `.then()` chains.
In 2017, JavaScript introduced `async` and `await`. It does exactly the same thing as `.then()` under the hood, but it allows you to write your code in a straight, flat, top-to-bottom line. It revolutionized how JavaScript developers write network requests.

### (2) Reality Metaphor
**`.then()` (The old way):** You order a pizza delivery. You write down instructions on a sticky note: "When the pizza arrives, put it on the table." You stick the note to the door and go watch TV. (You are scheduling future actions).
**`await` (The new way):** You order a pizza delivery. You pull up a chair, sit next to the front door, and literally wait. You do nothing else until the pizza arrives, and then you put it on the table yourself. (You are explicitly pausing the execution of your current function).

### (3) The Two Rules
1. You can only use the keyword `await` inside a function that has been labeled with the keyword `async`.
2. `await` forces JavaScript to **pause the execution of that specific function** until the Promise resolves. (It does *not* freeze the whole browser, just the function it's inside).

### (4) Code Examples

#### The Old Way (`.then()`)
```javascript
function getUserData() {
  fetch('https://api.example.com/user')
    .then(response => response.json())
    .then(data => {
      console.log(data);
    });
}
```

#### The New Way (`async/await`)
```javascript
// 1. Label the function as async
async function getUserData() {
  // 2. Tell JS to literally pause and wait for the network!
  const response = await fetch('https://api.example.com/user');
  
  // 3. Wait for the JSON to parse
  const data = await response.json();
  
  console.log(data);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the `async` keyword

**The mistake:** A developer writes:
```javascript
function loadData() {
  const res = await fetch('/api'); // ERROR!
}
```

**Why it's wrong:** JavaScript engine strictly forbids the use of `await` inside normal functions. If it allowed it, it might accidentally pause critical background processes. You must explicitly label the function as `async` to tell the engine "I intend for this function to be paused."
**Solution:** Change it to `async function loadData()`.

---

### Mistake 2: Awaiting Sequential Independent API Calls inside Loops (Waterfall Latency Penalty)

**The mistake:** Writing `for (const id of ids) { await fetch(`/api/${id}`); }` for independent requests.

**Why it's wrong:** Awaiting inside a loop forces each request to wait for the previous request to finish, creating sequential network waterfall delays. Use `Promise.all()` to execute in parallel.

*Incorrect:*
```javascript
const results = [];
for (const id of ids) {
  const res = await fetch(`/api/items/${id}`); // ❌ Sequential network waterfall!
  results.push(await res.json());
}
```

*Fix:*
```javascript
const promises = ids.map(id => fetch(`/api/items/${id}`).then(r => r.json()));
const results = await Promise.all(promises); // Parallel execution
```

---

### Mistake 3: Forgetting `try / catch` Blocks Around `async / await` API Requests

**The mistake:** Calling `await fetch()` without wrapping in `try / catch` handling.

**Why it's wrong:** Uncaught rejected promises in async functions cause UnhandledPromiseRejection warnings or crash Node.js process runtimes.

*Incorrect:*
```javascript
async function getData() {
  const res = await fetch('/api/data'); // ❌ Unhandled promise rejection on network failure!
  return res.json();
}
```

*Fix:*
```javascript
async function getData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}
```


---

## 6. Practice Exercises

### Exercise 1: Translate to Modern Syntax

**Problem:** Convert this `.then()` chain into `async/await`.
```javascript
const loadProduct = () => {
  fetch('/api/products/1')
    .then(res => res.json())
    .then(product => console.log(product.name));
};
```

**Expected output:**
```javascript
const loadProduct = async () => {
  const res = await fetch('/api/products/1');
  const product = await res.json();
  console.log(product.name);
};
```

> [!check]- Answer
> - Arrow functions can be `async` too! Just put the keyword before the `()`.
> - Every `.then()` becomes a new line with `await`.

---

### Exercise 2: Converting Promises to Async/Await

**Problem:** Convert this `.then()` chain into `async / await` syntax:
```javascript
fetch('/api/user')
  .then(res => res.json())
  .then(user => console.log(user.name))
  .catch(err => console.error(err));
```

**Expected output:**
```text
try { const res = await fetch('/api/user'); const user = await res.json(); console.log(user.name); } catch (err) { console.error(err); }
```

> [!check]- Answer
> ```javascript
> try {
> const res = await fetch('/api/user');
> const user = await res.json();
> console.log(user.name);
> } catch (err) {
> console.error(err);
> }
> ```
> - **Explanation:** `async/await` turns asynchronous promise chains into synchronous-looking code.
---

### Exercise 3: Async Function Return Value Type

**Problem:** What does an `async` function ALWAYS return, regardless of what value is inside the return statement?

**Expected output:**
```text
A Promise (resolving to the returned value).
```

> [!check]- Answer
> ```text
> A Promise (resolving to the returned value).
> ```
> - **Explanation:** `async` functions automatically wrap return values in resolved Promises.
---

## 7. Related Terms
- [Error Handling (`try/catch`)](../level_05/error_handling.md) — Because we no longer use `.catch()`, we need a new way to handle errors with `async/await`.

---

## 8. Key Takeaways
- **`async/await`** is the modern, readable way to handle Promises.
- It allows you to write asynchronous network code in a flat, top-to-bottom style.
- **`await`** literally pauses the execution of the function until the network request finishes.
- You can only use `await` inside an **`async`** function.
