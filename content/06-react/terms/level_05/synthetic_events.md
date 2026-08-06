# Synthetic Events

> **Level 5 — DOM & Event Handling**
> React's cross-browser wrapper around the native browser events (like `click`, `change`, `keydown`). It ensures that events behave identically across all browsers.

---

## 1. Prerequisites
- [Declarative Programming](../level_01/declarative_programming.md) — You use Synthetic events instead of `addEventListener`.
- [JSX (JavaScript XML)](../level_01/jsx.md) — Handling synthetic DOM events in JSX templates.

---

## 2. Term Category
- **React Mechanic / Event Handling**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In vanilla JavaScript, you listen to events using `element.addEventListener('click', handleClick)`. However, different browsers (Chrome, Firefox, Safari, old Internet Explorer) sometimes implement these events slightly differently. 
To save developers from writing browser-specific `if` statements, React intercepts all native browser events, wraps them in a standardized JavaScript object called a **Synthetic Event**, and passes *that* object to your function instead.

### (2) Event Delegation (The Performance Trick)
If you have a list of 1,000 buttons, attaching 1,000 native `onClick` listeners would consume a massive amount of RAM. 
React doesn't actually attach `onClick` to your buttons! 
Instead, React attaches **one single event listener** to the very root of your entire application (`<div id="root">`). When you click a button, the event bubbles up to the root, React figures out which component you were targeting, creates a Synthetic Event, and triggers your component's function. This is called Event Delegation, and it makes React incredibly memory efficient.

### (3) Usage in JSX
Because React events are custom, they use camelCase instead of lowercase HTML attributes.
```javascript
// Native HTML: <button onclick="handleClick()">
// React JSX:
<button onClick={handleClick}>Click Me</button>

function handleClick(e) {
  // `e` is a Synthetic Event!
  e.preventDefault(); 
  console.log("Clicked!");
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Invoking the function immediately

**The mistake:** A developer writes `<button onClick={handleClick()}>Click</button>`.

**Why it's wrong:** Because you added parentheses `()`, JavaScript executes the function *immediately* during the render phase! If `handleClick` updates state, it causes an infinite loop. 
**Golden Rule:** You must pass the function **reference**, not the function **call**. Write `onClick={handleClick}` (no parentheses), or use an inline arrow function `onClick={() => handleClick(id)}`.

---



### Mistake 2: Invoking Handler Functions Directly in Event Props (`onClick={handleClick()}`)

**The mistake:** Writing `<button onClick={handleClick()}>Click</button>`.

**Why it's wrong:** Writing `handleClick()` INVOKES the function immediately during component render, causing an infinite re-render loop if `handleClick` updates state! Pass function reference `<button onClick={handleClick}>`.

*Incorrect:*
```javascript
<button onClick={handleClick()}>Click</button> // ❌ Invokes function during render!
```

*Fix:*
```javascript
<button onClick={handleClick}>Click</button> // Passes function reference
```

### Mistake 3: Accessing `e.target` Asynchronously After `await` in Event Handlers

**The mistake:** Writing `const value = e.target.value; await saveData(); console.log(e.target.value);`.

**Why it's wrong:** In older React event pooling models, synthetic events are recycled. Extract event property values into local variables BEFORE asynchronous operations.

*Incorrect:*
```javascript
const handleSubmit = async (e) => {
  await apiCall();
  console.log(e.target.value); // ❌ Property may be nullified after async await!
};
```

*Fix:*
```javascript
const handleSubmit = async (e) => {
  const val = e.target.value; // Store value synchronously
  await apiCall();
  console.log(val);
};
```

## 6. Practice Exercises

### Exercise 1: Passing Arguments

**Problem:** You have a function `deleteUser(id)`. You want to call it when a button is clicked. Why is `<button onClick={deleteUser(user.id)}>` wrong, and how do you fix it?

**Expected output:**
> [!check]- Answer
> ```text
> It's wrong because adding `(user.id)` invokes the function immediately on render.
> To fix it, wrap it in an inline arrow function:
> `<button onClick={() => deleteUser(user.id)}>`
> ```
> - Create a new function that waits to be clicked, and *then* calls `deleteUser`.
> 
---



### Exercise 2: Preventing Default Form Submission

**Problem:** Write form `onSubmit` event handler calling `e.preventDefault()` to stop browser page reloads.

**Expected output:**
> [!check]- Answer
> ```text
> function Form() { const handleSubmit = (e) => { e.preventDefault(); console.log('Submitted'); }; return <form onSubmit={handleSubmit}><button type="submit">Submit</button></form>; }
> ```
> ```javascript
> function Form() {
>   const handleSubmit = (e) => {
>     e.preventDefault();
>     console.log('Submitted');
>   };
>   return (
>     <form onSubmit={handleSubmit}>
>       <button type="submit">Submit</button>
>     </form>
>   );
> }
> ```
>
> **Explanation:** `e.preventDefault()` prevents native browser navigation reloads on form submission.
> 
---

### Exercise 3: Event Target vs CurrentTarget

**Problem:** Compare: `e.target` (The actual DOM element that triggered the event); `e.currentTarget` (The DOM element that attached the event listener).

**Expected output:**
> [!check]- Answer
> ```text
> target: element that triggered event; currentTarget: element holding event listener
> ```
> ```text
> target: element that triggered event; currentTarget: element holding event listener
> ```
>
> **Explanation:** Event delegation routes synthetic events up to listener attachments.
> 
## 7. Related Terms
- [JSX (JavaScript XML)](../level_01/jsx.md) — Where you attach these event handlers using camelCase.
- [Testing: React Testing Library + Jest](../level_11/react_testing_library.md) — Related concept: Testing: React Testing Library + Jest.
- [Controlled Components](controlled_components.md) — Form input events.

---

## 8. Key Takeaways
- **Synthetic Events** are React's standardized wrapper around native browser events, ensuring cross-browser compatibility.
- Event names in JSX are camelCase (`onClick`, `onChange`, `onSubmit`).
- Pass function references to event handlers, do not invoke them immediately.
- React uses Event Delegation at the root of the app to save memory, rather than attaching thousands of individual listeners.
