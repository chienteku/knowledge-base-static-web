# React Native

> **Level 11 — Ecosystem Libraries**
> A cross-platform framework that compiles React component trees directly into native iOS and Android mobile UI controls.

---

## 1. Prerequisites

- [Declarative Programming](../level_01/declarative_programming.md) — React Native utilizes React's declarative component architecture, state hooks, and reconciliation.
- [Virtual DOM](../level_01/virtual_dom.md) — The abstract UI data structure that allows React to target native mobile platforms.

---

## 2. Term Category

**Ecosystem (cross-platform framework)**: React Native is a mobile application development framework created by Meta that allows developers to build native iOS and Android applications using React and JavaScript. Unlike traditional web applications that render HTML elements (`<div>`, `<p>`, `<button>`) into browser DOM trees, React Native maps component primitives (`<View>`, `<Text>`, `<TouchableOpacity>`) directly to native mobile platform controls (`UIView` on iOS, `android.view.View` on Android).

React Native does not run inside an embedded web browser wrapper (such as WebView-based hybrid frameworks). Instead, it runs JavaScript application logic on a dedicated JavaScript engine thread (Hermes), communicating asynchronously across a native bridge or direct C++ JSI (JavaScript Interface) layer to invoke native OS drawing and system APIs.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Historically, building mobile applications for both iOS and Android required writing two completely separate applications using different programming languages and development environments: Swift/Objective-C in Xcode for iOS, and Kotlin/Java in Android Studio for Android. This dual-development model required separate engineering teams, doubled development costs, and led to feature drift between platforms.

Meta recognized that React's [Virtual DOM](../level_01/virtual_dom.md) is fundamentally an abstract tree of UI node data. The core reconciliation engine does not require HTML DOM targets.

By replacing browser HTML rendering targets with native iOS and Android platform UI bridges, **React Native** realized the philosophy of *"Learn once, write anywhere."* Developers write a single codebase using React functional components, hooks, and JavaScript styling logic, which compiles into native UI widgets on both iOS and Android with native 60+ FPS performance.

### (2) Reality Metaphor

Imagine an international diplomacy summit.

- **WebView Hybrid App (Hiring a Translator to Read a Book):** You hire a translator to sit in a room and read a web page out loud to delegates through a megaphone (**rendering HTML inside a mobile web browser view**). The delegates listen, but latency is high, scrolling stutters, and it feels fundamentally artificial (**web view performance lag**).
- **React Native (Simultaneous Native Interpreters):** The speaker addresses the room in JavaScript (**React component state & logic**). Native interpreters (**JSI / Native Bridge**) instantly translate the speaker's words directly into native French for French delegates (**drawing native iOS UIViews**) and native German for German delegates (**drawing native Android Views**). Delegates interact directly with native UI controls without web browser wrappers.

### (3) React Code Examples

#### Short Snippet

```jsx
// NativeCounter.jsx (React Native Primitive Components)
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';

export function NativeCounter() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.textVal}>Count: {count}</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setCount(prev => prev + 1)}
      >
        <Text style={styles.btnText}>Increment Native State</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  textVal: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8 },
  btnText: { color: '#FFFFFF', fontWeight: '600' }
});
```

#### Fuller Example

```jsx
// SensorTelemetryMobile.jsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

export default function SensorTelemetryMobile() {
  const [sensors, setSensors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching sensor telemetry array
    setTimeout(() => {
      setSensors([
        { id: 's1', name: 'Server Room A', temp: 22.4, status: 'NOMINAL' },
        { id: 's2', name: 'HVAC Intake 4', temp: 36.8, status: 'WARNING' },
        { id: 's3', name: 'Backup Generator', temp: 19.1, status: 'NOMINAL' }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const renderSensorCard = ({ item }) => (
    <View style={[styles.card, item.status === 'WARNING' && styles.warningCard]}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardMetrics}>Temp: {item.temp}°C</Text>
      <Text style={styles.statusBadge}>Status: {item.status}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Syncing Native Telemetry...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>IoT Field Telemetry</Text>
      <FlatList
        data={sensors}
        keyExtractor={(item) => item.id}
        renderItem={renderSensorCard}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F2F7', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 },
  listContent: { paddingHorizontal: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  warningCard: { borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  cardMetrics: { fontSize: 14, color: '#3A3A3C', marginTop: 4 },
  statusBadge: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginTop: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#8E8E93' }
});
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Attempting to use browser HTML DOM elements (`<div>`, `<p>`, `<span>`) in React Native

**The mistake:** Writing `<div><p>Hello Mobile</p></div>` inside a React Native application.

**Why it's wrong:** Mobile iOS and Android operating systems do not contain an HTML DOM engine. Using HTML tags in React Native causes immediate runtime compilation crashes: `Uncaught Error: Unknown element <div>`.

*Incorrect:*
```jsx
// ❌ Crash: HTML elements do not exist in React Native!
function MobileCard() {
  return (
    <div>
      <p>Card Content</p>
    </div>
  );
}
```

*Fix:*
```jsx
import { View, Text } from 'react-native';

function MobileCard() {
  return (
    <View>
      <Text>Card Content</Text>
    </View>
  );
}
```

### Mistake 2: Applying web CSS class strings (`className="card"`) instead of `StyleSheet.create()` objects

**The mistake:** Passing CSS class strings (`className="card"`) to React Native primitive components.

**Why it's wrong:** React Native does not use browser CSS engines, external `.css` stylesheet files, or class names. Styling is handled exclusively via JavaScript objects created with `StyleSheet.create()` passed to the `style` prop.

*Incorrect:*
```jsx
// ❌ React Native primitives do not accept className props!
<View className="container">
  <Text className="title">Title</Text>
</View>
```

*Fix:*
```jsx
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20 }
});

<View style={styles.container}>
  <Text style={styles.title}>Title</Text>
</View>
```

### Mistake 3: Forgetting that Flexbox `flexDirection` defaults to `'column'` in React Native

**The mistake:** Assuming Flexbox containers lay out children horizontally in a row by default, as in web CSS.

**Why it's wrong:** On the web, CSS Flexbox `flexDirection` defaults to `'row'`. In React Native, `flexDirection` defaults to `'column'` to align with mobile vertical screen layouts.

*Incorrect:*
```javascript
// Expecting side-by-side horizontal layout without specifying flexDirection: 'row'
```

*Fix:*
```javascript
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' } // Explicitly set 'row' for horizontal layouts
});
```

---

## 5. Practice Exercises

### Exercise 1: IoT Mobile Equipment Status Screen

**Scenario:** Develop a mobile screen for IoT service technicians to view equipment status details and toggle an active maintenance lock using React Native primitives.

**Requirements:**
1. Use `<View>`, `<Text>`, and `<TouchableOpacity>` primitives.
2. Toggle `isLocked` state using `setIsLocked(prev => !prev)`.
3. Apply dynamic styles using `StyleSheet.create()`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { useState } from 'react';
> import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
>
> export function EquipmentLockScreen({ equipmentName = 'Generator #4' }) {
>   const [isLocked, setIsLocked] = useState(false);
> 
>   return (
>     <View style={styles.container}>
>       <Text style={styles.title}>Equipment: {equipmentName}</Text>
>       <Text style={styles.status}>
>         Status: {isLocked ? '🔒 MAINT LOCKED' : '🟢 OPERATIONAL'}
>       </Text>
>       
>       <TouchableOpacity 
>         style={[styles.btn, isLocked ? styles.btnUnlock : styles.btnLock]}
>         onPress={() => setIsLocked(prev => !prev)}
>       >
>         <Text style={styles.btnText}>
>           {isLocked ? 'Release Maintenance Lock' : 'Engage Maintenance Lock'}
>         </Text>
>       </TouchableOpacity>
>     </View>
>   );
> }
>
> const styles = StyleSheet.create({
>   container: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 12 },
>   title: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
>   status: { fontSize: 14, color: '#3A3A3C', marginVertical: 12 },
>   btn: { padding: 14, borderRadius: 8, alignItems: 'center' },
>   btnLock: { backgroundColor: '#FF3B30' },
>   btnUnlock: { backgroundColor: '#34C759' },
>   btnText: { color: '#FFFFFF', fontWeight: 'bold' }
> });
> ```
>
> #### Technical Explanation
> 1. **Native Primitives**: Uses `<View>` and `<Text>` instead of `<div>` and `<p>`.
> 2. **Native Touch Target**: `<TouchableOpacity>` provides native touch feedback and `onPress` handling.
> 3. **Style Array Composition**: Combines base and conditional styles using array notation `[styles.btn, ...]`.
> 4. **State Updater Pattern**: Toggles lock state cleanly via `setIsLocked(prev => !prev)`.
> 
### Exercise 2: Financial Mobile Ticker Watchlist Item

**Scenario:** Build a mobile financial trading watchlist row displaying stock ticker symbols, price changes, and trade execution buttons for iOS and Android devices.

**Requirements:**
1. Render stock symbol and current price in horizontal layout (`flexDirection: 'row'`).
2. Style price change text green for positive, red for negative.
3. Handle native press event via `onPress`.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
>
> export function TickerRow({ symbol, price, change, onTrade }) {
>   const isPositive = change >= 0;
> 
>   return (
>     <View style={styles.row}>
>       <View style={styles.symbolCol}>
>         <Text style={styles.symbolText}>{symbol}</Text>
>         <Text style={styles.subText}>Equity</Text>
>       </View>
> 
>       <View style={styles.priceCol}>
>         <Text style={styles.priceText}>${price.toFixed(2)}</Text>
>         <Text style={[styles.changeText, isPositive ? styles.green : styles.red]}>
>           {isPositive ? '+' : ''}{change.toFixed(2)}%
>         </Text>
>       </View>
> 
>       <TouchableOpacity style={styles.tradeBtn} onPress={() => onTrade(symbol)}>
>         <Text style={styles.tradeBtnText}>Trade</Text>
>       </TouchableOpacity>
>     </View>
>   );
> }
>
> const styles = StyleSheet.create({
>   row: { 
>     flexDirection: 'row', 
>     alignItems: 'center', 
>     justifyContent: 'space-between',
>     paddingVertical: 14, 
>     borderBottomWidth: 1, 
>     borderBottomColor: '#E5E5EA' 
>   },
>   symbolCol: { flex: 1 },
>   symbolText: { fontSize: 16, fontWeight: '700', color: '#000000' },
>   subText: { fontSize: 12, color: '#8E8E93' },
>   priceCol: { alignItems: 'flex-end', marginRight: 16 },
>   priceText: { fontSize: 16, fontWeight: '600' },
>   changeText: { fontSize: 12, fontWeight: '600' },
>   green: { color: '#34C759' },
>   red: { color: '#FF3B30' },
>   tradeBtn: { backgroundColor: '#007AFF', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
>   tradeBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }
> });
> ```
>
> #### Technical Explanation
> 1. **Horizontal Layout**: `flexDirection: 'row'` overrides React Native's default vertical column flex layout.
> 2. **Native Text Styling**: Fonts and weights are styled explicitly via `StyleSheet` objects.
> 3. **Conditional Color Assignment**: Dynamic style array `[styles.changeText, isPositive ? ...]` toggles colors cleanly.
> 4. **Touch Event Delegation**: `onPress` delegates trade events back to parent screen handlers.
> 
### Exercise 3: E-Commerce Mobile Shopping Cart Item

**Scenario:** Construct a mobile e-commerce cart item row displaying item details and native quantity increment/decrement buttons.

**Requirements:**
1. Render item image placeholder, name, and quantity.
2. Implement native quantity buttons using `<TouchableOpacity>`.
3. Ensure state updates use state updater pattern.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import { useState } from 'react';
> import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
>
> export function MobileCartItem({ name, initialQty, price }) {
>   const [quantity, setQuantity] = useState(initialQty);
> 
>   return (
>     <View style={styles.cartCard}>
>       <View style={styles.infoCol}>
>         <Text style={styles.itemName}>{name}</Text>
>         <Text style={styles.itemPrice}>${(price * quantity).toFixed(2)}</Text>
>       </View>
> 
>       <View style={styles.qtyRow}>
>         <TouchableOpacity 
>           style={styles.qtyBtn} 
>           onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
>         >
>           <Text style={styles.qtyBtnText}>-</Text>
>         </TouchableOpacity>
> 
>         <Text style={styles.qtyVal}>{quantity}</Text>
> 
>         <TouchableOpacity 
>           style={styles.qtyBtn} 
>           onPress={() => setQuantity(prev => prev + 1)}
>         >
>           <Text style={styles.qtyBtnText}>+</Text>
>         </TouchableOpacity>
>       </View>
>     </View>
>   );
> }
>
> const styles = StyleSheet.create({
>   cartCard: { 
>     flexDirection: 'row', 
>     justifyContent: 'space-between', 
>     alignItems: 'center',
>     backgroundColor: '#FFFFFF', 
>     padding: 16, 
>     borderRadius: 10,
>     marginVertical: 6
>   },
>   infoCol: { flex: 1 },
>   itemName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
>   itemPrice: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
>   qtyRow: { flexDirection: 'row', alignItems: 'center' },
>   qtyBtn: { width: 32, height: 32, backgroundColor: '#E5E5EA', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
>   qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
>   qtyVal: { marginHorizontal: 12, fontSize: 16, fontWeight: '600' }
> });
> ```
>
> #### Technical Explanation
> 1. **Encapsulated Native UI**: Renders mobile UI components without HTML DOM dependencies.
> 2. **Touch Target Dimensions**: Sets explicit width/height dimensions for touchable buttons.
> 3. **Updater Function Pattern**: Quantity updates use `prev => prev + 1` to guarantee atomic state changes.
> 4. **Derived Price Calculations**: Subtotal is derived directly during render as `(price * quantity).toFixed(2)`.
> 
---

## 6. Related Terms

- [Declarative Programming](../level_01/declarative_programming.md) — The parent programming model powering React Native.
- [Virtual DOM](../level_01/virtual_dom.md) — The abstract tree structure enabling non-browser platform rendering.
- [Components](../level_01/components.md) — Core functional units mapped to native platform controls.

---

## 7. Key Takeaways

- React Native compiles React component trees directly into native iOS and Android platform UI widgets.
- Uses native primitives (`<View>`, `<Text>`, `<TouchableOpacity>`) instead of HTML DOM tags (`<div>`, `<p>`, `<button>`).
- Does not run inside a browser WebView; logic runs on a JavaScript engine communicating with native OS APIs.
- Styling is defined via JavaScript objects using `StyleSheet.create()`, not CSS files or class names.
- Flexbox `flexDirection` defaults to `'column'` in React Native.
- Uses `onPress` instead of `onClick` for native touch interaction handling.
