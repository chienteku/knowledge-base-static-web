# Props

> **Level 4 — Components & Lifecycle**
> Custom attributes registered on a component that allow parent components to pass data downward to child components, enforcing strict One-Way Data Flow.

---

## 1. Prerequisites

- [Components](components.md) — The building blocks passing data between each other.
- [`v-bind`](../level_03/v_bind.md) — The directive used to pass dynamic variables or non-string primitives as props.

---

## 2. Term Category

**Downward Data Interface (One-Way Data Flow Contract)**: Props (short for Properties) are the primary mechanism for top-down component communication in Vue. Declared inside child components via the `defineProps()` compiler macro, props define the explicit typed data contract a child expects to receive from its parent. Operating as read-only proxy objects during Virtual DOM rendering and patching, props enforce Vue's core architectural principle: **One-Way Data Flow (Props Down, Events Up)**.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

If you create a reusable UI component like `<UserProfileCard>`, it is useless if it always displays hardcoded data for `"Alice"`. You need to be able to configure the component dynamically depending on where and how it is used.

**Props** allow parent components to pass input arguments down into child components, exactly like passing parameters into a JavaScript function.

However, software applications require predictability. If child components could freely mutate data passed down from parent components, tracking down bugs in large applications would be impossible. A mutation made deep inside child #5 would unexpectedly corrupt parent state and break child #2. To eliminate this category of bugs, Vue enforces that **Props are strictly Read-Only**. The parent owns the state, and the child merely borrows it for rendering.

### (2) Reality Metaphor

Imagine a rental car agency lending a vehicle to a customer.

The rental car agreement specifies the car model, fuel level, and mileage limit (**Props** passed down from parent to child). The customer is granted full permission to drive the car and look through the windshield (render the UI using prop values).

However, the customer is strictly forbidden from taking a sledgehammer to the engine block or re-painting the chassis blue (**Mutating Props directly**). If the customer wants a blue car, they must return to the rental counter and submit a formal request form (**Emit an Event**) asking the agency manager (Parent Component) to assign them a blue car from the fleet inventory.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- UserBadge.vue (Child Component receiving props) -->
<script setup>
// Declare expected props using defineProps compiler macro
const props = defineProps({
  username: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'Member'
  }
})
</script>

<template>
  <div class="user-badge">
    <h4>{{ username }}</h4>
    <span class="role">{{ role }}</span>
  </div>
</template>
```

#### Fuller Example
```vue
<!-- App.vue (Parent Component passing props) -->
<script setup>
import { ref } from 'vue'
import ProductCard from './ProductCard.vue'

const catalog = ref([
  { id: 101, title: 'Wireless Mouse', price: 49.99, inStock: true },
  { id: 102, title: 'Mechanical Keyboard', price: 129.50, inStock: false }
])
</script>

<template>
  <div class="catalog-grid">
    <h2>Store Catalog</h2>
    
    <div class="grid">
      <!-- 
        Passing props:
        - title: static string prop
        - :price: v-bind shorthand for JS Number primitive
        - :is-available: v-bind shorthand for boolean primitive
      -->
      <ProductCard 
        v-for="item in catalog" 
        :key="item.id" 
        :title="item.title" 
        :price="item.price" 
        :is-available="item.inStock" 
      />
    </div>
  </div>
</template>
```

```vue
<!-- ProductCard.vue (Child Component receiving typed props) -->
<script setup>
// Object-syntax defineProps with runtime type validation and defaults
defineProps({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div class="product-card">
    <h3>{{ title }}</h3>
    <p class="price">${{ price.toFixed(2) }}</p>
    <span :class="['stock-tag', isAvailable ? 'in-stock' : 'out-stock']">
      {{ isAvailable ? 'In Stock' : 'Out of Stock' }}
    </span>
  </div>
</template>

<style scoped>
.product-card { padding: 16px; border: 1px solid #ccc; border-radius: 8px; }
.in-stock { color: #52c41a; }
.out-stock { color: #ff4d4f; }
</style>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating a prop directly inside a child component

**The mistake:** A child component writing `function increment() { props.count++; }`.

**Why it's wrong:** **Props are strictly Read-Only!** Data flows strictly "One-Way" (Top-Down). The parent owns the data. If the child attempts to mutate a prop directly, Vue throws a glaring console warning: `Set operation on key "count" failed: target is readonly`.

*Incorrect:*
```javascript
const props = defineProps(['count']);
function increment() {
  props.count++; // ❌ Readonly prop mutation error!
}
```

*Fix:* Emit an event requesting the parent to mutate its own state.
```javascript
const emit = defineEmits(['update:count']);
function increment() {
  emit('update:count', props.count + 1); // Emit event to parent
}
```

---

### Mistake 2: Passing numeric or boolean primitives without `v-bind` (`:`)

**The mistake:** Writing `<ProductCard price="50" is-active="true" />`.

**Why it's wrong:** Without `v-bind` (`:`), Vue treats attributes as static literal STRINGS (`"50"` and `"true"`). A child component expecting a JS `Number` receives string `"50"`, leading to runtime type errors when performing arithmetic operations (`price * 1.1` becomes `"501.1"`).

*Incorrect:*
```vue
<ProductCard price="50" is-active="true" /> <!-- ❌ Passes string '50' and string 'true'! -->
```

*Fix:*
```vue
<ProductCard :price="50" :is-active="true" /> <!-- Passes JS number 50 and boolean true -->
```

---

### Mistake 3: Providing direct object/array literals as prop default values

**The mistake:** Declaring `items: { type: Array, default: [] }` inside `defineProps`.

**Why it's wrong:** In JavaScript, objects and arrays are passed by reference. Providing a direct array literal default `[]` causes all component instances that rely on the default value to share the exact same physical array reference in memory!

*Incorrect:*
```javascript
defineProps({
  items: { type: Array, default: [] } // ❌ Shared array reference across all instances!
})
```

*Fix:* Use a factory function returning a fresh array instance.
```javascript
defineProps({
  items: { type: Array, default: () => [] } // Factory function returns fresh array
})
```

---

## 5. Practice Exercises

### Exercise 1: Industrial IoT Telemetry Threshold Configuration Props (IoT)

**Scenario:** An industrial motor monitor has a child component `<MotorStatusCard>`. You must construct `defineProps()` with runtime validations requiring string `motorId`, numeric `rpm` (default 0), and boolean `overheatAlert`.

**Requirements:**
1. Declare `defineProps` object with type validation.
2. Require `motorId` string.
3. Default `rpm` number to `0`.
4. Render status indicators in template.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- MotorStatusCard.vue -->
> <script setup>
> defineProps({
>   motorId: {
>     type: String,
>     required: true
>   },
>   rpm: {
>     type: Number,
>     default: 0
>   },
>   overheatAlert: {
>     type: Boolean,
>     default: false
>   }
> })
> </script>
> 
> <template>
>   <div :class="['motor-card', { warning: overheatAlert }]">
>     <h4>Motor #{{ motorId }}</h4>
>     <p>Speed: {{ rpm }} RPM</p>
>     <span v-if="overheatAlert" class="alert-tag">OVERHEAT DANGER</span>
>   </div>
> </template>
> 
> <style scoped>
> .motor-card { padding: 12px; border: 1px solid #ccc; }
> .warning { border-color: #ff4d4f; background: #fff1f0; }
> .alert-tag { color: #ff4d4f; font-weight: bold; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `defineProps` declares typed prop input contracts.
> 2. **Concept**: `required: true` ensures parent components supply mandatory keys.
> 3. **Concept**: `default` supplies fallback values when parent omits optional props.
> 4. **Concept**: Object syntax prevents runtime primitive type mismatch bugs.
> 
---

### Exercise 2: Financial Order Summary Props with TypeScript Generics (Finance)

**Scenario:** A stock trading application utilizes TypeScript `<script setup lang="ts">` with `defineProps<Props>()` and `withDefaults()` to typecheck order summary props.

**Requirements:**
1. Define TS interface `OrderProps` (symbol string, qty number, limitPrice optional number, side 'BUY' | 'SELL').
2. Use `withDefaults(defineProps<OrderProps>(), { ... })` to set default `limitPrice: 0`.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- OrderSummary.vue -->
> <script setup lang="ts">
> interface OrderProps {
>   symbol: string
>   qty: number
>   side: 'BUY' | 'SELL'
>   limitPrice?: number
> }
> 
> // TypeScript type-only defineProps paired with withDefaults macro
> const props = withDefaults(defineProps<OrderProps>(), {
>   limitPrice: 0.00
> })
> </script>
> 
> <template>
>   <div class="summary-box">
>     <h3>Order Confirmation</h3>
>     <p>{{ props.side }} {{ props.qty }} shares of {{ props.symbol }}</p>
>     <p>Target Price: ${{ props.limitPrice.toFixed(2) }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Generic `defineProps<OrderProps>()` provides compile-time TypeScript validation.
> 2. **Concept**: `withDefaults()` supplies default prop values when using TS interface generics.
> 3. **Concept**: Unions (`'BUY' | 'SELL'`) restrict allowed string literals at build time.
> 4. **Concept**: Premier pattern for enterprise Vue TypeScript applications.
> 
---

### Exercise 3: E-Commerce Product Image List Prop with Factory Default (E-commerce)

**Scenario:** An e-commerce gallery component `<ProductGallery>` receives an array of image URL strings. You must configure default array props using a factory function to prevent shared array reference bugs across component instances.

**Requirements:**
1. Define prop `images` of type `Array`.
2. Supply default factory function `default: () => ['/images/placeholder.png']`.
3. Loop through images in template.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- ProductGallery.vue -->
> <script setup>
> defineProps({
>   images: {
>     type: Array,
>     default: () => ['/images/placeholder.png']
>   }
> })
> </script>
> 
> <template>
>   <div class="gallery-strip">
>     <img v-for="(url, i) in images" :key="i" :src="url" alt="Product Image" />
>   </div>
> </template>
> 
> <style scoped>
> .gallery-strip { display: flex; gap: 8px; }
> .gallery-strip img { width: 80px; height: 80px; object-fit: cover; }
> </style>
> ```
>
> #### Technical Explanation
> 1. **Concept**: Array and Object prop defaults MUST be returned from factory functions (`() => []`).
> 2. **Concept**: Factory functions ensure every component instance receives a unique array reference in memory.
> 3. **Concept**: Prevents cross-instance state pollution bugs.
> 4. **Concept**: Guarantees robust component reusability.
> 
---

## 6. Related Terms

- [Emitting Events (`defineEmits`)](emit.md) — Upward communication (Props Down, Events Up).
- [`v-bind`](../level_03/v_bind.md) — Directive for passing dynamic prop primitives.
- [Fallthrough Attributes (`$attrs`)](fallthrough_attributes.md) — Undeclared attributes forwarding.
- [Components](components.md) — Component architecture foundation.
- [`<script setup>` & Compiler Macros](script_setup.md) — `defineProps` macro.
- [Provide / Inject](../level_05/provide_inject.md) — Bypassing prop drilling for deep trees.

---

## 7. Key Takeaways

- **Props** are custom attributes used to pass data downward from parent to child components.
- Child components explicitly declare expected props using the `defineProps()` compiler macro.
- Always use `v-bind` (`:`) when passing non-string primitives (Numbers, Booleans, Objects, Arrays).
- **Props are Read-Only.** Child components must NEVER mutate a prop directly.
- Array and Object default values MUST be returned from a factory function (`default: () => []`).
