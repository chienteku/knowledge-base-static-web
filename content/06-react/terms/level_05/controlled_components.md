# Controlled Components

> **Level 5 — DOM & Event Handling**
> A form input (like `<input>`, `<textarea>`, or `<select>`) whose value is strictly controlled by React State, making React the "Single Source of Truth."

---

## 1. Prerequisites
- [`useState` Hook](../level_02/use_state.md) — The mechanism used to control the input.
- [Synthetic Events](synthetic_events.md) — Specifically `onChange`, which captures keystrokes.

---

## 2. Term Category
- **React Design Pattern / Form Handling**

---

## 3. Environment Context
- **Client-Side (React DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard HTML, an `<input>` element has its own internal memory. When you type "A", the browser updates the input box to show "A". 
But React wants to control the UI! If the HTML input is holding its own data, and React is holding State data, you have **Two Sources of Truth**. They can easily get out of sync.
To fix this, we create a **Controlled Component**. We hijack the input, force it to display the React state, and update the state every time the user types.

### (2) The Two-Step Loop
To control an input, you must provide two props:
1. `value`: Hardcoded to the React State variable. (React pushes data to the input).
2. `onChange`: A function that updates the State when the user types. (The input pushes data to React).

```javascript
function Search() {
  const [text, setText] = useState("");

  function handleChange(e) {
    // e.target.value contains the exact keystroke
    setText(e.target.value); 
  }

  // The input's text is 100% controlled by the `text` state variable.
  return <input type="text" value={text} onChange={handleChange} />;
}
```

### (3) The Benefit: Instant Validation
Because React intercepts every single keystroke *before* it updates the screen, you can do powerful things! 
For example, you can force the text to be uppercase:
`setText(e.target.value.toUpperCase())`
Now, even if the user types a lowercase 'a', the state becomes 'A', and React forces the input to display 'A'. 

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Providing `value` without `onChange`

**The mistake:** A developer writes `<input type="text" value={name} />` but forgets to add the `onChange` handler.

**Why it's wrong:** You just locked the input! The `value` is tied to the `name` state. If the user presses a key on their keyboard, the browser tries to change the text, but React immediately steps in and says "No, the state hasn't changed, change it back!" The user cannot type anything.
**Golden Rule:** If you provide a `value` prop to an input, you MUST provide an `onChange` prop to update that value.

---



### Mistake 2: Initializing Controlled Inputs with `undefined` (Uncontrolled to Controlled Error Trap)

**The mistake:** Initializing state `const [name, setName] = useState(data.name);` where `data.name` is `undefined` initially.

**Why it's wrong:** Passing `value={undefined}` makes the HTML `<input>` uncontrolled initially. When state updates to `'Alice'`, React throws warning `A component is changing an uncontrolled input to be controlled`. Always default to empty strings `useState(data.name || '')`.

*Incorrect:*
```javascript
const [val, setVal] = useState(undefined); // ❌ Switches uncontrolled to controlled!
```

*Fix:*
```javascript
const [val, setVal] = useState(data.name || ''); // Default empty string
```

### Mistake 3: Providing `value` Prop Without `onChange` Handler (Read-Only Warning)

**The mistake:** Writing `<input value={name} />` without supplying an `onChange` handler function.

**Why it's wrong:** Providing a fixed `value` prop locks the input field value. Users will be unable to type into the input, and React logs warning `You provided a 'value' prop without an 'onChange' handler`.

*Incorrect:*
```javascript
<input value={name} /> // ❌ Input is locked read-only!
```

*Fix:*
```javascript
<input value={name} onChange={e => setName(e.target.value)} />
```

## 6. Practice Exercises

### Exercise 1: The Number Limiter

**Problem:** You have a controlled input for a phone number. Write the `onChange` handler so that it ONLY updates the state if the user types numbers. If they type a letter, the input ignores it.

**Expected output:**
> [!check]- Answer
> ```javascript
> function handleChange(e) {
>   const input = e.target.value;
>   // Only update state if it contains only numbers
>   if (/^\d*$/.test(input)) {
>     setPhone(input);
>   }
> }
> ```
> - You can use an `if` statement to conditionally call the `set` function based on what `e.target.value` is.

---



### Exercise 2: Controlled Form Multi-Input Handling

**Problem:** Build controlled form managing `email` and `password` with a single object state handler.

**Expected output:**
> [!check]- Answer
> ```text
> function LoginForm() { const [form, setForm] = useState({ email: '', password: '' }); const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value }); return <form><input name="email" value={form.email} onChange={handleChange} /><input name="password" value={form.password} onChange={handleChange} /></form>; }
> ```
> ```javascript
> function LoginForm() {
>   const [form, setForm] = useState({ email: '', password: '' });
>   const handleChange = e => {
>     setForm({ ...form, [e.target.name]: e.target.value });
>   };
>   return (
>     <form>
>       <input name="email" value={form.email} onChange={handleChange} />
>       <input name="password" value={form.password} onChange={handleChange} />
>     </form>
>   );
> }
> ```
>
> **Explanation:** Computed property names (`[e.target.name]`) manage multi-input form object state.

---

### Exercise 3: Controlled Checkbox Input Property

**Problem:** What prop handles controlled state for checkbox inputs? (`checked={isChecked}` instead of `value`).

**Expected output:**
> [!check]- Answer
> ```text
> checked={isChecked} prop paired with onChange={e => setIsChecked(e.target.checked)}
> ```
> ```javascript
> <input type="checkbox" checked={isChecked} onChange={e => setIsChecked(e.target.checked)} />
> ```
>
> **Explanation:** Checkboxes use boolean `checked` props instead of string `value` props.

## 7. Related Terms
- [Uncontrolled Components](uncontrolled_components.md) — The alternative way to handle forms without tying every keystroke to state.
- [Unidirectional Data Flow](../level_02/unidirectional_flow.md) — Controlled components perfectly demonstrate this concept.
- [`useState` Hook](../level_02/use_state.md) — useState for form inputs.
- [Synthetic Events](synthetic_events.md) — Related concept: Synthetic Events.

---

## 8. Key Takeaways
- A **Controlled Component** is an input whose `value` is tied directly to React State.
- You must use the `onChange` event to update the state on every keystroke.
- This pattern makes React the "Single Source of Truth", allowing for instant form validation, disabling buttons based on input length, and manipulating user input in real-time.
