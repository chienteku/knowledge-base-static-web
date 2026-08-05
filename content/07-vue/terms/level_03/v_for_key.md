# `v-for` (List Rendering) & `:key`

> **Level 3 — Directives**
> The directive used to render a list of items by looping over an array or object, combined with the `:key` attribute to give each item a stable identity for virtual DOM reconciliation.

---

## 1. Prerequisites
- [Directives](directives.md) — The foundation of Vue's template attributes.
- [Template Syntax](../level_01/template_syntax.md) — The rules for writing Vue templates.
---

## 2. Term Category
- **Directive**

---

## 3. Environment Context
- **Client-Side (Browser)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In modern applications, web pages are rarely static. We work with collections of data—messages, cart items, search results—and we need to render them dynamically. 

Vue provides **`v-for`** to handle this list generation declaratively in HTML:
```html
<li v-for="item in items">{{ item.text }}</li>
```
However, arrays change. We add items, delete them, or sort them. When this happens, Vue needs to update the browser's DOM. 

If Vue simply redrew the entire list from scratch every time one item changed, the app would be slow, and users would lose focus on input elements or scroll positions inside list items. To optimize this, Vue's Virtual DOM matches the new list against the old list. To do this matching accurately and fast, Vue needs each item in the loop to have a unique identifier. This is the purpose of the **`:key`** attribute.

### (2) How it works under the hood
When you loop over a list, Vue compiles the template into a virtual render function.
- **Without `:key`:** Vue uses an "in-place patch" strategy. If a list changes (e.g., a row is deleted), Vue does not move the DOM elements. Instead, it stays in place and updates the text/props of each row to match the new data array. While fast, this breaks any DOM nodes that have local temporary state (like an un-saved input field or CSS animations). The input field remains in place, so the user suddenly sees their typed text mapped to the wrong database row!
- **With `:key`:** Vue tracks the identity of each virtual node. If the order changes, Vue physically re-orders the existing DOM nodes instead of patching their contents in place. The state, cursor focus, and animations are preserved correctly.

### (3) Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'
const books = ref([
  { id: 'b1', title: 'Vue 3 Cookbook' },
  { id: 'b2', title: 'Clean Architecture' }
])
</script>

<template>
  <ul>
    <!-- Loop through books, using book.id as a stable key -->
    <li v-for="book in books" :key="book.id">
      {{ book.title }}
    </li>
  </ul>
</template>
```

#### Fuller Example
Below is a task manager where users can delete items. Notice how using a stable ID as `:key` keeps the checkbox state matched to the correct item.

```vue
<script setup>
import { ref } from 'vue'

const tasks = ref([
  { id: 1, text: 'Design database schema' },
  { id: 2, text: 'Write integration tests' },
  { id: 3, text: 'Review pull request' }
])

function removeTask(id) {
  tasks.value = tasks.value.filter(task => task.id !== id)
}
</script>

<template>
  <div class="task-list">
    <h3>Active Tasks</h3>
    <ul>
      <li v-for="task in tasks" :key="task.id" class="task-item">
        <!-- Local checkbox state is preserved inside this DOM node -->
        <input type="checkbox" />
        <span>{{ task.text }}</span>
        <button @click="removeTask(task.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.task-item {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
}
</style>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using the array index as a `:key`

**The mistake:** Binding the index of the loop as the key: `<li v-for="(item, index) in items" :key="index">`.

**Why it's wrong:** The array index is *not* a stable identifier. If you sort the list or delete an item from the middle, the item at index `2` becomes index `1`. Its key changes! Vue thinks the old item was modified instead of moved. This results in visual glitches where checkboxes, input values, or transitions stay on the wrong lines.

*Incorrect:*
```html
<!-- If we delete item index 0, index 1 becomes index 0, losing its focus/state -->
<div v-for="(user, index) in users" :key="index">
  <input v-model="user.name" />
</div>
```

*Fix:*
```html
<!-- The id is unique and permanently bound to the user record -->
<div v-for="user in users" :key="user.id">
  <input v-model="user.name" />
</div>
```

**Golden Rule:** Always use a unique, stable, and persistent property (like a database ID) as the `:key` for any mutable list. Never use the array index unless the list is strictly read-only and static.

---

### Mistake 2: Using Array Index (`:key="index"`) for Dynamic Lists That Can Be Sorted or Filtered

**The mistake:** Writing `<li v-for="(item, index) in items" :key="index">` on a re-orderable list.

**Why it's wrong:** Using array index as `:key` causes Virtual DOM DOM-reuse bugs when items are inserted, deleted, or sorted. Temporary form input states stay bound to old index positions. Use unique IDs (`:key="item.id"`).

*Incorrect:*
```vue
<li v-for="(item, index) in items" :key="index">
  <input v-model="item.name" /> <!-- ❌ Input state corrupts on list deletion/sort! -->
</li>
```

*Fix:*
```vue
<li v-for="item in items" :key="item.id">
  <input v-model="item.name" /> <!-- Unique persistent ID key -->
</li>
```

---

### Mistake 3: Omitting `:key` on `v-for` Loops

**The mistake:** Writing `<div v-for="item in items">` without a `:key` attribute.

**Why it's wrong:** Omitting `:key` disables Vue's optimized Virtual DOM element reordering algorithm, falling back to an in-place patch strategy that breaks component state stability.

*Incorrect:*
```vue
<div v-for="item in items">{{ item.name }}</div> <!-- ❌ Missing mandatory :key attribute! -->
```

*Fix:*
```vue
<div v-for="item in items" :key="item.id">{{ item.name }}</div>
```


---

## 6. Practice Exercises

### Exercise 1: Sorting a List Safely

**Problem:** You are building a leaderboard component. Players can be sorted by score. If you use the index as a key, any local styling (like a highlight class applied to the first element) stays stuck to the rank rather than moving with the player. Correct the template to use the player's unique identifier instead of the rank index.

```vue
<script setup>
import { ref } from 'vue'

const players = ref([
  { username: 'vue_ninja', score: 980 },
  { username: 'vite_runner', score: 850 },
  { username: 'pinia_pro', score: 1020 }
])
</script>

<template>
  <div>
    <!-- Fix this loop to use a safe key -->
    <div v-for="(player, index) in players" :key="index" class="player-card">
      <span>{{ player.username }}</span>
      <strong>Score: {{ player.score }}</strong>
    </div>
  </div>
</template>
```

**Expected output:**
> [!check]- Answer
> ```text
> The loop is modified to use a stable property. Since there is no numeric ID, player.username is the next best choice because it is unique and stable.
> ```
> - The current key is `:key="index"`.
> - Replace it with a stable unique key using the player's properties.
> - Since usernames are unique here, `player.username` is the ideal key.

---

### Exercise 2: v-for Iteration Variants

**Problem:** Write `v-for` loop syntax for:
1. Array iteration (`(item, index) in items`)
2. Object property iteration (`(value, key) in userObject`)
3. Range integer iteration (`n in 5`)

**Expected output:**
> [!check]- Answer
> ```html
> 1. <li v-for="(item, index) in items" :key="item.id">{{ item }}</li>
> 2. <div v-for="(val, key) in user" :key="key">{{ key }}: {{ val }}</div>
> 3. <span v-for="n in 5" :key="n">{{ n }}</span>
> ```
> - Array: `(item, index) in array`
> - Object: `(val, key, index) in object`
> - Range: `n in 10` (1-indexed)
> 
> ```html
> <li v-for="(item, index) in items" :key="item.id">{{ item.name }}</li>
> <div v-for="(val, key) in user" :key="key">{{ key }}: {{ val }}</div>
> <span v-for="n in 5" :key="n">{{ n }}</span>
> ```

---

### Exercise 3: v-for and v-if Precedence Warning

**Problem:** Why is placing `v-if` and `v-for` on the exact same HTML element considered an anti-pattern in Vue 3?

**Expected output:**
> [!check]- Answer
> ```text
> In Vue 3, v-if has higher precedence than v-for, so v-if cannot access variables declared inside v-for. Use computed properties to filter lists instead.
> ```
> - Vue 3: `v-if` has HIGHER priority than `v-for`.
> - `v-if` executes first and cannot read loop variables.
> 
> ```html
> <!-- Anti-pattern -->
> <li v-for="user in users" v-if="user.isActive" :key="user.id">...</li> <!-- ❌ Error! -->
> 
> <!-- Recommended -->
> <li v-for="user in activeUsers" :key="user.id">...</li>
> ```


---

## 7. Related Terms
- [Directives](directives.md) — The core attribute system in Vue.
- [`v-if` / `v-show`](v_if_show.md) — Conditional rendering directives.
- [`v-once` & `v-memo`](../level_08/v_once_memo.md) — Performance directives for static and memoized list sections.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — The engine that diffs keys to perform updates.
---

## 8. Key Takeaways
- **`v-for`** loops over arrays or objects to render dynamic DOM lists.
- The **`:key`** attribute is vital; it guides Vue's virtual DOM patching algorithm.
- Without a stable key, Vue uses an in-place patch strategy that destroys local DOM states (inputs, selections, focus).
- Never use array indices as keys for lists that can be modified, reordered, or filtered.
- Always use unique, database-level IDs or unique string keys (like usernames or emails).
