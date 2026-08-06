# Scoped Slots

> **Level 5 — Advanced Component Architecture**
> An advanced pattern where a Child component passes internal data *up* to the Parent specifically so the Parent can use that data to render the UI that goes back *down* into the slot.

---

## 1. Prerequisites

- [Slots](slots.md) — The baseline mechanism.
- [Props](../level_04/props.md) — How data usually flows (Top-Down). Scoped slots briefly invert this.

---

## 2. Term Category

**Vue Template Pattern (Content Distribution Architecture)**: Scoped Slots are an advanced template rendering feature that allows child components to pass internal data props *upward* to parent component template slots. The parent component consumes this child-scoped data to dynamically customize the HTML markup rendered inside the child's template slot placement.

In standard Vue data flow, props flow top-down while slot content is evaluated in the parent's rendering scope. Scoped slots temporarily invert this scope by binding child data directly to `<slot :item="data">` elements. In React, this architectural pattern is implemented via Render Props (`children={(data) => <CustomUI data={data} />}`). Vue scoped slots compile down to VNode slot rendering functions (`v-slot:default="slotProps"`), providing clean, declarative template syntax with optimized Virtual DOM performance.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
Consider a reusable `<DataGrid>` or `<ListView>` component. The child component excels at managing data concerns: fetching records from an API, handling pagination, sorting rows, and looping over items via `v-for`. However, different parent pages require completely different visual presentations for each row—one view needs compact text bullets, another needs rich image cards with action buttons.

Without scoped slots, developers had to create dozens of conditional prop flags (`:isCardView="true"`, `:showAvatar="false"`), leading to bloated child components. Scoped slots solve this by cleanly separating **data orchestration** (managed by the child) from **visual rendering design** (delegated to the parent template). The child component exposes internal item data to the slot, allowing the parent to write custom HTML templates that directly consume each item.

### (2) Reality Metaphor
Think of a Scoped Slot like a high-tech photo framing machine supplied by an art gallery (the child component). The machine knows how to load photographs, mount them securely, control lightning, and swap pictures automatically. However, the gallery machine does not hardcode what frame design to place around each picture. Instead, it holds up each picture through a cutout window (the scoped slot) and provides real-time dimensions and photo metadata to an external custom framer (the parent template). The custom framer designs bespoke frames on the spot while relying on the machine to manage picture loading.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- Child.vue (ListContainer) -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <!-- Expose 'item' data up to the parent slot -->
      <slot :item="item"></slot>
    </li>
  </ul>
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <ListContainer>
    <!-- Receive and destructure 'item' data in parent template -->
    <template #default="{ item }">
      <span class="badge">{{ item.title }}</span>
    </template>
  </ListContainer>
</template>
```

#### Fuller Example
```vue
<!-- DataGrid.vue (Child Component orchestrating data) -->
<script setup>
import { ref } from 'vue'

const records = ref([
  { id: 'REC-01', name: 'Server Alpha', status: 'Online', load: 42 },
  { id: 'REC-02', name: 'DB Cluster Beta', status: 'Warning', load: 88 },
  { id: 'REC-03', name: 'Cache Node Gamma', status: 'Offline', load: 0 }
])
</script>

<template>
  <div class="grid-table">
    <div v-for="(record, index) in records" :key="record.id" class="grid-row">
      <!-- Pass record and index up to named scoped slot -->
      <slot name="row" :record="record" :index="index">
        <!-- Fallback rendering if parent provides no custom template -->
        <span>{{ record.name }} - {{ record.status }}</span>
      </slot>
    </div>
  </div>
</template>
```

```vue
<!-- SystemDashboard.vue (Parent Component consuming scoped slot) -->
<script setup>
import DataGrid from './DataGrid.vue'
</script>

<template>
  <div class="dashboard">
    <h2>Infrastructure Status</h2>
    <DataGrid>
      <!-- Target named slot 'row' and destructure scoped slot props -->
      <template #row="{ record, index }">
        <div class="custom-card" :class="record.status.toLowerCase()">
          <span class="index">#{{ index + 1 }}</span>
          <strong>{{ record.name }}</strong>
          <span class="metric">Load: {{ record.load }}%</span>
        </div>
      </template>
    </DataGrid>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Confusing Scoped Slots with Component Event Emits (`emit`)

**The mistake:** Attempting to update parent JavaScript logic state variables by passing data up through a scoped slot.

**Why it's wrong:** Scoped slots are strictly designed for **Template UI Rendering**. Data exposed by a child via a scoped slot is available exclusively within the parent's `<template>` block. It cannot be accessed inside the parent's `<script setup>` logic block.

*Incorrect:*
```vue
<!-- Expecting parent script to read scoped slot data: -->
<ChildComponent #default="{ item }">
  <!-- ❌ 'item' is not accessible in parent <script setup>! -->
</ChildComponent>
```

*Fix:*
```vue
<!-- Use Emits ($emit) for script business logic; Scoped Slots for UI template rendering: -->
<ChildComponent @select-item="handleItemSelection" #default="{ item }">
  <span>Rendering: {{ item.name }}</span>
</ChildComponent>
```

---

### Mistake 2: Consuming Scoped Slot Data Without Declaring Slot Props

**The mistake:** Referencing child slot properties directly in the parent template without capturing slot props on `<template #slotName="slotProps">`.

**Why it's wrong:** Slot data belongs to the child scope. Unless captured via `v-slot` or `#`, referencing `item.name` in the parent template causes a `ReferenceError` because `item` is undefined in the parent scope.

*Incorrect:*
```vue
<MyList>
  <template #item>
    <p>{{ item.title }}</p> <!-- ❌ ReferenceError: item is undefined! -->
  </template>
</MyList>
```

*Fix:*
```vue
<MyList>
  <!-- Capture slot props explicitly via destructured object syntax: -->
  <template #item="{ item }">
    <p>{{ item.title }}</p>
  </template>
</MyList>
```

---

### Mistake 3: Invalid Shorthand Syntax (`#="{ item }"`)

**The mistake:** Writing `<template #="{ item }">` without providing an explicit slot name when consuming the default slot.

**Why it's wrong:** The `#` shorthand requires an explicit slot identifier (e.g. `#default="{ item }"` or `#row="{ item }"`). Omitting the slot name causes a Vue compiler syntax error.

*Incorrect:*
```vue
<template #="{ item }"> <!-- ❌ Syntax error: missing slot name after # -->
```

*Fix:*
```vue
<template #default="{ item }"> <!-- Explicit default slot shorthand -->
```

---

## 5. Practice Exercises

### Exercise 1: Financial Trading Order Book Data Grid

**Scenario:** An institutional trading desk platform uses a reusable `<OrderGrid>` component. The grid fetches order data and exposes individual order objects to parent view templates via a named scoped slot `#orderRow`.

**Requirements:**
1. `<OrderGrid>` child component loops over an array of `orders` (`id`, `symbol`, `price`, `type`).
2. Expose `order` and `isBuyOrder` boolean up via slot name `"orderRow"`.
3. Parent component template applies custom CSS styling based on `isBuyOrder`.
4. Include test assertions for slot prop availability.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- OrderGrid.vue (Child) -->
> <script setup>
> import { ref } from 'vue';
> 
> const orders = ref([
>   { id: 'ORD-101', symbol: 'AAPL', price: 185.50, type: 'BUY' },
>   { id: 'ORD-102', symbol: 'TSLA', price: 240.20, type: 'SELL' }
> ]);
> </script>
> 
> <template>
>   <div class="order-grid">
>     <div v-for="order in orders" :key="order.id">
>       <slot name="orderRow" :order="order" :isBuyOrder="order.type === 'BUY'"></slot>
>     </div>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- TradingDashboard.vue (Parent) -->
> <script setup>
> import OrderGrid from './OrderGrid.vue';
> </script>
> 
> <template>
>   <OrderGrid>
>     <template #orderRow="{ order, isBuyOrder }">
>       <div class="row" :class="{ 'text-green': isBuyOrder, 'text-red': !isBuyOrder }">
>         <span>{{ order.symbol }}</span> - <span>${{ order.price }}</span>
>       </div>
>     </template>
>   </OrderGrid>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Slot Prop Binding**: `:isBuyOrder="order.type === 'BUY'"` derives slot properties dynamically inside the child template loop.
> 2. **Destructuring Syntax**: Parent consumes slot data cleanly via `<template #orderRow="{ order, isBuyOrder }">`.
> 3. **Separation of Concerns**: Data state management remains inside `<OrderGrid>`, while visual color coding stays with `<TradingDashboard>`.
> 4. **Named Slot Isolation**: Dedicated `#orderRow` slot prevents collisions with header or footer slot templates.
> 
---

### Exercise 2: Logistics Fleet Real-Time Coordinate Tracker

**Scenario:** A delivery logistics platform tracks fleet vehicles. A `<FleetTracker>` component manages telemetry sockets and exposes vehicle coordinates to parent templates via scoped slots for custom map overlay pin rendering.

**Requirements:**
1. `<FleetTracker>` component maintains an array of vehicle positions (`vehicleId`, `lat`, `lng`, `speed`).
2. Expose vehicle position and a formatted string `speedLabel` to default slot.
3. Parent component customizes map pin popups consuming `speedLabel`.
4. Include fallback content rendering when no parent template is passed.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- FleetTracker.vue (Child) -->
> <script setup>
> import { ref } from 'vue';
> 
> const vehicles = ref([
>   { vehicleId: 'TRUCK-01', lat: 37.7749, lng: -122.4194, speed: 55 },
>   { vehicleId: 'VAN-04', lat: 37.7833, lng: -122.4167, speed: 0 }
> ]);
> </script>
> 
> <template>
>   <div class="tracker-container">
>     <div v-for="v in vehicles" :key="v.vehicleId">
>       <slot :vehicle="v" :speedLabel="`${v.speed} mph`">
>         <!-- Fallback content if parent template is omitted -->
>         <p>{{ v.vehicleId }}: {{ v.lat }}, {{ v.lng }}</p>
>       </slot>
>     </div>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- MapView.vue (Parent) -->
> <script setup>
> import FleetTracker from './FleetTracker.vue';
> </script>
> 
> <template>
>   <FleetTracker>
>     <template #default="{ vehicle, speedLabel }">
>       <div class="map-pin">
>         <strong>{{ vehicle.vehicleId }}</strong>
>         <span>Status: {{ speedLabel }}</span>
>       </div>
>     </template>
>   </FleetTracker>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Calculated Slot Props**: `:speedLabel="`${v.speed} mph`"` formats raw child telemetry data before passing it to the parent.
> 2. **Fallback Safety**: Default content inside `<slot>...</slot>` renders gracefully if the parent uses self-closing `<FleetTracker />`.
> 3. **Template Context Binding**: Scoped slots evaluate template expressions within parent component reactive contexts.
> 4. **VNode Performance**: Compiled slot functions avoid unneeded DOM reconciliation steps during live socket position updates.
> 
---

### Exercise 3: Electronic Health Records Patient Directory Filter

**Scenario:** An EHR hospital portal requires a `<PatientDirectory>` component. The component handles multi-attribute search filtering and exposes matching patient records to parent slot templates.

**Requirements:**
1. Child component filters patient records based on internal search query state.
2. Expose `patient` object and `index` count to named slot `"patientItem"`.
3. Parent component renders custom medical alert icons based on `patient.allergies` array length.
4. Verify TypeScript compilation safety.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- PatientDirectory.vue (Child) -->
> <script setup>
> import { ref, computed } from 'vue';
> 
> const searchQuery = ref('');
> const patients = ref([
>   { id: 'P-1', name: 'Alice Smith', age: 34, allergies: ['Penicillin'] },
>   { id: 'P-2', name: 'Bob Jones', age: 62, allergies: [] }
> ]);
> 
> const filteredPatients = computed(() => {
>   return patients.value.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
> });
> </script>
> 
> <template>
>   <div class="ehr-directory">
>     <input v-model="searchQuery" placeholder="Filter patients..." />
>     <div v-for="(patient, idx) in filteredPatients" :key="patient.id">
>       <slot name="patientItem" :patient="patient" :index="idx"></slot>
>     </div>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- HospitalView.vue (Parent) -->
> <script setup>
> import PatientDirectory from './PatientDirectory.vue';
> </script>
> 
> <template>
>   <PatientDirectory>
>     <template #patientItem="{ patient, index }">
>       <div class="patient-row">
>         <span>{{ index + 1 }}. {{ patient.name }} (Age: {{ patient.age }})</span>
>         <span v-if="patient.allergies.length > 0" class="alert-tag">⚠️ Allergy Warning</span>
>       </div>
>     </template>
>   </PatientDirectory>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Computed Filtering**: `<PatientDirectory>` encapsulates reactive search filtering logic inside a computed property.
> 2. **Index Scope Passing**: Exposing `:index="idx"` allows the parent to display custom 1-based list numbering.
> 3. **Dynamic Alert Badges**: Parent inspects `patient.allergies` to conditionally render warning icons in its local template.
> 4. **Declarative Composition**: Combines reactive data pipelines with customizable component template injection.
> 
---

## 6. Related Terms

- [Slots](slots.md) — The fundamental mechanism.
- [Composables](composables.md) — The modern replacement for the "Renderless Component" scoped slot pattern.

---

## 7. Key Takeaways

- **Scoped Slots** allow a child component to expose internal data properties *upward* to parent template slots.
- Solves data presentation challenges by separating **data orchestration** (child) from **UI layout rendering** (parent).
- Pass data in the child using slot prop attributes: `<slot :item="record" :index="i"></slot>`.
- Consume data in the parent using template slot props: `<template #default="{ item, index }">`.
- Scoped slot data is available exclusively within the parent's `<template>` block—use custom event emits (`$emit`) for script logic handling.
