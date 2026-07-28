# Scoped Slots

> **Level 5 — Advanced Component Architecture**
> An advanced pattern where a Child component passes internal data *up* to the Parent specifically so the Parent can use that data to render the UI that goes back *down* into the slot.

---

## 1. Prerequisites
- [Slots](../level_05/slots.md) — The baseline mechanism.
- [Props](../level_04/props.md) — How data usually flows (Top-Down). Scoped slots briefly invert this.

---

## 2. Term Category
- **Vue Advanced Pattern**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Imagine you are building a highly reusable `<DataList>` component. It fetches an array of users from an API and loops over them. 
But you want the *Parent* component to decide what each user looks like! One parent might want a clean list (`<li>Alice</li>`), while another parent wants complex cards (`<div class="card">Alice - Admin</div>`).
If the Parent is providing the HTML (via a Slot), but the Child owns the data (the `user` object), how can the Parent's HTML access the Child's data? 
**Scoped Slots** solve this. The Child "scopes" (exposes) its data to the slot.

### (2) The Child: Exposing the Data
In the child, you bind the data to the `<slot>` tag exactly like passing a prop.
```vue
<!-- Child.vue (DataList) -->
<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      <!-- We expose the `user` object up to the slot! -->
      <slot :item="user"></slot>
    </li>
  </ul>
</template>
```

### (3) The Parent: Consuming the Data
In the parent, you use `v-slot` (or `#`) to receive the exposed data object. You can destructure it instantly!
```vue
<!-- Parent.vue -->
<template>
  <DataList>
    <!-- We receive the 'item' that the child exposed! -->
    <template #default="{ item }">
      <div class="fancy-user-card">
        <h3>{{ item.name }}</h3>
        <p>{{ item.role }}</p>
      </div>
    </template>
  </DataList>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing Scoped Slots with Emits

**The mistake:** A developer needs to update a Parent's state variable when something happens in a Child. They try to use a Scoped Slot to push the data up.

**Why it's wrong:** Scoped slots are strictly for **Rendering**. They provide data to the Parent's *template* only so the template can render properly. They do NOT pass data to the Parent's `<script>` logic.
**Golden Rule:** If the Parent needs the data to perform business logic (like saving to a database), the child must [Emit an Event](../level_04/emit.md). If the Parent just needs the data to render HTML, use a Scoped Slot.

---

### Mistake 2: Confusing Standard Named Slots with Scoped Slots

**The mistake:** Attempting to access child slot data inside a standard `<template #header>` without declaring slot props.

**Why it's wrong:** Standard slots receive static HTML layout content. Scoped slots pass data back from child component to parent template using `v-slot:slotName="slotProps"`.

*Incorrect:*
```vue
<MyList>
  <template #item>{{ item.name }}</template> <!-- ❌ item is undefined in parent! -->
</MyList>
```

*Fix:*
```vue
<MyList>
  <template #item="slotProps">{{ slotProps.item.name }}</template> <!-- Access slot props -->
</MyList>
<!-- Or destructured: -->
<MyList>
  <template #item="{ item }">{{ item.name }}</template>
</MyList>
```

---

### Mistake 3: Using `v-slot` Shorthand `#` Without Specifying a Slot Name

**The mistake:** Writing `<template #="{ item }">`.

**Why it's wrong:** The `#` shorthand requires an explicit slot name (e.g. `#default="{ item }"` or `#item="{ item }"`). Omitting the slot name creates a template syntax error.

*Incorrect:*
```vue
<template #="{ item }"> <!-- ❌ Syntax error! -->
```

*Fix:*
```vue
<template #default="{ item }"> <!-- Explicit default slot shorthand -->
```


---

## 6. Practice Exercises

### Exercise 1: The Renderless Component

**Problem:** Have you ever seen a component that has absolutely no UI of its own? It just does logic (like fetching an API or tracking mouse coordinates) and uses a Scoped Slot for 100% of its rendering? This is called a "Renderless Component". Is this a good pattern in Vue 3?

**Expected output:**
> [!check]- Answer
> ```text
> In Vue 2, yes, this was a very popular pattern.
> In Vue 3, NO! 
> Renderless components have been entirely superseded by Composables (`useMouse()`, `useFetch()`). Composables extract logic without the heavy performance overhead of creating invisible Vue components.
> ```
> - Think about the new features introduced in Vue 3's Composition API!

---

### Exercise 2: Child Component Scoped Slot Binding

**Problem:** Write child component `<template>` exposing item data object `row` to a named scoped slot `item`.

**Expected output:**
> [!check]- Answer
> ```html
> <slot name="item" :row="row"></slot>
> ```
> - Pass props to `<slot :propName="data">` to create scoped slots.
> 
> ```html
> <div v-for="row in list">
>   <slot name="item" :row="row"></slot>
> </div>
> ```

---

### Exercise 3: Parent Scoped Slot Destructuring

**Problem:** Write parent component template consuming scoped slot `item` destructuring `row` and `index`.

**Expected output:**
> [!check]- Answer
> ```html
> <MyList #item="{ row, index }">{{ index }}: {{ row.title }}</MyList>
> ```
> - Parent template uses `#slotName="{ destructure }"`.
> 
> ```html
> <MyList #item="{ row, index }">
>   <p>{{ index }}: {{ row.title }}</p>
> </MyList>
> ```


---

## 7. Related Terms
- [Slots](../level_05/slots.md) — The fundamental mechanism.
- [Composables](../level_05/composables.md) — The modern replacement for the "Renderless Component" scoped slot pattern.

---

## 8. Key Takeaways
- **Scoped Slots** allow a Child component to pass data up to a Parent's slot template.
- This allows the Child to manage the logic/state, while the Parent completely controls the UI rendering.
- The child passes data by binding it to the slot tag: `<slot :data="myVar">`.
- The parent receives the data in the template: `<template #default="slotProps">`.
- Scoped slots are for *rendering only*, not for passing data back to the parent's JavaScript logic.
