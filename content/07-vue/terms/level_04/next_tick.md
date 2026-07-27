# `nextTick`

> **Level 4 — Components & Props**
> A utility that returns a Promise resolving after the next DOM update cycle, allowing developers to execute code that depends on the updated state of the DOM.

---

## 1. Prerequisites
- [Reactive State](../level_02/reactive_state.md) — How Vue detects data changes.
- [Component Lifecycle](../level_04/component_lifecycle.md) — The timing phases of rendering.

---

## 2. Term Category
- **Vue Core Concept**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vue, when you mutate a reactive variable (for example, `message.value = 'Updated'`), the physical DOM on the screen **does not update instantly**. 

If you try to access the DOM immediately on the next line of code, you will get the old, outdated HTML:
```javascript
message.value = 'Updated'
console.log(textElement.value.innerText) // Output: 'Old Message' (DOM hasn't updated yet!)
```
Vue does this on purpose. If Vue updated the real browser DOM every time any variable changed, a function that modifies ten variables in a row would force the browser to recalculate the page layout and styles ten times. This is called "layout thrashing" and is extremely slow.

To prevent this, Vue batches state changes. It waits until all synchronous JavaScript code has finished running, then runs a single, combined update to the DOM at the end of the current "tick".

However, there are times when your JavaScript code needs to run *after* the DOM has finished updating. For example:
- Scrolling a chat container to the bottom after adding a new message.
- Querying a DOM element's height or width.
- Focusing a text input that was just shown using `v-if`.

Vue designed **`nextTick`** to resolve this timing gap. It acts as a pause button, letting you wait for Vue to finish updating the DOM before executing the next line of code.

### (2) How it works under the hood
Vue's reactivity scheduler maintains a queue of pending DOM update jobs. When state changes occur:
1. The update jobs are pushed to a queue.
2. Vue schedules a flush handler to process this queue using JavaScript's native **Promise microtask** mechanism (`Promise.resolve().then(flush)`).
3. When you call `nextTick(callback)` or `await nextTick()`, Vue registers your callback or resolves the Promise immediately behind the DOM flush task in the microtask queue.

Because microtasks run sequentially in the browser's event loop, your code is guaranteed to execute exactly after the browser DOM has been patched with the new virtual tree.

### (3) Code Examples

#### Short Snippet
```vue
<script setup>
import { ref, nextTick } from 'vue'

const text = ref('Initial Text')
const paragraphRef = ref(null)

async function changeText() {
  text.value = 'New Text'
  
  // 1. Read DOM immediately - fails!
  console.log(paragraphRef.value.innerText) // 'Initial Text'
  
  // 2. Await the DOM update
  await nextTick()
  
  // 3. Read DOM after flush - success!
  console.log(paragraphRef.value.innerText) // 'New Text'
}
</script>

<template>
  <p ref="paragraphRef">{{ text }}</p>
  <button @click="changeText">Update</button>
</template>
```

#### Fuller Example
In this chat interface, every time a new message is pushed to the list, the browser must scroll to the bottom. We must use `nextTick` because the height of the list container does not expand until Vue renders the new list items in the DOM.

```vue
<script setup>
import { ref, nextTick } from 'vue'

const messages = ref(['Hello!', 'How are you?'])
const newMessage = ref('')
const chatContainer = ref(null)

async function sendMessage() {
  if (!newMessage.value.trim()) return
  
  messages.value.push(newMessage.value)
  newMessage.value = ''
  
  // Await the DOM flush so the new <li> element is physically rendered
  await nextTick()
  
  // Now we can accurately calculate the container's scroll height!
  const container = chatContainer.value
  container.scrollTop = container.scrollHeight
}
</script>

<template>
  <div class="chat-app">
    <!-- Scrollable container -->
    <ul ref="chatContainer" class="message-list">
      <li v-for="(msg, index) in messages" :key="index">
        {{ msg }}
      </li>
    </ul>
    
    <input v-model="newMessage" @keyup.enter="sendMessage" />
    <button @click="sendMessage">Send</button>
  </div>
</template>

<style scoped>
.message-list {
  height: 200px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}
</style>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `nextTick` when computed properties or watchers are sufficient

**The mistake:** Using `nextTick` to chain state updates. E.g., changing variable A, calling `nextTick`, then updating variable B.

**Why it's wrong:** State-to-state logic should be handled reactively using computed properties or watchers. Using `nextTick` forces unnecessary component re-renders and breaks the clean reactive flow of data.

*Incorrect:*
```javascript
const width = ref(10)
const area = ref(100)

async function updateWidth(newVal) {
  width.value = newVal
  await nextTick() // WRONG: Don't use nextTick to sync state!
  area.value = width.value * width.value
}
```

*Fix:* Declare a read-only computed property.
```javascript
const width = ref(10)
const area = computed(() => width.value * width.value) // Clean and reactive!
```

**Golden Rule:** Only use `nextTick` when you need to read or write directly to physical DOM attributes (positions, focus, client dimensions). Never use it to coordinate simple reactive state changes.

---

### Mistake 2: Querying Updated DOM Nodes Immediately After Modifying Reactive State Without `nextTick()`

**The mistake:** Changing `count.value++` and immediately querying `element.textContent` on the next line.

**Why it's wrong:** Vue updates the DOM asynchronously on the next tick. Inspecting DOM elements synchronously right after state mutation retrieves OLD stale DOM values. Await `nextTick()` first.

*Incorrect:*
```javascript
count.value = 10;
console.log(elRef.value.textContent); // ❌ Logs old DOM text content!
```

*Fix:*
```javascript
count.value = 10;
await nextTick();
console.log(elRef.value.textContent); // Logs updated DOM text content (10)
```

---

### Mistake 3: Using `setTimeout(fn, 0)` Instead of `nextTick()` for DOM Syncing

**The mistake:** Wrapping DOM queries in `setTimeout(() => ..., 0)`.

**Why it's wrong:** `nextTick()` hooks directly into Vue's microtask queue, executing immediately after DOM updates complete. `setTimeout` delays execution to a macrotask, causing potential visual layout flickering.

*Incorrect:*
```javascript
count.value = 5;
setTimeout(() => { focusInput(); }, 0); // ❌ Macrotask delay anti-pattern!
```

*Fix:*
```javascript
count.value = 5;
await nextTick();
focusInput(); // Microtask DOM sync
```


---

## 6. Practice Exercises

### Exercise 1: Show and Focus Input

**Problem:** You are building an inline-edit component. When the user clicks "Edit", the text is replaced by an input element (`v-if="isEditing"`). However, the focus logic below fails. Modify the script block so that the input is focused correctly.

```vue
<script setup>
import { ref, nextTick } from 'vue'

const isEditing = ref(false)
const inputRef = ref(null)

function startEdit() {
  isEditing.value = true
  // Fix this focus call
  inputRef.value.focus() 
}
</script>

<template>
  <div>
    <div v-if="!isEditing">
      <span>My profile item</span>
      <button @click="startEdit">Edit</button>
    </div>
    <input v-else ref="inputRef" type="text" />
  </div>
</template>
```

**Expected output:**
```text
Clicking "Edit" updates the state to show the input element and immediately places the cursor focus inside it.
```

> [!check]- Answer
> - The component fails because when `inputRef.value.focus()` is called, the input has not been rendered into the DOM yet (`inputRef.value` is still null).
> - Make `startEdit` an `async` function and call `await nextTick()` between changing `isEditing.value` and calling `.focus()`.

---

### Exercise 2: Focus Newly Created Input with nextTick

**Problem:** Write `async` function `showAndFocusInput()` setting `showInput.value = true`, awaiting `nextTick()`, and focusing `inputRef.value`.

**Expected output:**
```javascript
async function showAndFocusInput() { showInput.value = true; await nextTick(); inputRef.value.focus(); }
```

> [!check]- Answer
> - `await nextTick()` resolves after Vue flushes DOM updates.
> 
> ```javascript
> async function showAndFocusInput() {
>   showInput.value = true;
>   await nextTick();
>   inputRef.value.focus();
> }
> ```

---

### Exercise 3: nextTick Promise vs Callback Syntax

**Problem:** Compare `await nextTick()` promise syntax vs `nextTick(() => {})` callback syntax.

**Expected output:**
```text
Both are equivalent; await nextTick() offers cleaner async/await code flow.
```

> [!check]- Answer
> - Both forms wait for DOM update flush.
> 
> ```javascript
> // Promise syntax:
> await nextTick();
> 
> // Callback syntax:
> nextTick(() => { /* DOM updated */ });
> ```


---

## 7. Related Terms
- [Watchers](../level_02/watchers.md) — Listening for state changes to perform async tasks.
- [Virtual DOM](../level_08/virtual_dom.md) — The lightweight in-memory tree that Vue updates before flushing changes to the screen.
- [Component Lifecycle](../level_04/component_lifecycle.md) — The sequence of hooks coordinating component rendering.

---

## 8. Key Takeaways
- Vue updates the DOM asynchronously. Multiple state changes are batched to prevent layout calculations on every change.
- **`nextTick()`** returns a Promise that resolves after Vue has finished flushing all pending DOM changes.
- Use `nextTick` when you need to read DOM measurements, adjust scroll levels, or focus conditionally rendered elements.
- Under the hood, `nextTick` queues its callback as a microtask directly after the component update task.
- Do not use `nextTick` for state-to-state data calculations; use `computed` instead.
