# Promises (in the context of networks)

> **Level 5 — Fetching Data (Client-Side)**
> A JavaScript object that represents the eventual completion (or failure) of an asynchronous network operation.

---

## 1. Prerequisites
- [The fetch() API](fetch.md) — `fetch` is the most common function that generates a Promise.
- [Request & Response Lifecycle](../level_01/request_response.md) — Promises exist to handle the "waiting" phase of this lifecycle.

---

## 2. Term Category
- **JavaScript Core Concept / Asynchronous Programming**

---

## 3. Environment Context
- **Universal JavaScript** (Used heavily in both Browsers and Node.js).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
JavaScript is **single-threaded**. It can only do one thing at a time. 
If your code says `fetch('google.com')`, and the network takes 2 full seconds to reply, what should JavaScript do? If it freezes and does nothing for 2 seconds (Synchronous blocking), the entire website will lock up. The user won't be able to scroll or click buttons.
To prevent the UI from freezing, network requests are **Asynchronous**. JavaScript fires the request into the network, immediately grabs a "Promise" placeholder, and keeps running the rest of the code. When the network request finally finishes, the Promise "resolves," and JavaScript comes back to handle the data.

### (2) Reality Metaphor
You go to a busy burger restaurant. You pay the cashier. 
Instead of making you stand at the register for 10 minutes while they cook the burger (which would block the line for everyone else), the cashier hands you a **Buzzer** (a Promise). 
You go sit down and talk to your friends (JavaScript keeps executing other code). The Buzzer currently has a state of **Pending**.
Eventually, one of two things happens:
1. The Buzzer flashes green (**Resolved/Fulfilled**). You go to the counter and get your burger (the data).
2. The Buzzer flashes red (**Rejected**). The cashier tells you they ran out of meat (a network error).

### (3) The 3 States of a Promise
1. **Pending**: The network request is currently traveling across the internet.
2. **Fulfilled**: The server responded successfully.
3. **Rejected**: The network crashed (e.g., the user lost Wi-Fi).

### (4) Code Examples

#### Using `.then()` to handle the Buzzer
```javascript
console.log("1. Ordering burger...");

// fetch gives us the Buzzer (Promise) immediately
fetch('https://api.example.com/burger')
  .then((burger) => {
    // This code only runs when the Buzzer flashes green (Fulfilled)
    console.log("3. Eating the burger!");
  })
  .catch((error) => {
    // This code only runs if the Buzzer flashes red (Rejected)
    console.log("Error: Kitchen is on fire!");
  });

console.log("2. Sitting down to talk to friends.");

// Console output order: 1, 2, ... (wait 500ms) ... 3
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to return data from inside a `.then()`

**The mistake:** A developer tries to extract data out of the Promise to use it synchronously.
```javascript
let myData = null;

fetch('/api/data').then(data => {
  myData = data; // Assigning it later
});

console.log(myData); // Prints: null. Why?!
```

**Why it's wrong:** The `console.log(myData)` runs *immediately* (Step 2 in the burger metaphor), while the network is still pending! The data hasn't arrived yet. 
**Golden Rule:** You cannot "escape" a Promise. If a piece of code relies on network data, that code MUST be placed inside the `.then()` block, or you must use `await`.

---

### Mistake 2: Creating Deferred Anti-Pattern ("Explicit Promise Construction Anti-Pattern")

**The mistake:** Wrapping an already promise-returning function inside `new Promise((resolve, reject) => ...)`.

**Why it's wrong:** Wrapping existing promise-based functions (like `fetch()`) in `new Promise` adds unnecessary boilerplate and breaks exception propagation. Chain `.then()` or return `fetch()` directly.

*Incorrect:*
```javascript
// Redundant promise wrapper anti-pattern
function getData() {
  return new Promise((resolve, reject) => {
    fetch('/api/data').then(res => resolve(res.json())).catch(err => reject(err)); // ❌ Redundant!
  });
}
```

*Fix:*
```javascript
function getData() {
  return fetch('/api/data').then(res => res.json()); // Return fetch promise directly
}
```

---

### Mistake 3: Forgetting to Return Promises inside `.then()` Chains (Broken Chaining)

**The mistake:** Omitting the `return` keyword inside a `.then()` callback.

**Why it's wrong:** Omitting `return` causes subsequent `.then()` callbacks to receive `undefined` instead of waiting for the inner promise result.

*Incorrect:*
```javascript
fetch('/api/user')
  .then(res => {
    res.json(); // ❌ Missing return! Next .then gets undefined!
  })
  .then(data => console.log(data)); // Logs undefined!
```

*Fix:*
```javascript
fetch('/api/user')
  .then(res => res.json()) // Explicit implicit return
  .then(data => console.log(data));
```


---

## 6. Practice Exercises

### Exercise 1: Execution Order

**Problem:** What is the exact order of `console.log`s in this code?
```javascript
console.log("A");
fetch('/api').then(() => console.log("B"));
console.log("C");
```

**Expected output:**
> [!check]- Answer
> ```text
> A, C, B.
> JavaScript logs A. It fires the fetch and gets a pending Promise. It does NOT wait. It moves to the next line and logs C. Finally, milliseconds later, the network returns and it logs B.
> ```
> - JavaScript never waits for the network unless you explicitly tell it to with `await`!
> 
---

### Exercise 2: Promise 3-State Life Cycle Matrix

**Problem:** Identify the 3 mutually exclusive states of a JavaScript Promise.

**Expected output:**
> [!check]- Answer
> ```text
> 1. Pending (Initial state)
> 2. Fulfilled (Operation succeeded - resolved)
> 3. Rejected (Operation failed)
> ```
> ```text
> 1. Pending -> Initial state (neither fulfilled nor rejected)
> 2. Fulfilled -> Completed successfully with value
> 3. Rejected -> Failed with error reason
> ```
> - **Explanation:** Promises transition from Pending to either Fulfilled or Rejected permanently.
---

### Exercise 3: Promise.resolve / Promise.reject Utility

**Problem:** Write single line creating a Promise that immediately fulfills with value `42`.

**Expected output:**
> [!check]- Answer
> ```text
> const p = Promise.resolve(42);
> ```
> ```javascript
> const p = Promise.resolve(42);
> ```
> - **Explanation:** `Promise.resolve(val)` wraps non-promise values into resolved Promises.
---

## 7. Related Terms
- [async / await](async_await.md) — The modern, much cleaner syntax for handling Promises without using `.then()`.
- [Error Handling (try / catch)](error_handling.md) — How we handle "Rejected" promises.
- [The fetch() API](fetch.md) — Related concept: The fetch() API.
- [XMLHttpRequest / AJAX](xmlhttprequest_ajax.md) — Related concept: XMLHttpRequest / AJAX.

---

## 8. Key Takeaways
- A **Promise** is a placeholder for data that hasn't arrived yet.
- Because network requests are slow, `fetch` returns a Promise so it doesn't freeze the browser.
- Use `.then()` to schedule code to run *after* the Promise successfully fulfills.
- Use `.catch()` to schedule code to run if the Promise rejects (fails).
