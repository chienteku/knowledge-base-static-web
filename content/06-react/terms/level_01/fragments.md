# Fragments

> **Level 1 — Core Concepts**
> Grouping sibling elements in JSX without introducing unnecessary container wrapper elements to the real browser DOM.

---

## 1. Prerequisites
- [JSX](../level_01/jsx.md) — The XML-like syntax that compiles to elements.
- [Components](../level_01/components.md) — React's reusable building blocks.

---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In React, a component's render execution can only return a **single root element**. This is because React compiles JSX down into standard nested JavaScript function calls:
`JSX: <div><p>Hello</p></div>` compiles to: `React.createElement('div', null, React.createElement('p', null, 'Hello'))`
A JavaScript function cannot return two values (or two independent objects) at the same time. Therefore, trying to return sibling elements directly from a component will trigger a syntax compilation error:
```javascript
// SYNTAX ERROR: Adjacent JSX elements must be wrapped in an enclosing tag
return (
  <h1>Title</h1>
  <p>Description</p>
);
```

To work around this, developers historically wrapped adjacent elements in a container `<div>`:
```javascript
return (
  <div>
    <h1>Title</h1>
    <p>Description</p>
  </div>
);
```

While functional, this approach pollutes the real browser HTML DOM tree with thousands of redundant wrapper `<div>` nodes. This extra nesting:
1.  **Breaks Layouts:** CSS layouts like Flexbox and Grid rely on direct parent-child relationships. An extra wrapper `<div>` breaks formatting and margins.
2.  **Degrades Performance:** Large, bloated DOM trees consume extra browser memory and slow down page rendering.
3.  **Invalid HTML:** Placing a wrapper `<div>` inside table layouts (like between `<tr>` and `<td>`) produces invalid HTML structure.

To return siblings cleanly without introducing wrapper DOM nodes, React provides **Fragments**:
-   **Short Syntax:** `<>...</>` wraps siblings without inserting any node into the real DOM.
-   **Long Syntax:** `<React.Fragment>...</React.Fragment>` behaves identically but is required when you need to pass a `key` attribute during loop iterations.

---

### (2) Reality Metaphor
Imagine ordering a burger and fries at a fast-food counter.
- **Redundant Wrapper `<div>` (Box in a Box):** The server puts your burger box and fries box inside a large, heavy cardboard box. When you sit at your table (**the browser layout**), you are forced to keep that large box on your tray, which leaves no space for drinks.
- **React Fragments (Transparent Plastic wrap):** The server wraps the burger and fries boxes with a temporary cling wrap. When you place them on your tray, the wrap instantly dissolves, leaving only the two items sitting side-by-side, exactly where you wanted them.

---

### (3) Code Examples

#### 1. Redundant DOM Pollution vs Clean Fragment Output
```jsx
// Redundant Div (Creates a real <div> on screen)
function RedundantMenu() {
  return (
    <div>
      <a href="/home">Home</a>
      <a href="/about">About</a>
    </div>
  );
}

// Clean Fragment (Creates NO extra DOM node)
function CleanMenu() {
  return (
    <>
      <a href="/home">Home</a>
      <a href="/about">About</a>
    </>
  );
}
```

#### 2. Keyed Fragments in List Iteration
When rendering lists of sibling components, you must use the explicit `<React.Fragment>` syntax to attach keys:
```jsx
import React from 'react';

function GlossaryList({ items }) {
  return (
    <dl>
      {items.map(item => (
        // Short syntax <> cannot accept key attributes!
        <React.Fragment key={item.id}>
          <dt>{item.term}</dt>
          <dd>{item.definition}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to pass keys or attributes to the short syntax `<>`

**The mistake:** Trying to pass a `key` or `className` to the short-form fragment syntax:
```jsx
// SYNTAX ERROR: Key attribute cannot be placed on short fragments!
{items.map(item => (
  <key={item.id}>
    <span>{item.name}</span>
  </key>
))}
```

*Fix:* Switch to the explicit `<React.Fragment>` component when keys or props are required:
```jsx
<React.Fragment key={item.id}>
  <span>{item.name}</span>
</React.Fragment>
```

---



### Mistake 2: Attempting to Pass `key` Props to Short Fragment Syntax `<> ... </>`

**The mistake:** Writing `<key={item.id}> ... </key>` or `<> key={item.id} ... </>` inside mapped lists.

**Why it's wrong:** The short fragment syntax `<> ... </>` DOES NOT support HTML attributes or `key` props! When mapping list items, use explicit `<React.Fragment key={item.id}>`.

*Incorrect:*
```javascript
items.map(item => (
  <> key={item.id} -- ❌ Syntax error! Short fragments cannot receive props!
    <h3>{item.title}</h3>
  </>
));
```

*Fix:*
```javascript
items.map(item => (
  <React.Fragment key={item.id}>
    <h3>{item.title}</h3>
  </React.Fragment>
));
```

### Mistake 3: Wrapping Sibling Components in Un-Necessary `<div>` Containers Breaking CSS Layouts

**The mistake:** Wrapping flexbox grid child components in wrapper `<div>` nodes.

**Why it's wrong:** Adding extra `<div>` elements breaks CSS Flexbox / Grid parent-child relationships and introduces DOM node bloat. Use `<Fragment>` or `<>`.

*Incorrect:*
```javascript
function Columns() {
  return (
    <div> {/* ❌ Breaks CSS Flexbox parent layout! */}
      <td>One</td>
      <td>Two</td>
    </div>
  );
}
```

*Fix:*
```javascript
function Columns() {
  return (
    <>
      <td>One</td>
      <td>Two</td>
    </>
  );
}
```



### Mistake 4: Attempting to Pass `key` Props to Short Fragment Syntax `<> ... </>`

**The mistake:** Writing `<key={item.id}> ... </key>` or `<> key={item.id} ... </>` inside mapped lists.

**Why it's wrong:** The short fragment syntax `<> ... </>` DOES NOT support HTML attributes or `key` props! When mapping list items, use explicit `<React.Fragment key={item.id}>`.

*Incorrect:*
```javascript
items.map(item => (
  <> key={item.id} -- ❌ Syntax error! Short fragments cannot receive props!
    <h3>{item.title}</h3>
  </>
));
```

*Fix:*
```javascript
items.map(item => (
  <React.Fragment key={item.id}>
    <h3>{item.title}</h3>
  </React.Fragment>
));
```

### Mistake 5: Wrapping Sibling Components in Un-Necessary `<div>` Containers Breaking CSS Layouts

**The mistake:** Wrapping flexbox grid child components in wrapper `<div>` nodes.

**Why it's wrong:** Adding extra `<div>` elements breaks CSS Flexbox / Grid parent-child relationships and introduces DOM node bloat. Use `<Fragment>` or `<>`.

*Incorrect:*
```javascript
function Columns() {
  return (
    <div> {/* ❌ Breaks CSS Flexbox parent layout! */}
      <td>One</td>
      <td>Two</td>
    </div>
  );
}
```

*Fix:*
```javascript
function Columns() {
  return (
    <>
      <td>One</td>
      <td>Two</td>
    </>
  );
}
```

## 6. Practice Exercises

### Exercise 1: Refactoring Grid Components

**Problem:** The grid component below generates invalid HTML because of the wrapper `div` separating `<tr>` and `<td>`. Refactor it to use Fragments:

```jsx
// Before (Invalid HTML markup):
function TableBody({ rows }) {
  return (
    <tbody>
      {rows.map(row => (
        <div key={row.id}>
          <tr>
            <td>{row.name}</td>
            <td>{row.value}</td>
          </tr>
        </div>
      ))}
    </tbody>
  );
}

// After (Refactored Solution):
import React from 'react';

function TableBody({ rows }) {
  return (
    <tbody>
      {rows.map(row => (
        <React.Fragment key={row.id}>
          <tr>
            <td>{row.name}</td>
            <td>{row.value}</td>
          </tr>
        </React.Fragment>
      ))}
    </tbody>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.

### Exercise 2: Mapping List Items with Explicit Fragment

**Problem:** Map array `terms` returning `dt` and `dd` elements using `<React.Fragment key={item.id}>`.

**Expected output:**
```text
function Glossary({ items }) { return <dl>{items.map(item => <React.Fragment key={item.id}><dt>{item.term}</dt><dd>{item.def}</dd></React.Fragment>)}</dl>; }
```

> [!check]- Answer
> ```javascript
> function Glossary({ items }) {
>   return (
>     <dl>
>       {items.map(item => (
>         <React.Fragment key={item.id}>
>           <dt>{item.term}</dt>
>           <dd>{item.def}</dd>
>         </React.Fragment>
>       ))}
>     </dl>
>   );
> }
> ```
>
> **Explanation:** `React.Fragment` accepts `key` props when mapping multi-element list items.

### Exercise 3: Short Fragment Syntax

**Problem:** Write component returning two sibling `<p>` elements using short Fragment syntax `<> ... </>`.

**Expected output:**
```text
function Intro() { return <> <p>First</p> <p>Second</p> <>; }
```

> [!check]- Answer
> ```javascript
> function Intro() {
>   return (
>     <>
>       <p>First</p>
>       <p>Second</p>
>     </>
>   );
> }
> ```
>
> **Explanation:** `<> ... </>` groups sibling elements without adding extra wrapper nodes to the DOM tree.



### Exercise 4: Mapping List Items with Explicit Fragment

**Problem:** Map array `terms` returning `dt` and `dd` elements using `<React.Fragment key={item.id}>`.

**Expected output:**
```text
function Glossary({ items }) { return <dl>{items.map(item => <React.Fragment key={item.id}><dt>{item.term}</dt><dd>{item.def}</dd></React.Fragment>)}</dl>; }
```

> [!check]- Answer
> ```javascript
> function Glossary({ items }) {
>   return (
>     <dl>
>       {items.map(item => (
>         <React.Fragment key={item.id}>
>           <dt>{item.term}</dt>
>           <dd>{item.def}</dd>
>         </React.Fragment>
>       ))}
>     </dl>
>   );
> }
> ```
>
> **Explanation:** `React.Fragment` accepts `key` props when mapping multi-element list items.

### Exercise 5: Short Fragment Syntax

**Problem:** Write component returning two sibling `<p>` elements using short Fragment syntax `<> ... </>`.

**Expected output:**
```text
function Intro() { return <> <p>First</p> <p>Second</p> <>; }
```

> [!check]- Answer
> ```javascript
> function Intro() {
>   return (
>     <>
>       <p>First</p>
>       <p>Second</p>
>     </>
>   );
> }
> ```
>
> **Explanation:** `<> ... </>` groups sibling elements without adding extra wrapper nodes to the DOM tree.

## 7. Related Terms
- [Lists & Keys](../level_05/lists_and_keys.md) — Managing render loops using key tags.
- [Children Prop](../level_07/children_prop.md) — Passing elements down component nesting lines.

---

## 8. Key Takeaways
- React components must return a single root element due to JavaScript function limitations.
- Wrapping siblings in redundant `<div>` tags bloats the DOM and breaks layouts (e.g. Flexbox/Grid).
- Fragments group adjacent JSX elements without adding nodes to the real DOM.
- The short syntax `<>...</>` is clean but cannot accept keys or attributes.
- Use explicit `<React.Fragment key={id}>...</React.Fragment>` when rendering lists.
