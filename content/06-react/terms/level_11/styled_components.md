# Styled Components / Emotion (CSS-in-JS)

> **Level 11 — Ecosystem Libraries**
> A popular paradigm (and set of libraries) that allows you to write actual CSS code directly inside your JavaScript files, binding the styles tightly to individual React components.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — What you are styling.
- [Props (Properties)](../level_01/props.md) — How CSS-in-JS conditionally changes styles.

---

## 2. Term Category
- **React Ecosystem / Styling Library**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web development, you have an `index.html` file and a massive `styles.css` file. 
If you delete a `<button>` from your HTML, you often forget to delete the `.btn-primary` class from your CSS file. Over time, your CSS file becomes bloated with thousands of lines of "dead code" that nobody is brave enough to delete.
Also, dealing with global class name collisions is a nightmare (two developers both naming a class `.container`).
**CSS-in-JS** (like Styled Components or Emotion) solves this. It scopes the CSS strictly to the component. If you delete the component, the CSS is automatically deleted with it!

### (2) How to use Styled Components
You use a special JavaScript syntax called "Tagged Template Literals" (backticks) to write standard CSS. It returns a fully functioning React Component with the CSS permanently attached to it!

```javascript
import styled from 'styled-components';

// 1. Create a styled component
const PrimaryButton = styled.button`
  background-color: blue;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  
  &:hover {
    background-color: darkblue;
  }
`;

function App() {
  // 2. Use it just like a normal React component!
  return <PrimaryButton>Click Me!</PrimaryButton>;
}
```

### (3) Dynamic Styling via Props
Because the CSS is inside JavaScript, it can read React Props! You can change the CSS dynamically based on the component's state.

```javascript
// If the `isWarning` prop is true, it's red. Otherwise, it's green.
const StatusBadge = styled.div`
  background-color: ${props => props.isWarning ? 'red' : 'green'};
  padding: 5px;
`;

<StatusBadge isWarning={true}>Error!</StatusBadge>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Defining Styled Components inside the Render method

**The mistake:** A developer writes `const MyButton = styled.button...` *inside* the `function App() { ... }` body.

**Why it's wrong:** Every time `<App>` re-renders, it will create a brand new Styled Component from scratch, generating a new CSS class name, forcing the browser to recalculate all styles, and destroying any CSS animations that were playing.
**Golden Rule:** ALWAYS define your Styled Components *outside* and *above* your React component function.

---



### Mistake 2: Defining Styled Components Inside Other Component Function Bodies

**The mistake:** Writing `const StyledButton = styled.button`color: red`;` inside a parent component function body.

**Why it's wrong:** Defining a styled component inside a function body re-creates the component type and generates new CSS class names on EVERY single render! This causes complete DOM element unmounting, state loss, and focus flickering.

*Incorrect:*
```javascript
function App() {
  const StyledDiv = styled.div`color: red;`; // ❌ Re-created every render!
  return <StyledDiv />;
}
```

*Fix:*
```javascript
// Define styled components outside function components at module scope
const StyledDiv = styled.div`color: red;`;
function App() { return <StyledDiv />; }
```

### Mistake 3: Passing Custom Non-Standard Props to Underlying HTML DOM Elements Without Filtering

**The mistake:** Writing `<StyledButton isActive={true}>` where `isActive` is passed directly to the native `<button>` DOM element.

**Why it's wrong:** Passing custom props to native DOM elements logs React dev warnings `React does not recognize the 'isActive' prop on a DOM element`. Use transient props with `$` prefix (`$isActive={true}`).

*Incorrect:*
```javascript
const Btn = styled.button`color: ${props => props.isActive ? 'red' : 'blue'};`; // ❌ Passes isActive to DOM!
```

*Fix:*
```javascript
const Btn = styled.button`color: ${props => props.$isActive ? 'red' : 'blue'};`; // Transient $ prop
```

## 6. Practice Exercises

### Exercise 1: Dead Code Elimination

**Problem:** You have a file `Sidebar.js` that contains a `const SidebarContainer = styled.nav...`. You delete `Sidebar.js` from your project. What happens to the CSS that was styling the Sidebar?

**Expected output:**
> [!check]- Answer
> ```text
> It is perfectly deleted!
> Because the CSS was inside the JavaScript file, deleting the JS file guarantees that 100% of the associated CSS is also removed from your application's final build. Zero dead CSS code!
> ```
> - Think about where the CSS lives physically.

---



### Exercise 2: Creating Dynamic Styled Component with Props

**Problem:** Create `Button` styled component setting background color to `'green'` if `$primary` prop is true.

**Expected output:**
> [!check]- Answer
> ```text
> import styled from 'styled-components'; const Button = styled.button` background-color: ${props => props.$primary ? 'green' : 'gray'}; color: white; padding: 10px; `;
> ```
> ```javascript
> import styled from 'styled-components';
>
> const Button = styled.button`
>   background-color: ${props => (props.$primary ? 'green' : 'gray')};
>   color: white;
>   padding: 10px;
> `;
> ```
>
> **Explanation:** CSS-in-JS styled components evaluate dynamic JavaScript props to generate CSS styles.

---

### Exercise 3: Transient Props Prefix

**Problem:** What prefix prevents custom styled-components props from being passed down to HTML DOM elements? (`$` dollar sign prefix e.g. `$primary`).

**Expected output:**
> [!check]- Answer
> ```text
> $ (dollar sign) prefix e.g. $primary
> ```
> ```text
> $ (dollar sign) prefix e.g. $primary
> ```
>
> **Explanation:** Transient props (`$prop`) are consumed strictly by styled-components and omitted from HTML DOM nodes.

## 7. Related Terms
- [Components](../level_01/components.md) — Styled Components are just React Components that render a specific HTML tag with injected CSS.

---

## 8. Key Takeaways
- **CSS-in-JS** (Styled Components / Emotion) allows you to write real CSS directly inside your JavaScript files.
- It scopes the CSS strictly to the component, eliminating global class name collisions and "dead" CSS code.
- It allows you to dynamically change CSS properties based on React **Props**.
- Never define a styled component inside a React render function; always define them outside.
