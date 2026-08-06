# Emitting Events (`defineEmits`)

> **Level 4 — Components & Lifecycle**
> The formal event messaging mechanism a child component uses to send custom triggers and payload data *up* to its parent component, enforcing strict One-Way Data Flow.

---

## 1. Prerequisites

- [Props](props.md) — Understand why emits are necessary (because props are strictly read-only).
- [`v-on`](../level_03/v_on.md) — How parent components listen for emitted events in templates.

---

## 2. Term Category

**Upward Event Communication (Component Event Bus)**: Emitting events represents Vue's official architectural mechanism for child-to-parent component communication. Enforcing the strict rule **"Props Down, Events Up"**, children are forbidden from directly mutating incoming props. Instead, children trigger custom events using the `emit()` method declared via `defineEmits()`. Parent components listen to these custom events using standard `@event-name` directive handlers. Executed in client-side runtime environments, emits preserve unidirectionality and component boundaries.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

In component-driven architecture, data flows strictly downward from parent to child via [Props](props.md). To guarantee predictability and prevent debugging nightmares where dozens of child components mutate shared data silently, Vue marks incoming props as strictly read-only.

However, child components inevitably need to trigger state changes. For example, when a user clicks a "Delete Item" button inside a `<TaskRow>` child component, the `<TaskRow>` component itself does not own the master `tasks` array. It cannot delete the item from the parent array directly!

Vue designed **Emits** to solve this upward communication gap. Rather than mutating data directly, the child component "emits an event" (yells up to the parent): *"Hey! The user clicked delete on Item #42!"* The parent component listens for this custom event via `@delete-item="handleDelete"` and mutates its own master state. This keeps state mutation logic strictly contained within the component that owns the state.

### (2) Reality Metaphor

Imagine a corporate hierarchy in a manufacturing company.

A Vice President (Parent Component) hands a written project assignment document (Props) down to a Project Manager (Child Component). The Project Manager is strictly forbidden from taking a pen and crossing out lines on the Vice President's official master contract document.

If an issue arises on the factory floor, the Project Manager doesn't alter the contract. Instead, the Project Manager submits an **Event Memo** (`emit('budget-exceeded', { amount: 5000 })`) up to the Vice President's desk. The Vice President reads the memo (`@budget-exceeded="adjustBudget"`) and officially updates the master budget allocation.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- DeleteButton.vue (Child) -->
<script setup>
// Declare emitted custom events using defineEmits compiler macro
const emit = defineEmits(['delete-user'])

function handleClick() {
  // Emit custom event name and optional payload data up to parent
  emit('delete-user', { id: 42, reason: 'User requested removal' })
}
</script>

<template>
  <button @click="handleClick">Delete User #42</button>
</template>
```

#### Fuller Example
```vue
<!-- UserTable.vue (Parent Component) -->
<script setup>
import { ref } from 'vue'
import UserRow from './UserRow.vue'

const users = ref([
  { id: 101, name: 'Alice Architecture', role: 'Admin' },
  { id: 102, name: 'Bob Backend', role: 'Developer' }
])

function handleRemoveUser(payload) {
  console.log(`Parent removing user #${payload.id}. Reason: ${payload.reason}`)
  users.value = users.value.filter(u => u.id !== payload.id)
}
</script>

<template>
  <div class="user-management">
    <h2>Active System Accounts</h2>
    <div class="table">
      <!-- Parent listens to child custom event '@remove-user' using standard v-on -->
      <UserRow 
        v-for="u in users" 
        :key="u.id" 
        :user="u" 
        @remove-user="handleRemoveUser" 
      />
    </div>
  </div>
</template>
```

```vue
<!-- UserRow.vue (Child Component) -->
<script setup>
defineProps({
  user: Object
})

// Compiler macro declares custom events
const emit = defineEmits(['remove-user'])

function triggerRemoval() {
  // Emit custom event back up to parent
  emit('remove-user', { id: props.user.id, reason: 'Manual deletion' })
}
</script>

<template>
  <div class="row">
    <span>{{ user.name }} ({{ user.role }})</span>
    <button @click="triggerRemoval">Remove Account</button>
  </div>
</template>

<style scoped>
.row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #ccc; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Forgetting to declare custom emitted events in `defineEmits()`

**The mistake:** Calling `emit('user-selected', user)` inside `<script setup>` without declaring `defineEmits(['user-selected'])`.

**Why it's wrong:** Undeclared emitted events fall through to root element DOM attributes (fallthrough attributes `$attrs`), triggering duplicate event executions or compiler warnings.

*Incorrect:*
```vue
<script setup>
// ❌ Missing defineEmits macro declaration!
function remove() { emit('delete', id); }
</script>
```

*Fix:*
```vue
<script setup>
const emit = defineEmits(['delete']); // Explicitly declare custom emitted events
function remove() { emit('delete', id); }
</script>
```

---

### Mistake 2: Mutating props directly instead of emitting events ("Mutating Prop Anti-Pattern")

**The mistake:** A child component attempting to modify an incoming prop directly: `props.user.name = 'New Name'`.

**Why it's wrong:** Props are strictly read-only proxies enforcing One-Way Data Flow. Mutating props throws runtime console warnings and creates untraceable side-effects in parent state.

*Incorrect:*
```javascript
const props = defineProps(['modelValue'])
function update(val) {
  props.modelValue = val // ❌ Readonly prop mutation warning!
}
```

*Fix:*
```javascript
const emit = defineEmits(['update:modelValue'])
function update(val) {
  emit('update:modelValue', val) // Request parent update via event emit
}
```

---

### Mistake 3: Using camelCase event names in HTML templates

**The mistake:** Emitting `emit('userUpdated')` and listening with `@userUpdated="handler"` in HTML templates.

**Why it's wrong:** HTML attributes are case-insensitive. In HTML templates, camelCase listeners `@userUpdated` are coerced to lowercase `@userupdated`, breaking event registration. The Vue Style Guide strongly recommends naming custom events in kebab-case (`user-updated`).

*Incorrect:*
```javascript
emit('userUpdated', user); // ❌ May fail in HTML templates due to case coercion
```

*Fix:*
```javascript
emit('user-updated', user); // Standard kebab-case event naming
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Alarm Reset Event Pipeline (IoT)

**Scenario:** An industrial machine tile `<MachineTile>` has an "Emergency Reset" button. Clicking it must emit a `reset-alarm` event containing the machine's unit ID and operator code to the parent control station `<ControlStation>`.

**Requirements:**
1. Declare `defineEmits(['reset-alarm'])` inside `MachineTile.vue`.
2. Emit `reset-alarm` with payload `{ unitId: 'M-90', operatorCode: 'OP-42' }`.
3. Listen with `@reset-alarm="handleReset"` in parent component.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- MachineTile.vue (Child) -->
> <script setup>
> const props = defineProps({ unitId: String })
> const emit = defineEmits(['reset-alarm'])
> 
> function triggerReset() {
>   emit('reset-alarm', { unitId: props.unitId, operatorCode: 'OP-42' })
> }
> </script>
> 
> <template>
>   <div class="tile">
>     <h4>Machine Unit: {{ unitId }}</h4>
>     <button @click="triggerReset">Reset Alarm</button>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- ControlStation.vue (Parent) -->
> <script setup>
> import MachineTile from './MachineTile.vue'
> 
> function handleReset(payload) {
>   console.log(`Alarm reset for unit ${payload.unitId} by operator ${payload.operatorCode}`)
> }
> </script>
> 
> <template>
>   <div class="station">
>     <MachineTile unit-id="M-90" @reset-alarm="handleReset" />
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `defineEmits` declares custom component event triggers.
> 2. **Concept**: `emit('reset-alarm', payload)` sends event data up to parent scopes.
> 3. **Concept**: Parent uses `@reset-alarm` to attach event handlers.
> 4. **Concept**: Respects One-Way Data Flow cleanly.
> 
---

### Exercise 2: Financial Order Form Payload Validation Emits (Finance)

**Scenario:** A financial trade entry form component `<OrderForm>` must validate order payloads before emitting a `submit-order` event. You will configure object payload validation inside `defineEmits()`.

**Requirements:**
1. Configure object-syntax `defineEmits` validating that `amount` payload is a positive number.
2. Emit `submit-order` on valid form submission.
3. Return `false` in validator when amount is <= 0 to trigger dev warnings.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- OrderForm.vue -->
> <script setup>
> import { ref } from 'vue'
> 
> const tradeAmount = ref(1000)
> 
> // defineEmits object syntax for payload runtime validation
> const emit = defineEmits({
>   'submit-order': (payload) => {
>     if (typeof payload.amount === 'number' && payload.amount > 0) {
>       return true // Validation passed
>     }
>     console.warn('Invalid emit payload: amount must be positive!')
>     return false // Triggers console warning in dev mode
>   }
> })
> 
> function onSubmit() {
>   emit('submit-order', { amount: tradeAmount.value, asset: 'BTC' })
> }
> </script>
> 
> <template>
>   <form @submit.prevent="onSubmit">
>     <input v-model.number="tradeAmount" type="number" />
>     <button type="submit">Submit Order</button>
>   </form>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Object syntax in `defineEmits` defines runtime payload validation functions.
> 2. **Concept**: Returning `false` from validator functions outputs Vue development console warnings.
> 3. **Concept**: Guarantees event payloads conform to expected data contracts.
> 4. **Concept**: Enhances type safety and debugging in complex applications.
> 
---

### Exercise 3: Real-Time Network Packet Filter Clear Event (Networking)

**Scenario:** A network filter bar component `<FilterBar>` has a "Clear Filters" button. Clicking it emits a simple parameterless `clear-all` event to the main packet table.

**Requirements:**
1. Declare `defineEmits(['clear-all'])`.
2. Emit event on button click.
3. Parent handles event resetting filter refs.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- FilterBar.vue (Child) -->
> <script setup>
> const emit = defineEmits(['clear-all'])
> </script>
> 
> <template>
>   <div class="filters">
>     <button @click="emit('clear-all')">Reset All Filters</button>
>   </div>
> </template>
> ```
> 
> ```vue
> <!-- PacketView.vue (Parent) -->
> <script setup>
> import { ref } from 'vue'
> import FilterBar from './FilterBar.vue'
> 
> const activeProtocol = ref('TCP')
> 
> function resetFilters() {
>   activeProtocol.value = 'ALL'
>   console.log('Filters reset to default.')
> }
> </script>
> 
> <template>
>   <div>
>     <FilterBar @clear-all="resetFilters" />
>     <p>Active Filter: {{ activeProtocol }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Parameterless emits signal notification triggers without payloads.
> 2. **Concept**: `@clear-all="resetFilters"` connects custom child triggers to parent handlers.
> 3. **Concept**: Keeps filter toolbar completely decoupled from packet data state.
> 4. **Concept**: Clean modular event composition.
> 
---

## 6. Related Terms

- [Props](props.md) — The downward half of Vue data flow (Props Down, Events Up).
- [`v-on`](../level_03/v_on.md) — Parent directive listening for emitted custom events.
- [Fallthrough Attributes (`$attrs`)](fallthrough_attributes.md) — Forwarding undeclared attributes.
- [`<script setup>` & Compiler Macros](script_setup.md) — `defineEmits` compiler macro.

---

## 7. Key Takeaways

- **Emitting Events** is how child components send messages and payload data *up* to parent components.
- Custom events must be declared using the `defineEmits(['event-name'])` compiler macro.
- Children trigger events via `emit('event-name', payload)`.
- Parents listen for custom events using standard `@event-name` directive syntax.
- Enforces strict Vue architecture: **Props Down, Events Up**. Never mutate props directly.
