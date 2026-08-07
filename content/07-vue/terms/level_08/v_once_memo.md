# `v-once` & `v-memo`

> **Level 8 — Advanced Architecture & Performance**
> Performance directives used to bypass or conditionally skip Virtual DOM diffing subtrees to maximize render speeds in large applications.

---

## 1. Prerequisites

- [Virtual DOM (Vue)](virtual_dom.md) — The VNode diffing algorithm that `v-once` and `v-memo` explicitly optimize and skip.
- [Directives](../level_03/directives.md) — The foundation of Vue's special template attributes.

---

## 2. Term Category

**Vue Performance Directives (V-DOM Diffing Optimization & Memoization)**: `v-once` and `v-memo` are template directives designed to optimize Virtual DOM rendering performance. Functioning within client-side rendering engines and SSR template compilation steps, they instruct the Vue compiler to cache rendered VNode subtrees.

`v-once` renders an element or component exactly once during initial mount and freezes its VNode representation permanently, treating it as static HTML forever. `v-memo` (introduced in Vue 3.2) accepts a dependency array (`v-memo="[depA, depB]"`). It caches the rendered VNode subtree and skips Virtual DOM diffing entirely unless one of the specified dependency values changes, serving as the template equivalent of memoization functions.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Although Vue 3's Virtual DOM patch algorithm is extremely fast, rendering giant lists containing thousands of complex rows (such as financial order books or IoT grid tables) creates CPU overhead. When a user updates a single selected item in a 5,000-item `v-for` list, Vue's diffing algorithm must evaluate all 5,000 VNode subtrees to check if any properties changed.

**`v-once`** and **`v-memo`** provide explicit escape hatches for performance-critical rendering bottlenecks. With `v-once`, developers tell Vue: *"This sub-header or legal disclaimers block will never change—render it once and never evaluate its VNodes again."* With `v-memo`, developers tell Vue: *"Do not diff this list item VNode tree unless `item.id === selectedId` or `item.updatedAt` changes."* In a 5,000-item list, `v-memo` allows Vue to skip diffing 4,999 unchanged rows, turning an `O(N)` diffing loop into an `O(1)` targeted update.

### (2) Reality Metaphor
Imagine a printing press publishing a daily 100-page newspaper. In a standard Virtual DOM model without memoization directives, every morning the master print setter must re-typeset all 100 pages character by character—even if Page 2 through Page 99 contain static weekly comics or archived legal notices.

`v-once` is like permanently archiving static metal printing plates for the legal notice section (Page 99). The printing press uses the saved plate directly every day without ever re-typesetting Page 99. `v-memo` is like checking a stamp indicator on the sports section (Page 50). If the stamp reads "No game played yesterday" (dependency unchanged), the press re-uses yesterday's sports plate instantly without inspecting individual scores.

### (3) Vue Code Examples

#### Short Snippet
```vue
<template>
  <!-- Rendered ONCE during initial mount; ignores future reactivity updates -->
  <h1 v-once>Static Header: {{ title }}</h1>

  <!-- Re-rendered ONLY if selectedId matches item.id -->
  <div v-for="item in items" :key="item.id" v-memo="[item.id === selectedId]">
    <p>{{ item.name }} - Selected: {{ item.id === selectedId }}</p>
  </div>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref } from 'vue'

const selectedId = ref(1)
const list = ref(Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Data Entry #${i + 1}`,
  timestamp: new Date().toLocaleTimeString()
})))

function selectRow(id) {
  selectedId.value = id
}
</script>

<template>
  <div class="memo-container">
    <h3>Memoized Data Grid (1,000 Rows)</h3>
    <p>Selected Row ID: {{ selectedId }}</p>

    <table class="grid-table">
      <thead>
        <!-- v-once freezes table header VNodes permanently -->
        <tr v-once>
          <th>ID</th>
          <th>Name</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <!-- v-memo skips V-DOM diffing for all rows EXCEPT old/new selected rows -->
        <tr 
          v-for="item in list" 
          :key="item.id"
          v-memo="[item.id === selectedId]"
          :class="{ active: item.id === selectedId }"
        >
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.id === selectedId ? 'SELECTED' : 'Idle' }}</td>
          <td>
            <button @click="selectRow(item.id)">Select</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Premature Optimization on Small Component Trees
**The mistake:** Applying `v-memo` to small lists of 5 or 10 elements or applying `v-once` across basic UI paragraphs.

**Why it's wrong:** Evaluating `v-memo` dependency arrays carries a small JavaScript comparison cost. For small component trees, the overhead of checking `v-memo` dependency arrays is actually **slower** than letting Vue's compiler perform its native, fast Virtual DOM patch! Reserve `v-memo` for large lists (1,000+ items).

*Incorrect:*
```vue
<!-- ❌ Premature optimization on small static lists adds overhead -->
<div v-for="i in 5" :key="i" v-memo="[i]">
  <p>{{ i }}</p>
</div>
```

*Fix:*
```vue
<!-- Standard rendering for small lists is faster natively -->
<div v-for="i in 5" :key="i">
  <p>{{ i }}</p>
</div>
```

---

### Mistake 2: Using `v-memo` Without Providing a Dependency Array
**The mistake:** Writing `<div v-memo>` without passing a dependency array argument (`v-memo="[dep]"`).

**Why it's wrong:** Omitting the dependency array causes `v-memo` to evaluate as `v-memo="[]"`, which behaves identically to `v-once`. The element will never re-render even if child variables change.

*Incorrect:*
```vue
<!-- ❌ Missing dependency array parameter freezes updates permanently! -->
<div v-memo>
  {{ dynamicText }}
</div>
```

*Fix:*
```vue
<!-- Always supply explicit dependency array -->
<div v-memo="[dynamicText]">
  {{ dynamicText }}
</div>
```

---

### Mistake 3: Placing `v-once` on Elements Containing Dynamic Reactive Content
**The mistake:** Placing `v-once` on an unread notification counter badge or status indicator `<span v-once>{{ unreadCount }}</span>`.

**Why it's wrong:** `v-once` permanently freezes the rendered DOM after initial mount. When `unreadCount` increments, Vue skips updating the `v-once` element, displaying stale state to users.

*Incorrect:*
```vue
<span class="badge" v-once>{{ unreadCount }}</span> <!-- ❌ Never updates! -->
```

*Fix:*
```vue
<span class="badge">{{ unreadCount }}</span> <!-- Standard dynamic binding -->
```

---

## 5. Practice Exercises

### Exercise 1: Financial Order Book Depth Chart Memoization
**Scenario:** A crypto trading desk renders 2,000 bid/ask depth rows. Selecting a target row highlights its price level. Optimize list rendering using `v-memo` so selecting a row diffs only 2 rows (old selection and new selection) rather than 2,000.

**Requirements:**
1. Maintain `orders` state array of 2,000 items `{ price, amount, type }`.
2. Maintain `selectedPrice` ref.
3. Use `v-memo="[order.price === selectedPrice]"` on table row elements.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const selectedPrice = ref(180.50)
> const orders = ref(Array.from({ length: 2000 }, (_, i) => ({
>   id: i + 1,
>   price: 100 + (i * 0.1),
>   amount: (Math.random() * 5).toFixed(2),
>   type: i % 2 === 0 ? 'bid' : 'ask'
> })))
> 
> function setSelection(price) {
>   selectedPrice.value = price
> }
> </script>
> 
> <template>
>   <div class="order-book">
>     <h3>Depth Chart (Selected Price: ${{ selectedPrice }})</h3>
> 
>     <table>
>       <tbody>
>         <!-- v-memo skips V-DOM diffing for all 1,998 unchanged rows -->
>         <tr 
>           v-for="order in orders" 
>           :key="order.id"
>           v-memo="[order.price === selectedPrice]"
>           :class="{ highlighted: order.price === selectedPrice }"
>           @click="setSelection(order.price)"
>         >
>           <td>{{ order.price.toFixed(2) }}</td>
>           <td>{{ order.amount }}</td>
>           <td>{{ order.type.toUpperCase() }}</td>
>         </tr>
>       </tbody>
>     </table>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Targeted Diffing**: `v-memo="[order.price === selectedPrice]"` checks boolean equality for each row VNode.
> 2. **O(1) Patch Performance**: When `selectedPrice` changes, 1,998 rows evaluate boolean `false === false` (unchanged), causing Vue to skip V-DOM diffing for those rows entirely.
> 3. **Reduced CPU Frame Drops**: Prevents layout lag during fast mouse clicks across large tabular views.
> 4. **Memory Retention**: Cached VNode representations are re-used directly from memory.
> 
---

### Exercise 2: Real-Time IoT Telemetry Grid Optimization
**Scenario:** An industrial IoT dashboard displays 1,500 sensor cards. Cards should only re-render if their sensor status changes from `'normal'` to `'warning'` or if their `lastUpdate` timestamp changes.

**Requirements:**
1. State `sensors` array of `{ id, status, val, lastUpdate }`.
2. Apply `v-memo="[sensor.status, sensor.lastUpdate]"` on card elements.
3. Verify that changes to internal sub-properties not in the dependency array are ignored during updates.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const sensors = ref([
>   { id: 'SN-01', status: 'normal', val: 24.5, lastUpdate: '10:00:00' },
>   { id: 'SN-02', status: 'warning', val: 98.2, lastUpdate: '10:00:00' }
> ])
> 
> function triggerUpdate(id) {
>   const sensor = sensors.value.find(s => s.id === id)
>   if (sensor) {
>     sensor.lastUpdate = new Date().toLocaleTimeString()
>   }
> }
> </script>
> 
> <template>
>   <div class="sensor-grid">
>     <div 
>       v-for="s in sensors" 
>       :key="s.id"
>       v-memo="[s.status, s.lastUpdate]"
>       :class="['card', s.status]"
>     >
>       <h4>{{ s.id }} (Status: {{ s.status }})</h4>
>       <p>Value: {{ s.val }}</p>
>       <small>Updated: {{ s.lastUpdate }}</small>
>       <button @click="triggerUpdate(s.id)">Ping Sensor</button>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Multi-Dependency Tracking**: `v-memo="[s.status, s.lastUpdate]"` re-evaluates VNodes only if status or timestamp changes.
> 2. **Subtree Caching**: Entire card HTML subtrees (headers, paragraphs, buttons) are cached when dependencies match.
> 3. **Grid Render Efficiency**: Allows dashboards with thousands of telemetry nodes to handle high-frequency socket updates smoothly.
> 4. **Selective Invalidation**: Updating `s.lastUpdate` invalidates cache for that specific sensor node.
> 
---

### Exercise 3: Healthcare Patient Record Static Header Freezing
**Scenario:** A hospital EHR system renders a long patient medical history page. The top patient identity banner contains static demographic data (Name, DOB, Blood Type) that never changes during a session. Freeze the top banner using `v-once`.

**Requirements:**
1. State `patient` containing static demographics.
2. Render top demographic banner using `v-once`.
3. Render dynamic medical notes list below banner without `v-once`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref } from 'vue'
> 
> const patient = ref({
>   name: 'Eleanor Vance',
>   dob: '1984-05-12',
>   bloodType: 'O-Positive'
> })
> 
> const medicalNotes = ref(['Initial Consultation - Healthy', 'Blood Pressure Check - Normal'])
> const newNote = ref('')
> 
> function addNote() {
>   if (newNote.value) {
>     medicalNotes.value.push(newNote.value)
>     newNote.value = ''
>   }
> }
> </script>
> 
> <template>
>   <div class="ehr-record">
>     <!-- v-once freezes static demographic banner permanently after mount -->
>     <header v-once class="patient-banner">
>       <h2>Patient: {{ patient.name }}</h2>
>       <p>DOB: {{ patient.dob }} | Blood Type: {{ patient.bloodType }}</p>
>     </header>
> 
>     <section class="notes-section">
>       <h3>Medical Notes</h3>
>       <input v-model="newNote" placeholder="Add note..." />
>       <button @click="addNote">Add Note</button>
> 
>       <ul>
>         <li v-for="(note, idx) in medicalNotes" :key="idx">{{ note }}</li>
>       </ul>
>     </section>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Permanent VNode Freezing**: `<header v-once>` compiles to a static VNode tree hoisted from render cycles.
> 2. **Zero Diffing Overhead**: Adding new notes mutates `medicalNotes` array, but Vue skips checking the demographic header VNodes during the patch phase.
> 3. **Memory Optimization**: Static header VNodes are cached permanently in memory.
> 4. **Clean Architectural Separation**: Isolates static branding/identity subtrees from dynamic content streams.
> 
---

## 6. Related Terms

- [Virtual DOM (Vue)](virtual_dom.md) — The VNode patching process optimized by `v-once` and `v-memo`.
- [Computed Properties](../level_02/computed_properties.md) — The JavaScript equivalent for caching derived values.
- [`v-for` (List Rendering) & `:key`](../level_03/v_for_key.md) — The list rendering directive where `v-memo` provides peak performance gains.
- [Directives](../level_03/directives.md) — The parent directive system in Vue.

---

## 7. Key Takeaways

- `v-once` renders an element/component once and freezes its VNode representation permanently.
- `v-memo="[deps]"` caches VNode subtrees and re-evaluates them ONLY when specified dependency values change.
- `v-memo` turns expensive `O(N)` list diffing operations into fast `O(1)` targeted updates in large `v-for` loops (1,000+ items).
- Avoid **Premature Optimization**: Do not use `v-memo` on tiny lists (5-10 items); native Vue diffing is faster.
- Always supply a non-empty dependency array to `v-memo` (`v-memo="[a, b]"`).
