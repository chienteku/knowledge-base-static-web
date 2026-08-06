# Composition over Inheritance

> **Level 7 — Component Patterns**
> React's core reuse strategy — compose components instead of extending classes.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — The modular elements being combined.
- [Children Prop](children_prop.md) — The primary mechanism enabling element nesting.

---

## 2. Term Category
- **Component Pattern**

---

## 3. Environment Context
- **Client-Side (SPA) / Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional Object-Oriented Programming (OOP) patterns, code reuse is achieved via **Inheritance**: you define a base class (e.g. `Button`) and extend it to create subclasses (e.g. `IconButton` or `PrimaryButton`).

While inheritance works well for backend data models, it is highly rigid when building user interfaces. If you want an `IconButton` that inherits the styling of a `PrimaryButton` but the hover animation of a `SecondaryButton`, you end up with complex nested class hierarchies that are difficult to refactor.

To provide maximum flexibility and clean code reuse, React enforces **Composition over Inheritance**:
-   **Composition:** Instead of extending component classes, you build complex components by combining (composing) smaller, independent components together, passing data and markup down as props.
-   **Core Composition Patterns:**
    1.  **Containment (Children):** Box-like components (such as a `<Card>`, `<Modal>`, or `<Sidebar>`) do not know what their children will be ahead of time. They use the `children` prop to render nested HTML or sibling components dynamically.
    2.  **Specialization:** A specific component (such as a `<ConfirmDialog>`) renders a generic component (like `<Dialog>`) and configures it with specific props (e.g. setting `title="Confirm deletion"`).

---

### (2) Reality Metaphor
Imagine building toy figures.
- **Inheritance (Clay Sculpting):** You sculpt a generic human shape out of clay. To make a soldier, you add armor. If you later want a pilot, you must carve away the baked clay armor, which can break the base figure (**fragile base class problem**).
- **Composition (Lego Blocks):** You have independent Lego pieces: a head, a helmet, an armor plate, and a sword. To build a soldier, you snap the pieces together (**composing components**). To convert the soldier into a pilot, you snap off the helmet and snap on a visor. You reuse the same components in different configurations without modifying the base pieces.

---

### (3) React Code Examples

#### 1. Specialization Pattern
We define a generic `<Button>` component and compose it to create a specialized `<DeleteButton>`:
```jsx
import React from 'react';

// Generic Component
function Button({ color, onClick, children }) {
  return (
    <button 
      style={{ backgroundColor: color, color: 'white', padding: '10px' }} 
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Specialized Component Composed from Generic Button
function DeleteButton({ onDelete }) {
  return (
    <Button color="red" onClick={onDelete}>
      🗑️ Delete Item
    </Button>
  );
}
```

#### 2. Containment Pattern (Slot Layouts)
You can expose specific named props (slots) to pass layout structures:
```jsx
function AppLayout({ sidebar, header, children }) {
  return (
    <div className="layout">
      <header className="header">{header}</header>
      <div className="main-content">
        <aside className="sidebar">{sidebar}</aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

// Consuming layout
function App() {
  return (
    <AppLayout 
      header={<Logo />} 
      sidebar={<NavigationList />}
    >
      <h1>Main Dashboard Area</h1>
      <p>Body contents...</p>
    </AppLayout>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Attempting to extend component classes

**The mistake:** Writing class-based extensions to share UI logic across components:

```javascript
// BAD: Class extensions are not supported or recommended in React!
class PrimaryButton extends BaseButton {
  render() {
    return super.render({ color: 'blue' }); 
  }
}
```

**Why it's wrong:** React does not use class inheritance for components. The React API does not provide a standard mechanism to inherit rendering output, props, or lifecycles using `super`.

*Fix:* Wrap and compose the base component inside a functional wrapper instead:
```jsx
// GOOD: Functional wrapper composing the base component
function PrimaryButton(props) {
  return <BaseButton {...props} color="blue" />;
}
```

---



### Mistake 2: Attempting to Use OOP Class Inheritance (`extends ParentComponent`) in React Components

**The mistake:** Writing `class SpecialButton extends BaseButton` to share component UI or behavior.

**Why it's wrong:** React follows a **Composition over Inheritance** design paradigm! Class inheritance creates tight coupling and rigid class hierarchies. Achieve reusability by composing components (`<Dialog>` wrapping `<Button>`) and custom hooks.

*Incorrect:*
```javascript
class SpecialDialog extends BaseDialog { ... } // ❌ Anti-pattern in React!
```

*Fix:*
```javascript
function SpecialDialog() { return <BaseDialog header="Special" /> } // Composition
```

### Mistake 3: Creating Deeply Nested Wrapper Component Chains Instead of Slot Composition Props

**The mistake:** Creating 10 layers of wrapper components just to pass custom UI to a header.

**Why it's wrong:** Instead of creating rigid inheritance or deep wrapper chains, pass custom JSX elements directly as named slot props (e.g. `leftSlot={<Icon />}`).

*Incorrect:*
```javascript
// Creating custom sub-classes for minor UI header variations
```

*Fix:*
```javascript
function Header({ leftSlot, rightSlot }) { return <div>{leftSlot} Title {rightSlot}</div>; }
```

## 6. Practice Exercises

### Exercise 1: Specialized Card layout

**Problem:** Complete the specialized `<ProductCard />` component below using composition to wrap the generic `<Card />` container:

```jsx
import React from 'react';

// Generic Card Container
function Card({ borderStyle, children }) {
  return (
    <div style={{ border: borderStyle, padding: '20px', borderRadius: '8px' }}>
      {children}
    </div>
  );
}

// Solution:
function ProductCard({ product }) {
  return (
    <Card borderStyle="2px solid blue">
      <h2>{product.name}</h2>
      <p>Price: ${product.price}</p>
    </Card>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Slot Composition Pattern

**Problem:** Create `SplitPane` layout component accepting `left` and `right` JSX slot props.

**Expected output:**
> [!check]- Answer
> ```text
> function SplitPane({ left, right }) { return <div className="split-pane"><div className="left">{left}</div><div className="right">{right}</div></div>; }
> ```
> ```javascript
> function SplitPane({ left, right }) {
>   return (
>     <div className="split-pane">
>       <div className="left">{left}</div>
>       <div className="right">{right}</div>
>     </div>
>   );
> }
> ```
>
> **Explanation:** Slot props pass custom JSX elements as named properties for flexible layout composition.
> 
---

### Exercise 3: Composition over Inheritance Principle

**Problem:** State primary React architecture principle regarding code reuse (Use Component Composition and Custom Hooks instead of OOP class inheritance).

**Expected output:**
> [!check]- Answer
> ```text
> Use Component Composition and Custom Hooks instead of Class Inheritance
> ```
> ```text
> Use Component Composition and Custom Hooks instead of Class Inheritance
> ```
>
> **Explanation:** Composition provides flexible, decoupled code reuse across component UIs.
> 
## 7. Related Terms
- [Children Prop](children_prop.md) — The property that enables nesting components.
- [Higher-Order Components (HOC)](hoc.md) — An alternative pattern for component wrapper logic.

---

## 8. Key Takeaways
- React uses composition rather than inheritance to achieve code reuse.
- Composition builds complex components by combining simple, modular pieces.
- Containment uses the `children` prop to nest layouts dynamically.
- Specialization configures generic components with predefined props.
- Expose specific slots using custom element props (e.g. `sidebar={<Sidebar />}`).
- Avoid component class inheritance; wrap and compose components instead.
