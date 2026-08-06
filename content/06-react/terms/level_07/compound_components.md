# Compound Components

> **Level 7 — Component Patterns**
> A parent + subcomponents sharing implicit state via context (`<Tabs><Tab/></Tabs>`).

---

## 1. Prerequisites
- [The Context API](../level_06/context_api.md) — The state-sharing mechanism used under the hood.
- [Children Prop](children_prop.md) — The property enabling flexible subcomponent layout structures.

---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
When building complex, interactive UI controls (such as tabs, accordions, dropdown select menus, or menu bars), parent and child elements need to share state. For example, clicking a tab button must tell the parent layout to update the active index, which in turn determines which tab panel is visible.

A basic prop-driven approach results in a single, complex component with a verbose API:
```jsx
// MONOLITHIC PROP API: Rigid and difficult to customize!
<Tabs 
  activeIndex={activeIndex} 
  onChange={setIndex} 
  data={[{ label: 'Tab 1', content: '...' }, { label: 'Tab 2', content: '...' }]} 
/>
```

This monolithic structure is highly inflexible: you cannot easily insert an icon inside one tab button, add a separator element between tabs, or adjust the nesting structure of your HTML layout without modifying the `data` array structure.

To allow flexible layouts while sharing state implicitly, developers use the **Compound Components Pattern**:
-   **Coordinated Ecosystem:** Split the interface into a group of related components (e.g. `<Tabs>`, `<TabList>`, `<Tab>`, `<TabPanel>`).
-   **Shared Context:** The parent component acts as a wrapper that manages state and exposes it to all child components via a private React Context Provider.
-   **Implicit Sharing:** Child components subscribe to the parent's context using `useContext` under the hood. This allows developers to arrange, nest, and style the subcomponents however they choose.

---

### (2) Reality Metaphor
Imagine a passenger train.
- **Monolithic Component (City Bus):** A bus is a single, rigid vehicle. You cannot remove seats, insert a dining table in the middle, or rearrange the layout. The configuration is fixed at the factory.
- **Compound Components (Coupled Train Cars):** The train engine (**the parent component**) provides a power line (**the Context Provider**) running the length of the train. Each individual carriage (**the child components**)—such as the dining car, passenger car, and luggage van—can be coupled in any order. They all draw power from the main engine line implicitly, but you can arrange and customize them to fit the journey.

---

### (3) React Code Example: Building a Tab Layout

```jsx
import React, { createContext, useContext, useState } from 'react';

// 1. Create the shared context
const TabsContext = createContext(null);

// 2. Parent Component: Manages state and provides context
function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">{children}</div>
    </TabsContext.Provider>
  );
}

// Helper hook to protect child context access
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs child components must be used inside a <Tabs> provider!');
  }
  return context;
}

// 3. Child Component: Tab Trigger Button
function Tab({ value, children }) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      className={`tab-btn ${isActive ? 'active' : ''}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

// 4. Child Component: Tab Content Panel
function Panel({ value, children }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null; // Hide if not active
  return <div className="tab-panel">{children}</div>;
}

// 5. Compose the compound components
Tabs.Tab = Tab;
Tabs.Panel = Panel;

export default function App() {
  return (
    <Tabs defaultValue="home">
      <div className="tab-bar">
        {/* We can structure and style the buttons however we want! */}
        <Tabs.Tab value="home">🏠 Home</Tabs.Tab>
        <span className="separator">|</span>
        <Tabs.Tab value="settings">⚙️ Settings</Tabs.Tab>
      </div>

      <Tabs.Panel value="home">
        <h3>Welcome Home!</h3>
      </Tabs.Panel>
      <Tabs.Panel value="settings">
        <h3>System Settings</h3>
      </Tabs.Panel>
    </Tabs>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Rendering a compound subcomponent outside of its parent container

**The mistake:** Rendering a component that expects shared context (like `<Tabs.Tab>`) outside of the parent provider wrapper:

```jsx
// BUG: Will crash because there is no parent <Tabs> context provider!
function Header() {
  return <Tabs.Tab value="home">Home</Tabs.Tab>;
}
```

**Why it's wrong:** Sibling or child elements in a compound pattern rely on `useContext` to access state. If a child is rendered outside the parent provider, `useContext` returns `null`, and attempting to destructure it will cause a runtime crash.

*Fix:* Implement a safety check inside your custom context hook (like `useTabsContext`) to throw a clear, developer-friendly error message if the context is missing.

---



### Mistake 2: Attempting to Use Compound Components Without Passing Shared Context to Sub-Components

**The mistake:** Creating `<Select>` and `<Option>` components where `<Option>` cannot access selected value because Context was omitted.

**Why it's wrong:** Compound components (`<Select>`, `<Select.Option>`) rely on a shared implicit Context to communicate state between parent and child sub-components without explicit prop drilling.

*Incorrect:*
```javascript
// Option sub-component unable to read active value because Provider was omitted
```

*Fix:*
```javascript
Wrap sub-components in parent SelectContext.Provider
```

### Mistake 3: Restricting Compound Component Children Placement to Immediate Direct Children Only

**The mistake:** Using `React.Children.map()` directly in parent compound component expecting sub-components to be immediate children.

**Why it's wrong:** `React.Children.map()` works ONLY on immediate direct child elements. If a user wraps `<Option>` inside a `<div>`, `Children.map` breaks! Use Context API so sub-components can be nested at arbitrary DOM depths.

*Incorrect:*
```javascript
React.Children.map(props.children, child => ...) // ❌ Fails if sub-components are nested inside divs!
```

*Fix:*
```javascript
Use React Context API to share state with deeply nested sub-components
```

## 6. Practice Exercises

### Exercise 1: Compound Toggle Accordion

**Problem:** Complete the accordion component below by implementing a compound pattern. The accordion should toggle its visible pane when clicked:

```jsx
import React, { createContext, useContext, useState } from 'react';

const AccordionContext = createContext(null);

// Solution:
function Accordion({ children }) {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}

function Item({ id, children }) {
  return <div className="accordion-item">{children}</div>;
}

function Trigger({ id, children }) {
  const { toggle } = useContext(AccordionContext);
  return <button onClick={() => toggle(id)}>{children}</button>;
}

function Content({ id, children }) {
  const { openId } = useContext(AccordionContext);
  if (openId !== id) return null;
  return <div className="accordion-content">{children}</div>;
}

// Composition Usage
function App() {
  return (
    <Accordion>
      <Item id="pane-1">
        <Trigger id="pane-1">Item A</Trigger>
        <Content id="pane-1">Details A</Content>
      </Item>
    </Accordion>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Compound Select Component Pattern

**Problem:** Build compound `Select` component with `Select.Option` sub-component using Context.

**Expected output:**
> [!check]- Answer
> ```text
> const SelectContext = createContext(); function Select({ value, onChange, children }) { return <SelectContext.Provider value={{ value, onChange }}>{children}</SelectContext.Provider>; } Select.Option = function Option({ val, children }) { const { value, onChange } = useContext(SelectContext); return <div onClick={() => onChange(val)} className={value === val ? 'active' : ''}>{children}</div>; };
> ```
> ```javascript
> const SelectContext = createContext();
>
> function Select({ value, onChange, children }) {
>   return (
>     <SelectContext.Provider value={{ value, onChange }}>
>       {children}
>     </SelectContext.Provider>
>   );
> }
>
> Select.Option = function Option({ val, children }) {
>   const { value, onChange } = useContext(SelectContext);
>   return (
>     <div
>       onClick={() => onChange(val)}
>       className={value === val ? 'active' : ''}
>     >
>       {children}
>     </div>
>   );
> };
> ```
>
> **Explanation:** Compound components share implicit state via Context while exposing expressive declarative markup.
> 
---

### Exercise 3: Benefits of Compound Component Pattern

**Problem:** List 2 benefits of Compound Component design pattern (1. Expressive declarative API; 2. Flexible layout sub-component positioning).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Expressive declarative API; 2. Flexible layout sub-component positioning
> ```
> ```text
> 1. Expressive declarative API; 2. Flexible layout sub-component positioning
> ```
>
> **Explanation:** Compound components allow consumers to arrange child elements flexibly.
> 
## 7. Related Terms
- [The Context API](../level_06/context_api.md) — The state transport vehicle used by compound parent-child pairings.
- [Children Prop](children_prop.md) — The JSX container that allows subcomponent markup structures.
- [Higher-Order Components (HOC)](hoc.md) — Related concept: Higher-Order Components (HOC).

---

## 8. Key Takeaways
- The Compound Components Pattern shares state implicitly between parent and child elements.
- It provides high layout flexibility, allowing custom nesting and styling.
- The parent component manages the state and exposes it via a Context Provider.
- Child components subscribe to the parent's context using `useContext`.
- Always check if context is undefined inside child components and throw descriptive errors.
- Group subcomponents onto the parent namespace (e.g. `Tabs.Tab = Tab`) to improve discoverability.
