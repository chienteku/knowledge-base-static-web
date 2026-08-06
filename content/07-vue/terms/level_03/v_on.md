# `v-on`

> **Level 3 — Directives & Template Features**
> A fundamental Vue directive used to attach event listeners to HTML DOM elements or custom component events, executing JavaScript handlers when interactions occur.

---

## 1. Prerequisites

- [Directives](directives.md) — The category `v-on` belongs to.
- [Reactive State](../level_02/reactive_state.md) — The JavaScript data that event listeners typically mutate.

---

## 2. Term Category

**Core Event Handling Directive (One-Way Upward Event Binding)**: `v-on` is Vue's primary syntax for binding user interactions (clicks, keypresses, mouse moves, form submissions) and custom component emits to JavaScript method execution. Operating at client-side browser DOM execution runtime, `v-on` automatically manages raw DOM `addEventListener` calls when elements enter the document and unbinds `removeEventListener` calls when elements are unmounted, preventing browser memory leaks.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In Vanilla JavaScript, listening to user events required writing imperative DOM code:
```javascript
const btn = document.getElementById('submit-btn');
btn.addEventListener('click', handleSubmit);
```
This imperative approach suffered from two major operational problems:
1. **Memory Leaks:** Developers frequently forgot to call `removeEventListener` when elements were destroyed, trapping callbacks and DOM nodes in memory.
2. **Coupling:** Event registration logic was scattered across JS files rather than declared right on the visual HTML elements being interacted with.

Vue introduced **`v-on`** to handle event listening declaratively inside HTML templates. By writing `v-on:click="submitData"` (or shorthand `@click="submitData"`), Vue automatically manages underlying DOM listener attachments on mount and performs complete teardown when components unmount.

### (2) Reality Metaphor

Imagine a large office building equipped with physical wall light switches controlling hallway lights.

Writing imperative Vanilla JS `addEventListener` code is like sending an electrician into the building with a spool of copper wire every morning to manually twist copper wires onto the light switches, and hoping the electrician remembers to snip the wires every evening before leaving. If the electrician forgets, tangled live wires accumulate behind walls.

**`v-on`** is like installing pre-wired smart toggle switches. The electrical connections are specified directly on the switch blueprint (`@click="toggleLight"`). When a switch is unmounted or moved during office renovations, the smart wiring disconnects automatically—no manual wire snipping or memory leaks required.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <!-- v-on shorthand '@' binds click events to script setup functions -->
  <button @click="increment">Clicked {{ count }} times</button>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const logMessages = ref([])

function logEvent(name, event) {
  logMessages.value.unshift({
    id: Date.now(),
    text: `${name} triggered at X:${event.clientX}, Y:${event.clientY}`
  })
}

function handleKeySubmit(event) {
  logMessages.value.unshift({
    id: Date.now(),
    text: `Enter key pressed in input: ${event.target.value}`
  })
}
</script>

<template>
  <div class="event-demo">
    <h3>Interactive Event Monitor</h3>

    <!-- 1. Passing native $event to inline methods -->
    <button @click="logEvent('Primary Button', $event)">
      Click Me (Passes $event)
    </button>

    <!-- 2. Listening to keyup events -->
    <input 
      type="text" 
      placeholder="Type and press Enter..." 
      @keyup.enter="handleKeySubmit" 
    />

    <!-- 3. Mouse move tracking -->
    <div class="mouse-box" @mousemove="logEvent('Mouse Box', $event)">
      Hover Mouse Over Me
    </div>

    <h4>Log History:</h4>
    <ul>
      <li v-for="log in logMessages" :key="log.id">{{ log.text }}</li>
    </ul>
  </div>
</template>

<style scoped>
.event-demo { display: flex; flex-direction: column; gap: 10px; max-width: 500px; }
.mouse-box { padding: 20px; background: #e6f7ff; border: 1px dashed #1890ff; text-align: center; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Invoking methods instantly in template bindings (`@click="handleClick()"` vs `@click="handleClick"`)

**The mistake:** Writing `@click="deleteUser()"` when `deleteUser` expects an event parameter without arguments.

**Why it's wrong:** Writing `@click="handler()"` with empty parentheses executes inline function calls, discarding Vue's automatic DOM event parameter passing. Use parameterless method reference `@click="handler"` to receive native `$event` automatically.

*Incorrect:*
```vue
<!-- Discards native $event parameter -->
<button @click="submitForm()">Submit</button>
```

*Fix:*
```vue
<!-- Passes native DOM $event automatically -->
<button @click="submitForm">Submit</button>
<!-- Or explicitly pass $event when custom arguments are needed: -->
<button @click="submitForm($event, userId)">Submit</button>
```

---

### Mistake 2: Forgetting `.prevent` modifier on form submit buttons

**The mistake:** Binding `@click="saveData"` to `<button type="submit">` inside a `<form>` without intercepting submission.

**Why it's wrong:** Clicking a submit button inside an HTML form triggers native browser page reloads, destroying Vue single-page application state. Use `<form @submit.prevent="saveData">`.

*Incorrect:*
```vue
<form>
  <button type="submit" @click="saveData">Save</button> <!-- ❌ Triggers page reload! -->
</form>
```

*Fix:*
```vue
<form @submit.prevent="saveData">
  <button type="submit">Save</button> <!-- Intercepts submit cleanly -->
</form>
```

---

### Mistake 3: Object syntax `@click` instead of array or individual listener declarations

**The mistake:** Writing `@click="{ handleA, handleB }"` expecting multiple functions to run sequentially.

**Why it's wrong:** `v-on` object syntax is reserved for binding multiple different event types at once (`v-on="{ click: handleA, mouseover: handleB }"`). To execute multiple statements on a single event, separate statements with semicolons or call a wrapper method.

*Incorrect:*
```vue
<button @click="{ step1(), step2() }">Run Steps</button> <!-- ❌ Invalid syntax! -->
```

*Fix:*
```vue
<button @click="step1(); step2()">Run Steps</button> <!-- Valid inline statements -->
```

---

## 5. Practice Exercises

### Exercise 1: IoT Device Control Command Listener (IoT)

**Scenario:** An IoT telemetry terminal allows operators to send control commands. You need to bind click listeners for buttons, intercept form submission reloads, and capture keydown shortcuts.

**Requirements:**
1. Bind form submission using `@submit.prevent="sendTelemetryCommand"`.
2. Bind button click using `@click="emergencyShutdown"`.
3. Capture `Ctrl + S` keydown shortcut using `@keydown.ctrl.s.prevent="saveLogs"`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const commandInput = ref('')
> const terminalLogs = ref([])
> 
> function sendTelemetryCommand() {
>   terminalLogs.value.unshift(`Executed: ${commandInput.value}`)
>   commandInput.value = ''
> }
> 
> function emergencyShutdown() {
>   terminalLogs.value.unshift('EMERGENCY SHUTDOWN INITIATED')
> }
> 
> function saveLogs() {
>   terminalLogs.value.unshift('Terminal logs saved to disk.')
> }
> </script>
> 
> <template>
>   <div class="terminal" tabIndex="0" @keydown.ctrl.s.prevent="saveLogs">
>     <!-- 1. @submit.prevent -->
>     <form @submit.prevent="sendTelemetryCommand">
>       <input v-model="commandInput" placeholder="Enter CLI command..." />
>       <button type="submit">Send</button>
>     </form>
> 
>     <!-- 2. @click -->
>     <button class="danger" @click="emergencyShutdown">
>       Emergency Shutdown
>     </button>
> 
>     <p>Press Ctrl+S to save logs.</p>
>     <ul>
>       <li v-for="(log, i) in terminalLogs" :key="i">{{ log }}</li>
>     </ul>
>   </div>
> </template>
> 
> <style scoped>
> .danger { background: #ff4d4f; color: white; margin-top: 10px; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `@submit.prevent` intercepts standard HTML browser form submissions.
> 2. **Concept**: `@click` listens for mouse button press events on DOM elements.
> 3. **Concept**: Modifier chain `@keydown.ctrl.s.prevent` intercepts custom browser keyboard shortcuts.
> 4. **Concept**: Vue automatically cleans up DOM event listeners when components unmount.
> 
---

### Exercise 2: Financial Trade Form Inline Parameter Passing (Finance)

**Scenario:** A stock trading application displays order rows. Traders can execute trades by clicking "Buy" or "Sell" buttons, which must pass the stock symbol, order direction, and native mouse event to the handler.

**Requirements:**
1. Bind `@click` handler passing parameters `'AAPL'`, `'BUY'`, and `$event`.
2. Read `clientX` and `clientY` from `$event` parameter.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const statusMessage = ref('')
> 
> function executeOrder(symbol, side, event) {
>   statusMessage.value = `Order Executed: ${side} ${symbol} at Click Coordinates (${event.clientX}, ${event.clientY})`
> }
> </script>
> 
> <template>
>   <div class="trader">
>     <h3>Quick Order Execution</h3>
>     
>     <!-- Inline parameters + native $event -->
>     <button @click="executeOrder('AAPL', 'BUY', $event)">
>       Buy AAPL
>     </button>
>     
>     <button @click="executeOrder('AAPL', 'SELL', $event)">
>       Sell AAPL
>     </button>
> 
>     <p>{{ statusMessage }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `$event` is a special Vue template variable representing the native DOM event object.
> 2. **Concept**: Passing `$event` alongside custom parameters permits reading event coordinates and targets.
> 3. **Concept**: Inline function calls allow passing dynamic argument primitives cleanly.
> 4. **Concept**: Methods operate declaratively based on template arguments.
> 
---

### Exercise 3: Real-Time Network Packet Inspection Mouse Drag Events (Networking)

**Scenario:** A network packet analyzer allows expanding packet row height via dragging a splitter handle using `mousedown`, `mousemove`, and `mouseup` events.

**Requirements:**
1. Attach `mousedown` listener to splitter handle.
2. Bind `mousemove` and `mouseup` events cleanly.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const panelHeight = ref(150)
> let isDragging = false
> 
> function startDrag() {
>   isDragging = true
>   window.addEventListener('mousemove', onDrag)
>   window.addEventListener('mouseup', stopDrag)
> }
> 
> function onDrag(e) {
>   if (isDragging) {
>     panelHeight.value = Math.max(50, e.clientY - 100)
>   }
> }
> 
> function stopDrag() {
>   isDragging = false
>   window.removeEventListener('mousemove', onDrag)
>   window.removeEventListener('mouseup', stopDrag)
> }
> </script>
> 
> <template>
>   <div class="analyzer">
>     <div class="packet-panel" :style="{ height: panelHeight + 'px' }">
>       Packet Inspection Log Window
>     </div>
>     <!-- v-on:mousedown starter -->
>     <div class="splitter-bar" @mousedown="startDrag">
>       === Drag to Resize ===
>     </div>
>   </div>
> </template>
> 
> <style scoped>
> .packet-panel { background: #1f1f1f; color: #52c41a; padding: 10px; }
> .splitter-bar { background: #ccc; cursor: ns-resize; text-align: center; font-size: 12px; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `@mousedown` initiates drag sequences declaratively from the template element.
> 2. **Concept**: Window listeners added during drag are cleaned up in `stopDrag()` to prevent memory leaks.
> 3. **Concept**: Dynamic style binding `:style` updates element dimensions based on reactive `panelHeight`.
> 4. **Concept**: Declarative directives integrate smoothly with low-level browser interaction APIs.
> 
---

## 6. Related Terms

- [`v-bind`](v_bind.md) — Attribute binding (the other half of template directives).
- [Emitting Events (`defineEmits`)](../level_04/emit.md) — Custom child component event triggers.
- [Event, Key & Form Modifiers](modifiers.md) — Directive modifier suffixes.
- [`v-model`](v_model.md) — Two-way data binding.

---

## 7. Key Takeaways

- **`v-on`** attaches event listeners to DOM elements or custom component events.
- Always use the standard shorthand syntax: the **`@`** symbol (`@click`, `@submit`).
- Vue automatically manages `addEventListener` and `removeEventListener` calls to prevent memory leaks.
- Pass `$event` explicitly when calling inline methods that require both custom arguments and the native DOM event.
- Use event modifiers (`.prevent`, `.stop`, `.enter`) to keep JavaScript method logic clean and pure.
