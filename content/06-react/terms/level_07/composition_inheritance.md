# Composition over Inheritance

> **Level 7 — Component Patterns**
> React's foundational architectural design paradigm favoring component assembly and slot composition over traditional Object-Oriented Class Inheritance for UI code reuse.

---

## 1. Prerequisites

- [Components](../level_01/components.md) — The independent modular elements assembled into complex UI trees.
- [Props (Properties)](../level_01/props.md) — Passing data and JSX elements to customize specialized components.

---

## 2. Term Category

**Component Pattern (architectural reuse paradigm)**: Composition over Inheritance is the core architectural principle governing code reuse in React.

While traditional Object-Oriented Programming (OOP) relies on Class Inheritance (`class PrimaryButton extends BaseButton`) to share behavior and UI logic, React rejects class hierarchies. Instead, React achieves complete reusability by combining (composing) small, focused components together using two primary patterns: **Containment** (using the `children` prop or explicit JSX slot props to nest elements) and **Specialization** (rendering a generic component inside a specialized wrapper configured with specific props).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional Object-Oriented UI frameworks, developers frequently built component libraries using deep inheritance hierarchies (`BaseButton` -> `IconButton` -> `PrimaryIconButton` -> `LoadingPrimaryIconButton`). 

This OOP approach suffered from the **Fragile Base Class Problem**: modifying a method or property in `BaseButton` broke subclasses unpredictably across the application. Furthermore, inheritance is extremely rigid: if a developer wanted an `IconButton` that inherited styling from `PrimaryButton` but hover animations from `SecondaryButton`, OOP forced developers into multiple inheritance anti-patterns or duplicate code.

React solved this by embracing functional composition. In React:
- **Components are functions, not classes.**
- **Containment (Slots):** Outer layout components do not hardcode inner components; they accept markup dynamically via `children` or slot props (`leftSlot={<Icon />}`).
- **Specialization:** Rather than inheriting from a base component, specialized components wrap generic components (`function PrimaryButton(props) { return <Button className="primary" {...props} />; }`).

### (2) Reality Metaphor

Imagine building physical structures using Lego bricks versus sculpting with solid block clay.

In **Class Inheritance (Clay Sculpting)**, you sculpt a generic human body out of clay. To make a police officer, you add a clay badge to the base figure. If you later want a pilot, you must carve away baked clay badge details, risking structural fractures to the base figure. If you want a character who is both a pilot and a police officer, OOP class hierarchies break down.

In **Component Composition (Lego Bricks)**, you possess independent Lego pieces: a head, a torso, a helmet, and a badge piece. To construct a police officer, you snap the badge piece onto the torso (**composing components**). To convert the officer into a pilot, you snap off the helmet and snap on a visor piece. The base Lego bricks remain untouched and can be combined into infinite custom configurations without modifying internal piece structures.

### (3) React Code Examples

#### Short Snippet

```jsx
import React from 'react';

// Generic Base Component
function Button({ variant, children, onClick }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// Specialization Pattern: Composing Generic Button rather than extending it
function DangerButton({ children, onClick }) {
  return (
    <Button variant="danger" onClick={onClick}>
      ⚠️ {children}
    </Button>
  );
}

export default DangerButton;
```

#### Fuller Example

```jsx
import React from 'react';

// Containment & Slot Composition Pattern for a Complex Layout
function AppLayout({ sidebarSlot, headerSlot, children }) {
  return (
    <div className="app-layout">
      <header className="top-header">{headerSlot}</header>
      <div className="layout-body">
        <aside className="sidebar-pane">{sidebarSlot}</aside>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

// Specialized Components
function LogoHeader() {
  return <h2>Industrial Control Systems</h2>;
}

function NavigationSidebar() {
  return (
    <nav>
      <ul>
        <li>Dashboard</li>
        <li>Telemetry</li>
        <li>System Logs</li>
      </ul>
    </nav>
  );
}

// Assembling the complete view via Composition
export default function App() {
  return (
    <AppLayout
      headerSlot={<LogoHeader />}
      sidebarSlot={<NavigationSidebar />}
    >
      <div className="dashboard-view">
        <h3>System Overview</h3>
        <p>All telemetry streams operational.</p>
      </div>
    </AppLayout>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to Use OOP Class Inheritance (`extends ParentComponent`) in React

**The mistake:** Writing `class SpecialButton extends BaseButton` to share component rendering output.

**Why it's wrong:** React does NOT support class inheritance for component rendering or lifecycle methods. The React component engine does not provide a mechanism to call `super.render()` to merge JSX output. Attempting class inheritance creates rigid code that breaks React's reconciliation model.

*Incorrect:*
```jsx
// ❌ Anti-pattern in React! Do NOT extend component classes.
class SpecialButton extends BaseButton {
  render() {
    return super.render({ color: 'blue' });
  }
}
```

*Fix:*
```jsx
// Wrap and compose the base component inside a functional wrapper instead
function SpecialButton(props) {
  return <BaseButton color="blue" {...props} />;
}
```

### Mistake 2: Creating Deeply Nested Wrapper Chains Instead of Using Named Slot Props

**The mistake:** Creating 8 layers of wrapper components just to pass custom UI elements down to a header container.

**Why it's wrong:** Creating deep wrapper component chains creates unnecessary Virtual DOM nesting and prop drilling. Expose explicit JSX element props (`leftSlot={<Icon />}`) to allow parent components to inject markup directly where needed.

*Incorrect:*
```jsx
// Creating 5 intermediate custom sub-classes for minor UI header variations
```

*Fix:*
```jsx
function Header({ title, leftSlot, rightSlot }) {
  return (
    <header>
      {leftSlot} <span>{title}</span> {rightSlot}
    </header>
  );
}
```

### Mistake 3: Duplicating UI Code Because a Base Component Lacks Customization Props

**The mistake:** Copy-pasting 50 lines of `<Card>` component JSX just to add an icon, because `<Card>` didn't have an icon prop.

**Why it's wrong:** Instead of copy-pasting component code, refactor `<Card>` to accept a `children` prop or `iconSlot` prop. Composition allows components to accommodate unexpected UI requirements without code duplication.

*Incorrect:*
```jsx
// Copy-pasting entire Card component definition to create CardWithIcon
```

*Fix:*
```jsx
function Card({ iconSlot, children }) {
  return (
    <div className="card">
      {iconSlot}
      <div className="body">{children}</div>
    </div>
  );
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Gateway Telemetry Card Composition

**Scenario:** You are building an industrial IoT dashboard. Create a generic `<TelemetryCard>` component and compose it to build a specialized `<CriticalAlertCard>` component.

**Requirements:**
1. Create generic `<TelemetryCard>` accepting `title`, `borderStyle`, and `children`.
2. Build specialized `<CriticalAlertCard>` composing `<TelemetryCard>` with a red border and alarm icon.
3. Include runtime assertions verifying card composition.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> // Generic Base Component
> function TelemetryCard({ title, borderStyle = '1px solid #ccc', children }) {
>   return (
>     <div className="card" style={{ border: borderStyle, padding: '16px' }}>
>       <h4>{title}</h4>
>       <div className="card-content">{children}</div>
>     </div>
>   );
> }
> 
> // Specialized Component Composed from Base TelemetryCard
> function CriticalAlertCard({ title, children }) {
>   return (
>     <TelemetryCard title={`🚨 ALARM: ${title}`} borderStyle="2px solid red">
>       {children}
>     </TelemetryCard>
>   );
> }
> 
> export function testTelemetryCardComposition() {
>   const res = CriticalAlertCard({ title: 'Overheat', children: 'Sensor #4' });
>   console.assert(res.props.borderStyle === '2px solid red', 'Specialized card prop injection check');
> }
> ```
>
> #### Technical Explanation
> 1. **Specialization Pattern**: `<CriticalAlertCard>` configures generic `<TelemetryCard>` props (`borderStyle="2px solid red"`).
> 2. **Containment Passthrough**: Passes `children` down to generic container components.
> 3. **Zero Class Inheritance**: Achieves code reusability without OOP class inheritance.
> 4. **Decoupled Styling**: Decouples generic card layout logic from alarm-specific visual styles.
> 
### Exercise 2: Financial Trading SplitPane Slot Composition

**Scenario:** Implement a financial trading desk layout component `<SplitPane>` accepting `leftPane` and `rightPane` JSX slot props.

**Requirements:**
1. Accept `leftPane` and `rightPane` JSX props.
2. Render slots inside a split flexbox container.
3. Include runtime test assertions for slot assignment.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> function SplitPane({ leftPane, rightPane }) {
>   return (
>     <div className="split-pane" style={{ display: 'flex', gap: '16px' }}>
>       <div className="pane-left" style={{ flex: 1 }}>{leftPane}</div>
>       <div className="pane-right" style={{ flex: 1 }}>{rightPane}</div>
>     </div>
>   );
> }
> 
> export function testSplitPaneSlots() {
>   const res = SplitPane({ leftPane: <div>Order Book</div>, rightPane: <div>Trade History</div> });
>   console.assert(res.props.children[0].props.children.props.children === 'Order Book', 'SplitPane left slot test');
> }
> ```
>
> #### Technical Explanation
> 1. **Named Slot Ingestion**: Accepts arbitrary JSX elements as named props (`leftPane`, `rightPane`).
> 2. **Flexible Sub-Component Placement**: Arranges slots within flexbox layout columns.
> 3. **Zero Prop Drilling**: Eliminates intermediate prop dependencies.
> 4. **Reusable Layout Engine**: Serves as a reusable structural component across different application views.
> 
### Exercise 3: Healthcare EHR Patient Summary Composition

**Scenario:** Create a specialized `<PatientSummaryCard>` composing a generic `<EHRBox>` container.

**Requirements:**
1. Build generic `<EHRBox>` wrapper.
2. Compose specialized `<PatientSummaryCard>` passing patient vitals JSX.
3. Add test assertions for EHR box composition.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React from 'react';
> 
> function EHRBox({ title, children }) {
>   return (
>     <div className="ehr-box">
>       <h3>{title}</h3>
>       {children}
>     </div>
>   );
> }
> 
> function PatientSummaryCard({ patientName, vitals }) {
>   return (
>     <EHRBox title={`Summary — ${patientName}`}>
>       <p>Heart Rate: {vitals.hr} BPM</p>
>       <p>SpO2: {vitals.spo2}%</p>
>     </EHRBox>
>   );
> }
> 
> export function testPatientSummaryComposition() {
>   const res = PatientSummaryCard({ patientName: 'John', vitals: { hr: 72, spo2: 99 } });
>   console.assert(res.type === EHRBox, 'Specialized component returns generic base');
> }
> ```
>
> #### Technical Explanation
> 1. **Containment Wrapping**: Uses `EHRBox` to supply generic container borders and headers.
> 2. **Specialized Title Configuration**: Formats dynamic title strings before passing to base components.
> 3. **Clean UI Assembly**: Assembles clinical views from small modular components.
> 4. **Maintainable Base System**: Modifying `EHRBox` styling updates all specialized medical cards across the application.
> 
---

## 6. Related Terms

- [Children Prop](children_prop.md) — The fundamental prop mechanism powering Containment composition.
- [Components](../level_01/components.md) — The modular building blocks combined via composition.
- [Higher-Order Components (HOC)](hoc.md) — Alternative wrapper function pattern for sharing logic.
- [Render Props](render_props.md) — Delegating component rendering via function props.

---

## 7. Key Takeaways

- React uses Composition over Class Inheritance to achieve UI and logic reusability.
- Use **Containment** (the `children` prop or explicit JSX slot props) for box-like layout components that wrap arbitrary markup.
- Use **Specialization** (rendering a generic component inside a specialized functional wrapper configured with specific props) for custom variants.
- Never attempt OOP class inheritance (`extends ParentComponent`) in React.
- Expose explicit slot props (`headerSlot={<Header />}`) to inject custom markup cleanly without deep wrapper nesting.
