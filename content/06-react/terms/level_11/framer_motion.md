# Framer Motion

> **Level 11 — Ecosystem Libraries**
> An industry-standard production animation engine for React providing a declarative API for gestures, layout morphing, and unmount transitions.

---

## 1. Prerequisites

- [Declarative Programming](../level_01/declarative_programming.md) — Framer Motion expresses animations declaratively via component props.
- [Component Lifecycle](../level_03/component_lifecycle.md) — Framer Motion orchestrates enter, update, and exit lifecycle phase animations.

---

## 2. Term Category

**Ecosystem (declarative animation engine)**: Framer Motion is a production animation framework built specifically for React's component model. Rather than manually manipulating imperatively managed CSS class names, inline element style strings, or direct DOM offset calculations, Framer Motion exposes wrapped motion components (`<motion.div>`, `<motion.button>`) that accept declarative animation props (`initial`, `animate`, `exit`, `transition`, `whileHover`, `whileTap`).

Powered by an internal physics engine and hardware-accelerated CSS transform drivers, Framer Motion automatically calculates keyframes, spring physics, and layout morphing transitions. It integrates cleanly with React render cycles, providing specialized components like `<AnimatePresence>` to defer component DOM unmounting until exit keyframe animations complete.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Animating React components using vanilla CSS or raw JavaScript animation libraries introduces significant complexity:
1. **Unmount Animation Problem:** When a React component's state changes to unmount an element (`{isOpen && <Modal />}`), React immediately removes the DOM node from the document. A CSS transition or fade-out animation cannot play because the element vanishes instantly.
2. **Layout Shift Calculations:** Animating layout position changes (such as reordering list items) requires complex FLIP (First, Last, Invert, Play) DOM calculation math to prevent jarring visual jumps.
3. **Imperative Boilerplate:** Writing manual `addEventListener('mouseenter')` or inline CSS style transitions splits animation logic away from React's state driven philosophy.

Framer Motion solves these challenges. It exposes `<AnimatePresence>` to catch unmounting React nodes, delaying physical DOM removal until `exit` animation keyframes finish playing. Furthermore, its `layout` prop automatically calculates FLIP layout morphing between renders using GPU-accelerated transforms.

### (2) Reality Metaphor

Imagine a stage theater production.

- **Vanilla React without Framer Motion (Trapdoor Removal):** An actor (**a component**) finishes their scene. Instantly, a trapdoor opens under their feet and they fall through the floor (**instant unmount**). The audience sees them vanish abruptly without taking a bow or bowing out gracefully (**no exit animation**).
- **Framer Motion with AnimatePresence (Stage Manager Curtain Call):** When the script signals the actor's scene is over, a stage manager (**`<AnimatePresence>`**) steps in and holds the scene open. The actor plays a smooth bow and walks off into the wings (**plays `exit` animation**). Only after the actor steps completely offstage does the stage manager close the scene curtain (**physically unmounts DOM node**).

### (3) React Code Examples

#### Short Snippet

```jsx
// WelcomeBanner.jsx (Framer Motion Short Snippet)
import { motion } from 'framer-motion';

export function WelcomeBanner() {
  return (
    // Automatically fades in and slides down on mount
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="welcome-card"
    >
      <h3>Welcome to the Dashboard</h3>
    </motion.div>
  );
}
```

#### Fuller Example

```jsx
// ModalDialog.jsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function ModalDialog({ isOpen, onClose, title, children }) {
  return (
    // AnimatePresence enables exit animations when isOpen becomes false
    <AnimatePresence>
      {isOpen && (
        <div className="backdrop-overlay">
          {/* Fades out backdrop on exit */}
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Scales and fades in modal content */}
          <motion.div
            className="modal-box"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <header className="modal-header">
              <h2>{title}</h2>
              <button onClick={onClose} className="close-btn">×</button>
            </header>
            <div className="modal-body">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omitting unique `key` props when animating list elements inside `<AnimatePresence>`

**The mistake:** Rendering dynamic list items or tabs inside `<AnimatePresence>` without supplying unique React `key` props.

**Why it's wrong:** React uses `key` identity to track component unmounting and mounting. Without a unique key, React mutates existing DOM nodes in place during state updates, causing `<AnimatePresence>` to miss the unmount lifecycle event and skip exit animations.

*Incorrect:*
```jsx
// ❌ Missing unique key: Framer Motion cannot detect unmounting tab change!
<AnimatePresence>
  <motion.div exit={{ opacity: 0 }}>{activeTab.content}</motion.div>
</AnimatePresence>
```

*Fix:*
```jsx
<AnimatePresence mode="wait">
  <motion.div key={activeTab.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    {activeTab.content}
  </motion.div>
</AnimatePresence>
```

### Mistake 2: Using standard HTML DOM elements (`<div>`) instead of Motion components (`<motion.div>`)

**The mistake:** Passing Framer Motion props (`initial`, `animate`, `whileHover`) to standard HTML DOM elements.

**Why it's wrong:** Standard HTML DOM tags ignore Framer Motion animation props, logging React dev warnings regarding unrecognized DOM attributes and failing to execute animations.

*Incorrect:*
```jsx
// ❌ Standard HTML div ignores animate/initial props!
<div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Content</div>
```

*Fix:*
```jsx
// Use motion.div wrapper component
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Content</motion.div>
```

### Mistake 3: Omitting `<AnimatePresence>` when defining `exit` props on conditionally rendered elements

**The mistake:** Adding `exit={{ opacity: 0 }}` to a `<motion.div>` rendered via `{show && <motion.div ... />}` without wrapping the conditional block inside `<AnimatePresence>`.

**Why it's wrong:** When `show` becomes `false`, React unmounts the element from the DOM instantly. Without `<AnimatePresence>`, Framer Motion has no opportunity to defer unmounting while playing the exit animation.

*Incorrect:*
```jsx
// ❌ Unmounts instantly; exit animation never plays!
{show && <motion.div exit={{ opacity: 0 }}>Alert</motion.div>}
```

*Fix:*
```jsx
<AnimatePresence>
  {show && <motion.div exit={{ opacity: 0 }}>Alert</motion.div>}
</AnimatePresence>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Telemetry Alarm Banner Alert

**Scenario:** Create an IoT Telemetry alarm banner that slides down from top screen bounds when an alarm triggers, animating smoothly out of view when silenced by an operator.

**Requirements:**
1. Wrap conditional banner in `<AnimatePresence>`.
2. Animate `initial={{ y: -50, opacity: 0 }}` to `animate={{ y: 0, opacity: 1 }}`.
3. Animate `exit={{ y: -50, opacity: 0 }}` on dismissal.
4. Include interactive `whileTap={{ scale: 0.95 }}` on button.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { motion, AnimatePresence } from 'framer-motion';
>
> export function TelemetryAlarmBanner({ activeAlarm, onSilence }) {
>   return (
>     <AnimatePresence>
>       {activeAlarm && (
>         <motion.div
>           key={activeAlarm.id}
>           className="alarm-banner critical"
>           initial={{ y: -60, opacity: 0 }}
>           animate={{ y: 0, opacity: 1 }}
>           exit={{ y: -60, opacity: 0 }}
>           transition={{ duration: 0.35, ease: 'easeOut' }}
>         >
>           <div className="banner-content">
>             <strong>⚠️ ALARM: {activeAlarm.sensorName}</strong>
>             <span>Temp: {activeAlarm.temp}°C (Exceeds Limit)</span>
>           </div>
>           <motion.button
>             whileHover={{ scale: 1.05 }}
>             whileTap={{ scale: 0.95 }}
>             onClick={() => onSilence(activeAlarm.id)}
>             className="btn-silence"
>           >
>             Silence Alarm
>           </motion.button>
>         </motion.div>
>       )}
>     </AnimatePresence>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Exit Lifecycle Deferral**: `<AnimatePresence>` catches component unmounting when `activeAlarm` becomes `null`, playing slide-up exit keyframes.
> 2. **Key Tracking**: `key={activeAlarm.id}` ensures consecutive alarms re-trigger enter animations cleanly.
> 3. **Tactile Gesture Feedback**: `whileTap={{ scale: 0.95 }}` provides tactile button feedback on touch or click events.
> 4. **Hardware Acceleration**: GPU-accelerated CSS `transform: translateY()` handles movement smooth at 60 FPS.
> 
### Exercise 2: Financial Trading Order Ticket Slide-Over

**Scenario:** Develop a Financial Trading order ticket slide-over drawer that slides in from the right edge of the screen when a trader clicks a ticker symbol.

**Requirements:**
1. Animate drawer from `x: '100%'` to `x: 0`.
2. Use spring transition physics (`stiffness: 260`, `damping: 25`).
3. Handle backdrop fade-in and fade-out.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { motion, AnimatePresence } from 'framer-motion';
>
> export function OrderTicketDrawer({ isOpen, ticker, onClose }) {
>   return (
>     <AnimatePresence>
>       {isOpen && (
>         <div className="drawer-overlay">
>           <motion.div
>             className="drawer-backdrop"
>             initial={{ opacity: 0 }}
>             animate={{ opacity: 0.5 }}
>             exit={{ opacity: 0 }}
>             onClick={onClose}
>           />
>           <motion.aside
>             className="order-drawer"
>             initial={{ x: '100%' }}
>             animate={{ x: 0 }}
>             exit={{ x: '100%' }}
>             transition={{ type: 'spring', stiffness: 260, damping: 25 }}
>           >
>             <h3>Order Ticket - {ticker}</h3>
>             <div className="ticket-body">
>               <p>Market Buy Order: 100 Shares</p>
>               <button onClick={onClose}>Submit Trade</button>
>             </div>
>           </motion.aside>
>         </div>
>       )}
>     </AnimatePresence>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Spring Physics Engine**: `type: 'spring'` provides realistic physical momentum without rigid linear keyframe timers.
> 2. **Off-Screen Bounds**: `x: '100%'` translates drawer completely off-screen prior to enter animation.
> 3. **Synchronized Overlay**: Backdrop opacity and drawer slide animations execute concurrently inside `<AnimatePresence>`.
> 4. **Clean Component Boundary**: Unmounting is deferred until drawer completes rightward slide-out animation.
> 
### Exercise 3: E-Commerce Product Carousel Morphing

**Scenario:** Construct an e-commerce product image thumbnail gallery where selecting a thumbnail animates an active border layout highlight using Framer Motion's `layoutId`.

**Requirements:**
1. Implement thumbnail gallery mapping over image list.
2. Render `<motion.div layoutId="activeRing">` around active item.
3. Smoothly morph selection highlight between thumbnails.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> 'use client';
>
> import { useState } from 'react';
> import { motion } from 'framer-motion';
>
> export function ProductGallery({ images }) {
>   const [selectedIndex, setSelectedIndex] = useState(0);
> 
>   return (
>     <div className="gallery-widget">
>       <div className="main-stage">
>         <img src={images[selectedIndex]} alt="Product view" />
>       </div>
> 
>       <div className="thumbnails-row">
>         {images.map((img, idx) => (
>           <div 
>             key={idx} 
>             className="thumb-wrapper"
>             onClick={() => setSelectedIndex(idx)}
>           >
>             <img src={img} alt="thumb" />
>             {selectedIndex === idx && (
>               <motion.div 
>                 layoutId="activeIndicator"
>                 className="active-ring"
>                 transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>               />
>             )}
>           </div>
>         ))}
>       </div>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **FLIP Layout Morphing**: `layoutId="activeIndicator"` instructs Framer Motion to morph the active ring element smoothly between thumbnail positions.
> 2. **Declarative State Binding**: Active ring is conditionally rendered, while Framer Motion handles continuous spatial interpolation.
> 3. **Zero Math Overhead**: FLIP calculations run automatically without manual `getBoundingClientRect()` measuring code.
> 4. **Hardware Acceleration**: Performs layout position interpolation via GPU transform channels.
> 
---

## 6. Related Terms

- [Conditional Rendering](../level_05/conditional_rendering.md) — The conditional rendering pattern enhanced by `<AnimatePresence>`.
- [Declarative Programming](../level_01/declarative_programming.md) — The programming model underlying Framer Motion props.
- [Component Lifecycle](../level_03/component_lifecycle.md) — The mount/unmount phase transitions managed by motion components.

---

## 7. Key Takeaways

- Framer Motion is the standard declarative animation framework for React.
- Replace standard HTML tags with motion components (`<motion.div>`, `<motion.button>`) to enable animation props.
- Props like `initial` and `animate` declare starting and ending keyframe states.
- Wrap conditionally rendered elements in `<AnimatePresence>` to enable `exit` unmount animations.
- Always supply unique React `key` props to child items rendered inside `<AnimatePresence>`.
- Use `layoutId` to morph shared layout elements smoothly between components.
