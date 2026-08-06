# TypeScript with React

> **Level 11 — Ecosystem Libraries**
> Static type declarations for component props, states, hooks, and DOM event objects.

---

## 1. Prerequisites
- [Props (Properties)](../level_01/props.md) — The parameters typed by TypeScript.
- [`useState` Hook](../level_02/use_state.md) — The state hook that utilizes TypeScript generics.

---

## 2. Term Category
- **Ecosystem / Language Tooling**

---

## 3. Environment Context
- **Build-Time** (TypeScript compiles to plain JavaScript before browser execution).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React components pass data down to children via props. In plain JavaScript, components are loosely defined. If a developer renames a prop or changes its type (e.g. changing `isLoaded` from a boolean to a string), it can be difficult to track down all instances of this prop across a large codebase. This often results in runtime errors like `Cannot read properties of undefined`.

Using **TypeScript with React** provides compile-time safety by statically type-checking your entire component tree, props, states, hooks, and DOM event handlers before the code runs in the browser.

---

### (2) Key TypeScript + React Typings

#### 1. Typing Props
You define an `interface` or `type` describing the expected prop properties:
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional prop
}

// Typing a functional component
export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

#### 2. Generics in `useState` Hook
TypeScript automatically infers state types from their default values (e.g. `useState(0)` infers `number`). However, when state starts as `null` or `undefined` (like user profiles fetched from an API), you must declare the types explicitly using generics:
```typescript
interface User {
  id: string;
  name: string;
}

// User can be a User object or null
const [user, setUser] = useState<User | null>(null);
```

#### 3. Generics in `useRef` Hook
To reference HTML elements, you pass the specific DOM element type:
```typescript
const inputRef = useRef<HTMLInputElement>(null);

const focusInput = () => {
  // TypeScript checks if inputRef.current exists before calling focus
  inputRef.current?.focus(); 
};
```

#### 4. Event Handler Typing
Event handlers receive React's Synthetic Event wrapper objects, which must be typed to access element targets:
```typescript
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value); // Typed and autocomplete-enabled!
};

const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};
```

---

### (3) Reality Metaphor
Imagine sending a package.
- **Plain JavaScript (Unlabeled Box):** You ship a box containing a fragile glass vase without any markings. The courier drops the box, shattering the vase. You only find out the package was damaged after it was delivered (**runtime error**).
- **TypeScript (Shipping manifest checklist):** You glue an explicit shipping manifest to the outside of the box declaring: `Contents: Glass Vase (Fragile)`. The courier scan-checks the label before loading it (**compile-time checking**). If the package is mishandled, the system warns them before the truck leaves the warehouse, preventing damage (**blocking compiling**).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Overusing the `any` type to bypass compiler errors

**The mistake:** Declaring props or state as `any` when you encounter compiler errors:

```typescript
// BAD: any disables type-checking, defeating the purpose of TypeScript!
function Profile({ data }: { data: any }) {
  return <h1>{data.usrName}</h1>; // Typo 'usrName' is ignored by TypeScript!
}
```

**Why it's wrong:** The `any` type acts as an escape hatch that turns off type checking. It allows typos and invalid property calls to bypass compiler checks, which can lead to runtime crashes.

*Fix:* Take the time to declare interfaces or type aliases for all incoming data structures. Use TypeScript utilities (like `Partial` or `Omit`) if you need to modify existing types.

---



### Mistake 2: Using `any` for Component Event Handlers or Props Interfaces

**The mistake:** Writing `const handleChange = (e: any) => ...` or `function App(props: any)`.

**Why it's wrong:** Using `any` bypasses TypeScript type checking completely, disabling autocompletion and permitting runtime type crashes. Use explicit types `React.ChangeEvent<HTMLInputElement>`.

*Incorrect:*
```javascript
const onChange = (e: any) => console.log(e.target.value); // ❌ Disables type safety!
```

*Fix:*
```javascript
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => console.log(e.target.value);
```

### Mistake 3: Using Legacy `React.FC` (React.FunctionComponent) Type Un-Necessarily

**The mistake:** Typing components as `const MyComponent: React.FC<Props> = (props) => ...`.

**Why it's wrong:** Legacy `React.FC` implicitly included `children` in older React versions and complicates generic components. Type props directly: `function MyComponent(props: Props)`. 

*Incorrect:*
```javascript
const Card: React.FC<CardProps> = ({ title }) => <h2>{title}</h2>; // Legacy React.FC
```

*Fix:*
```javascript
interface CardProps { title: string; }
function Card({ title }: CardProps) { return <h2>{title}</h2>; }
```

## 6. Practice Exercises

### Exercise 1: Typing a Form Component

**Problem:** Add TypeScript type annotations to the props, state, and event handlers in the component below:

```typescript
// Before (Untyped JavaScript):
function InputForm({ onSubmitLabel }) {
  const [text, setText] = useState('');

  const handleChange = (e) => {
    setText(e.target.value);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmitLabel(text); }}>
      <input value={text} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}

// After (Solution):
import React, { useState } from 'react';

interface InputFormProps {
  onSubmitLabel: (val: string) => void;
}

export default function InputForm({ onSubmitLabel }: InputFormProps) {
  const [text, setText] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmitLabel(text);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <input value={text} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

> [!check]- Answer
> - Complete problem steps as outlined above.
> 
---

### Exercise 2: Typing Component Props Interface

**Problem:** Write TypeScript `Props` interface for component taking `name` (string), `age` (number), `onSave` callback, and optional `bio`.

**Expected output:**
> [!check]- Answer
> ```text
> interface UserProps { name: string; age: number; onSave: (id: number) => void; bio?: string; } function UserCard({ name, age, onSave, bio }: UserProps) { ... }
> ```
> ```typescript
> interface UserProps {
>   name: string;
>   age: number;
>   onSave: (id: number) => void;
>   bio?: string;
> }
>
> function UserCard({ name, age, onSave, bio }: UserProps) {
>   return <div>{name} ({age})</div>;
> }
> ```
>
> **Explanation:** TypeScript interfaces enforce compile-time prop type safety across components.
> 
---

### Exercise 3: Typing Children Props with ReactNode

**Problem:** What TypeScript type should be used for typing arbitrary React JSX children props? (`React.ReactNode`).

**Expected output:**
> [!check]- Answer
> ```text
> React.ReactNode
> ```
> ```typescript
> interface ContainerProps {
>   children: React.ReactNode;
> }
> ```
>
> **Explanation:** `React.ReactNode` represents any renderable React child element (JSX, strings, numbers, fragments).
> 
## 7. Related Terms
- [Props (Properties)](../level_01/props.md) — The data structure typed by interfaces.
- [`useState` Hook](../level_02/use_state.md) — The state manager utilizing generics.
- [Components](../level_01/components.md) — Typed component props.
- [Custom Hooks](../level_04/custom_hooks.md) — Typed custom hooks.

---

## 8. Key Takeaways
- TypeScript provides compile-time safety by checking types before execution.
- Define interfaces or types to validate incoming component props.
- Use generic parameters (e.g. `useState<User | null>(null)`) for dynamic state typing.
- Type refs (e.g. `useRef<HTMLButtonElement>(null)`) to safely access DOM methods.
- Type synthetic event objects (like `React.ChangeEvent<HTMLInputElement>`) to ensure safe event targets.
- Avoid using the `any` type escape hatch.
