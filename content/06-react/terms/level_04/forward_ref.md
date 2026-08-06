# `forwardRef` & `useImperativeHandle`

> **Level 4 — Advanced Hooks**
> Exposing internal DOM node references or custom imperative methods across parent-child component boundaries.

---

## 1. Prerequisites

- [`useRef` Hook](use_ref.md) — The reference container hook mechanism.
- [Components](../level_01/components.md) — Custom component boundaries crossed by ref attributes.

---

## 2. Term Category

**Component Pattern (ref delegation API)**: By default, custom React components do not accept a `ref` prop because `ref` is a reserved attribute (like `key`) intercepted by React's Fiber engine. `React.forwardRef` is an API wrapper that intercepts the `ref` attribute passed to a custom component and forwards it down to an underlying DOM node or child component.

Paired with `forwardRef`, the `useImperativeHandle` hook allows child components to customize the instance value exposed to parents, replacing raw DOM nodes with restricted, safe imperative interface methods.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In declarative React, data flows downward via props. However, certain DOM operations are inherently imperative:
- Focusing an `<input>` element on modal mount.
- Measuring DOM element dimensions or scroll offsets.
- Triggering HTML5 `<video>` or `<audio>` play/pause actions.

If a parent component `<LoginForm />` needs to focus an input inside `<CustomTextInput />`, writing `<CustomTextInput ref={inputRef} />` fails in React 18 and earlier because React does not pass `ref` as a standard prop.

`React.forwardRef` resolves this by permitting components to forward their internal DOM refs to parent components. Furthermore, exposing raw DOM nodes directly can violate encapsulation (a parent could alter DOM styles or delete nodes). `useImperativeHandle` resolves encapsulation concerns by allowing child components to expose only specific imperative methods (`.focus()`, `.clear()`) to parents.

#### React 19 Ref Prop Simplification Note

In **React 19+**, `ref` is available as a standard component prop (`props.ref`), rendering `forwardRef` obsolete for new codebases. However, understanding `forwardRef` and `useImperativeHandle` remains critical for maintaining React 18 codebases and building controlled component libraries.

### (2) Reality Metaphor

Imagine visiting a bank teller window.

- **Ignored Ref (Default Security Gate):** You try to walk behind the counter to use the teller's computer terminal directly. The security gate blocks you (**custom components block ref access by default**).
- **`forwardRef` (Raw Access Gate):** The teller unlocks the counter gate and lets you operate the computer terminal directly (**exposing raw DOM node ref**).
- **`useImperativeHandle` (Service Intercom Panel):** The teller keeps the counter gate locked but provides a wall-mounted intercom panel with two buttons: *"Deposit Cash"* and *"Print Balance"*. You can trigger specific operations, but you cannot touch internal bank computers directly (**exposing a safe imperative interface**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { forwardRef } from 'react';

// Forwarding internal DOM input ref to parent component
const CustomInput = forwardRef((props, ref) => {
  return <input ref={ref} className="styled-input" {...props} />;
});

export default CustomInput;
```

#### Fuller Example

```jsx
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

// Child Component exposing custom imperative methods via useImperativeHandle
const CustomVideoPlayer = forwardRef(({ src }, ref) => {
  const videoRef = useRef(null);

  // Customize ref object exposed to parent
  useImperativeHandle(ref, () => ({
    playVideo: () => {
      if (videoRef.current) videoRef.current.play();
    },
    pauseVideo: () => {
      if (videoRef.current) videoRef.current.pause();
    },
    restartVideo: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  }));

  return <video ref={videoRef} src={src} width="400" />;
});

// Parent Component controlling child imperatively
function VideoDashboard() {
  const playerRef = useRef(null);

  return (
    <div>
      <CustomVideoPlayer ref={playerRef} src="/media/stream.mp4" />
      <div className="controls">
        <button onClick={() => playerRef.current?.playVideo()}>Play</button>
        <button onClick={() => playerRef.current?.pauseVideo()}>Pause</button>
        <button onClick={() => playerRef.current?.restartVideo()}>Restart</button>
      </div>
    </div>
  );
}

export default VideoDashboard;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Reversing Argument Order in `forwardRef` Render Functions

**The mistake:** Defining `forwardRef((ref, props) => ...)` with reversed arguments.

**Why it's wrong:** `forwardRef` passes arguments in strict order: `(props, ref)`. Reversing arguments assigns props data to the `ref` argument and breaks component logic.

*Incorrect:*
```jsx
const MyInput = forwardRef((ref, props) => { // ❌ Reversed arguments!
  return <input ref={ref} />;
});
```

*Fix:*
```jsx
const MyInput = forwardRef((props, ref) => { // ✅ Correct: (props, ref)
  return <input ref={ref} />;
});
```

### Mistake 2: Attempting to Pass `ref` to Custom Components Without `forwardRef` (React 18)

**The mistake:** Writing `<CustomInput ref={myRef} />` when `CustomInput` is a standard functional component `function CustomInput(props)`.

**Why it's wrong:** In React 18 and earlier, `ref` is not included in `props`. React logs console warning `Function components cannot be given refs` and `myRef.current` remains `null`.

*Incorrect:*
```jsx
function CustomInput(props) {
  return <input ref={props.ref} />; // ❌ props.ref is undefined in React 18
}
```

*Fix:*
```jsx
const CustomInput = forwardRef((props, ref) => {
  return <input ref={ref} />; // ✅ Properly forwarded ref
});
```

### Mistake 3: Using Imperative Handles to Bypass Declarative State Management

**The mistake:** Exposing state setters inside `useImperativeHandle` so parent components can imperatively change child state.

**Why it's wrong:** React is a declarative framework. Imperatively driving child state breaks unidirectional data flow and makes code difficult to trace. Use refs strictly for non-declarative DOM operations (focus, scroll, media playback).

*Incorrect:*
```jsx
useImperativeHandle(ref, () => ({
  setChildState: (val) => setState(val) // ❌ Bypassing declarative props!
}));
```

*Fix:*
```jsx
// Pass state updates down via standard declarative props
```

---

## 5. Practice Exercises

### Exercise 1: IoT Industrial Gauge Focus Delegate

**Scenario:** An IoT control panel contains nested numeric input fields inside custom `<SensorInput />` components. When an out-of-range value alert occurs, the parent panel must focus the specific invalid input using `forwardRef`.

**Requirements:**
1. Wrap `<SensorInput />` with `forwardRef`.
2. Forward `ref` to internal HTML `<input>`.
3. Parent component triggers `.focus()` when validation fails.
4. Render styled sensor input.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef, forwardRef } from 'react';
> 
> export const SensorInput = forwardRef(({ label, value, onChange }, ref) => {
>   return (
>     <div className="sensor-field">
>       <label>{label}</label>
>       <input ref={ref} type="number" value={value} onChange={onChange} />
>     </div>
>   );
> });
> 
> export function SensorControlPanel() {
>   const inputRef = useRef(null);
>   const [val, setVal] = React.useState(150);
> 
>   const handleValidate = () => {
>     if (val > 100) {
>       alert('Value out of safety bounds!');
>       inputRef.current?.focus();
>     }
>   };
> 
>   return (
>     <div>
>       <SensorInput ref={inputRef} label="Pressure Limit" value={val} onChange={e => setVal(+e.target.value)} />
>       <button onClick={handleValidate}>Validate Bounds</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Ref Delegation**: `forwardRef` intercepts `ref` and binds it to the native `<input>` node.
> 2. **Imperative Focus**: Parent triggers `.focus()` directly on input validation errors.
> 3. **Encapsulated Styling**: Component maintains markup wrapper structure.
> 4. **Declarative State**: Value binding remains driven by React state props.
> 
### Exercise 2: Financial Order Pad Imperative Clearer

**Scenario:** A stock order entry pad contains multiple custom fields. Expose a restricted `.clearForm()` imperative method to the parent order container using `useImperativeHandle`.

**Requirements:**
1. Child component uses `forwardRef` and `useImperativeHandle`.
2. Expose only `clearForm` method.
3. Reset internal input values on `.clearForm()` call.
4. Prevent parent from accessing raw DOM input nodes.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
> 
> export const OrderPadFields = forwardRef((props, ref) => {
>   const [symbol, setSymbol] = useState('');
>   const [shares, setShares] = useState('');
> 
>   useImperativeHandle(ref, () => ({
>     clearForm: () => {
>       setSymbol('');
>       setShares('');
>     }
>   }));
> 
>   return (
>     <div>
>       <input placeholder="Symbol" value={symbol} onChange={e => setSymbol(e.target.value)} />
>       <input placeholder="Shares" value={shares} onChange={e => setShares(e.target.value)} />
>     </div>
>   );
> });
> 
> export function TradingDesk() {
>   const padRef = useRef(null);
> 
>   return (
>     <div>
>       <OrderPadFields ref={padRef} />
>       <button onClick={() => padRef.current?.clearForm()}>Reset Order Pad</button>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Encapsulated Interface**: `useImperativeHandle` exposes only `clearForm`, shielding DOM nodes.
> 2. **Ref Isolation**: Parent cannot arbitrarily alter internal DOM styles.
> 3. **Clean Teardown**: Method clears local child state fields safely.
> 4. **Standard Signature**: Uses `(props, ref)` argument ordering.
> 
### Exercise 3: E-Commerce Audio Preview Player

**Scenario:** An online music store previews audio samples. Expose `.playPreview()` and `.stopPreview()` imperative methods from an `<AudioPreview />` child component using `useImperativeHandle`.

**Requirements:**
1. Encapsulate `<audio>` tag inside `<AudioPreview />`.
2. Expose `playPreview` and `stopPreview` via `useImperativeHandle`.
3. Parent component triggers playback on hover events.
4. Handle media loading state cleanly.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef, useImperativeHandle, forwardRef } from 'react';
> 
> export const AudioPreview = forwardRef(({ src }, ref) => {
>   const audioRef = useRef(null);
> 
>   useImperativeHandle(ref, () => ({
>     playPreview: () => {
>       audioRef.current?.play().catch(console.error);
>     },
>     stopPreview: () => {
>       if (audioRef.current) {
>         audioRef.current.pause();
>         audioRef.current.currentTime = 0;
>       }
>     }
>   }));
> 
>   return <audio ref={audioRef} src={src} preload="none" />;
> });
> 
> export function ProductTrackCard({ trackSrc, title }) {
>   const mediaRef = useRef(null);
> 
>   return (
>     <div
>       onMouseEnter={() => mediaRef.current?.playPreview()}
>       onMouseLeave={() => mediaRef.current?.stopPreview()}
>       style={{ padding: '16px', border: '1px solid #ccc' }}
    >
>       <h4>Track: {title}</h4>
>       <AudioPreview ref={mediaRef} src={trackSrc} />
>       <small>Hover to preview track</small>
>     </div>
>   );
> }
> ```
>
> #### Technical Explanation
> 1. **Media Control**: Imperative methods control HTML5 audio playback safely.
> 2. **Event Integration**: Hover events trigger playback methods cleanly.
> 3. **Safe Abstraction**: Encapsulates media DOM elements away from product cards.
> 4. **Promise Handling**: Safely handles browser media autoplay policies.
> 
---

## 6. Related Terms

- [`useRef` Hook](use_ref.md) — The reference container engine used to create ref objects.
- [Components](../level_01/components.md) — The structural boundaries crossed by forwarded refs.
- [Uncontrolled Components](../level_05/uncontrolled_components.md) — Form components relying on refs for input values.

---

## 7. Key Takeaways

- By default, custom React components do not accept the `ref` prop.
- Wrap components with `React.forwardRef((props, ref) => ...)` to forward DOM refs to parent components.
- Use `useImperativeHandle` alongside `forwardRef` to expose custom, restricted methods instead of raw DOM nodes.
- Argument order in `forwardRef` render functions is strictly `(props, ref)`.
- Use refs only for imperative non-declarative operations (focus, scroll, media controls).
- In React 19+, `ref` is available as a standard prop (`props.ref`), simplifying ref passing.
```

---

## File 3: `knowledge-base/06-react/terms/level_04/memoization.md`

```markdown
