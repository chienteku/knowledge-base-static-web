# Styled Components / Emotion (CSS-in-JS)

> **Level 11 — Ecosystem Libraries**
> A component styling paradigm that writes actual CSS code directly inside JavaScript files using tagged template literals, binding styles tightly to React components.

---

## 1. Prerequisites

- [Components](../level_01/components.md) — The visual UI components styled by CSS-in-JS libraries.
- [Props (Properties)](../level_01/props.md) — How styled components evaluate dynamic JavaScript variables to compute CSS styles.

---

## 2. Term Category

**Ecosystem (css-in-js styling library)**: Styled Components and Emotion are CSS-in-JS component styling libraries for React. Utilizing JavaScript's ES6 Tagged Template Literals feature (`styled.button`...``), CSS-in-JS libraries generate React components with scoped, auto-generated CSS class names permanently attached to them.

Rather than maintaining separate global `.css` stylesheet files and manually assigning string class names (`className="btn-primary"`), CSS-in-JS components encapsulate styling logic directly within JavaScript modules. When a component unmounts or is deleted from the codebase, its associated CSS rules are automatically garbage-collected and eliminated from the build payload.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In traditional web development, HTML markup and CSS stylesheets are physically separated into different files (`index.html` and `styles.css`). As applications grow to hundreds of components, this separation introduces significant production issues:
1. **Global Class Collisions:** Two developers working on separate components both create a `.card` or `.container` CSS selector, causing unexpected global style overrides across the app.
2. **Dead Code Accumulation:** Deleting a React component file from the project rarely results in deleting its corresponding CSS classes from `styles.css`. Over time, stylesheets bloat with thousands of lines of orphaned "dead CSS" that no engineer dares to remove.
3. **Static Styling Limitations:** Changing a CSS property based on dynamic component state required writing conditional string concatenations: `className={`btn ${isActive ? 'active' : ''}`}`.

Styled Components and Emotion resolve these issues. CSS rules are scoped strictly to individual component instances using unique hashed class names (e.g. `sc-bdVaJa eKzOev`). When a component file is deleted, 100% of its associated CSS is deleted with it. Furthermore, because CSS rules are defined inside JavaScript template literals, styles can directly evaluate component **Props** at runtime.

### (2) Reality Metaphor

Imagine custom-tailoring clothing for a theatrical performance.

- **Traditional CSS (Universal Costume Wardrobe Racks):** All costumes are stored on giant global racks in a central warehouse (**a 10,000-line global `styles.css` file**). If an actor needs red pants, they search the global rack for tag `#red-pants-item-42`. If two actors need red pants, one might accidentally take the wrong pair, causing costume collisions (**CSS specificity & class collision bugs**). When a character is cut from the script, their red pants remain on the global rack forever (**dead CSS accumulation**).
- **Styled Components (Custom Fitted Suits with Attached Tag):** Every actor wears a custom-tailored suit that has its fabric specifications, measurements, and color rules permanently stitched into the lining of the jacket (**CSS bundled inside the JS component**). If the character is removed from the play, taking the actor out of the cast automatically removes their suit from the building (**100% dead code elimination**). If the script calls for the suit to turn blue when the character becomes king (**dynamic prop logic**), the fabric changes color automatically on demand.

### (3) React Code Examples

#### Short Snippet

```jsx
// PrimaryButton.jsx (Styled Components)
import styled from 'styled-components';

// Creates a React component with scoped CSS attached
export const PrimaryButton = styled.button`
  background-color: #007AFF;
  color: #FFFFFF;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #0056B3;
  }
`;
```

#### Fuller Example

```jsx
// StatusBadge.jsx
'use client';

import styled from 'styled-components';

// Dynamic styling reading transient props ($status)
const BadgeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;

  /* Dynamic CSS evaluation based on $status prop */
  background-color: ${props => {
    switch (props.$status) {
      case 'CRITICAL': return '#FFD2D2';
      case 'WARNING': return '#FFF0C2';
      default: return '#D2F5D3';
    }
  }};

  color: ${props => {
    switch (props.$status) {
      case 'CRITICAL': return '#D8000C';
      case 'WARNING': return '#9F6000';
      default: return '#4F8A10';
    }
  }};
`;

export function StatusBadge({ status = 'NOMINAL', label }) {
  return (
    // Transient prop $status is consumed by styled-components and omitted from DOM
    <BadgeContainer $status={status}>
      <span className="dot">● </span>
      {label || status}
    </BadgeContainer>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Defining Styled Components inside component render function bodies

**The mistake:** Declaring `const MyStyledDiv = styled.div...` *inside* a parent component function body.

**Why it's wrong:** Every time the parent component re-renders, JavaScript re-executes the function body, creating a brand new Styled Component type and generating new CSS class names. This forces the browser to unmount and remount the DOM element tree, destroying input focus, state, and active CSS animations.

*Incorrect:*
```jsx
// ❌ Anti-pattern: Re-created on every render! Destroys DOM focus and performance!
function App() {
  const StyledCard = styled.div`padding: 20px;`;
  return <StyledCard>Content</StyledCard>;
}
```

*Fix:*
```jsx
// Define styled components outside function components at module scope
const StyledCard = styled.div`padding: 20px;`;

function App() {
  return <StyledCard>Content</StyledCard>;
}
```

### Mistake 2: Passing custom non-standard props to DOM elements without transient `$` prefixes

**The mistake:** Passing `<StyledButton isActive={true}>` where `isActive` is forwarded to a native `<button>` HTML DOM element.

**Why it's wrong:** React logs dev environment warnings when unrecognized custom props are forwarded to native HTML DOM nodes: `React does not recognize the 'isActive' prop on a DOM element`. Use transient props with a `$` prefix (`$isActive={true}`) to instruct styled-components to filter the prop out before rendering the HTML DOM element.

*Incorrect:*
```jsx
// ❌ Forwards 'isActive' to native <button> DOM node, logging warnings!
const Btn = styled.button`
  color: ${props => props.isActive ? 'red' : 'blue'};
`;
```

*Fix:*
```jsx
// Transient $ prop is consumed strictly by styled-components and filtered from DOM
const Btn = styled.button`
  color: ${props => props.$isActive ? 'red' : 'blue'};
`;
```

### Mistake 3: Overusing dynamic CSS functions inside styled templates for static styles

**The mistake:** Wrapping static CSS declarations inside unnecessary string interpolation arrow functions.

**Why it's wrong:** Unnecessary interpolation functions slow down CSS parsing and template evaluation. Keep static CSS properties raw within the template string.

*Incorrect:*
```javascript
// ❌ Unnecessary function wrapper for static style!
const Card = styled.div`
  margin: ${() => '20px'};
`;
```

*Fix:*
```javascript
const Card = styled.div`
  margin: 20px;
`;
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Alarm Box (Dynamic Status Styling)

**Scenario:** Build an IoT Telemetry alarm card component using Styled Components where the background border color dynamically changes based on a `$severity` prop (`'CRITICAL'`, `'WARNING'`, or `'NOMINAL'`).

**Requirements:**
1. Create `AlarmCard` styled component.
2. Evaluate `$severity` transient prop inside CSS template literal.
3. Apply border colors: Critical (`#FF3B30`), Warning (`#FF9500`), Nominal (`#34C759`).

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import styled from 'styled-components';
>
> const AlarmCardContainer = styled.article`
>   padding: 16px;
>   border-radius: 8px;
>   background-color: #FFFFFF;
>   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
>   
>   /* Dynamic border color evaluation */
>   border-left: 6px solid ${props => {
>     if (props.$severity === 'CRITICAL') return '#FF3B30';
>     if (props.$severity === 'WARNING') return '#FF9500';
>     return '#34C759';
>   }};
>
>   h4 {
>     margin: 0 0 6px 0;
>     color: #1C1C1E;
>   }
> `;
>
> export function TelemetryAlarmCard({ sensorName, severity, metric }) {
>   return (
>     <AlarmCardContainer $severity={severity}>
>       <h4>Sensor: {sensorName}</h4>
>       <p>Reading: {metric}</p>
>     </AlarmCardContainer>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Transient Prop Filtering**: `$severity` uses the `$` prefix to prevent passing non-standard attributes to the HTML `<article>` DOM element.
> 2. **Dynamic Prop Evaluation**: Arrow function `${props => ...}` computes CSS left-border colors dynamically during render.
> 3. **Nested Selector Support**: `h4 { ... }` nests CSS rules cleanly inside the component scope.
> 4. **Module Level Declaration**: `AlarmCardContainer` is defined outside `TelemetryAlarmCard` to prevent re-creation on render.
> 
### Exercise 2: Financial Trading Action Button Theme Matrix

**Scenario:** Develop a Financial Trading action button styled component that supports primary/secondary variants and an `$isBuy` boolean prop (Green for Buy, Red for Sell).

**Requirements:**
1. Create `ActionButton` styled `button`.
2. Evaluate `$isBuy` transient boolean prop for background color.
3. Include `:disabled` pseudo-selector states.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import styled from 'styled-components';
>
> export const TradeActionButton = styled.button`
>   padding: 10px 18px;
>   border-radius: 6px;
>   font-weight: 700;
>   font-size: 14px;
>   border: none;
>   cursor: pointer;
>   transition: background-color 0.2s ease, opacity 0.2s ease;
>
>   /* Green for Buy, Red for Sell */
>   background-color: ${props => props.$isBuy ? '#34C759' : '#FF3B30'};
>   color: #FFFFFF;
>
>   &:hover {
>     background-color: ${props => props.$isBuy ? '#28A745' : '#DC3545'};
>   }
>
>   &:disabled {
>     opacity: 0.5;
>     cursor: not-allowed;
>   }
> `;
> ```
>
> #### Technical Explanation
> 1. **Boolean Prop Logic**: `${props => props.$isBuy ? ...}` toggles button color schemes declaratively.
> 2. **Pseudo-Class Scoping**: `&:hover` and `&:disabled` nest standard CSS pseudo-class state rules within the component scope.
> 3. **Reusable Primitive**: Exports a fully functioning styled button component for application-wide order ticket use.
> 4. **Clean DOM Markup**: Output HTML renders clean native `<button>` tags with auto-generated CSS class hashes.
> 
### Exercise 3: E-Commerce Product Card Responsive Layout

**Scenario:** Construct an e-commerce product card grid container using Styled Components with media queries for responsive grid column layouts.

**Requirements:**
1. Create `ProductGrid` styled `div`.
2. Apply CSS Grid layout (`grid-template-columns`).
3. Add media queries for desktop screens (`@media (min-width: 768px)`).

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import styled from 'styled-components';
>
> export const ProductGrid = styled.div`
>   display: grid;
>   grid-template-columns: 1fr;
>   gap: 16px;
>   padding: 16px;
> 
>   /* Desktop Responsive Media Query */
>   @media (min-width: 768px) {
>     grid-template-columns: repeat(3, 1fr);
>     gap: 24px;
>   }
> 
>   @media (min-width: 1200px) {
>     grid-template-columns: repeat(4, 1fr);
>   }
> `;
> ```
>
> #### Technical Explanation
> 1. **Media Query Nesting**: Media queries are embedded directly within the styled component template string.
> 2. **Scoped Grid Layout**: Layout rules are encapsulated without leaking global CSS selector rules across the application.
> 3. **Mobile-First Design**: Defaults to 1-column mobile layout, scaling to 3 and 4 columns on larger viewports.
> 4. **Zero Class Collisions**: Generated class hashes ensure grid styles do not collide with external layout CSS.
> 
---

## 6. Related Terms

- [Components](../level_01/components.md) — The React components styled by CSS-in-JS primitives.
- [Props (Properties)](../level_01/props.md) — The data properties evaluated inside styled templates.

---

## 7. Key Takeaways

- Styled Components and Emotion allow developers to write actual CSS directly inside JavaScript files using Tagged Template Literals.
- Scopes CSS rules to individual components using auto-generated unique class hashes, eliminating global collisions.
- Deleting a component file automatically removes 100% of its associated CSS code from application builds.
- Evaluates component **Props** dynamically to compute runtime CSS values.
- Always define styled components **outside** component render function bodies to prevent DOM re-creation bugs.
- Use transient `$` prefixes (`$prop`) for custom styled props to prevent forwarding unrecognized attributes to native DOM nodes.
