# Props (Properties)

> **Level 1 — Core Concepts**
> The mechanism for passing data from a Parent component down to a Child component. They act exactly like parameters in a JavaScript function.

---

## 1. Prerequisites
- [Components](../level_01/components.md) — You pass props into components.

---

## 2. Term Category
- **React Architecture / Data Flow**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you build a `<ProfileCard />` component that has "Alice" hardcoded into the JSX, you can render it 5 times, but you will just see 5 Alices. It's reusable, but not dynamic.
We need a way to tell the component: *"Render a card, but use the name Bob this time."* 
We do this using **Props**. Props allow components to be dynamic templates rather than static HTML.

### (2) How to use Props
Props look exactly like standard HTML attributes when you pass them:
```javascript
// The Parent Component passing data
function App() {
  return (
    <main>
      <ProfileCard name="Alice" age={25} />
      <ProfileCard name="Bob" age={30} />
    </main>
  );
}
```
Inside the Child component, React bundles all those attributes into a single JavaScript object called `props`.
```javascript
// The Child Component receiving data
function ProfileCard(props) {
  return (
    <div className="card">
      <h2>{props.name}</h2>
      <p>Age: {props.age}</p>
    </div>
  );
}
```

### (3) The Object Destructuring Trick
Because `props` is always an object, modern React developers almost never type the word `props`. Instead, they use JavaScript ES6 Object Destructuring directly in the function signature for incredibly clean code:
```javascript
// Destructuring instantly extracts the properties!
function ProfileCard({ name, age }) {
  return (
    <div className="card">
      <h2>{name}</h2>
      <p>Age: {age}</p>
    </div>
  );
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to modify Props

**The mistake:** A developer wants the user to be able to increment their age. They write `props.age = props.age + 1;` inside the Child component.

**Why it's wrong:** Props are **Strictly Read-Only**. A child component is absolutely forbidden from modifying the props passed to it by its parent. If you try, React will throw an error. 
**Golden Rule:** Data only flows down. If a child needs to change a value, the Parent must pass down a State Update Function as a prop, and the child must call that function.

---



### Mistake 2: Attempting to Mutate Props Directly inside Child Components (Props Are Read-Only)

**The mistake:** Writing `props.title = 'New Title'` inside a child component function.

**Why it's wrong:** Props are immutable read-only inputs! Mutating `props` directly breaks React's unidirectional data flow. Pass a callback function prop (e.g. `onTitleChange`) to request parent state updates.

*Incorrect:*
```javascript
function Header(props) {
  props.title = 'Updated'; // ❌ Error: props are read-only!
  return <h1>{props.title}</h1>;
}
```

*Fix:*
```javascript
function Header({ title, onUpdate }) {
  return <h1 onClick={() => onUpdate('Updated')}>{title}</h1>;
}
```

### Mistake 3: Passing String Numbers as Props Without Expression Braces (`count="5"`)

**The mistake:** Passing `<Counter count="5" />` expecting `count` to be a JavaScript number.

**Why it's wrong:** Quotes `"5"` pass literal string `'5'`, causing string concatenation bugs (`'5' + 1 = '51'`). Wrap numbers in curly braces `<Counter count={5} />`.

*Incorrect:*
```javascript
<Counter count="5" /> // Passes string '5' instead of number 5
```

*Fix:*
```javascript
<Counter count={5} /> // Passes numeric primitive 5
```



### Mistake 4: Attempting to Mutate Props Directly inside Child Components (Props Are Read-Only)

**The mistake:** Writing `props.title = 'New Title'` inside a child component function.

**Why it's wrong:** Props are immutable read-only inputs! Mutating `props` directly breaks React's unidirectional data flow. Pass a callback function prop (e.g. `onTitleChange`) to request parent state updates.

*Incorrect:*
```javascript
function Header(props) {
  props.title = 'Updated'; // ❌ Error: props are read-only!
  return <h1>{props.title}</h1>;
}
```

*Fix:*
```javascript
function Header({ title, onUpdate }) {
  return <h1 onClick={() => onUpdate('Updated')}>{title}</h1>;
}
```

### Mistake 5: Passing String Numbers as Props Without Expression Braces (`count="5"`)

**The mistake:** Passing `<Counter count="5" />` expecting `count` to be a JavaScript number.

**Why it's wrong:** Quotes `"5"` pass literal string `'5'`, causing string concatenation bugs (`'5' + 1 = '51'`). Wrap numbers in curly braces `<Counter count={5} />`.

*Incorrect:*
```javascript
<Counter count="5" /> // Passes string '5' instead of number 5
```

*Fix:*
```javascript
<Counter count={5} /> // Passes numeric primitive 5
```

## 6. Practice Exercises

### Exercise 1: The Button Template

**Problem:** Write a functional component called `Button` that accepts two props: `color` and `text`. It should return a `<button>` element where the text matches the prop, and the inline style matches the color prop. Use destructuring.

**Expected output:**
```javascript
function Button({ color, text }) {
  return (
    <button style={{ backgroundColor: color }}>
      {text}
    </button>
  );
}

// Usage: <Button color="red" text="Delete" />
```

> [!check]- Answer
> - Destructure `{ color, text }` in the arguments.
> - Inline styles in React require double curly braces `style={{ property: value }}`.

---



### Exercise 2: Destructuring Props with Default Values

**Problem:** Create `Avatar` component destructuring `src` and `size` (defaulting to `50`).

**Expected output:**
```text
function Avatar({ src, size = 50 }) { return <img src={src} width={size} height={size} />; }
```

> [!check]- Answer
> ```javascript
> function Avatar({ src, size = 50 }) {
>   return <img src={src} width={size} height={size} />;
> }
> ```
>
> **Explanation:** Destructuring parameters allows assigning clean fallback default prop values.

### Exercise 3: Unidirectional Data Flow Prop Direction

**Problem:** In React, do props flow down from Parent to Child, or up from Child to Parent? (Down from Parent to Child).

**Expected output:**
```text
Down from Parent to Child (Unidirectional data flow)
```

> [!check]- Answer
> ```text
> Down from Parent to Child (Unidirectional data flow)
> ```
>
> **Explanation:** Props flow top-down through component trees.



### Exercise 4: Destructuring Props with Default Values

**Problem:** Create `Avatar` component destructuring `src` and `size` (defaulting to `50`).

**Expected output:**
```text
function Avatar({ src, size = 50 }) { return <img src={src} width={size} height={size} />; }
```

> [!check]- Answer
> ```javascript
> function Avatar({ src, size = 50 }) {
>   return <img src={src} width={size} height={size} />;
> }
> ```
>
> **Explanation:** Destructuring parameters allows assigning clean fallback default prop values.

### Exercise 5: Unidirectional Data Flow Prop Direction

**Problem:** In React, do props flow down from Parent to Child, or up from Child to Parent? (Down from Parent to Child).

**Expected output:**
```text
Down from Parent to Child (Unidirectional data flow)
```

> [!check]- Answer
> ```text
> Down from Parent to Child (Unidirectional data flow)
> ```
>
> **Explanation:** Props flow top-down through component trees.

## 7. Related Terms
- [Render Purity](./render_purity.md) — Why props must remain read-only snapshots during render.
- [State](../level_02/state.md) — Unlike Props (which are read-only and passed down), State is data that the component owns and can mutate.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — The rule that Props only go down, never up.

---

## 8. Key Takeaways
- **Props** are how Parent components pass data into Child components.
- They look like HTML attributes (`name="Alice"`).
- Inside the Child, they arrive as a single JavaScript object (`{ name: "Alice" }`).
- Modern developers always destructure them in the function parameters.
- Props are **Read-Only**. A child can never alter its own props.
