# `useContext` Hook

> **Level 6 — Context & Global State**
> The hook used by a Child component to "tune in" to a Context broadcast and extract the data teleported by the Parent.

---

## 1. Prerequisites
- [The Context API](context_api.md) — You must understand how to Create and Provide Context before you can Consume it.
---

## 2. Term Category
- **Core React Hook**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before React 16.8 (Hooks), consuming Context was incredibly ugly. You had to wrap your component in a complex `<Context.Consumer>` higher-order component that used a confusing "Render Props" pattern. It made your JSX look like a deeply nested staircase of doom.
The **`useContext`** hook simplified this entirely. It allows you to grab the Context data and assign it to a simple JavaScript variable at the top of your functional component.

### (2) How it works
You import the original `Context` object (the one you made with `createContext`), and pass it directly into the `useContext` hook.
```javascript
// 1. Import the hook and the Context object
import { useContext } from 'react';
import { ThemeContext } from './App'; 

function DeeplyNestedButton() {
  // 2. Pass the Context object into the hook. 
  // It instantly returns whatever data the Provider broadcasted!
  const theme = useContext(ThemeContext);

  // 3. Use the data normally
  return (
    <button className={`btn-${theme}`}>
      Click Me
    </button>
  );
}
```
No props needed! The button instantly knows the theme is "dark".

### (3) The Closest Provider Rule
What happens if you have multiple Providers of the same Context?
```javascript
<ThemeContext.Provider value="light">
  <ThemeContext.Provider value="dark">
    <DeeplyNestedButton />
  </ThemeContext.Provider>
</ThemeContext.Provider>
```
`useContext` will ALWAYS grab the value from the **closest Provider above it in the tree**. In this case, it will grab "dark". If there is no Provider at all, it will grab the default value you provided to `createContext("default")`.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Passing the Provider instead of the Context

**The mistake:** A developer tries to consume the context like this: `const theme = useContext(ThemeContext.Provider);`

**Why it's wrong:** The hook strictly expects the base Context object (`ThemeContext`), not the React Component wrapper (`ThemeContext.Provider`). Passing the Provider will result in an error or undefined behavior.
**Golden Rule:** Always pass the exact object created by `createContext()` into the `useContext` hook.

---



### Mistake 2: Calling `useContext` Without Wrapping the Component Tree in a Context Provider

**The mistake:** Calling `useContext(AuthContext)` in a component that is rendered outside `<AuthContext.Provider>`.

**Why it's wrong:** Calling `useContext` outside a Provider returns the default value passed to `createContext(defaultValue)`. If no default value was supplied (`createContext()`), accessing context properties causes `TypeError: Cannot read properties of undefined`.

*Incorrect:*
```javascript
const { user } = useContext(AuthContext); // ❌ Throws error if rendered outside Provider!
```

*Fix:*
```javascript
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Mistake 3: Splitting Frequently Used Contexts into 20 Granular Separate Context Providers

**The mistake:** Wrapping application in 20 nested `<Context1.Provider><Context2.Provider>...` layers.

**Why it's wrong:** Deep context provider nesting (Provider Hell) complicates component tree inspection. Combine related global states or use a global store library like Zustand.

*Incorrect:*
```javascript
// 20 nested Context Providers wrapping root App component
```

*Fix:*
```javascript
Group related contexts or use Zustand for modular global state
```

## 6. Practice Exercises

### Exercise 1: The Context Custom Hook

**Problem:** To make life easier, senior developers often hide `useContext` inside a Custom Hook so other developers don't have to import the Context object themselves. 
Write a custom hook called `useTheme` that returns the `ThemeContext`.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { useContext } from 'react';
> import { ThemeContext } from './ThemeContextFile';
> 
> // Custom Hook!
> export function useTheme() {
>   return useContext(ThemeContext);
> }
> 
> // Now other files can just write: const theme = useTheme();
> ```
> - Wrap `useContext` inside a function that starts with `use`.

---



### Exercise 2: Custom Context Hook Guard Pattern

**Problem:** Create custom hook `useAuthContext()` throwing informative error if consumed outside `AuthProvider`.

**Expected output:**
> [!check]- Answer
> ```text
> function useAuthContext() { const context = useContext(AuthContext); if (!context) throw new Error('useAuthContext must be used within AuthProvider'); return context; }
> ```
> ```javascript
> function useAuthContext() {
>   const context = useContext(AuthContext);
>   if (!context) {
>     throw new Error('useAuthContext must be used within AuthProvider');
>   }
>   return context;
> }
> ```
>
> **Explanation:** Custom context hooks validate Provider wrapper presence early with clear error messages.

---

### Exercise 3: Consuming Multiple Contexts

**Problem:** Consume `ThemeContext` and `UserContext` inside a component using `useContext`.

**Expected output:**
> [!check]- Answer
> ```text
> function Header() { const { theme } = useContext(ThemeContext); const { user } = useContext(UserContext); return <header className={theme}>Welcome {user.name}</header>; }
> ```
> ```javascript
> function Header() {
>   const { theme } = useContext(ThemeContext);
>   const { user } = useContext(UserContext);
>   return <header className={theme}>Welcome {user.name}</header>;
> }
> ```
>
> **Explanation:** `useContext` can be called multiple times inside a component to consume independent contexts.

## 7. Related Terms
- [The Context API](context_api.md) — The system that powers this hook.
- [Custom Hooks](../level_04/custom_hooks.md) — Often used to wrap `useContext` for cleaner code.
- [Prop Drilling](prop_drilling.md) — Solving prop drilling.
---

## 8. Key Takeaways
- **`useContext`** is the hook used to read data from a Context Provider.
- You pass the actual Context object (e.g., `ThemeContext`) into the hook.
- It completely replaces the ugly, legacy `<Context.Consumer>` pattern.
- It always reads data from the closest Provider above it in the component tree.
