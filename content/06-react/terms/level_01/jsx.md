# JSX (JavaScript XML)

> **Level 1 — Core Concepts**
> A syntax extension for JavaScript that allows developers to write HTML-like template markup directly within JavaScript component files.

---

## 1. Prerequisites

- [Declarative Programming](declarative_programming.md) — The programming paradigm underlying JSX template declarations.

---

## 2. Term Category

**Rendering Mechanic (syntax extension)**: JSX (JavaScript XML) is a declarative syntax extension for ECMAScript designed by Meta. It allows developers to write HTML-like markup inside JavaScript code files. Browsers cannot read or execute JSX directly; build-time compilers (such as Babel, SWC, or ESBuild) compile JSX tags down into standard JavaScript function calls (`React.createElement(...)` or `_jsx(...)`).

Rather than separating visual structure (HTML) and behavior (JavaScript) into separate files, JSX co-locates markup and logic within components, creating a unified component architecture.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web development, HTML (structure), CSS (styling), and JavaScript (behavior) were stored in separate files. Developers believed this maintained a "separation of concerns." However, as web applications evolved into dynamic SPAs, developers realized that visual markup and interactive behavior are deeply coupled. Clicking a button modifies element attributes, toggles CSS classes, and updates text nodes.

Separating HTML and JS into different files was not separating *concerns*—it was merely separating *technologies*.

React introduced **JSX** to co-locate rendering layout directly alongside the JavaScript logic controlling it. Furthermore, because JSX compiles directly to JavaScript expressions, developers gain full access to the power of JavaScript (loops, array methods, conditional ternaries, variable scopes) directly inside template markup using curly braces `{}`.

### (2) Reality Metaphor
Imagine a house architect drafting blueprint schematics.

- **Separate Files (Paper Blueprints & Written Notes):** The architect draws wall shapes on one sheet of paper (HTML), writes wiring instructions on a second notepad (JavaScript), and writes paint color samples in a separate book (CSS). To verify if a light switch works, a builder must cross-reference three separate documents simultaneously.
- **JSX (Annotated Interactive Blueprint):** The architect draws the wall shapes directly on a digital tablet screen where clicking a drawn light switch icon instantly flips open its exact electrical schematic and paint code on the same view. Markup and behavior are visually unified in one clear view.

### (3) React Code Examples

#### Short Snippet
```jsx
// JSX co-locates variables, dynamic expressions ({}), and markup
function UserGreeting({ username, unreadCount }) {
  return (
    <div className="greeting-card">
      <h2>Welcome back, {username}!</h2>
      <p>You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.</p>
    </div>
  );
}
```

#### Fuller Example
```jsx
import React from 'react';

// Compilation visualization:
// <div className="card">...</div> compiles to:
// React.createElement('div', { className: 'card' }, ...)

export default function OrderSummary({ items, discountCode }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasDiscount = Boolean(discountCode);
  const finalTotal = hasDiscount ? subtotal * 0.9 : subtotal;

  return (
    <div className="summary-box">
      <h3>Shopping Cart ({items.length} items)</h3>
      <ul className="item-list">
        {items.map(item => (
          <li key={item.id} className="item-row">
            <span>{item.name} (x{item.quantity})</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="calculation-divider" />
      
      <div className="price-row">
        <span>Subtotal:</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {hasDiscount && (
        <div className="price-row discount">
          <span>Discount (10% code: {discountCode}):</span>
          <span>-${(subtotal * 0.1).toFixed(2)}</span>
        </div>
      )}

      <div className="price-row total">
        <strong>Total Amount:</strong>
        <strong>${finalTotal.toFixed(2)}</strong>
      </div>
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using HTML Attribute Names (`class`, `for`) Instead of JSX DOM Properties (`className`, `htmlFor`)

**The mistake:** Writing `<div class="container">` or `<label for="email">` inside JSX templates.

**Why it's wrong:** JSX compiles directly into JavaScript object property declarations. In JavaScript, `class` and `for` are reserved keyword identifiers. React requires developers to use DOM property names written in camelCase (`className`, `htmlFor`, `tabIndex`, `onClick`).

*Incorrect:*
```jsx
// ❌ Warning: Invalid DOM property 'class'. Did you mean 'className'?
function Card() {
  return (
    <div class="card">
      <label for="name">User Name</label>
      <input id="name" tabindex="1" />
    </div>
  );
}
```

*Fix:*
```jsx
// ✅ Clean camelCase DOM property names in JSX
function Card() {
  return (
    <div className="card">
      <label htmlFor="name">User Name</label>
      <input id="name" tabIndex={1} />
    </div>
  );
}
```

### Mistake 2: Returning Multiple Root Sibling Elements Without a Enclosing Container or Fragment

**The mistake:** Writing `return (<h1>Title</h1><p>Body</p>);` without a root wrapper tag.

**Why it's wrong:** JSX compiles into JavaScript function calls (`React.createElement(...)`). In JavaScript, a function cannot return two independent objects simultaneously without an outer wrapper array or container.

*Incorrect:*
```jsx
// ❌ Syntax Error: Adjacent JSX elements must be wrapped in an enclosing tag
function Header() {
  return (
    <h1>Title</h1>
    <p>Subtitle</p>
  );
}
```

*Fix:*
```jsx
// ✅ Wrapped using short fragment syntax <> ... </>
function Header() {
  return (
    <>
      <h1>Title</h1>
      <p>Subtitle</p>
    </>
  );
}
```

### Mistake 3: Passing String Numbers or Booleans Without Curly Braces `{}`

**The mistake:** Passing `<Counter count="5" isVisible="true" />` expecting JavaScript numeric and boolean data types.

**Why it's wrong:** Quoted values `"5"` pass literal JavaScript string primitives (`'5'`). This causes string concatenation bugs (e.g. `'5' + 1 = '51'`) and truthy string behavior (`"false"` evaluates to truthy). Pass non-string primitives wrapped inside curly braces (`count={5}`).

*Incorrect:*
```jsx
// ❌ Passes string '5' and string 'false'!
<Pagination limit="5" showBorders="false" />
```

*Fix:*
```jsx
// ✅ Passes number 5 and boolean false
<Pagination limit={5} showBorders={false} />
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Telemetry Status Template (IoT Telemetry)

**Scenario:** Construct a JSX component `DeviceStatus` that embeds dynamic variables, evaluates online status conditionally, and formats uptime durations.

**Requirements:**
1. Create `DeviceStatus` accepting `deviceName`, `isOnline`, `uptimeSeconds`, and `signalStrength`.
2. Format `uptimeSeconds` to hours (`(uptimeSeconds / 3600).toFixed(1)`).
3. Use camelCase attributes (`className`, `style`).
4. Embed dynamic JS expressions inside JSX curly braces `{}`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function DeviceStatus({ deviceName, isOnline, uptimeSeconds, signalStrength }) {
>   const uptimeHours = (uptimeSeconds / 3600).toFixed(1);
> 
>   return (
>     <div className={`device-card ${isOnline ? 'online' : 'offline'}`}>
>       <h3>{deviceName}</h3>
>       <p>Status: <strong>{isOnline ? 'CONNECTED' : 'DISCONNECTED'}</strong></p>
>       <p>Uptime: {uptimeHours} hrs</p>
>       <div 
>         className="signal-bar" 
>         style={{ width: `${signalStrength}%`, backgroundColor: isOnline ? '#4caf50' : '#f44336' }} 
>       />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Expression Embedding**: Curly braces `{}` evaluate dynamic JavaScript expressions like ternary conditions and numeric operations during render.
> 2. **JSX Style Objects**: Inline style attributes receive camelCase JavaScript objects (`{ backgroundColor: '...' }`).
> 3. **Template Strings**: JavaScript template strings (`className={`device-card ${...}`}`) generate dynamic CSS classes.
> 4. **DOM Attribute Normalization**: standard `className` properties prevent DOM reserved keyword conflicts.
> 
---

### Exercise 2: Financial Stock Ticker Card (Financial Trading)

**Scenario:** Build a `StockTicker` component rendering market quotes with color-coded price changes and dynamic gain/loss indicators.

**Requirements:**
1. Create `StockTicker` taking `symbol`, `price`, and `changePercent`.
2. Conditionally determine green (`gain`) vs red (`loss`) CSS classes.
3. Render directional arrows (`▲` or `▼`) based on `changePercent`.
4. Return semantic markup with clean prop expression syntax.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function StockTicker({ symbol, price, changePercent }) {
>   const isPositive = changePercent >= 0;
>   const statusClass = isPositive ? 'gain' : 'loss';
>   const arrow = isPositive ? '▲' : '▼';
> 
>   return (
>     <div className="ticker-card">
>       <span className="symbol">{symbol}</span>
>       <span className="price">${price.toFixed(2)}</span>
>       <span className={`change ${statusClass}`}>
>         {arrow} {Math.abs(changePercent).toFixed(2)}%
>       </span>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Co-located Logic and View**: Calculations for price formatting and direction arrows execute directly above returned JSX markup.
> 2. **Dynamic Content Interpolation**: Math utilities (`Math.abs`) run cleanly inside JSX template interpolation tags.
> 3. **Semantic Element Selection**: Structure uses semantic `<span>` tags styled via camelCase properties.
> 4. **Render Evaluation**: Evaluates pure output snapshots on every state/prop change.
> 
---

### Exercise 3: E-Commerce Product Rating Badge (E-Commerce)

**Scenario:** Build a `ProductRating` component that renders star symbols (`★` / `☆`) based on numeric rating props.

**Requirements:**
1. Create `ProductRating` taking `rating` (number 1-5) and `reviewCount`.
2. Construct star string array or loop expression inside JSX template.
3. Render accessible markup using `aria-label`.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> export function ProductRating({ rating, reviewCount }) {
>   const stars = Array.from({ length: 5 }, (_, index) => index < rating ? '★' : '☆');
> 
>   return (
>     <div className="rating-badge" aria-label={`Rating: ${rating} out of 5 stars`}>
>       <span className="stars-rendered">{stars.join('')}</span>
>       <span className="review-count">({reviewCount} reviews)</span>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Array Operations in JSX**: JavaScript array helpers (`Array.from`, `join`) execute seamlessly inside component logic.
> 2. **Accessibility Attributes**: ARIA accessibility properties like `aria-label` map directly to standard DOM attributes in JSX.
> 3. **Clean Template Evaluation**: Evaluates star representations dynamically without imperative string concatenations.
> 4. **Co-located Rendering**: Visual star markup and numerical counts reside together inside a unified functional component.
> 
---

## 6. Related Terms

- [Declarative Programming](declarative_programming.md) — The paradigm underlying JSX template declarations.
- [Fragments](fragments.md) — Tool for wrapping adjacent JSX elements without adding wrapper DOM nodes.
- [Components](components.md) — Modular functional units returning JSX trees.
- [Virtual DOM](virtual_dom.md) — The object tree generated by compiled `React.createElement` calls.

---

## 7. Key Takeaways

- **JSX** is a syntax extension that lets developers write HTML-like markup inside JavaScript files.
- Browsers cannot execute JSX directly; compilers (Babel/SWC) compile JSX to `React.createElement()` calls.
- Inject dynamic JavaScript expressions directly into JSX using curly braces `{}`.
- Always use camelCase for DOM attributes in JSX (`className`, `htmlFor`, `tabIndex`, `onClick`).
- JSX tags must return a single root element or use Fragments to group sibling tags.
