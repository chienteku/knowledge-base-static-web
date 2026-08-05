# JSX (JavaScript XML)

> **Level 1 — Core Concepts**
> A syntax extension for JavaScript that allows you to write HTML-like markup directly inside your JavaScript files.

---

## 1. Prerequisites
- [Declarative Programming](declarative_programming.md)
---

## 2. Term Category
- **React Syntax / Tooling**

---

## 3. Environment Context
- **React Core**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web development, HTML (structure) and JavaScript (logic) were kept in separate files. However, the UI structure is intimately connected to the logic (e.g., clicking a button changes a header). 
React creators realized that separating HTML and JS was a mistake—it was separating *technologies*, not *concerns*. 
**JSX** was created so you can put the visual structure directly alongside the logic that controls it, creating a truly unified Component.

### (2) What JSX actually is
JSX is not HTML. The browser cannot read it. 
Before your code runs in the browser, a tool like Babel compiles your JSX into standard JavaScript function calls.
**You write:**
```javascript
const element = <h1 className="greeting">Hello, world!</h1>;
```
**Babel compiles it to:**
```javascript
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, world!'
);
```

### (3) The Superpower: Embedding Expressions
Because JSX is just JavaScript in disguise, you can embed any valid JavaScript expression directly inside the markup using curly braces `{}`.
```javascript
const name = "Alice";
const score = 10;
// We can use variables, math, and function calls directly inside the HTML!
return <div>{name} scored {score * 2} points!</div>;
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using HTML attributes instead of DOM properties

**The mistake:** A developer writes `<div class="container" tabindex="1"></div>` in JSX.

**Why it's wrong:** JSX is closer to JavaScript than HTML! In JavaScript, `class` is a reserved keyword (used to create classes). Therefore, React requires you to use the JavaScript DOM property names, which use camelCase.
**Golden Rule:** Always use camelCase for attributes in JSX. Use `className` instead of `class`, `tabIndex` instead of `tabindex`, and `onClick` instead of `onclick`.

---



### Mistake 2: Returning Multiple Root Sibling Elements Without a Wrapping Container or Fragment

**The mistake:** Writing `return (<h1>Title</h1><p>Text</p>);` without a parent tag.

**Why it's wrong:** JSX compiles down to JavaScript function calls (`React.createElement` or `_jsx`). A JS function cannot return two values simultaneously. Wrap siblings in `<>` or `<div>`.

*Incorrect:*
```javascript
function Header() {
  return (
    <h1>Title</h1> -- ❌ Syntax error: adjacent JSX elements must be wrapped!
    <p>Text</p>
  );
}
```

*Fix:*
```javascript
function Header() {
  return (
    <>
      <h1>Title</h1>
      <p>Text</p>
    </>
  );
}
```

### Mistake 3: Using HTML Attribute Names (`class`, `for`) Instead of React JSX Properties (`className`, `htmlFor`)

**The mistake:** Writing `<div class="card">` or `<label for="email">` in JSX.

**Why it's wrong:** JSX is JavaScript! `class` and `for` are reserved keywords in JavaScript. Use `className` and `htmlFor`.

*Incorrect:*
```javascript
<div class="box"><label for="name">Name</label></div> -- ❌ DOM attribute warnings!
```

*Fix:*
```javascript
<div className="box"><label htmlFor="name">Name</label></div>
```



### Mistake 4: Returning Multiple Root Sibling Elements Without a Wrapping Container or Fragment

**The mistake:** Writing `return (<h1>Title</h1><p>Text</p>);` without a parent tag.

**Why it's wrong:** JSX compiles down to JavaScript function calls (`React.createElement` or `_jsx`). A JS function cannot return two values simultaneously. Wrap siblings in `<>` or `<div>`.

*Incorrect:*
```javascript
function Header() {
  return (
    <h1>Title</h1> -- ❌ Syntax error: adjacent JSX elements must be wrapped!
    <p>Text</p>
  );
}
```

*Fix:*
```javascript
function Header() {
  return (
    <>
      <h1>Title</h1>
      <p>Text</p>
    </>
  );
}
```

### Mistake 5: Using HTML Attribute Names (`class`, `for`) Instead of React JSX Properties (`className`, `htmlFor`)

**The mistake:** Writing `<div class="card">` or `<label for="email">` in JSX.

**Why it's wrong:** JSX is JavaScript! `class` and `for` are reserved keywords in JavaScript. Use `className` and `htmlFor`.

*Incorrect:*
```javascript
<div class="box"><label for="name">Name</label></div> -- ❌ DOM attribute warnings!
```

*Fix:*
```javascript
<div className="box"><label htmlFor="name">Name</label></div>
```

## 6. Practice Exercises

### Exercise 1: The Babel Compilation

**Problem:** How does Babel translate the following JSX into pure JavaScript?
```javascript
<button id="btn">Click Me</button>
```

**Expected output:**
> [!check]- Answer
> ```javascript
> React.createElement("button", { id: "btn" }, "Click Me");
> ```
> - `React.createElement(tag, attributes, children)`

---

### Exercise 2: Embedding JavaScript Expressions in JSX

**Problem:** Embed `user.name` and ternary `isOnline ? 'Online' : 'Offline'` inside JSX using curly braces `{}`.

**Expected output:**
> [!check]- Answer
> ```javascript
> function UserStatus({ user, isOnline }) {
>   return (
>     <div>
>       <h1>{user.name}</h1>
>       <p>{isOnline ? 'Online' : 'Offline'}</p>
>     </div>
>   );
> }
> ```
>
> **Explanation:** Curly braces `{}` embed dynamic JavaScript expressions inside JSX markup.

---

### Exercise 3: Inline Style Object Syntax in JSX

**Problem:** Apply inline background color `'blue'` and font size `16` to `<div>` using `style={{ backgroundColor: 'blue', fontSize: 16 }}`.

**Expected output:**
> [!check]- Answer
> ```javascript
> <div style={{ backgroundColor: 'blue', fontSize: 16 }}>Content</div>
> ```
>
> **Explanation:** JSX inline styles accept camelCase JavaScript objects wrapped in double curly braces.

## 7. Related Terms
- [Fragments](fragments.md) — Wrapping adjacent JSX elements without extra DOM wrapper nodes.
- [Components](components.md) — What you build using JSX.
- [Virtual DOM](virtual_dom.md) — What those `React.createElement` calls actually produce.
- [Conditional Rendering](../level_05/conditional_rendering.md) — Related concept: Conditional Rendering.
- [Synthetic Events](../level_05/synthetic_events.md) — Related concept: Synthetic Events.
---

## 8. Key Takeaways
- **JSX** is a syntax extension that lets you write HTML inside JavaScript.
- It is not read by the browser; it is compiled into `React.createElement()` function calls.
- You can inject dynamic JavaScript variables and logic into the markup using `{ curly_braces }`.
- Because it is JavaScript, you must use camelCase for attributes like `className` and `onClick`.
