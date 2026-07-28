# Teleport

> **Level 5 — Advanced Component Architecture**
> A built-in Vue component that allows you to render a piece of your component's HTML in a completely different location in the browser's DOM tree, breaking out of the component hierarchy.

---

## 1. Prerequisites
- [Components](../level_04/components.md) — Understanding the strict hierarchy of the Component Tree.
- [DOM Manipulation](../../../01-html/terms/level_09/dom.md) — The physical HTML structure we are breaking out of.

---

## 2. Term Category
- **Vue Built-in Component**

---

## 3. Environment Context
- **Client-Side (Browser DOM)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, Vue components output their HTML exactly where they are placed in the Component Tree.
If you have a deeply nested `<UserProfile>` component, and it triggers a Full-Screen `<Modal>` to confirm deletion, that `<Modal>` HTML is rendered deep inside the layout hierarchy (perhaps inside a `<div style="overflow: hidden; position: relative;">`).
Because the Modal is physically nested inside a container with `overflow: hidden` or `z-index` contexts, the Modal might be visually clipped or trapped, completely ruining the full-screen effect.
We need the logic to stay in the component, but the HTML to render directly inside the `<body>` tag. **`<Teleport>`** does exactly this. (Identical to React Portals).

### (2) How to use it
You wrap the HTML you want to move in a `<Teleport>` tag, and provide a `to` target (a CSS selector).

```vue
<!-- DeeplyNestedComponent.vue -->
<template>
  <button @click="isOpen = true">Delete Account</button>

  <!-- This logic stays here, but the HTML is beamed to the <body> tag! -->
  <Teleport to="body">
    <div v-if="isOpen" class="fullscreen-modal">
      <p>Are you sure?</p>
      <button @click="isOpen = false">Cancel</button>
    </div>
  </Teleport>
</template>
```

### (3) The Logic Stays Put
Even though the Modal HTML is physically rendered inside the `<body>` tag, Vue still treats it logically as a child of `DeeplyNestedComponent.vue`. It still has full access to the component's state (`isOpen`), its computed properties, and its injected data.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Teleporting to an element that doesn't exist yet

**The mistake:** A developer writes `<Teleport to="#modal-container">`, but the `<div id="modal-container">` is rendered by a different Vue component that hasn't mounted yet.

**Why it's wrong:** Vue must physically move the HTML immediately. If the target CSS selector does not exist in the DOM at the exact moment the Teleport tries to render, Vue will throw a fatal error.
**Golden Rule:** The target element (like `body` or a static `<div id="modals">` in your `index.html`) must exist outside the Vue app or be guaranteed to be mounted before the Teleport fires.

---

### Mistake 2: Teleporting to a DOM Target Element That Does Not Exist in the DOM Yet

**The mistake:** Writing `<Teleport to="#non-existent-id">`.

**Why it's wrong:** The target container specified in `to="..."` MUST exist in the DOM before the `<Teleport>` component mounts. If the target element is null, Vue throws a runtime error.

*Incorrect:*
```vue
<Teleport to="#missing-modal-root"> <!-- ❌ Target element missing in DOM! -->
  <Modal />
</Teleport>
```

*Fix:*
```vue
<!-- Ensure target element exists in index.html: <div id="modal-root"></div> -->
<Teleport to="#modal-root">
  <Modal />
</Teleport>
```

---

### Mistake 3: Assuming Teleported Components Lose Parent Reactive State Context

**The mistake:** Thinking props, injects, or event bindings break when a component is teleported to `body`.

**Why it's wrong:** `<Teleport>` moves ONLY the rendered DOM nodes physically to the target container. The component remains logically a child of its parent component in Vue's Virtual DOM tree (props, injects, and events function normally).

*Incorrect:*
```vue
/* Assuming Teleport severs Vue parent/child reactive component tree links */
```

*Fix:*
```vue
/* Teleport moves DOM nodes physically while preserving logical Vue component hierarchy */
```


---

## 6. Practice Exercises

### Exercise 1: CSS Scoping

**Problem:** You use `<style scoped>` in your component to make all `<button>`s red. You Teleport a button out to the `<body>` tag. Does the Teleported button still get the scoped red styling?

**Expected output:**
> [!check]- Answer
> ```text
> Yes!
> The Vue Compiler applies the `data-v-xxxx` scoping attributes to the elements *before* they are Teleported. So even though the button is physically in the `<body>` tag, it retains its scoped component styling!
> ```
> - Does Teleport break logical Vue behavior, or just physical DOM placement?

---

### Exercise 2: Conditional Teleport Disabling Pattern

**Problem:** Write `<Teleport>` syntax disabling DOM teleportation on mobile devices using boolean prop `:disabled="isMobile"`.

**Expected output:**
> [!check]- Answer
> ```html
> <Teleport to="body" :disabled="isMobile"><Modal /></Teleport>
> ```
> - `:disabled="true"` keeps rendered DOM nodes in place without teleporting.
> 
> ```html
> <Teleport to="body" :disabled="isMobile">
>   <ModalContent />
> </Teleport>
> ```

---

### Exercise 3: Teleport Target Selectors

**Problem:** Which valid CSS query selectors can be passed to `<Teleport to="...">`?

**Expected output:**
> [!check]- Answer
> ```text
> Any valid CSS query selector string (e.g. 'body', '#modal-root', '.popup-container') or a raw HTMLElement object.
> ```
> - Accepts CSS selector string or DOM HTMLElement.
> 
> ```html
> <Teleport to="body">
> <Teleport to="#modals">
> ```


---

## 7. Related Terms
- [Component Tree](../level_04/components.md) — What Teleport allows you to escape.
- [SFCs](../level_04/sfc.md) — Scoped styling still works with Teleport!

---

## 8. Key Takeaways
- **`<Teleport>`** allows a component to physically render its HTML somewhere else in the DOM (usually `body`), while keeping its logic exactly where it is.
- It is primarily used to fix CSS trapping issues with Modals, Tooltips, Dropdowns, and Notifications.
- You target the destination using a CSS selector (`to="body"` or `to="#modal-root"`).
- The target destination must exist in the DOM *before* the Teleport attempts to render.
