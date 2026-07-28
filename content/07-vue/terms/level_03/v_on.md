# `v-on`

> **Level 3 — Directives**
> A Vue directive used to listen to DOM events (like clicks, keypresses, or form submissions) and trigger JavaScript methods in response.

---

## 1. Prerequisites
- [Directives](../level_03/directives.md) — The category `v-on` belongs to.
- [Reactive State](../level_02/reactive_state.md) — What events typically mutate.

---

## 2. Term Category
- **Vue Directive**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In Vanilla JavaScript, listening to user interaction requires imperative code: `document.getElementById('btn').addEventListener('click', doSomething)`. You have to manually manage these listeners and remember to remove them when the element is destroyed to prevent memory leaks.
Vue solves this declaratively with **`v-on`**. You attach the listener directly in the HTML template. Vue automatically handles adding the `addEventListener` under the hood, and automatically cleans it up when the component is unmounted!

### (2) The Shorthand Syntax (`@`)
Just like `v-bind` has the `:` shorthand, `v-on` is so common that it has its own shorthand: the **`@`** symbol.

```html
<script setup>
import { ref } from 'vue'
const count = ref(0)
function submitForm() { /* ... */ }
</script>

<template>
  <!-- Long way -->
  <button v-on:click="count++">Increment</button>

  <!-- Modern shorthand (Use this!) -->
  <button @click="count++">Increment</button>

  <!-- Listening to form submissions -->
  <form @submit="submitForm"></form>
</template>
```

### (3) Event Modifiers
Normally, if you want to stop a form from refreshing the page, you have to write `event.preventDefault()` inside your JavaScript function. 
Vue provides **Modifiers** to handle this in the template, keeping your JavaScript functions clean and purely focused on data.
- `@submit.prevent="submitForm"` (Calls `event.preventDefault()`)
- `@click.stop="doSomething"` (Calls `event.stopPropagation()`)
- `@keyup.enter="login"` (Only triggers when the 'Enter' key is released!)

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Calling the function instead of passing it

**The mistake:** A developer writes `<button @click="submitData()">Submit</button>` instead of `<button @click="submitData">Submit</button>`.

**Why it's wrong (sometimes):** If you include the parentheses `()`, you are explicitly evaluating that function immediately in the template. If `submitData` doesn't take arguments, it's safer and cleaner to just pass the *reference* to the function without parentheses.
**Golden Rule:** If you need to pass a custom argument (e.g., `@click="deleteUser(user.id)"`), use parentheses. If you don't need custom arguments, just pass the function name (`@click="submitData"`), and Vue will automatically pass the native DOM event object to it.

---

### Mistake 2: Invoking Functions Instantly in Template Event Bindings (`@click="handleClick()"` vs `@click="handleClick"`)

**The mistake:** Writing `@click="deleteUser(id)"` when `deleteUser` expects an event object parameter without arguments.

**Why it's wrong:** Writing `@click="handler()"` executes inline function calls. If you pass arguments, pass explicit parameters or use parameterless method reference `@click="handler"` to automatically receive the DOM event.

*Incorrect:*
```vue
<button @click="submitForm()">Submit</button> <!-- Ignores native $event parameter -->
```

*Fix:*
```vue
<button @click="submitForm">Submit</button> <!-- Passes native event automatically -->
<!-- Or inline event passing: -->
<button @click="submitForm($event, id)">Submit</button>
```

---

### Mistake 3: Forgetting `.prevent` Modifier on Form Submissions

**The mistake:** Binding `@click="saveData"` to a `<button type="submit">` inside a `<form>`.

**Why it's wrong:** Clicking a submit button inside a form triggers browser default form page reloads. Use `<form @submit.prevent="saveData">` to intercept submission cleanly.

*Incorrect:*
```vue
<form>
  <button type="submit" @click="saveData">Save</button> <!-- ❌ Triggers browser page reload! -->
</form>
```

*Fix:*
```vue
<form @submit.prevent="saveData">
  <button type="submit">Save</button> <!-- Intercepts submit cleanly -->
</form>
```


---

## 6. Practice Exercises

### Exercise 1: The Magic Key

**Problem:** You have an input field for a search bar. You want to trigger the `search()` function *only* when the user presses the 'Escape' key. How do you write this in Vue?

**Expected output:**
> [!check]- Answer
> ```html
> <input @keyup.escape="search" />
> ```
> - Use `v-on` (the `@` shorthand), listen to `keyup`, and apply a modifier for the specific key!

---

### Exercise 2: Inline Parameter and Event Passing

**Problem:** Write `@click` template binding passing user ID `42` AND the native DOM event `$event` to method `removeUser(id, event)`.

**Expected output:**
> [!check]- Answer
> ```html
> <button @click="removeUser(42, $event)">Delete</button>
> ```
> - Use `$event` special keyword to pass native DOM event in inline handlers.
> 
> ```html
> <button @click="removeUser(42, $event)">Delete User</button>
> ```

---

### Exercise 3: Keyboard Event Modifier Chaining

**Problem:** Write template binding triggering `saveDoc()` ONLY when user presses `Ctrl + S` (`@keydown.ctrl.s.prevent`).

**Expected output:**
> [!check]- Answer
> ```html
> <input @keydown.ctrl.s.prevent="saveDoc" />
> ```
> - System modifier keys: `.ctrl`, `.alt`, `.shift`, `.meta`.
> 
> ```html
> <div @keydown.ctrl.s.prevent="saveDoc">Save Document</div>
> ```


---

## 7. Related Terms
- [`v-bind`](../level_03/v_bind.md) — The other half of the coin (Binding attributes vs listening to events).
- [Emitting Events](../level_04/emit.md) — How you use `@` to listen to custom events emitted by child components.
- [Event, Key & Form Modifiers](../level_03/modifiers.md) — The full modifier system for events.

---

## 8. Key Takeaways
- **`v-on`** is used to listen to DOM events (clicks, inputs, form submissions).
- You should always use the shorthand syntax: the **`@`** symbol.
- Vue automatically manages adding and removing the underlying `addEventListener` logic to prevent memory leaks.
- Use **Event Modifiers** (like `.prevent`, `.stop`, or `.enter`) to handle standard DOM event logic in the template, keeping your JavaScript functions pure.
