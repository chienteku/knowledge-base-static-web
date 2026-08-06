# TypeScript with React

> **Level 11 — Ecosystem Libraries**
> Static type declarations and compile-time type checking for React component props, state hooks, and synthetic DOM event handlers.

---

## 1. Prerequisites

- [Props (Properties)](../level_01/props.md) — The data parameters typed and validated by TypeScript interfaces.
- [`useState` Hook](../level_02/use_state.md) — The state primitive hook utilizing TypeScript generics.

---

## 2. Term Category

**Ecosystem (static type checker)**: TypeScript integrated with React provides compile-time static type analysis and tooling across the component tree. While plain JavaScript evaluates component prop types dynamically at browser execution runtime—often failing silently when properties are missing or misspelled—TypeScript parses TSX code during build compilation, validating component prop contracts, hook types, and DOM synthetic events before code reaches production.

TypeScript definitions for React (provided via `@types/react` and `@types/react-dom`) expose strong type primitives for component signatures (`React.ReactNode`), hooks (`useRef<HTMLInputElement>`), and synthetic events (`React.ChangeEvent<HTMLInputElement>`). This enhances IDE autocompletion, enables safe code refactoring, and eliminates an entire class of runtime errors (such as `TypeError: Cannot read properties of undefined`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In plain JavaScript React development, components accept arbitrary `props` objects without structural validation. If a developer renames a prop inside a child component (e.g. changing `isUserActive` to `isActive`), tracking down every parent call-site across a 200-file codebase relies on manual text searches. Missing a single call-site introduces silent production bugs.

TypeScript with React solves this by turning prop contracts into strict compile-time constraints:
1. **Interface Prop Definitions:** Developers define explicit TypeScript `interface` or `type` contracts for every component.
2. **Generics for Nullable Hooks:** State initialized to `null` (such as API data fetching) uses explicit generic parameters (`useState<User | null>(null)`), forcing developers to handle null checks before dereferencing properties.
3. **Reflect Structural Changes:** Renaming a prop interface field instantly highlights every broken invocation site across the entire project in the IDE before building.

### (2) Reality Metaphor

Imagine shipping fragile physical goods via a freight service.

- **Plain JavaScript (Unlabeled Wooden Crates):** You pack fragile glass artwork into unmarked wooden boxes without documentation (**plain JS components**). Freight handlers stack heavy steel beams on top of the crates. You only find out the artwork was shattered after the customer unboxes the delivery at their house (**runtime crash in production**).
- **TypeScript with React (Digital Shipping Manifest System):** Every crate carries a scannable digital manifest declaring: `Contents: Glass Artwork (Max Weight: 5kg, Fragile)` (**TypeScript interface definitions**). When a forklift operator attempts to load a 500kg beam onto the crate, the automated scanner locks the forklift arm and flashes a red alert warning (**compile-time build error**). The error is caught inside the warehouse before the truck ever leaves the dock.

### (3) React Code Examples

#### Short Snippet

```tsx
// TypedButton.tsx (TypeScript Props & Event Handlers)
import React from 'react';

interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean; // Optional prop
}

export function TypedButton({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-primary">
      {label}
    </button>
  );
}
```

#### Fuller Example

```tsx
// PatientVitalsForm.tsx
import React, { useState, useRef } from 'react';

interface PatientVitals {
  patientId: string;
  heartRate: number;
  notes?: string;
}

interface FormProps {
  initialPatientId: string;
  onSaveVitals: (vitals: PatientVitals) => Promise<boolean>;
  children?: React.ReactNode; // Type for JSX children
}

export function PatientVitalsForm({ initialPatientId, onSaveVitals, children }: FormProps) {
  // Generics for nullable state
  const [vitals, setVitals] = useState<PatientVitals | null>(null);
  const [hrInput, setHrInput] = useState<string>('72');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHrInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hrVal = Number(hrInput);

    if (isNaN(hrVal) || hrVal <= 0) {
      inputRef.current?.focus(); // Safe optional chaining on typed DOM ref
      return;
    }

    const payload: PatientVitals = {
      patientId: initialPatientId,
      heartRate: hrVal
    };

    const success = await onSaveVitals(payload);
    if (success) setVitals(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="vitals-form">
      {children}
      <div className="input-group">
        <label htmlFor="hr">Heart Rate (BPM):</label>
        <input 
          ref={inputRef}
          type="number" 
          id="hr" 
          value={hrInput} 
          onChange={handleInputChange} 
        />
      </div>

      <button type="submit">Record Vitals</button>

      {vitals && (
        <div className="summary">
          <p>Recorded for #{vitals.patientId}: {vitals.heartRate} BPM</p>
        </div>
      )}
    </form>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Overusing the `any` type to bypass compiler errors

**The mistake:** Declaring component props or state variables as `any` when encountering TypeScript compilation errors.

**Why it's wrong:** The `any` type completely disables TypeScript type-checking for that variable and all downstream property accesses. Using `any` permits typos and invalid property calls to bypass compiler checks, defeating the purpose of TypeScript.

*Incorrect:*
```tsx
// ❌ Anti-pattern: any disables type-checking; typos like 'usrName' are missed!
function UserCard({ data }: { data: any }) {
  return <div>{data.usrName}</div>;
}
```

*Fix:*
```tsx
interface UserData {
  name: string;
  email: string;
}

function UserCard({ data }: { data: UserData }) {
  return <div>{data.name}</div>;
}
```

### Mistake 2: Typing component event handlers using generic `any` or `Function` types

**The mistake:** Writing `const handleChange = (e: any) => ...` or `onClick: Function`.

**Why it's wrong:** Using generic `any` or `Function` types disables autocompletion for event objects (like `e.target.value` or `e.preventDefault()`) and permits passing incompatible callback signatures.

*Incorrect:*
```tsx
// ❌ Loses target.value autocompletion and type safety!
const onChange = (e: any) => console.log(e.target.value);
```

*Fix:*
```tsx
// Use specific SyntheticEvent types from React
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};
```

### Mistake 3: Using legacy `React.FC` (React.FunctionComponent) types unnecessarily

**The mistake:** Declaring components as `const MyComponent: React.FC<Props> = (props) => ...`.

**Why it's wrong:** Legacy `React.FC` implicitly included `children` in older React versions, complicated generic component declarations, and added unnecessary type wrapper syntax. Modern React standards prefer typing props directly in the function signature.

*Incorrect:*
```tsx
// ❌ Legacy React.FC type wrapper
const Card: React.FC<CardProps> = ({ title }) => <h2>{title}</h2>;
```

*Fix:*
```tsx
interface CardProps { title: string; }

export function Card({ title }: CardProps) {
  return <h2>{title}</h2>;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Telemetry Component Typing

**Scenario:** Add complete TypeScript interfaces and type annotations for an IoT Sensor Telemetry card component that accepts sensor status records and an optional `onReset` callback handler.

**Requirements:**
1. Define `SensorStatus` type union (`'NOMINAL' | 'WARNING' | 'CRITICAL'`).
2. Define `SensorCardProps` interface.
3. Type component props signature directly.

> [!check]- Answer
>
> #### Implementation
> ```tsx
> import React from 'react';
>
> export type SensorStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';
>
> export interface SensorCardProps {
>   sensorId: string;
>   location: string;
>   temperature: number;
>   status: SensorStatus;
>   onReset?: (sensorId: string) => void; // Optional callback
> }
>
> export function SensorCard({ sensorId, location, temperature, status, onReset }: SensorCardProps) {
>   return (
>     <div className={`sensor-card status-${status.toLowerCase()}`}>
>       <h3>{location} (#{sensorId})</h3>
>       <p>Temperature: {temperature}°C</p>
>       <p>Status: {status}</p>
>       
>       {onReset && (
>         <button onClick={() => onReset(sensorId)} className="btn-reset">
>           Reset Sensor Node
>         </button>
>       )}
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Union Type Restraints**: `SensorStatus` restricts status values strictly to allowed strings (`'NOMINAL' | 'WARNING' | 'CRITICAL'`).
> 2. **Optional Callbacks**: `onReset?: (sensorId: string) => void` types optional callback functions with typed string parameters.
> 3. **Direct Signature Typing**: `({ ... }: SensorCardProps)` applies prop types directly without legacy `React.FC`.
> 4. **Safe Invocation**: `{onReset && <button onClick={() => onReset(sensorId)} />}` safely checks optional callbacks before execution.
> 
### Exercise 2: Financial Order Form Event & Ref Typing

**Scenario:** Develop a Financial Trading order form component using TypeScript. Type HTML input element refs, text change event handlers, and form submit handlers cleanly.

**Requirements:**
1. Create `useRef<HTMLInputElement>(null)` for ticker input.
2. Type form submit handler as `React.FormEvent<HTMLFormElement>`.
3. Type input change handler as `React.ChangeEvent<HTMLInputElement>`.

> [!check]- Answer
>
> #### Implementation
> ```tsx
> import React, { useState, useRef } from 'react';
>
> interface OrderFormProps {
>   defaultTicker?: string;
>   onExecuteTrade: (symbol: string, quantity: number) => void;
> }
>
> export function FinancialOrderForm({ defaultTicker = 'AAPL', onExecuteTrade }: OrderFormProps) {
>   const [ticker, setTicker] = useState<string>(defaultTicker);
>   const [quantity, setQuantity] = useState<number>(10);
>   const inputRef = useRef<HTMLInputElement>(null);
> 
>   const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
>     setTicker(e.target.value.toUpperCase());
>   };
> 
>   const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
>     e.preventDefault();
>     if (quantity <= 0) {
>       inputRef.current?.focus();
>       return;
>     }
>     onExecuteTrade(ticker, quantity);
>   };
> 
>   return (
>     <form onSubmit={handleFormSubmit} className="trade-form">
>       <div className="field">
>         <label htmlFor="ticker">Ticker Symbol:</label>
>         <input 
>           type="text" 
>           id="ticker" 
>           value={ticker} 
>           onChange={handleTickerChange} 
>         />
>       </div>
> 
>       <div className="field">
>         <label htmlFor="quantity">Quantity:</label>
>         <input 
>           ref={inputRef}
>           type="number" 
>           id="quantity" 
>           value={quantity} 
>           onChange={(e) => setQuantity(Number(e.target.value))} 
>         />
>       </div>
> 
>       <button type="submit">Submit Trade Order</button>
>     </form>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Typed DOM Refs**: `useRef<HTMLInputElement>(null)` informs TypeScript of the precise DOM node type, unlocking methods like `.focus()`.
> 2. **Form Event Types**: `React.FormEvent<HTMLFormElement>` types form submission events, providing autocomplete for `.preventDefault()`.
> 3. **Input Change Event Types**: `React.ChangeEvent<HTMLInputElement>` types change events, guaranteeing `e.target.value` exists.
> 4. **State Generics**: `useState<string>()` and `useState<number>()` enforce strict variable types for component state.
> 
### Exercise 3: E-Commerce Children & Container Props Interface

**Scenario:** Construct an e-commerce product card container component that accepts JSX children and an optional header title using TypeScript's `React.ReactNode` type.

**Requirements:**
1. Define `ContainerProps` interface containing `title?: string` and `children: React.ReactNode`.
2. Render title conditionally.
3. Render `{children}` inside container layout.

> [!check]- Answer
>
> #### Implementation
> ```tsx
> import React from 'react';
>
> export interface ProductContainerProps {
>   title?: string;
>   children: React.ReactNode;
> }
>
> export function ProductContainer({ title, children }: ProductContainerProps) {
>   return (
>     <section className="product-container">
>       {title && <header className="container-header"><h2>{title}</h2></header>}
>       <div className="container-body">
>         {children}
>       </div>
>     </section>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **ReactNode Type**: `React.ReactNode` represents any renderable JSX child (JSX elements, strings, numbers, fragments, or arrays).
> 2. **Optional Interface Properties**: `title?: string` marks the header title as optional.
> 3. **Clean Container Pattern**: Separates container shell typing from child content components.
> 4. **Compile-Time Validation**: TS compiler enforces that `{children}` is passed when consuming `<ProductContainer>`.
> 
---

## 6. Related Terms

- [Props (Properties)](../level_01/props.md) — The data parameters typed by TypeScript interfaces.
- [`useState` Hook](../level_02/use_state.md) — The state hook utilizing TypeScript generics.
- [Components](../level_01/components.md) — Typed functional component units.
- [Custom Hooks](../level_04/custom_hooks.md) — Reusable typed hook abstractions.

---

## 7. Key Takeaways

- TypeScript provides compile-time static type safety across React component trees, props, and hooks.
- Define explicit `interface` or `type` structures to document component prop contracts.
- Use generic parameters (e.g. `useState<User | null>(null)`) when initializing state to `null` or `undefined`.
- Type DOM elements inside refs (e.g. `useRef<HTMLInputElement>(null)`) for safe element method access.
- Use specific React synthetic event types (`React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`).
- Avoid using the `any` type escape hatch or legacy `React.FC` component wrappers.
