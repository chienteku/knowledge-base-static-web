# Lifting State Up

> **Level 2 — State & Reactivity**
> The architectural pattern of relocating shared state to the closest common ancestor component so sibling components can stay synchronized.

---

## 1. Prerequisites

- [State](state.md) — The dynamic data needing to be shared between components.
- [Props (Properties)](../level_01/props.md) — The mechanism used to pass state values down and callback setters down/up.
- [Unidirectional Data Flow](unidirectional_flow.md) — The top-down data architecture enforcing state sharing boundaries.

---

## 2. Term Category

**Component Pattern (state sharing strategy)**: Lifting State Up is an architectural pattern in React used to synchronize state across sibling components. Because React enforces strict unidirectional data flow (data flows only downwards from parent to child), sibling components cannot pass state directly across to one another.

When two or more sibling components need to read or update the same dynamic data, developers "lift" the state up to their closest common parent component. The parent holds the `useState` hook, passes the state down to reader components via props, and passes state setter callbacks down to writer components via props.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex user interfaces, multiple components often need to reflect the same changing data. For example, consider an application with a `<SearchInput>` component where a user types text and a `<ResultsList>` component that filters records based on that query:

- If state lives inside `<SearchInput>`, `<ResultsList>` cannot read it.
- If state lives inside `<ResultsList>`, `<SearchInput>` cannot update it.
- Sibling components cannot pass props "sideways" to each other.

```text
               ┌────────────────────────┐
               │  Closest Common Parent │  <── State lives here
               └────────────────────────┘
                 /                    \
         (passes setter)        (passes state)
               /                        \
              ▼                          ▼
     ┌─────────────────┐        ┌──────────────────┐
     │   SearchInput   │        │   ResultsList    │
     └─────────────────┘        └──────────────────┘
```

To solve this, developers apply **Lifting State Up**:
1. Identify the **closest common parent** ancestor of the components needing the data.
2. Move the `useState` definition into that parent component.
3. Pass the state value down to reading components (e.g. `<ResultsList>`) as props.
4. Pass setter functions or event handler callbacks down to writing components (e.g. `<SearchInput>`) as props.
5. When the writer component triggers the callback, the parent updates its state, re-renders, and passes updated props down to both children simultaneously.

### (2) Reality Metaphor
Imagine two roommates sharing a apartment refrigerator.

- **Isolated State (Broken System):** Roommate A keeps a private shopping list notepad inside their bedroom drawer, and Roommate B keeps a separate list inside their own bedroom drawer. Because they cannot see each other's notepads, both roommates purchase milk on the same day, cluttering the fridge with extra cartons (**desynchronized state**).
- **Lifting State Up (Shared Refrigerator List):** They lift the shopping list up to the kitchen refrigerator door (**the common parent**). When Roommate A notices milk is low, they write it on the fridge door list (**triggering state setter**). Roommate B looks at the fridge door list before shopping (**reading prop state**), ensuring both roommates stay perfectly synchronized.

### (3) React Code Examples

#### Short Snippet
```jsx
// Parent component holds shared state and passes values/setters down
function SharedParent() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <SearchInput query={query} onQueryChange={setQuery} />
      <ResultsList query={query} />
    </div>
  );
}
```

#### Fuller Example
```jsx
import React, { useState } from 'react';

// 1. Writer Component: receives query value and callback prop
function SearchInput({ query, onQueryChange }) {
  return (
    <div className="search-bar">
      <input 
        type="text"
        value={query} 
        onChange={e => onQueryChange(e.target.value)} 
        placeholder="Filter results..."
      />
      {query && <button onClick={() => onQueryChange('')}>Clear</button>}
    </div>
  );
}

// 2. Reader Component: receives query value as read-only prop
function ResultsList({ query, items }) {
  const filtered = items.filter(item => 
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ul className="results-list">
      {filtered.map((item, idx) => <li key={idx}>{item}</li>)}
      {filtered.length === 0 && <li>No matching records found.</li>}
    </ul>
  );
}

// 3. Closest Common Parent: holds shared state
export default function SynchronizedSearch({ items }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="search-container">
      <h3>Synchronized Directory</h3>
      <SearchInput query={searchQuery} onQueryChange={setSearchQuery} />
      <ResultsList query={searchQuery} items={items} />
    </div>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Lifting State Too High (Causing Prop Drilling and Root Re-renders)

**The mistake:** Lifting state up to a top-level root component (like `App.jsx`) when only two nested components in a deep subtree need to share it.

**Why it's wrong:** Lifting state too high forces developers to manually pass state and callback props through dozens of intermediate components that do not care about the data (**Prop Drilling**). Additionally, updating root state forces the ENTIRE application component tree to re-render, degrading performance.

*Incorrect:*
```jsx
// ❌ Lifting local search query state up to root App component!
function App() {
  const [search, setSearch] = useState('');
  return <Layout search={search} setSearch={setSearch} />;
}
```

*Fix:*
```jsx
// ✅ Lift state ONLY to the closest common parent component
function SearchWidget() {
  const [search, setSearch] = useState('');
  return (
    <div>
      <SearchInput search={search} onChange={setSearch} />
      <SearchResults search={search} />
    </div>
  );
}
```

### Mistake 2: Duplicating Lifted State in Child Local `useState`

**The mistake:** Receiving a lifted state value as a prop, but duplicating it into local child state: `const [localQuery, setLocalQuery] = useState(props.query)`.

**Why it's wrong:** Copying props into local state creates two separate sources of truth. When the parent updates the lifted state, the child's local `useState` ignores the prop change, causing desynchronization bugs.

*Incorrect:*
```jsx
function ChildReader({ query }) {
  // ❌ Duplicate state snapshot ignores parent query prop updates!
  const [localQuery, setLocalQuery] = useState(query);
  return <div>Search: {localQuery}</div>;
}
```

*Fix:*
```jsx
function ChildReader({ query }) {
  // ✅ Read prop directly without local state duplication
  return <div>Search: {query}</div>;
}
```

### Mistake 3: Passing Down Numerous Individual State Setters Instead of Handler Callbacks

**The mistake:** Passing 8 separate `setField1`, `setField2`, `setField3` setter functions down to child components.

**Why it's wrong:** Passing raw `useState` setters tightly couples child components to parent implementation details. Pass domain-specific handler callbacks (e.g. `onFormChange(fieldName, value)`) to maintain clean component abstraction boundaries.

*Incorrect:*
```jsx
// ❌ Tightly couples child to raw parent setter signatures
<ChildForm setField1={setField1} setField2={setField2} />
```

*Fix:*
```jsx
// ✅ Clean domain callback signature
<ChildForm onChange={handleFieldChange} />
```

---

## 5. Practice Exercises

### Exercise 1: IoT Temperature Unit Converter (IoT Telemetry)

**Scenario:** An industrial IoT control view features a Celsius input field and a Fahrenheit input field. Typing in either field must automatically calculate and update the sibling field. Lift state up to their common parent.

**Requirements:**
1. Create `CelsiusInput` and `FahrenheitInput` writer components.
2. Create `TemperatureConverter` parent holding `temperature` and `scale` ('c' | 'f') state.
3. Calculate derived values for both fields.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function TempInput({ scale, temperature, onTempChange }) {
>   const scaleNames = { c: 'Celsius', f: 'Fahrenheit' };
>   return (
>     <label>
>       Temperature in {scaleNames[scale]}:
>       <input 
>         type="number" 
>         value={temperature} 
>         onChange={e => onTempChange(e.target.value)} 
>       />
>     </label>
>   );
> }
> 
> export function TemperatureConverter() {
>   const [temperature, setTemperature] = useState('');
>   const [scale, setScale] = useState('c');
> 
>   const handleCelsiusChange = (val) => {
>     setScale('c');
>     setTemperature(val);
>   };
> 
>   const handleFahrenheitChange = (val) => {
>     setScale('f');
>     setTemperature(val);
>   };
> 
>   // Derived conversions
>   const celsius = scale === 'f' && temperature !== '' 
>     ? (((parseFloat(temperature) - 32) * 5) / 9).toFixed(1) 
>     : temperature;
>     
>   const fahrenheit = scale === 'c' && temperature !== '' 
>     ? (((parseFloat(temperature) * 9) / 5) + 32).toFixed(1) 
>     : temperature;
> 
>   return (
>     <div className="converter-card">
>       <h4>Telemetry Temperature Sync</h4>
>       <TempInput scale="c" temperature={celsius} onTempChange={handleCelsiusChange} />
>       <TempInput scale="f" temperature={fahrenheit} onTempChange={handleFahrenheitChange} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Common Parent State**: `temperature` and `scale` state live in the common `TemperatureConverter` parent.
> 2. **Controlled Props**: Inputs receive calculated `celsius` and `fahrenheit` values via props.
> 3. **Synchronized Updates**: Updating either input notifies the parent, updating both sibling fields simultaneously.
> 4. **Single Source of Truth**: Eliminates conflicting state data between temperature scales.
> 
---

### Exercise 2: Financial Order Book Filter & Summary (Financial Trading)

**Scenario:** A trading workstation features an `OrderFilter` component (allowing users to set max price) and an `OrderSummary` component (displaying total volume). Lift state up to sync filtered results across components.

**Requirements:**
1. Create `OrderFilter` writer component.
2. Create `OrderSummary` reader component.
3. Create `TradingWorkstation` parent managing `maxPrice` state.
4. Filter order lists and calculate total volume as derived state.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function OrderFilter({ maxPrice, onMaxPriceChange }) {
>   return (
>     <div className="filter-box">
>       <label>Filter Max Price: ${maxPrice}</label>
>       <input 
>         type="range" 
>         min="100" 
>         max="500" 
>         value={maxPrice} 
>         onChange={e => onMaxPriceChange(Number(e.target.value))} 
>       />
>     </div>
>   );
> }
> 
> function OrderSummary({ filteredOrders }) {
>   const totalVol = filteredOrders.reduce((sum, o) => sum + o.volume, 0);
>   return (
>     <div className="summary-box">
>       <h5>Matching Orders: {filteredOrders.length}</h5>
>       <p>Total Volume: {totalVol} units</p>
>     </div>
>   );
> }
> 
> export function TradingWorkstation({ orders = [] }) {
>   const [maxPrice, setMaxPrice] = useState(300);
> 
>   // Derived State filtered from lifted maxPrice
>   const filteredOrders = orders.filter(o => o.price <= maxPrice);
> 
>   return (
>     <div className="workstation">
>       <h4>Trading Workstation</h4>
>       <OrderFilter maxPrice={maxPrice} onMaxPriceChange={setMaxPrice} />
>       <OrderSummary filteredOrders={filteredOrders} />
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **State Placement**: `maxPrice` state is lifted up to `TradingWorkstation`.
> 2. **Prop Synchronization**: Changing the slider in `OrderFilter` updates parent state, automatically updating `OrderSummary`.
> 3. **Top-Down Flow**: Data flows downward from parent to children smoothly.
> 4. **Decoupled Architecture**: `OrderSummary` remains pure, taking ready-filtered orders via props.
> 
---

### Exercise 3: E-Commerce Accordion Single Active Item (E-Commerce)

**Scenario:** An e-commerce FAQ accordion displays multiple collapsible panels. Only ONE panel can be open at a time. Lift active index state up from child panels to the parent accordion.

**Requirements:**
1. Create `AccordionPanel` taking `title`, `children`, `isOpen`, and `onOpen` props.
2. Create `Accordion` parent managing `activeIndex` state.
3. Ensure clicking a closed panel opens it and closes all other sibling panels.
4. Provide structured implementation with technical explanation.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState } from 'react';
> 
> function AccordionPanel({ title, children, isOpen, onOpen }) {
>   return (
>     <div className="accordion-item">
>       <button className="accordion-header" onClick={onOpen}>
>         {title} {isOpen ? '▲' : '▼'}
>       </button>
>       {isOpen && <div className="accordion-body">{children}</div>}
>     </div>
>   );
> }
> 
> export function FAQAccordion() {
>   const [activeIndex, setActiveIndex] = useState(0); // Lifted active index state
> 
>   const faqs = [
>     { title: 'Shipping Policy', content: 'Free shipping on orders over $50.' },
>     { title: 'Return Policy', content: '30-day money-back guarantee.' },
>     { title: 'Payment Options', content: 'We accept Visa, Mastercard, and PayPal.' }
>   ];
> 
>   return (
>     <div className="accordion-container">
>       <h4>Frequently Asked Questions</h4>
>       {faqs.map((faq, index) => (
>         <AccordionPanel
>           key={index}
>           title={faq.title}
>           isOpen={activeIndex === index}
>           onOpen={() => setActiveIndex(index)}
>         >
>           {faq.content}
>         </AccordionPanel>
>       ))}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Lifted Accordion State**: `activeIndex` is moved up from individual panels to `FAQAccordion`.
> 2. **Mutual Exclusion**: Because the parent controls `activeIndex`, clicking one panel automatically closes sibling panels.
> 3. **Controlled Props**: `isOpen={activeIndex === index}` evaluates panel visibility declaratively.
> 4. **Encapsulated Callbacks**: `onOpen={() => setActiveIndex(index)}` passes clean arrow callbacks down to children.
> 
---

## 6. Related Terms

- [State](state.md) — The dynamic data lifted up to common parent components.
- [Props (Properties)](../level_01/props.md) — The vehicle carrying lifted state values down and callbacks up.
- [Unidirectional Data Flow](unidirectional_flow.md) — The data architecture requiring state to be lifted up for sibling sharing.
- [Prop Drilling](../level_06/prop_drilling.md) — The maintainability issue caused by lifting state too high.

---

## 7. Key Takeaways

- **Lifting State Up** synchronizes sibling components by moving shared state to their closest common parent.
- Props carry state values down to reader components and setter callbacks down to writer components.
- Sibling components cannot communicate directly in React due to unidirectional top-down data flow.
- Always lift state to the **closest** common ancestor to prevent prop drilling and unnecessary re-renders.
- Avoid duplicating lifted prop values into local child `useState` variables.
