# Emitting Events (`defineEmits`)

> **Level 4 — Components & Props**
> The mechanism a Child component uses to send messages or data *up* to its Parent component, usually to request that the Parent change some state.

---

## 1. Prerequisites
- [Props](props.md) — Why Emits are necessary (because Props are read-only).
- [`v-on`](../level_03/v_on.md) — How the Parent listens to the emitted events.

---

## 2. Term Category
- **Vue Core Concept / Data Flow**

---

## 3. Environment Context
- **Composition API (`<script setup>`)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Data in Vue strictly flows downward via [Props](../level_04/props.md). A Child component is absolutely forbidden from modifying a Prop.
So, what happens if you have a `<DeleteButton>` component, and the user clicks it? The Child component cannot delete the user data itself! 
Instead, the Child must **Emit an Event**. It essentially yells up to the Parent: *"Hey! The user clicked me! Please delete item ID 5!"* The Parent hears the yell, and the Parent deletes the data.

### (2) Emitting Data (The Child)
In the `<script setup>`, the child declares which events it is allowed to emit using `defineEmits()`. Then, it calls the `emit` function, passing the event name and any optional payload data.
```vue
<!-- Child.vue (DeleteButton) -->
<script setup>
// 1. Declare the events this component can yell
const emit = defineEmits(['requestDelete'])

function handleClick() {
  // 2. Yell to the parent, and pass data (the ID to delete)
  emit('requestDelete', 5)
}
</script>

<template>
  <button @click="handleClick">Delete User</button>
</template>
```

### (3) Listening to Data (The Parent)
The Parent component listens for this custom event using the standard [`v-on` (`@`)](../level_03/v_on.md) directive, exactly like listening to a native DOM click!
```vue
<!-- Parent.vue -->
<template>
  <!-- Listen for the custom 'requestDelete' event -->
  <DeleteButton @requestDelete="handleDelete" />
</template>

<script setup>
// The payload (5) is automatically passed to the parameter `id`
function handleDelete(id) {
  console.log("Parent is deleting user ID: ", id)
}
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using camelCase in HTML templates

**The mistake:** A child emits `emit('userUpdated')`. The parent listens using `<Child @userUpdated="refresh" />`.

**Why it's wrong (sometimes):** HTML attributes are case-insensitive. While Vue's compiler is usually smart enough to handle this in `.vue` files, if you ever write Vue directly in standard HTML, `@userUpdated` becomes `@userupdated` and breaks.
**Golden Rule:** The official Vue Style Guide recommends naming custom events using kebab-case (`user-updated`). So the child emits `emit('user-updated')` and the parent listens with `@user-updated`.

---

### Mistake 2: Forgetting to Declare Custom Emitted Events in `defineEmits()`

**The mistake:** Emitting an event `emit('delete')` inside `<script setup>` without declaring `defineEmits(['delete'])`.

**Why it's wrong:** Undeclared emitted events fall through to root element DOM attributes (fallthrough attributes), leading to duplicate event triggers or warnings.

*Incorrect:*
```vue
<script setup>
// ❌ Missing defineEmits declaration!
function remove() { emit('delete', id); }
</script>
```

*Fix:*
```vue
<script setup>
const emit = defineEmits(['delete']); // Declare custom emitted events
function remove() { emit('delete', id); }
</script>
```

---

### Mistake 3: Using camelCase for Event Names in Templates

**The mistake:** Emitting `emit('itemSelected')` and listening with `@itemSelected="handler"` in Vue 2 or HTML templates.

**Why it's wrong:** HTML attributes are case-insensitive. In HTML templates, camelCase event listeners (`@itemSelected`) are coerced to lowercase. Use kebab-case (`emit('item-selected')` / `@item-selected`).

*Incorrect:*
```javascript
// Emitting camelCase event
emit('userUpdated', user); // ❌ Listeners in inline HTML coerced to @userupdated
```

*Fix:*
```javascript
// Emit kebab-case event names for HTML template compatibility:
emit('user-updated', user);
```


---

## 6. Practice Exercises

### Exercise 1: The V-Model Connection

**Problem:** You know that `v-model` creates Two-Way Data Binding on inputs. How do you think `v-model` works on custom components?

**Expected output:**
> [!check]- Answer
> ```text
> It's just a combination of Props and Emits!
> When you write `<CustomInput v-model="text" />`, Vue automatically translates it to:
> `<CustomInput :modelValue="text" @update:modelValue="newValue => text = newValue" />`
> The child receives the `modelValue` prop, and emits `update:modelValue` when it changes!
> ```
> - Remember the deconstruction of `v-model` from Level 3?

---

### Exercise 2: defineEmits Validation Setup

**Problem:** Write `defineEmits()` setup in `<script setup>` with object validation for event `'submit'` checking that `email` payload string contains `@`.

**Expected output:**
> [!check]- Answer
> ```javascript
> const emit = defineEmits({ submit: (payload) => typeof payload.email === 'string' && payload.email.includes('@') });
> ```
> - Object syntax in `defineEmits` validates event payload arguments.
> 
> ```javascript
> const emit = defineEmits({
>   submit: (payload) => {
>     return typeof payload.email === 'string' && payload.email.includes('@');
>   }
> });
> ```

---

### Exercise 3: Parent Event Listening Syntax

**Problem:** How does a parent component listen to a custom event `submit-form` emitted by child component `<ChildForm>`?

**Expected output:**
> [!check]- Answer
> ```text
> <ChildForm @submit-form="handleParentSubmit" />
> ```
> - Parents listen to child custom events using `@eventName` directive.
> 
> ```html
> <ChildForm @submit-form="handleParentSubmit" />
> ```


---

## 7. Related Terms
- [Props](props.md) — The Top-Down data flow (Props Down, Events Up).
- [`v-on`](../level_03/v_on.md) — How the Parent listens to the emit.
- [Fallthrough Attributes (`$attrs`)](fallthrough_attributes.md) — How event listeners passed to components fall through to root elements.
- [`<script setup>` & Compiler Macros](script_setup.md) — Related concept: `<script setup>` & Compiler Macros.

---

## 8. Key Takeaways
- **Emitting Events** is how a Child component sends messages *up* to its Parent.
- The Child must declare its events using `defineEmits(['event-name'])`.
- The Child calls `emit('event-name', payloadData)` to trigger the event.
- The Parent listens to the custom event using the standard `@event-name` syntax.
- This creates the strict Vue architecture: **Props Down, Events Up**.
