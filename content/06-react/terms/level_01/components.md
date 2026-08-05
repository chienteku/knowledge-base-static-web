# Components

> **Level 1 — Core Concepts**
> Independent, reusable blocks of code that represent a piece of the user interface. They are the fundamental building blocks of any React application.

---

## 1. Prerequisites
- [JSX (JavaScript XML)](jsx.md) — What components return.
---

## 2. Term Category
- **React Architecture / Design Pattern**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional HTML, a webpage is one massive file. If you have a complex navigation bar, and you want to use that same navigation bar on 10 different pages, you have to copy-paste the HTML 10 times. If you need to add a new link, you have to edit 10 files.
React solves this with **Components**. You write the Navigation Bar code once, wrap it in a Component, and then simply drop `<Navbar />` into any page that needs it. If you update the Component, all 10 pages update instantly.

### (2) What is a Component?
In modern React (v16.8+), a Component is literally just a standard JavaScript function that returns JSX.
```javascript
// This is a Component!
function ProfileCard() {
  return (
    <div className="card">
      <img src="avatar.jpg" />
      <h2>Alice</h2>
    </div>
  );
}
```
You can then use it like a custom HTML tag inside other components:
```javascript
function App() {
  return (
    <main>
      <ProfileCard /> 
      <ProfileCard /> 
    </main>
  );
}
```

### (3) The Lego Block Metaphor
A React application is like a massive Lego castle. You don't mold the castle out of one giant piece of plastic. You build small, reusable blocks (a Button component, an Input component). You snap them together to build bigger structures (a Form component). You snap those together to build the whole app.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Lowercase Component Names

**The mistake:** A developer names their component `function button() { return <button>Click</button> }` and tries to render it using `<button />`.

**Why it's wrong:** React uses capitalization to distinguish between standard HTML tags and custom React Components. If it starts with a lowercase letter, React thinks you want the literal HTML `<button>` tag. It will ignore your custom function completely.
**Golden Rule:** ALWAYS start React Component names with a Capital Letter (e.g., `Button`, `ProfileCard`).

---



### Mistake 2: Nesting Component Function Definitions Inside Other Component Functions

**The mistake:** Defining `function ChildComponent() { ... }` inside the body of `function ParentComponent() { ... }`.

**Why it's wrong:** Defining a component inside another component re-creates the child component definition on EVERY parent render. React treats the newly created function as a completely new component type, causing complete DOM unmounting, loss of state, and focus flicker.

*Incorrect:*
```javascript
function Parent() {
  function Child() { return <div>Child</div>; } // ❌ Re-created every render!
  return <Child />;
}
```

*Fix:*
```javascript
// Define child components at top-level module scope
function Child() { return <div>Child</div>; }
function Parent() { return <Child />; }
```

### Mistake 3: Performing Impure Side Effects (e.g. Updating Global Variables) Directly inside Component Render

**The mistake:** Mutating external global variables or sending network HTTP fetch requests directly inside the component body before returning JSX.

**Why it's wrong:** React render functions MUST be pure calculations. Impure side-effects executed during render run multiple times per render (especially under StrictMode or Concurrent Rendering), causing unpredictable bugs. Move side effects to `useEffect` or event handlers.

*Incorrect:*
```javascript
let guestCount = 0;
function Cup() {
  guestCount = guestCount + 1; // ❌ Impure side-effect during render!
  return <h2>Tea cup for guest #{guestCount}</h2>;
}
```

*Fix:*
```javascript
function Cup({ guest }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}
```



### Mistake 4: Nesting Component Function Definitions Inside Other Component Functions

**The mistake:** Defining `function ChildComponent() { ... }` inside the body of `function ParentComponent() { ... }`.

**Why it's wrong:** Defining a component inside another component re-creates the child component definition on EVERY parent render. React treats the newly created function as a completely new component type, causing complete DOM unmounting, loss of state, and focus flicker.

*Incorrect:*
```javascript
function Parent() {
  function Child() { return <div>Child</div>; } // ❌ Re-created every render!
  return <Child />;
}
```

*Fix:*
```javascript
// Define child components at top-level module scope
function Child() { return <div>Child</div>; }
function Parent() { return <Child />; }
```

### Mistake 5: Performing Impure Side Effects (e.g. Updating Global Variables) Directly inside Component Render

**The mistake:** Mutating external global variables or sending network HTTP fetch requests directly inside the component body before returning JSX.

**Why it's wrong:** React render functions MUST be pure calculations. Impure side-effects executed during render run multiple times per render (especially under StrictMode or Concurrent Rendering), causing unpredictable bugs. Move side effects to `useEffect` or event handlers.

*Incorrect:*
```javascript
let guestCount = 0;
function Cup() {
  guestCount = guestCount + 1; // ❌ Impure side-effect during render!
  return <h2>Tea cup for guest #{guestCount}</h2>;
}
```

*Fix:*
```javascript
function Cup({ guest }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}
```

## 6. Practice Exercises

### Exercise 1: The Composition

**Problem:** You have a `Header` component, a `Sidebar` component, and a `MainContent` component. Write a parent component called `Dashboard` that renders all three of them inside a `<div>`.

**Expected output:**
> [!check]- Answer
> ```javascript
> function Dashboard() {
>   return (
>     <div>
>       <Header />
>       <Sidebar />
>       <MainContent />
>     </div>
>   );
> }
> ```
> - Remember to return a single parent element (the `div`).
> - Use PascalCase for the component tags.

---

### Exercise 2: Extracting Reusable Button Component

**Problem:** Create a reusable `Button` component taking `label` and `onClick` props.

**Expected output:**
> [!check]- Answer
> ```javascript
> function Button({ label, onClick }) {
>   return <button onClick={onClick}>{label}</button>;
> }
> ```
>
> **Explanation:** Components encapsulate UI structure and behavior via props.

---

### Exercise 3: Component Naming Capitalization

**Problem:** Why MUST React component function names begin with a capital letter? (React uses capitalization to distinguish custom React components from standard built-in HTML tags).

**Expected output:**
> [!check]- Answer
> ```text
> React uses capitalization to distinguish custom React components from standard built-in HTML tags
> ```
>
> **Explanation:** Lowercase tags (`<button>`) evaluate to HTML string tags; uppercase tags (`<Button>`) evaluate to component functions.

## 7. Related Terms
- [Render Purity](render_purity.md) — The rule that components must be pure functions.
- [Fragments](fragments.md) — Grouping sibling elements without adding wrapper nodes.
- [Props (Properties)](props.md) — How you pass data into these components to customize them.
- [JSX (JavaScript XML)](jsx.md) — What the component returns.
- [Custom Hooks](../level_04/custom_hooks.md) — Related concept: Custom Hooks.
- [Rules of Hooks](../level_04/rules_of_hooks.md) — Related concept: Rules of Hooks.
- [Testing: React Testing Library + Jest](../level_11/react_testing_library.md) — Related concept: Testing: React Testing Library + Jest.
- [Styled Components / Emotion (CSS-in-JS)](../level_11/styled_components.md) — Related concept: Styled Components / Emotion (CSS-in-JS).
- [TypeScript with React](../level_11/typescript_react.md) — Related concept: TypeScript with React.
---

## 8. Key Takeaways
- **Components** are independent, reusable pieces of the UI.
- In modern React, they are just JavaScript functions that return JSX.
- They allow you to build complex UIs by composing small, simple blocks together.
- Component function names and tags **MUST** start with a Capital letter.
