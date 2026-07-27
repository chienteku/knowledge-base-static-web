# Event, Key & Form Modifiers

> **Level 3 — Directives**
> Suffixes appended to Vue directives (like `@click.stop` or `v-model.trim`) that declaratively modify event behavior, key interactions, or input parsing directly in the template.

---

## 1. Prerequisites
- [`v-on`](../level_03/v_on.md) — Listening to DOM events.
- [`v-model`](../level_03/v_model.md) — Two-way data binding.

---

## 2. Term Category
- **Directive**

---

## 3. Environment Context
- **Client-Side (Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional vanilla JavaScript development, event handling is plagued by DOM boilerplate. If you handle a form submission, you must write `event.preventDefault()` to stop the browser from reloading the page. If you build a dropdown menu, you need `event.stopPropagation()` to prevent clicks from bubbling up and closing the menu instantly. If you listen to a text box, you end up checking `if (event.key === 'Enter')` manually.

Similarly, HTML form inputs always return strings. Developers are forced to write `parseFloat(event.target.value)` or `.trim()` on every field change.

Vue designed **modifiers** to extract this repetitive DOM and parsing boilerplate out of your JavaScript files and place it where it belongs: in the view template. This keeps your Composition API functions pure and focused on business logic.

### (2) How it works under the hood
When the Vue template compiler processes suffixes like `.prevent` or `.number`, it modifies the generated render functions.

- **Event Modifiers** (`.stop`, `.prevent`, `.capture`, `.self`, `.once`, `.passive`):
  `@submit.prevent="save"` compiles directly to:
  ```javascript
  const handleEvent = (event) => {
    event.preventDefault()
    save(event)
  }
  ```
- **Key Modifiers** (`.enter`, `.tab`, `.delete`, `.esc`, `.space`, `.up`, `.down`, etc.):
  `@keyup.enter="submit"` compiles to check the key code before execution:
  ```javascript
  const handleKeyup = (event) => {
    if (event.key === 'Enter') {
      submit(event)
    }
  }
  ```
- **Form Modifiers** (`.lazy`, `.number`, `.trim`):
  - `.lazy`: syncs data on change events (blur) rather than input events.
  - `.number`: attempts to cast input string using `parseFloat()`. If parsing fails, it yields the raw string.
  - `.trim`: strips leading/trailing whitespace automatically.

### (3) Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'
const username = ref('')
const age = ref(0)

function handleSubmit() {
  console.log(`Saved: ${username.value} (${typeof age.value})`)
}
</script>

<template>
  <!-- Form submit is intercepted and prevented -->
  <form @submit.prevent="handleSubmit">
    <!-- Input is trimmed, age cast to a number, and synced only when focus leaves -->
    <input v-model.trim="username" placeholder="Username" />
    <input v-model.number="age" type="number" placeholder="Age" />
    <button type="submit">Submit</button>
  </form>
</template>
```

#### Fuller Example
In this modal drawer, we prevent clicks inside the drawer from bubbling up and triggering the parent element's close event. We also allow closing the modal via the Escape key.

```vue
<script setup>
import { ref } from 'vue'

const isOpen = ref(false)

function closeModal() {
  isOpen.value = false
  console.log('Modal closed via background or Escape key')
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <!-- .stop modifier prevents clicks inside the modal from bubbling to the overlay -->
    <div class="modal-content" @click.stop>
      <h3>Settings</h3>
      <!-- .enter modifier triggers save on keyup -->
      <input 
        type="text" 
        placeholder="Type here..." 
        @keyup.esc="closeModal" 
        @keyup.enter="console.log('Enter pressed!')" 
      />
      <button @click="closeModal">Close</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: grid;
  place-items: center;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
</style>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing `.number` with input restriction

**The mistake:** Expecting `v-model.number` to prevent the user from typing non-numeric characters.

**Why it's wrong:** The `.number` modifier does not filter user input. It only attempts to parse the value *after* the user types. If the user types "abc", `parseFloat("abc")` returns `NaN`. Because Vue cannot convert this to a valid number, it falls back to the original string value ("abc"). The reactive variable is updated with a string.

*Incorrect:*
```html
<!-- User can still type "abc" and state will become a string "abc" -->
<input v-model.number="age" />
```

*Fix:* Combine `.number` with the native HTML5 `type="number"` validation.
```html
<input v-model.number="age" type="number" />
```

**Golden Rule:** Modifiers transform output data; they do not perform input validation.

---

### Mistake 2: Using `event.preventDefault()` Manually Instead of Directive Event Modifiers (`@submit.prevent`)

**The mistake:** Writing `function handleSubmit(e) { e.preventDefault(); ... }` in form submission handlers.

**Why it's wrong:** Directives support event modifiers (`.prevent`, `.stop`, `.passive`). Modifiers keep method logic pure and declarative by offloading DOM event handling to template syntax.

*Incorrect:*
```vue
<form @submit="handleSubmit"></form>

<script setup>
function handleSubmit(e) {
  e.preventDefault(); // Manual DOM event handling
}
</script>
```

*Fix:*
```vue
<form @submit.prevent="handleSubmit"></form>

<script setup>
function handleSubmit() {
  // Clean method logic without DOM event boilerplate
}
</script>
```

---

### Mistake 3: Chaining Event Modifiers in Incorrect Order (`@click.prevent.self` vs `@click.self.prevent`)

**The mistake:** Assuming `@click.prevent.self` produces identical behavior to `@click.self.prevent`.

**Why it's wrong:** Modifier order MATTERS! `@click.prevent.self` prevents default action on ALL clicks first. `@click.self.prevent` prevents default action ONLY on clicks directly on the element itself.

*Incorrect:*
```vue
<!-- Modifiers evaluate left-to-right -->
<a href="/link" @click.prevent.self="doSomething">Link</a>
```

*Fix:*
```vue
<!-- Pay careful attention to modifier order intent -->
<a href="/link" @click.self.prevent="doSomething">Link</a>
```


---

## 6. Practice Exercises

### Exercise 1: Declaring Multi-Modifier Chains

**Problem:** Create an input element where:
1. Event propagation is stopped.
2. The browser's default behavior is prevented.
3. The function `handleAction` is called ONLY when the user clicks the left mouse button while holding the Shift key.

**Expected output:**
```text
An tag styled like:
<button @click.shift.left.stop.prevent="handleAction">Click Me</button>
```

> [!check]- Answer
> - Vue allows modifiers to be chained. E.g., `@click.stop.prevent`.
> - Check system modifier keys (`.shift`, `.alt`, etc.) and mouse button modifiers (`.left`, `.right`).

---

### Exercise 2: Common Event Modifiers Matrix

**Problem:** Identify the event modifier matching each requirement:
1. Stop event propagation (`event.stopPropagation()`)
2. Prevent default browser action (`event.preventDefault()`)
3. Trigger handler only once
4. Trigger handler only if event originated from target element itself

**Expected output:**
```text
1. .stop
2. .prevent
3. .once
4. .self
```

> [!check]- Answer
> - `.stop` -> stopPropagation()
> - `.prevent` -> preventDefault()
> - `.once` -> execute once
> - `.self` -> event.target === event.currentTarget
> 
> ```html
> <button @click.stop.prevent="clickHander">Click</button>
> ```

---

### Exercise 3: Key Modifiers and Mouse Modifiers

**Problem:** Write click event binding triggering `submit()` ONLY when Enter key is pressed on input (`@keyup.enter`) or when Right mouse button is clicked (`@click.right`).

**Expected output:**
```html
<input @keyup.enter="submit" />
<button @click.right.prevent="openMenu">Context Menu</button>
```

> [!check]- Answer
> - `.enter`, `.tab`, `.delete`, `.esc` key modifiers.
> - `.left`, `.right`, `.middle` mouse modifiers.
> 
> ```html
> <input @keyup.enter="submit" />
> <button @click.right.prevent="openMenu">Menu</button>
> ```


---

## 7. Related Terms
- [Directives](../level_03/directives.md) — The directive system.
- [`v-on`](../level_03/v_on.md) — Event listeners.
- [`v-model`](../level_03/v_model.md) — Input binding.

---

## 8. Key Takeaways
- **Modifiers** are directive suffixes prefixed with a dot that apply common behaviors without writing boilerplate code.
- **Event Modifiers** (like `.stop`, `.prevent`) manage event propagation and default actions directly in the template.
- **Key Modifiers** (like `.enter`, `.esc`) restrict keyboard listeners to target specific keys.
- **Form Modifiers** (`.lazy`, `.number`, `.trim`) automate casting, parsing, and sync-timing on `v-model`.
- Using modifiers keeps script blocks clean and focused solely on business logic, decoupled from DOM utilities.
