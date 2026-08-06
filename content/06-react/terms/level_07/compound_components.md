# Compound Components

> **Level 7 — Component Patterns**
> A design pattern where a group of related components work together sharing implicit state via Context to build expressive, flexible UI controls.

---

## 1. Prerequisites

- [The Context API](../level_06/context_api.md) — The state-sharing mechanism used under the hood to coordinate compound subcomponents.
- [Children Prop](children_prop.md) — Enabling flexible, nested markup structures within compound parent components.
- [Composition over Inheritance](composition_inheritance.md) — Assembling complex UI controls from small, modular subcomponents.

---

## 2. Term Category

**Component Pattern (implicit state coordination)**: The Compound Components Pattern is an advanced React design pattern used to construct complex, multi-part UI controls (such as Tabs, Accordions, Dropdown Select Menus, or Steppers).

Instead of rendering a single monolithic component driven by a giant, rigid configuration object (`<Tabs data={tabArray} />`), the Compound Components pattern splits the control into a coordinated family of components (`<Tabs>`, `<Tabs.List>`, `<Tabs.Tab>`, `<Tabs.Panel>`). The parent container component manages active state and shares it implicitly with all nested subcomponents via a private React Context. Subcomponents subscribe to this context using `useContext` under the hood, allowing developers to nest, re-order, and style child elements freely in JSX.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

When building interactive UI controls (like a tabbed navigation bar or accordion list), sub-elements must coordinate state. For example, clicking a tab button must notify the parent container to switch active tab state, which in turn determines which tab panel renders.

Building this with a monolithic component API results in a rigid structure:

```jsx
// MONOLITHIC API: Rigid, difficult to customize or insert custom HTML!
<Tabs data={[{ title: 'Tab 1', content: <Content1 /> }, { title: 'Tab 2', content: <Content2 /> }]} />
```

This monolithic structure makes it impossible to insert custom HTML icons between tab buttons, add separator lines, or re-arrange element layout without altering the underlying data schema. The Compound Components pattern solves this by giving consumers full control over component layout and styling while hiding state management inside an implicit context pipeline.

### (2) Reality Metaphor

Imagine a passenger train composed of a locomotive engine and coupled train cars.

A **Monolithic Component** is like a rigid city bus. The engine, seating rows, windows, and doors are molded into a single fixed chassis at the factory. You cannot insert a dining table in the middle of seat row #3 or detach the rear section.

**Compound Components** are like a coupled train. The main locomotive engine (**the parent component `<Tabs>`**) provides a central electric power line (**the private React Context Provider**) running the entire length of the train. Each individual carriage (**subcomponents `<Tabs.Tab>`, `<Tabs.Panel>`**)—such as the dining car, sleeper car, or observation deck—couples onto the train in any order chosen by the conductor. All carriages draw electric power from the locomotive's central line implicitly, while allowing the conductor to arrange and decorate each carriage freely.

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { createContext, useContext, useState } from 'react';

const ToggleContext = createContext(null);

// Parent Compound Component
function Toggle({ children }) {
  const [on, setOn] = useState(false);
  const toggle = () => setOn((prev) => !prev);
  return <ToggleContext.Provider value={{ on, toggle }}>{children}</ToggleContext.Provider>;
}

// Subcomponent Subscribing Implicitly
function ToggleButton() {
  const { on, toggle } = useContext(ToggleContext);
  return <button onClick={toggle}>{on ? 'ON' : 'OFF'}</button>;
}

// Compound Namespace Assignment
Toggle.Button = ToggleButton;
export default Toggle;
```

#### Fuller Example

```jsx
import React, { createContext, useContext, useState } from 'react';

// 1. Create Private Context
const TabsContext = createContext(null);

// Custom hook to protect child context access
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs subcomponents must be rendered within a <Tabs> container');
  }
  return context;
}

// 2. Parent Container Component
export function Tabs({ defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-compound-container">{children}</div>
    </TabsContext.Provider>
  );
}

// 3. Subcomponent: Tab Button
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

// 4. Subcomponent: Tab Panel
function Panel({ value, children }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null; // Hide if inactive
  return <div className="tab-panel">{children}</div>;
}

// 5. Attach subcomponents to Parent namespace
Tabs.Tab = Tab;
Tabs.Panel = Panel;

// Usage Example showcasing complete layout freedom
export function IndustrialTabsDemo() {
  return (
    <Tabs defaultValue="telemetry">
      <div className="custom-tab-bar">
        {/* Consumers can arrange and style tabs freely! */}
        <Tabs.Tab value="telemetry">📊 Telemetry</Tabs.Tab>
        <span className="divider">|</span>
        <Tabs.Tab value="alarms">🚨 Alarms</Tabs.Tab>
      </div>

      <div className="panel-area">
        <Tabs.Panel value="telemetry">
          <h4>Live Sensor Stream</h4>
          <p>Temperature: 42°C | Pressure: 101 kPa</p>
        </Tabs.Panel>

        <Tabs.Panel value="alarms">
          <h4>Active Alarm Logs</h4>
          <p>No critical alarms registered.</p>
        </Tabs.Panel>
      </div>
    </Tabs>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Rendering Compound Subcomponents Outside the Parent Container

**The mistake:** Rendering `<Tabs.Tab>` outside of the `<Tabs>` parent container in JSX.

**Why it's wrong:** Subcomponents rely on `useContext` to read parent state. If rendered outside the parent provider wrapper, `useContext` returns `null` or `undefined`, causing destructuring crashes (`TypeError: Cannot destructure property 'activeTab' of 'null'`).

*Incorrect:*
```jsx
function BrokenHeader() {
  // ❌ Crashes! Rendered outside <Tabs> provider
  return <Tabs.Tab value="home">Home</Tabs.Tab>;
}
```

*Fix:*
```jsx
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs subcomponents must be used inside a <Tabs> provider');
  }
  return context;
}
```

### Mistake 2: Using `React.Children.map()` Instead of Context for State Sharing

**The mistake:** Inspecting and mapping immediate `props.children` to pass props to subcomponents.

**Why it's wrong:** `React.Children.map()` ONLY works on *immediate direct child elements*. If a developer wraps a subcomponent inside a simple `<div>` or wrapper tag (`<div><Tabs.Tab /></div>`), `React.Children.map()` fails to find the subcomponent, breaking state passing. Use the Context API so subcomponents can be nested at arbitrary DOM depths.

*Incorrect:*
```jsx
// ❌ Fails if <Tabs.Tab> is wrapped inside a sub-div!
React.Children.map(props.children, child => React.cloneElement(child, { activeTab }));
```

*Fix:*
```jsx
// Use Context API for implicit state sharing at arbitrary depths
```

### Mistake 3: Omitting Namespace Attachments (`Parent.Child = Child`)

**The mistake:** Exporting 10 standalone subcomponent functions separately (`export function Tab()`, `export function Panel()`).

**Why it's wrong:** Exporting subcomponents as loose standalone functions litters the module export namespace and makes component discoverability difficult. Attaching subcomponents directly to the parent namespace (`Tabs.Tab = Tab`) provides clean auto-complete in IDEs.

*Incorrect:*
```jsx
export function Tab() { ... }
export function Panel() { ... }
```

*Fix:*
```jsx
Tabs.Tab = Tab;
Tabs.Panel = Panel;
export default Tabs;
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Accordion Compound Component

**Scenario:** Implement a compound `<Accordion>` component where clicking `<Accordion.Header>` toggles the visibility of matching `<Accordion.Body>`.

**Requirements:**
1. Create `AccordionContext` for implicit state sharing.
2. Implement `<Accordion>`, `<Accordion.Item>`, `<Accordion.Header>`, and `<Accordion.Body>`.
3. Include context safety guard checks in subcomponents.
4. Add runtime assertions for accordion rendering.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState } from 'react';
> 
> const AccordionContext = createContext(null);
> 
> function useAccordion() {
>   const ctx = useContext(AccordionContext);
>   if (!ctx) throw new Error('Accordion subcomponents must be used in <Accordion>');
>   return ctx;
> }
> 
> export function Accordion({ children, defaultOpenId = null }) {
>   const [openId, setOpenId] = useState(defaultOpenId);
>   const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));
> 
>   return (
>     <AccordionContext.Provider value={{ openId, toggle }}>
>       <div className="accordion">{children}</div>
>     </AccordionContext.Provider>
>   );
> }
> 
> function Header({ id, children }) {
>   const { toggle } = useAccordion();
>   return <button onClick={() => toggle(id)}>{children}</button>;
> }
> 
> function Body({ id, children }) {
>   const { openId } = useAccordion();
>   if (openId !== id) return null;
>   return <div className="accordion-body">{children}</div>;
> }
> 
> Accordion.Header = Header;
> Accordion.Body = Body;
> 
> export function testAccordionCompound() {
>   const res = Accordion({ defaultOpenId: 'item1', children: null });
>   console.assert(res.props.value.openId === 'item1', 'Accordion initial state check');
> }
> ```
>
> #### Technical Explanation
> 1. **Implicit State Coordination**: Coordinates active accordion items via private `AccordionContext`.
> 2. **Arbitrary Placement Freedom**: Subcomponents compute visibility independently via `openId === id`.
> 3. **Context Safety Guard**: Protects subcomponents with custom hook error handling.
> 4. **Namespace Organization**: Groups subcomponents cleanly onto `Accordion.Header` and `Accordion.Body`.
> 
### Exercise 2: Financial Trading Desk Compound Select Menu

**Scenario:** Build a compound dropdown select control `<Select>` with subcomponents `<Select.Option>` and `<Select.Trigger>`.

**Requirements:**
1. Share active selected value and setter via Context.
2. Implement `<Select.Option>` highlighting active selection.
3. Include runtime test assertions for compound select component output.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState } from 'react';
> 
> const SelectContext = createContext(null);
> 
> export function Select({ defaultValue, onChange, children }) {
>   const [val, setVal] = useState(defaultValue);
>   const selectOption = (newVal) => {
>     setVal(newVal);
>     if (onChange) onChange(newVal);
>   };
> 
>   return (
>     <SelectContext.Provider value={{ val, selectOption }}>
>       <div className="select-compound">{children}</div>
>     </SelectContext.Provider>
>   );
> }
> 
> function Option({ value, children }) {
>   const ctx = useContext(SelectContext);
>   if (!ctx) throw new Error('Option must be used in Select');
>   const isSelected = ctx.val === value;
> 
>   return (
>     <div
>       className={`select-option ${isSelected ? 'selected' : ''}`}
>       onClick={() => ctx.selectOption(value)}
>     >
>       {children}
>     </div>
>   );
> }
> 
> Select.Option = Option;
> 
> export function testSelectCompound() {
>   const res = Select({ defaultValue: 'USD', children: null });
>   console.assert(res.props.value.val === 'USD', 'Compound select initial value check');
> }
> ```
>
> #### Technical Explanation
> 1. **Shared State Coordination**: Drives dropdown selection via Context `selectOption` updaters.
> 2. **Active Style Branching**: Applies `.selected` CSS classes dynamically inside subcomponents.
> 3. **Declarative Markup API**: Offers expressive, readable component structures (`<Select.Option value="USD">`).
> 4. **Encapsulated Callbacks**: Triggers parent `onChange` handlers seamlessly upon option selection.
> 
### Exercise 3: Healthcare Patient EHR Stepper Compound Component

**Scenario:** Create an EHR patient wizard compound stepper component `<Stepper>` with `<Stepper.Step>` and `<Stepper.Controls>`.

**Requirements:**
1. Manage `activeStep` integer state in `<Stepper>`.
2. Implement `<Stepper.Step>` showing content only when `stepIndex === activeStep`.
3. Include test assertions for stepper step calculations.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { createContext, useContext, useState } from 'react';
> 
> const StepperContext = createContext(null);
> 
> export function Stepper({ children }) {
>   const [activeStep, setActiveStep] = useState(1);
>   const next = () => setActiveStep((s) => s + 1);
>   const prev = () => setActiveStep((s) => Math.max(s - 1, 1));
> 
>   return (
>     <StepperContext.Provider value={{ activeStep, next, prev }}>
>       <div className="stepper-compound">{children}</div>
>     </StepperContext.Provider>
>   );
> }
> 
> function Step({ index, children }) {
>   const ctx = useContext(StepperContext);
>   if (ctx.activeStep !== index) return null;
>   return <div className="step-content">{children}</div>;
> }
> 
> Stepper.Step = Step;
> 
> export function testStepperCompound() {
>   const res = Stepper({ children: null });
>   console.assert(res.props.value.activeStep === 1, 'Stepper initial step check');
> }
> ```
>
> #### Technical Explanation
> 1. **Step Visibility Guard**: Renders child steps selectively based on active step indices.
> 2. **Centralized Step Navigation**: Manages step advancement logic (`next`, `prev`) inside parent context.
> 3. **Declarative Multi-Step Form**: Provides expressive markup for complex multi-step patient intake forms.
> 4. **Protected Subcomponents**: Validates context presence before rendering step panels.
> 
---

## 6. Related Terms

- [The Context API](../level_06/context_api.md) — The state-sharing pipeline powering compound component subcomponents.
- [Children Prop](children_prop.md) — The slot primitive enabling subcomponent nesting.
- [Composition over Inheritance](composition_inheritance.md) — The overarching architectural design paradigm.
- [Render Props](render_props.md) — Alternative logic-sharing component pattern.

---

## 7. Key Takeaways

- The Compound Components pattern coordinates a family of related subcomponents using implicit state shared via Context.
- It provides maximum layout flexibility, allowing consumers to arrange, nest, and style subcomponents freely in JSX.
- Parent components manage state and expose a private Context Provider; subcomponents consume state via `useContext`.
- Always add safety guard checks in custom context hooks to throw descriptive errors if subcomponents are rendered outside the parent container.
- Attach subcomponents directly to the parent component namespace (e.g. `Tabs.Tab = Tab`) for clean IDE auto-complete.
