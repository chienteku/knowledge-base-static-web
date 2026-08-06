# Declarative Programming

> **Level 1 — Core Concepts**
> A programming paradigm where you describe *what* you want the UI to look like, rather than writing step-by-step instructions on *how* to build it.

---

## 1. Prerequisites
- None!

---

## 2. Term Category
- **Programming Paradigm / Conceptual**

---

## 3. Environment Context
- **Universal** (Applies to all modern UI frameworks like React, Vue, Svelte).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before React, developers used Imperative programming (like jQuery or vanilla DOM manipulation). 
If you wanted to show a success message, you had to write the exact steps:
1. `const div = document.createElement('div')`
2. `div.className = 'success'`
3. `div.innerText = 'Saved!'`
4. `document.body.appendChild(div)`

As apps grew to thousands of elements, tracking which step to execute next became impossible. Bugs multiplied.
React uses **Declarative Programming**. You simply tell React: *"If the status is 'success', show a div that says 'Saved!'."* React figures out the exact DOM commands needed to make that reality happen.

### (2) The Restaurant Metaphor
**Imperative (Vanilla JS):** You go to a restaurant kitchen. You tell the chef to get a pan, turn on the stove, crack two eggs, flip them, and put them on a plate.
**Declarative (React):** You sit at the table and order "Two fried eggs." You don't care *how* the chef makes them; you just declare *what* you want.

### (3) How React achieves this
React relies on the concept of `UI = f(state)`. The user interface is just a mathematical projection of the current data. You update the data variable (state), and React automatically re-renders the UI to match that new data.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to mix Declarative and Imperative

**The mistake:** A developer uses React, but they still write code like `document.getElementById('my-button').style.color = 'red'` inside their components to change colors.

**Why it's wrong:** You are trying to command the kitchen while ordering from the menu! If you manually change the DOM, React doesn't know you changed it. The next time React updates, it will completely overwrite your manual changes. 
**Golden Rule:** In React, never touch the DOM directly. If you want a button to be red, you must update the React State, and let React change the color.

---



### Mistake 2: Manually Querying and Mutating DOM Nodes (`document.getElementById`) inside React

**The mistake:** Writing `document.getElementById('title').innerText = 'New'` inside a React component to change text.

**Why it's wrong:** Direct DOM mutations bypass React's Virtual DOM state tracking. On the next state change, React will overwrite or conflict with your manual DOM mutations. Declare state and let React handle DOM updates declaratively.

*Incorrect:*
```javascript
function Title() {
  const handleClick = () => {
    document.getElementById('heading').innerText = 'Updated'; // ❌ Imperative DOM mutation!
  };
  return <h1 id="heading" onClick={handleClick}>Initial</h1>;
}
```

*Fix:*
```javascript
function Title() {
  const [text, setText] = useState('Initial');
  return <h1 onClick={() => setText('Updated')}>{text}</h1>; // Declarative state binding
}
```

### Mistake 3: Thinking Declarative Programming Eliminates All State Transitions

**The mistake:** Expecting React components to automatically know user intent without state updates.

**Why it's wrong:** Declarative code describes *what* UI to render for a given state ($UI = f(State)$). You must still trigger state updates ($State 
ightarrow State'$) in response to user events.

*Incorrect:*
```javascript
// Expecting UI to update without calling setState()
```

*Fix:*
```javascript
Update state values via setState() handlers to trigger declarative UI re-renders
```



### Mistake 4: Manually Querying and Mutating DOM Nodes (`document.getElementById`) inside React

**The mistake:** Writing `document.getElementById('title').innerText = 'New'` inside a React component to change text.

**Why it's wrong:** Direct DOM mutations bypass React's Virtual DOM state tracking. On the next state change, React will overwrite or conflict with your manual DOM mutations. Declare state and let React handle DOM updates declaratively.

*Incorrect:*
```javascript
function Title() {
  const handleClick = () => {
    document.getElementById('heading').innerText = 'Updated'; // ❌ Imperative DOM mutation!
  };
  return <h1 id="heading" onClick={handleClick}>Initial</h1>;
}
```

*Fix:*
```javascript
function Title() {
  const [text, setText] = useState('Initial');
  return <h1 onClick={() => setText('Updated')}>{text}</h1>; // Declarative state binding
}
```

### Mistake 5: Thinking Declarative Programming Eliminates All State Transitions

**The mistake:** Expecting React components to automatically know user intent without state updates.

**Why it's wrong:** Declarative code describes *what* UI to render for a given state ($UI = f(State)$). You must still trigger state updates ($State 
ightarrow State'$) in response to user events.

*Incorrect:*
```javascript
// Expecting UI to update without calling setState()
```

*Fix:*
```javascript
Update state values via setState() handlers to trigger declarative UI re-renders
```

## 6. Practice Exercises

### Exercise 1: Identify the Paradigm

**Problem:** Look at the two code snippets below. Which one is Declarative, and which one is Imperative?
**Snippet A:**
```javascript
const btn = document.querySelector('#submit');
btn.addEventListener('click', () => {
  btn.innerText = 'Loading...';
  btn.disabled = true;
});
```
**Snippet B:**
```javascript
<button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

**Expected output:**
> [!check]- Answer
> ```text
> Snippet A is Imperative (step-by-step commands to the DOM).
> Snippet B is Declarative (describing what the button should look like based on the `isLoading` variable).
> ```
> - Which one gives orders to the DOM, and which one uses variables to define the shape?
> 
---

### Exercise 2: Declarative Toggle Switch

**Problem:** Build declarative `Toggle` component displaying `'ON'` or `'OFF'` based on `isOn` state.

**Expected output:**
> [!check]- Answer
> ```javascript
> function Toggle() {
>   const [isOn, setIsOn] = useState(false);
>   return (
>     <button onClick={() => setIsOn(!isOn)}>
>       {isOn ? 'ON' : 'OFF'}
>     </button>
>   );
> }
> ```
>
> **Explanation:** Declarative components declare UI output based on current state values.
> 
---

### Exercise 3: Imperative vs Declarative Comparison

**Problem:** Compare: Imperative (Step-by-step DOM manipulation instructions); Declarative (Describing desired UI state output).

**Expected output:**
> [!check]- Answer
> ```text
> Imperative: step-by-step DOM manipulation instructions; Declarative: describing desired UI state output
> ```
>
> **Explanation:** Declarative programming abstracts DOM updates behind state transitions.
> 
## 7. Related Terms
- [State](../level_02/state.md) — The data that powers Declarative UIs.
- [Virtual DOM](virtual_dom.md) — The technology React uses to turn your declarative orders into imperative DOM commands.
- [`useRef` Hook](../level_04/use_ref.md) — Related concept: `useRef` Hook.
- [Framer Motion](../level_11/framer_motion.md) — Related concept: Framer Motion.
- [React Native](../level_11/react_native.md) — Related concept: React Native.

---

## 8. Key Takeaways
- **Declarative Programming** focuses on the *What*, not the *How*.
- You define what the UI should look like for any given state, and React handles the messy DOM manipulation.
- Never mix raw DOM manipulation (`document.getElementById`) into a React application.
