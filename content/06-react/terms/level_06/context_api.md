# The Context API

> **Level 6 — Context & Global State**
> A built-in React feature that allows you to "teleport" data directly from a Parent component to any deeply nested Child component, completely bypassing the middlemen.

---

## 1. Prerequisites
- [Prop Drilling](../level_06/prop_drilling.md) — The exact problem that the Context API was created to solve.

---

## 2. Term Category
- **React Architecture / State Management**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If your top-level `<App />` knows that the user prefers "Dark Mode", it is incredibly annoying to pass `theme="dark"` down through 20 different components just so a single `<Button />` can paint itself black.
The **Context API** acts like a global radio broadcast. The `<App />` sets up a radio tower and broadcasts the "Dark Mode" signal. Any component anywhere in the app can tune into that specific radio frequency and receive the data directly, without any of the intermediate components knowing about it.

### (2) The Three Steps of Context
**Step 1: Create the Context (The Radio Frequency)**
```javascript
import { createContext } from 'react';
// We create the empty context. Export it so others can use it!
export const ThemeContext = createContext("light"); 
```

**Step 2: Provide the Context (The Radio Tower)**
You wrap the top-level parent component in a `<Context.Provider>` and pass it the data you want to broadcast using the `value` prop.
```javascript
function App() {
  const [theme, setTheme] = useState("dark");

  return (
    // Everything inside this Provider can hear the broadcast!
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}
```

**Step 3: Consume the Context (The Radio Receiver)**
*(Note: Step 3 is usually done using the `useContext` hook, which is covered in the next term!)*

### (3) What should go in Context?
Context is best for "Global, infrequently changing data."
Perfect examples:
1. The current UI Theme (Light/Dark).
2. The currently logged-in User Profile.
3. The user's preferred Language (Localization).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Putting fast-changing state in Context

**The mistake:** A developer puts the `mousePosition` (X and Y coordinates) into a Context Provider at the top of the app. 

**Why it's wrong:** When the `value` of a Context.Provider changes, **every single component that consumes that context is forced to re-render immediately.** If the mouse moves 60 times a second, your entire app will re-render 60 times a second and completely freeze.
**Golden Rule:** The Context API is NOT optimized for high-frequency state changes. For fast-changing global data, use a dedicated state manager like Zustand or Redux.

---



### Mistake 2: Passing Un-Memoized Value Objects to Context Providers (Re-Render Cascade Trap)

**The mistake:** Writing `<AuthContext.Provider value={{ user, setUser }}>` inside a parent component.

**Why it's wrong:** Inline object `{ user, setUser }` creates a NEW object reference on EVERY parent render! ALL components subscribing to `useContext(AuthContext)` will re-render, even if `user` didn't change. Memoize with `useMemo`.

*Incorrect:*
```javascript
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>; // ❌ New object reference every render!
}
```

*Fix:*
```javascript
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Mistake 3: Using Context API for Frequently Changing Global App State (Performance Bottleneck)

**The mistake:** Storing 60fps mouse coordinates or high-frequency text input state inside a single top-level Context.

**Why it's wrong:** When a Context value changes, EVERY component consuming that Context re-renders! Context does not support selector-based partial subscriptions. Use Zustand or Redux for high-frequency state.

*Incorrect:*
```javascript
// Storing 60fps mouse position state in global React Context
```

*Fix:*
```javascript
Use Zustand / Redux Toolkit with selector subscriptions for high-frequency updates
```

## 6. Practice Exercises

### Exercise 1: The Provider Scope

**Problem:** Look at this code:
```javascript
<ThemeContext.Provider value="dark">
  <Header />
</ThemeContext.Provider>
<Footer />
```
Can the `<Footer />` access the "dark" theme?

**Expected output:**
```text
No!
A component can only consume context if it is nested INSIDE the `<Context.Provider>` tags. Since Footer is outside the Provider, it cannot hear the broadcast.
```

> [!check]- Answer
> - Think about HTML hierarchy. Where does the Provider close?

---



### Exercise 2: Creating Custom Context Provider Component

**Problem:** Create `ThemeContext` and `ThemeProvider` component exposing `theme` state and `toggleTheme` callback.

**Expected output:**
```text
const ThemeContext = createContext(); function ThemeProvider({ children }) { const [theme, setTheme] = useState('light'); const toggleTheme = useCallback(() => setTheme(t => t === 'light' ? 'dark' : 'light'), []); const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]); return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>; }
```

> [!check]- Answer
> ```javascript
> const ThemeContext = createContext();
>
> function ThemeProvider({ children }) {
>   const [theme, setTheme] = useState('light');
>   const toggleTheme = useCallback(() => {
>     setTheme(t => (t === 'light' ? 'dark' : 'light'));
>   }, []);
>   const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
>   return (
>     <ThemeContext.Provider value={value}>
>       {children}
>     </ThemeContext.Provider>
>   );
> }
> ```
>
> **Explanation:** Context Providers wrap child trees to supply global state without prop drilling.

### Exercise 3: Context Default Value Fallback

**Problem:** What value does `useContext(MyContext)` return if a component consumes Context outside its Provider? (The initial default value passed to `createContext(defaultValue)`).

**Expected output:**
```text
The initial default value passed to createContext(defaultValue)
```

> [!check]- Answer
> ```text
> The initial default value passed to createContext(defaultValue)
> ```
>
> **Explanation:** Providing default values in `createContext()` provides fallback values during testing.

## 7. Related Terms
- [`useContext` Hook](../level_06/use_context.md) — How the Child actually grabs the data out of the Context.
- [Prop Drilling](../level_06/prop_drilling.md) — What Context prevents.

---

## 8. Key Takeaways
- **The Context API** allows you to teleport data across your app without passing props manually at every level.
- You **Create** a context (`createContext`), and you **Provide** the data using a `<Provider value={data}>` wrapper component.
- Any child inside that Provider can access the data directly.
- Whenever the `value` changes, all components listening to that context will immediately re-render.
- Only use it for global data that rarely changes (Themes, Auth, Localization).
