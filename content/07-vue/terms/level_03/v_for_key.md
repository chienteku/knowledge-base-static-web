# `v-for` (List Rendering) & `:key`

> **Level 3 — Directives & Template Features**
> The template directive used to render lists of items by iterating over arrays or objects, paired with the mandatory `:key` attribute to give each Virtual DOM node a persistent, unique identity.

---

## 1. Prerequisites

- [Directives](directives.md) — Built-in attribute system.
- [Template Syntax](../level_01/template_syntax.md) — Vue template syntax.

---

## 2. Term Category

**Template Iteration Construct (Virtual DOM Diffing Guide)**: `v-for` is Vue's structural template directive for mapping JavaScript data collections (Arrays, Objects, Iterables, integer ranges) into dynamic lists of Virtual DOM elements. Paired with `:key`, `v-for` guides Vue's Virtual DOM reconciliation algorithm (`patchKeyedChildren`). Executed during client-side browser rendering, `v-for` enables high-performance DOM manipulation by reordering existing DOM nodes rather than destroying and rebuilding entire list elements when array state mutates.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Web applications constantly display lists of dynamic data: chat messages, shopping cart items, news feeds, search results. Managing these lists with imperative JavaScript (e.g. creating `<li>` nodes in loops and appending them to container elements) requires tedious DOM manipulation and manually tracking element position updates.

Vue introduced **`v-for`** to render lists declaratively straight inside HTML templates. 

However, arrays constantly change: users sort columns, delete rows, filter items, or insert new records at the top. When array data changes, Vue's Virtual DOM engine must reconcile the old list of DOM nodes against the new list of data objects. 

Without a unique identifier on each loop item, Vue is forced to use an "in-place patch" strategy: keeping DOM elements in their original positions and updating their text/props in place. While fast, this in-place strategy breaks any DOM elements containing local un-tracked state (such as text box cursor positions, form checkbox selections, or CSS animations). To solve this, Vue requires the **`:key`** attribute—a persistent identifier that tells Vue exactly which array item corresponds to which physical DOM node across re-renders.

### (2) Reality Metaphor

Imagine a coat check station at a busy convention center where guests store their jackets on a long clothing rack.

Rendering a list **without `:key`** is like hanging coats on numbered hangers (`0`, `1`, `2`, `3`). If guest #0 leaves and takes their coat, the coat check attendant doesn't move the hangers. Instead, they shift all coats over by one spot to fill the empty hanger #0. If coat #1 had a ticket in its pocket, that coat is now sitting on hanger #0, confusing the attendant and assigning tickets to the wrong jackets.

Rendering a list **with `:key`** (`:key="coat.ticketId"`) is like attaching permanent metal luggage tags to each individual coat. When guest #0 leaves, the attendant simply unhooks coat #0. The remaining coats keep their original metal luggage tags regardless of where they sit on the rack. The attendant instantly identifies and reorders coats without mixing up pockets or tickets.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const servers = ref([
  { id: 'srv-01', name: 'US-East Production', status: 'Online' },
  { id: 'srv-02', name: 'EU-Central Staging', status: 'Maintenance' }
])
</script>

<template>
  <ul>
    <!-- Loop through array, assigning unique, stable server.id to :key -->
    <li v-for="server in servers" :key="server.id">
      {{ server.name }} - {{ server.status }}
    </li>
  </ul>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const tasks = ref([
  { id: 101, title: 'Perform database backup', completed: false },
  { id: 102, title: 'Upgrade Vue to v3.4', completed: true },
  { id: 103, title: 'Audit dependency vulnerabilities', completed: false }
])

function removeTask(id) {
  // Array mutation: filter removes item from middle of list
  tasks.value = tasks.value.filter(t => t.id !== id)
}

function addTask() {
  const newId = Date.now()
  // Array mutation: unshift inserts item at start of list
  tasks.value.unshift({ id: newId, title: `New Task #${tasks.value.length + 1}`, completed: false })
}
</script>

<template>
  <div class="task-manager">
    <button @click="addTask">Add Urgent Task to Top</button>

    <ul>
      <!-- 
        Using task.id as :key guarantees that local DOM input state 
        (checkbox selections, cursor focus) stays accurately bound to the task
      -->
      <li v-for="task in tasks" :key="task.id" class="task-row">
        <input v-model="task.completed" type="checkbox" />
        <span :class="{ done: task.completed }">{{ task.title }}</span>
        <button @click="removeTask(task.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.task-row { display: flex; gap: 12px; margin-bottom: 8px; align-items: center; }
.done { text-decoration: line-through; color: #8c8c8c; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Using array index as `:key` on dynamic/mutable lists

**The mistake:** Writing `<li v-for="(item, index) in items" :key="index">`.

**Why it's wrong:** Array index is NOT a stable identifier. If items are inserted, deleted, or sorted, the item at index `1` becomes index `0`. Its key changes! Vue assumes the old item was modified in place rather than moved, resulting in visual glitches where form inputs, checkbox states, or CSS animations map to the wrong rows.

*Incorrect:*
```vue
<!-- Index key causes input state corruptions when items are re-ordered or deleted -->
<li v-for="(user, index) in users" :key="index">
  <input v-model="user.name" />
</li>
```

*Fix:*
```vue
<!-- Persistent database ID maintains correct DOM element mapping -->
<li v-for="user in users" :key="user.id">
  <input v-model="user.name" />
</li>
```

---

### Mistake 2: Omitting the `:key` attribute on `v-for` loops

**The mistake:** Writing `<div v-for="item in items">` without a `:key` attribute.

**Why it's wrong:** Omitting `:key` forces Vue to disable its optimized Virtual DOM element reordering algorithm, falling back to an in-place patch strategy that degrades performance and corrupts component instance state on list mutations.

*Incorrect:*
```vue
<div v-for="item in items">{{ item.title }}</div> <!-- ❌ Missing mandatory :key! -->
```

*Fix:*
```vue
<div v-for="item in items" :key="item.id">{{ item.title }}</div>
```

---

### Mistake 3: Combining `v-if` and `v-for` on the exact same HTML element

**The mistake:** Writing `<li v-for="user in users" v-if="user.isActive" :key="user.id">`.

**Why it's wrong:** In Vue 3, `v-if` takes higher precedence than `v-for`. The `v-if` condition evaluates *before* `v-for` initializes, meaning `v-if` cannot access the loop variable `user`, resulting in a runtime `ReferenceError`.

*Incorrect:*
```vue
<!-- ❌ v-if evaluates first and cannot access loop variable 'user'! -->
<li v-for="user in users" v-if="user.isActive" :key="user.id">{{ user.name }}</li>
```

*Fix:* Filter array using a computed property before looping.
```vue
<script setup>
const activeUsers = computed(() => users.value.filter(u => u.isActive))
</script>
<template>
  <li v-for="user in activeUsers" :key="user.id">{{ user.name }}</li>
</template>
```

---

## 5. Practice Exercises

### Exercise 1: Financial Order Book Depth Chart List Rendering (Finance)

**Scenario:** A trading exchange order book receives real-time price updates. Orders can be added to top/bottom or cancelled. You must implement a high-performance order list loop using unique order IDs as keys and support sorting by price.

**Requirements:**
1. Loop over `bids` array using `v-for` with persistent `:key="bid.id"`.
2. Format price display using mustache interpolation.
3. Compute total order volume dynamically.
4. Support sort toggle between ascending and descending price order without breaking DOM state.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const isAscending = ref(false)
> const bids = ref([
>   { id: 'b-101', price: 185.50, amount: 50 },
>   { id: 'b-102', price: 185.75, amount: 120 },
>   { id: 'b-103', price: 185.25, amount: 200 }
> ])
> 
> const sortedBids = computed(() => {
>   return [...bids.value].sort((a, b) => 
>     isAscending.value ? a.price - b.price : b.price - a.price
>   )
> })
> </script>
> 
> <template>
>   <div class="order-book">
>     <button @click="isAscending = !isAscending">
>       Sort: {{ isAscending ? 'Ascending' : 'Descending' }}
>     </button>
> 
>     <div v-for="bid in sortedBids" :key="bid.id" class="bid-row">
>       <span class="price">${{ bid.price.toFixed(2) }}</span>
>       <span class="amount">{{ bid.amount }} shares</span>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `sortedBids` computed property prevents inline sorting inside templates.
> 2. **Concept**: `:key="bid.id"` allows Vue's VDOM engine to physically reorder DOM nodes during sort toggles.
> 3. **Concept**: Using unique string/number IDs prevents element destruction during array mutations.
> 4. **Concept**: `v-for` loops over computed arrays reactively.
> 
---

### Exercise 2: Real-Time Network Router Interface Loop (Networking)

**Scenario:** A router management system monitors interface ports. You must build an interface list iteration handling port status changes and allowing engineers to assign custom alias strings via text inputs without losing focus during array updates.

**Requirements:**
1. Loop over `interfaces` array using `v-for` with `:key="iface.portNumber"`.
2. Bind alias input using `v-model`.
3. Display status badge class based on `iface.status`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const interfaces = ref([
>   { portNumber: 1, alias: 'WAN-Uplink', status: 'UP' },
>   { portNumber: 2, alias: 'LAN-Primary', status: 'UP' },
>   { portNumber: 3, alias: 'DMZ-Backup', status: 'DOWN' }
> ])
> </script>
> 
> <template>
>   <div class="port-panel">
>     <!-- Persistent portNumber key preserves input focus on array updates -->
>     <div v-for="iface in interfaces" :key="iface.portNumber" class="port-row">
>       <span>Port #{{ iface.portNumber }}</span>
>       <input v-model="iface.alias" placeholder="Custom Alias" />
>       <span :class="['status-pill', iface.status.toLowerCase()]">{{ iface.status }}</span>
>     </div>
>   </div>
> </template>
> 
> <style scoped>
> .port-row { display: flex; gap: 10px; margin-bottom: 6px; }
> .status-pill.up { color: #52c41a; }
> .status-pill.down { color: #ff4d4f; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `:key="iface.portNumber"` uses stable hardware port numbers as persistent keys.
> 2. **Concept**: Stable keys ensure cursor focus inside `<input>` elements is preserved during re-renders.
> 3. **Concept**: `v-model` updates reactive nested object properties inside loop items.
> 4. **Concept**: Class array syntax handles dynamic status styling per row.
> 
---

### Exercise 3: E-Commerce Product Filter Matrix with Object/Range Iteration (E-commerce)

**Scenario:** An online store needs to render pagination page numbers (range iteration) and product attribute specifications (object property iteration).

**Requirements:**
1. Render pagination page buttons using integer range `n in totalPages` with `:key="n"`.
2. Render product specification key-value pairs using `(value, key) in productSpecs` with `:key="key"`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const totalPages = ref(5)
> const currentPage = ref(1)
> const productSpecs = ref({
>   Brand: 'Logitech',
>   DPI: '25,600',
>   Weight: '63g',
>   Connectivity: 'Wireless'
> })
> </script>
> 
> <template>
>   <div class="product-details">
>     <h3>Specifications</h3>
>     <!-- 1. Object property iteration (value, key) -->
>     <ul>
>       <li v-for="(val, key) in productSpecs" :key="key">
>         <strong>{{ key }}:</strong> {{ val }}
>       </li>
>     </ul>
> 
>     <h3>Page Selection</h3>
>     <!-- 2. Range integer iteration (n in totalPages) -->
>     <div class="pagination">
>       <button 
>         v-for="n in totalPages" 
>         :key="n" 
>         :class="{ active: currentPage === n }"
>         @click="currentPage = n"
>       >
>         {{ n }}
>       </button>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `v-for="(val, key) in object"` iterates over object key-value pairs.
> 2. **Concept**: `v-for="n in 5"` iterates over integer ranges (1-indexed: 1, 2, 3, 4, 5).
> 3. **Concept**: Integer values and object keys serve as valid stable `:key` identifiers.
> 4. **Concept**: Range loops simplify template page number generation without dummy arrays.
> 
---

## 6. Related Terms

- [Directives](directives.md) — Built-in directive system.
- [`v-if` / `v-show`](v_if_show.md) — Conditional rendering directives.
- [`v-once` & `v-memo`](../level_08/v_once_memo.md) — List performance directives.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — Reconciliation algorithm.

---

## 7. Key Takeaways

- **`v-for`** iterates over arrays, objects, or integer ranges to render list DOM elements.
- The **`:key`** attribute provides persistent unique node identities for Virtual DOM diffing (`patchKeyedChildren`).
- Never use array index as `:key` on mutable or re-orderable lists. Always use persistent IDs.
- Omitting `:key` forces Vue into slow, error-prone in-place node patching.
- Never place `v-if` and `v-for` on the exact same HTML element (`v-if` has higher priority in Vue 3).
