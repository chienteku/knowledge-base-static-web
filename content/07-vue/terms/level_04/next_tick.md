# `nextTick`

> **Level 4 — Components & Lifecycle**
> A core Vue utility that returns a Promise resolving immediately after the next DOM update flush cycle, allowing developers to safely execute code dependent on post-render DOM measurements or state.

---

## 1. Prerequisites

- [Reactive State](../level_02/reactive_state.md) — How Vue detects data mutations reactively.
- [Component Lifecycle](component_lifecycle.md) — The timing phases of component rendering and updates.

---

## 2. Term Category

**Reactivity Scheduler Utility (DOM Microtask Flush Synchronization)**: `nextTick` is Vue's explicit API for synchronizing JavaScript execution with the reactivity scheduler's asynchronous DOM update flush queue. When reactive state mutates, Vue does NOT update the physical browser DOM synchronously; instead, it queues Virtual DOM patch jobs into a microtask batch queue. `nextTick` queues callbacks or resolves Promises immediately after this microtask queue flushes. Running across browser client rendering and testing frameworks, `nextTick` enables post-render DOM measurements (height, scroll position, focus) without layout thrashing.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Vue, when you mutate a reactive variable (e.g. `message.value = 'Updated'`), the physical HTML DOM displayed on screen **does not update synchronously on the next line of code**.

If you attempt to read DOM attributes immediately on the subsequent line, you receive stale, outdated HTML values:
```javascript
message.value = 'Updated'
console.log(elementRef.value.innerText) // Output: 'Old Message' (DOM not updated yet!)
```

Vue operates asynchronously by design. If Vue forced a physical browser DOM recalculation every single time any reactive variable mutated, a function that modifies ten variables in sequence would force the browser to recalculate CSS layout and repaints ten times in a row. This causes severe performance degradation known as "layout thrashing".

To prevent this, Vue batches reactive state mutations. It waits until synchronous JavaScript execution finishes, then flushes a single combined Virtual DOM patch to the physical browser DOM at the end of the current "tick".

However, software engineering frequently demands running code *after* physical DOM updates complete:
- Auto-scrolling a live chat window to the bottom after appending a new message element.
- Focusing an `<input>` field that was just rendered conditionally via `v-if`.
- Measuring the rendered height or width of a dynamic container for canvas or charting calculations.

Vue designed **`nextTick`** to bridge this timing gap. It acts as an asynchronous pause button, allowing developers to wait for Vue's Virtual DOM patch flush to complete before executing post-render DOM code.

### (2) Reality Metaphor

Imagine a high-speed printing press printing a daily newspaper.

Mutating reactive state variables (`count.value++`) is like an editor sending revised headline text down to the typesetting office. The printing press doesn't immediately print a single page of paper for every individual typo correction—that would waste paper and slow down production. Instead, the printing press batches all headline edits onto a single print plate queue.

Calling **`await nextTick()`** is like standing at the output conveyor belt of the printing press waiting for the current batch print run to complete. You don't try to read the paper while it's still being typeset inside the machine (reading DOM synchronously right after state mutation). You call `await nextTick()`, wait for the fresh newspaper page to drop onto the output tray (the Virtual DOM flush completes), and then pick up the printed page to read the final headline (`reading post-patch DOM properties`).

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, nextTick } from 'vue'

const text = ref('Initial Text')
const headingRef = ref(null)

async function updateHeading() {
  text.value = 'Updated Text'
  
  // 1. Synchronous read - retrieves old DOM text!
  console.log('Immediate read:', headingRef.value.innerText) // 'Initial Text'
  
  // 2. Await nextTick Promise flush
  await nextTick()
  
  // 3. Post-flush read - retrieves updated DOM text!
  console.log('Post-nextTick read:', headingRef.value.innerText) // 'Updated Text'
}
</script>

<template>
  <h3 ref="headingRef">{{ text }}</h3>
  <button @click="updateHeading">Update Text</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, nextTick } from 'vue'

const messages = ref(['System initialized.', 'Connected to cluster.'])
const newMessage = ref('')
const isEditing = ref(false)

const chatContainer = ref(null)
const inputRef = ref(null)

async function sendMessage() {
  if (!newMessage.value.trim()) return
  
  messages.value.push(newMessage.value)
  newMessage.value = ''
  
  // Await nextTick so the new <li> element is physically rendered in the DOM
  await nextTick()
  
  // Calculate container scrollHeight accurately post-patch
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function enableInlineEdit() {
  isEditing.value = true // Renders input via v-if
  
  // Input node does NOT exist in DOM yet! Await nextTick flush first:
  await nextTick()
  
  if (inputRef.value) {
    inputRef.value.focus() // Safe cursor focus
  }
}
</script>

<template>
  <div class="chat-app">
    <div ref="chatContainer" class="message-box">
      <p v-for="(msg, i) in messages" :key="i">{{ msg }}</p>
    </div>

    <div class="input-bar">
      <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type message..." />
      <button @click="sendMessage">Send</button>
    </div>

    <div class="edit-section">
      <button v-if="!isEditing" @click="enableInlineEdit">Edit Topic</button>
      <input v-else ref="inputRef" type="text" placeholder="Topic name..." />
    </div>
  </div>
</template>

<style scoped>
.message-box { height: 120px; overflow-y: auto; border: 1px solid #ccc; padding: 8px; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Querying updated DOM nodes immediately after state mutation without `nextTick()`

**The mistake:** Mutating state (`count.value = 10`) and immediately inspecting `el.textContent` on the next line without `nextTick()`.

**Why it's wrong:** Vue updates the physical DOM asynchronously on the next microtask flush. Reading DOM attributes synchronously right after mutating state retrieves stale DOM values.

*Incorrect:*
```javascript
count.value = 10;
console.log(headingRef.value.textContent); // ❌ Logs old DOM text content!
```

*Fix:*
```javascript
count.value = 10;
await nextTick();
console.log(headingRef.value.textContent); // Logs updated DOM text content (10)
```

---

### Mistake 2: Using `setTimeout(fn, 0)` instead of `nextTick()` for DOM flush synchronization

**The mistake:** Wrapping post-render DOM queries inside `setTimeout(() => ..., 0)`.

**Why it's wrong:** `nextTick()` integrates directly into Vue's microtask queue (`Promise.resolve()`), executing immediately after the Virtual DOM flush completes. `setTimeout` delays execution to the browser's macrotask queue, causing visual UI flickering.

*Incorrect:*
```javascript
isInputVisible.value = true;
setTimeout(() => { inputRef.value.focus(); }, 0); // ❌ Macrotask delay anti-pattern!
```

*Fix:*
```javascript
isInputVisible.value = true;
await nextTick();
inputRef.value.focus(); // Microtask DOM sync
```

---

### Mistake 3: Using `nextTick` to coordinate pure state-to-state calculations

**The mistake:** Using `nextTick` to chain reactive state updates (e.g. updating variable A, awaiting `nextTick()`, then updating variable B).

**Why it's wrong:** Pure state calculations should be handled declaratively using `computed()` properties or `watch()`. Using `nextTick` to sync JavaScript state forces unnecessary extra component re-renders.

*Incorrect:*
```javascript
const width = ref(10)
const area = ref(100)
async function setWidth(w) {
  width.value = w
  await nextTick() // ❌ Anti-pattern: Don't use nextTick to sync state!
  area.value = width.value * width.value
}
```

*Fix:*
```javascript
const width = ref(10)
const area = computed(() => width.value * width.value) // Clean reactive calculation
```

---

## 5. Practice Exercises

### Exercise 1: IoT Terminal Auto-Scroll Log Window (IoT)

**Scenario:** An industrial IoT terminal receives high-frequency telemetry messages. Every time a new log arrives, the terminal scroll container must auto-scroll to the bottom. You must use `nextTick` to ensure `scrollHeight` measurements reflect newly added DOM log elements.

**Requirements:**
1. Append telemetry string to `logs` array.
2. Await `nextTick()` to guarantee DOM elements are rendered.
3. Set `container.scrollTop = container.scrollHeight`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, nextTick } from 'vue'
> 
> const logs = ref(['[00:00:01] System boot sequence started...'])
> const logContainer = ref(null)
> 
> async function receiveTelemetry(message) {
>   logs.value.push(message)
>   
>   // 1. Await nextTick flush so <div> log row is physically created in DOM
>   await nextTick()
>   
>   // 2. Measure and apply scroll top safely
>   if (logContainer.value) {
>     logContainer.value.scrollTop = logContainer.value.scrollHeight
>   }
> }
> </script>
> 
> <template>
>   <div class="terminal">
>     <div ref="logContainer" class="log-window">
>       <div v-for="(log, i) in logs" :key="i" class="log-row">{{ log }}</div>
>     </div>
>     <button @click="receiveTelemetry(`[${new Date().toLocaleTimeString()}] Sensor Reading: Nominal`)">
>       Simulate Log Arrival
>     </button>
>   </div>
> </template>
> 
> <style scoped>
> .log-window { height: 100px; overflow-y: auto; background: #111; color: #00ff00; padding: 6px; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `messages.push()` queues a Virtual DOM patch.
> 2. **Concept**: `await nextTick()` resolves after the VDOM patch completes.
> 3. **Concept**: `scrollHeight` measurements retrieve accurate post-patch pixel heights.
> 4. **Concept**: Guarantees auto-scroll operates on actual rendered elements.
> 
---

### Exercise 2: Financial Order Form Conditional Focus (Finance)

**Scenario:** A stock trading form allows switching between "Quick Order" and "Custom Order" modes. Switching to Custom Order renders a price limit `<input>` via `v-if`. You must focus the input immediately upon rendering.

**Requirements:**
1. Toggle `isCustomOrder = true`.
2. Await `nextTick()`.
3. Focus input template ref `limitInputRef.value.focus()`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, nextTick } from 'vue'
> 
> const isCustomOrder = ref(false)
> const limitInputRef = ref(null)
> 
> async function enableCustomMode() {
>   isCustomOrder.value = true
>   
>   // Await DOM update flush so v-if renders the input tag
>   await nextTick()
>   
>   if (limitInputRef.value) {
>     limitInputRef.value.focus()
>   }
> }
> </script>
> 
> <template>
>   <div class="trader-form">
>     <button v-if="!isCustomOrder" @click="enableCustomMode">
>       Enable Custom Limit Order
>     </button>
> 
>     <div v-else class="custom-fields">
>       <label>Limit Price ($)</label>
>       <input ref="limitInputRef" type="number" placeholder="0.00" />
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-if` elements do not exist in the DOM until after the reactivity update flush.
> 2. **Concept**: Calling `.focus()` synchronously right after setting `isCustomOrder = true` throws `TypeError` (ref is null).
> 3. **Concept**: `await nextTick()` pauses execution until the element is mounted in the document.
> 4. **Concept**: Standard UX pattern for dynamic form elements.
> 
---

### Exercise 3: Real-Time Network Graph Canvas Resize Synchronization (Networking)

**Scenario:** A network monitoring graph resizes its underlying `<canvas>` buffer width based on container DOM measurements after toggling a sidebar panel.

**Requirements:**
1. Toggle sidebar ref `isSidebarOpen`.
2. Await `nextTick()`.
3. Read `container.clientWidth` and update canvas resolution.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, nextTick } from 'vue'
> 
> const isSidebarOpen = ref(false)
> const canvasContainer = ref(null)
> const canvasWidth = ref(600)
> 
> async function toggleSidebar() {
>   isSidebarOpen.value = !isSidebarOpen.value
>   
>   // Await nextTick so CSS layout recalculates container width
>   await nextTick()
>   
>   if (canvasContainer.value) {
>     canvasWidth.value = canvasContainer.value.clientWidth
>     console.log('Canvas resized to container width:', canvasWidth.value)
>   }
> }
> </script>
> 
> <template>
>   <div class="network-layout">
>     <button @click="toggleSidebar">Toggle Sidebar</button>
>     <div class="wrapper">
>       <div v-if="isSidebarOpen" class="sidebar">Sidebar Content</div>
>       <div ref="canvasContainer" class="main-stage">
>         <canvas :width="canvasWidth" height="200" class="graph-canvas"></canvas>
>       </div>
>     </div>
>   </div>
> </template>
> 
> <style scoped>
> .wrapper { display: flex; }
> .sidebar { width: 200px; background: #eee; }
> .main-stage { flex: 1; }
> .graph-canvas { background: #222; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: CSS layout changes (flexbox adjustments) process during Virtual DOM patch flushes.
> 2. **Concept**: `await nextTick()` waits for the browser layout engine to finish updating element client dimensions.
> 3. **Concept**: `clientWidth` measurements reflect accurate post-layout width values.
> 4. **Concept**: Prevents drawing canvas buffers with stale pixel dimensions.
> 
---

## 6. Related Terms

- [Watchers](../level_02/watchers.md) — Watching reactive state mutations.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — In-memory tree flushed to physical DOM.
- [Component Lifecycle](component_lifecycle.md) — Timing phases of rendering.

---

## 7. Key Takeaways

- Vue updates the physical browser DOM asynchronously by batching state changes into microtask flush queues.
- **`nextTick()`** returns a Promise that resolves immediately after Vue's Virtual DOM patch flush completes.
- Use `nextTick` when code depends on post-render DOM properties (focusing inputs, scrolling, container sizing).
- `await nextTick()` provides clean async/await syntax compared to legacy callback functions.
- Never use `nextTick` for state-to-state data calculations; use `computed()` instead.
