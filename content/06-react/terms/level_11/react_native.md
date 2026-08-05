# React Native

> **Level 11 — Ecosystem Libraries**
> A framework created by Meta that allows you to write standard React JavaScript code, but compiles it into a native mobile app for iOS and Android instead of a website.

---

## 1. Prerequisites
- [Declarative Programming](../level_01/declarative_programming.md) — React Native uses the exact same React Hooks, State, and architecture.
- [Virtual DOM](../level_01/virtual_dom.md) — The engine that powers React Native.
---

## 2. Term Category
- **React Ecosystem / Mobile Framework**

---

## 3. Environment Context
- **Mobile (iOS / Android)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Building mobile apps used to be a nightmare. You had to hire a Swift developer to build the iPhone app, a Kotlin/Java developer to build the Android app, and a React developer to build the Website. You were paying 3 people to build the exact same product 3 times.
Meta realized that the [Virtual DOM](../level_01/virtual_dom.md) is just an abstract tree of data. It doesn't *have* to output HTML `<div>` tags!
They created **React Native**. It takes your React Component tree and tells iOS to draw native iOS UI widgets, and tells Android to draw native Android UI widgets. You write the code once, and it runs on both phones natively!

### (2) Learn Once, Write Anywhere
In React Native, you cannot use HTML tags (because phones don't understand HTML). Instead, you use native primitive components provided by the framework.
- `<div>` becomes `<View>`
- `<p>` or `<h1>` becomes `<Text>`
- `<button>` becomes `<Button>` or `<TouchableOpacity>`

```javascript
import { View, Text, StyleSheet } from 'react-native';
import { useState } from 'react';

// Looks exactly like React, but uses Mobile primitives!
export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text>Count: {count}</Text>
    </View>
  );
}
```

### (3) True Native Performance
React Native does NOT run your app inside a hidden mobile web browser (like older frameworks such as Cordova/Ionic did). It actually compiles down to native machine code for the UI layer, making it nearly indistinguishable from an app built with Swift or Kotlin in terms of smoothness and performance.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use CSS in React Native

**The mistake:** A web developer tries to import an `app.css` file or write `style="margin-top: 10px"` on a `<View>`.

**Why it's wrong:** Mobile phones do not have CSS engines! React Native uses a custom styling system (`StyleSheet.create()`) that looks like CSS written in JavaScript camelCase, but it only supports a subset of CSS features (primarily Flexbox). 
**Golden Rule:** You must learn React Native's specific JavaScript styling system. You cannot reuse your CSS files from the web.

---



### Mistake 2: Using HTML DOM Tags (`<div>`, `<span>`, `<p>`) Instead of React Native Primitives (`<View>`, `<Text>`)

**The mistake:** Writing `<div><span>Hello</span></div>` in a React Native app.

**Why it's wrong:** React Native does NOT run in a web browser DOM environment! Native iOS/Android platforms do not have HTML elements. Use React Native primitives (`<View>`, `<Text>`).

*Incorrect:*
```javascript
function App() {
  return <div><span>Hello</span></div>; // ❌ Crash: HTML elements unsupported in React Native!
}
```

*Fix:*
```javascript
import { View, Text } from 'react-native';
function App() { return <View><Text>Hello</Text></View>; }
```

### Mistake 3: Applying CSS Class Strings (`className="box"`) Instead of `StyleSheet.create()` Objects

**The mistake:** Writing `<View className="box">` in standard React Native.

**Why it's wrong:** React Native uses JavaScript style objects (`StyleSheet.create({ box: { flex: 1 } })`) instead of CSS class strings.

*Incorrect:*
```javascript
<View className="container"> // ❌ CSS class strings unsupported in core React Native!
```

*Fix:*
```javascript
const styles = StyleSheet.create({ container: { flex: 1 } });
<View style={styles.container}>
```

## 6. Practice Exercises

### Exercise 1: Web to Mobile Translation

**Problem:** Translate this React Web component into a React Native component.
```javascript
function Button() {
  return (
    <div onClick={() => alert("Clicked")}>
      <span>Click Me</span>
    </div>
  )
}
```

**Expected output:**
> [!check]- Answer
> ```javascript
> import { View, Text, TouchableOpacity, Alert } from 'react-native';
> 
> function Button() {
>   return (
>     // TouchableOpacity is the standard wrapper for making things clickable
>     <TouchableOpacity onPress={() => Alert.alert("Clicked")}>
>       <Text>Click Me</Text>
>     </TouchableOpacity>
>   )
> }
> ```
> - `<div>` -> `<View>` (or Touchable)
> - `<span>` -> `<Text>`
> - `onClick` -> `onPress`

---



### Exercise 2: React Native Counter Component

**Problem:** Build React Native counter component using `<View>`, `<Text>`, and `<TouchableOpacity>`.

**Expected output:**
> [!check]- Answer
> ```text
> import { View, Text, TouchableOpacity } from 'react-native'; function Counter() { const [count, setCount] = useState(0); return <View><Text>Count: {count}</Text><TouchableOpacity onPress={() => setCount(c => c + 1)}><Text>Increment</Text></TouchableOpacity></View>; }
> ```
> ```javascript
> import { View, Text, TouchableOpacity } from 'react-native';
>
> function Counter() {
>   const [count, setCount] = useState(0);
>   return (
>     <View>
>       <Text>Count: {count}</Text>
>       <TouchableOpacity onPress={() => setCount(c => c + 1)}>
>         <Text>Increment</Text>
>       </TouchableOpacity>
>     </View>
>   );
> }
> ```
>
> **Explanation:** React Native maps core component primitives (`View`, `Text`) directly to native mobile UI controls.

---

### Exercise 3: React Native Flexbox Layout Default

**Problem:** What is the default `flexDirection` in React Native Flexbox layout? (`'column'` instead of web default `'row'`).

**Expected output:**
> [!check]- Answer
> ```text
> flexDirection: 'column'
> ```
> ```text
> flexDirection: 'column'
> ```
>
> **Explanation:** React Native defaults Flexbox layout direction to vertical columns.

## 7. Related Terms
- [Declarative Programming](../level_01/declarative_programming.md) — The parent library.
- [Virtual DOM](../level_01/virtual_dom.md) — The abstract layer that makes React Native possible.
---

## 8. Key Takeaways
- **React Native** allows you to build real, native iOS and Android apps using React.
- You use the exact same React logic (`useState`, `useEffect`, Custom Hooks).
- You cannot use HTML (`<div>`) or CSS. You must use React Native primitives (`<View>`, `<Text>`) and the `StyleSheet` API.
- It provides true native performance, not a web wrapper.
