# Slots

> **Level 5 — Advanced Component Architecture**
> A mechanism for content distribution that allows a Parent component to pass raw HTML or other components into a specific placeholder inside a Child component's template.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — The building blocks involved.
- [Props](../level_04/props.md) — The standard way to pass simple data. Slots are for passing HTML structure.

---

## 2. Term Category
- **Vue Core Concept / Component Architecture**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building a reusable `<Modal>` component. The Modal needs a background overlay, a white box, a close button, and some content in the middle.
You *could* try to pass the content as a string Prop: `<Modal content="Are you sure you want to delete?" />`. 
But what if the content needs to be complex HTML, like an image, a form with inputs, and three buttons? Passing a massive block of HTML as a string Prop is an absolute nightmare.
**Slots** solve this. They act as "holes" in your child component where the parent can inject arbitrary HTML. (This is exactly the same concept as React's `children` prop).

### (2) The Default Slot
In the Child component, you define the hole using the `<slot>` tag.
```vue
<!-- Child.vue (Modal) -->
<template>
  <div class="modal-wrapper">
    <button>Close</button>
    <div class="modal-content">
      <!-- The Parent's HTML will be magically injected right here! -->
      <slot></slot> 
    </div>
  </div>
</template>
```

When the Parent uses the component, anything put *between* the opening and closing tags gets injected into the slot.
```vue
<!-- Parent.vue -->
<template>
  <Modal>
    <!-- All of this goes into the slot! -->
    <h2>Warning!</h2>
    <img src="warning.png" />
    <p>Are you really sure?</p>
  </Modal>
</template>
```

### (3) Named Slots
What if your Modal needs *two* holes? One for the `header` and one for the `footer`?
You give the slots names! `<slot name="header">`. 
The parent targets them using the `<template v-slot:header>` syntax (or the shorthand `#header`).

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Not providing Fallback Content

**The mistake:** A developer creates a `<SubmitButton>` component with a `<slot></slot>`. If a teammate uses the component as a self-closing tag `<SubmitButton />`, the button renders completely empty with no text.

**Why it's wrong:** You should anticipate that a parent might not provide content. 
**Golden Rule:** Always provide "Fallback Content" (Default content) *inside* the slot tags in the child component. `<slot>Submit</slot>`. If the parent provides content, it overrides "Submit". If the parent provides nothing, "Submit" is rendered.

---

### Mistake 2: Mixing Default Slot Content with Named Slot Templates Directly on Component Tags

**The mistake:** Placing default slot content outside `<template>` when using named slots.

**Why it's wrong:** Mixing un-named content directly on component tags alongside `<template #header>` creates ambiguity regarding slot scope assignment. Wrap all slot content in explicit `<template>` tags.

*Incorrect:*
```vue
<MyCard>
  <h1>Main Content</h1> <!-- ❌ Mixed default slot content -->
  <template #header>Header</template>
</MyCard>
```

*Fix:*
```vue
<MyCard>
  <template #header>Header</template>
  <template #default><h1>Main Content</h1></template>
</MyCard>
```

---

### Mistake 3: Forgetting Fallback Default Content for Optional Slots

**The mistake:** Rendering `<slot name="header"></slot>` without providing fallback content when parent omits the slot.

**Why it's wrong:** If a parent component omits a slot, nothing renders. Providing fallback content inside `<slot>Fallback</slot>` guarantees sensible default rendering.

*Incorrect:*
```vue
<header><slot name="header"></slot></header> <!-- Empty if parent omits header slot -->
```

*Fix:*
```vue
<header><slot name="header">Default Header Title</slot></header>
```


---

## 6. Practice Exercises

### Exercise 1: Targeting Named Slots

**Problem:** You have a `Card.vue` component with `<slot name="title">` and `<slot name="body">`. How do you pass an `<h1>` to the title and a `<p>` to the body from the parent?

**Expected output:**
> [!check]- Answer
> ```html
> <Card>
>   <template #title>
>     <h1>My Title</h1>
>   </template>
>   
>   <template #body>
>     <p>My body content goes here.</p>
>   </template>
> </Card>
> 
> // Notice the `#` shorthand for `v-slot:`
> ```
> - Wrap the content in a `<template>` tag and use the `#` shorthand!
> 
---

### Exercise 2: Checking Slot Presence with useSlots()

**Problem:** Write JavaScript code inside `<script setup>` checking if a named slot `'header'` was provided by the parent component using `useSlots()`.

**Expected output:**
> [!check]- Answer
> ```javascript
> import { useSlots } from 'vue'; const slots = useSlots(); const hasHeader = !!slots.header;
> ```
> - `useSlots()` exposes slot functions passed by parent components.
> 
> ```javascript
> import { useSlots } from 'vue';
> const slots = useSlots();
> const hasHeader = !!slots.header;
> ```
> 
---

### Exercise 3: Dynamic Slot Names

**Problem:** Write template syntax rendering a dynamic slot name defined by string variable `dynamicSlotName`.

**Expected output:**
> [!check]- Answer
> ```html
> <template #[dynamicSlotName]>Dynamic Content</template>
> ```
> - Square brackets `#[dynamicName]` define dynamic slot names.
> 
> ```html
> <template #[dynamicSlotName]>
>   Dynamic Content
> </template>
> ```
> 
> 
---

## 7. Related Terms
- [Scoped Slots](scoped_slots.md) — Advanced slots that send data *back up* to the parent.
- [Props](../level_04/props.md) — For passing JavaScript data instead of HTML structure.
- [Components](../level_04/components.md) — Component template insertion.

---

## 8. Key Takeaways
- **Slots** allow a parent component to inject arbitrary HTML or components into designated areas of a child component.
- The child defines the placeholder using the `<slot>` tag.
- **Named Slots** (`<slot name="header">`) allow a component to have multiple injection points.
- The parent targets named slots using `<template #header>`.
- Any content placed between the `<slot></slot>` tags in the child acts as fallback/default content.
