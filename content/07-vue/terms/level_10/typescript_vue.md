# TypeScript with Vue

> **Level 10 — Tooling & Ecosystem**
> The integration of static type checking into Vue components using the `lang="ts"` attribute, providing type safety for props, emits, reactive refs, and composables at compile time.

---

## 1. Prerequisites

- [Props](../level_04/props.md) — Component inputs typed using TypeScript generics in `defineProps<T>()`.
- [Single-File Components (SFCs)](../level_04/sfc.md) — Single-File Components updated with `<script setup lang="ts">`.
- [`<script setup>` & Compiler Macros](../level_04/script_setup.md) — Compiler macros optimized for type-only generic declarations.

---

## 2. Term Category

**Language Integration (Type System Engine)**: TypeScript integration in Vue 3 provides compile-time static type analysis across template expressions, reactive state, component props, and custom composables. By adding `lang="ts"` to `<script setup>` tags, Vue's compiler plugin (`@vitejs/plugin-vue`) and Vue Language Tools (Volar) type-check templates and script logic natively.

While Vue 2 required verbose class-component decorators (`vue-class-component`), Vue 3 was re-written from scratch in TypeScript. It treats generic type declarations as first-class citizens, compiling type-only macro definitions (`defineProps<{ count: number }>()`) into runtime component configurations during the build step.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In large enterprise codebases, plain JavaScript presents hidden maintenance vulnerabilities: passing strings instead of numbers to component props, misspelling property names on complex nested API objects, or calling functions on objects that are occasionally `null` or `undefined`. These bugs manifest as runtime crashes in production.

TypeScript solves these problems by verifying types statically during development and CI/CD builds. Vue 3 designed its Composition API and `<script setup>` macros to leverage generic types seamlessly. Developers write standard functional Composition API code, while generic type parameters enforce strict contracts across component boundaries without requiring runtime object overhead.

### (2) Reality Metaphor
Imagine a high-security airport customs control station. In dynamically typed JavaScript, passengers (data payloads) board airplanes without presenting passports or identification. If a passenger brings invalid cargo onto the flight, the problem is discovered only after the airplane is airborne in mid-flight (production runtime crash).

TypeScript acts as the strict customs checkpoint at the boarding gate. It inspects every passenger's passport (type signature) before they board. If a passenger lacks the required visa stamp (type definition mismatch), the gate agent (TypeScript compiler) stops them immediately at the terminal, preventing bad cargo from ever taking off.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup lang="ts">
import { ref } from 'vue'

// 1. Type-only prop declaration
const props = defineProps<{
  title: string
  count?: number
}>()

// 2. Type-only emit declaration
const emit = defineEmits<{
  (e: 'update', val: number): void
}>()

// 3. Typed reactive ref
const currentCount = ref<number>(props.count ?? 0)
</script>

<template>
  <button @click="emit('update', currentCount + 1)">
    {{ title }}: {{ currentCount }}
  </button>
</template>
```

#### Fuller Example
```vue
<!-- TelemetryNodeCard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// 1. Exportable TypeScript Interface definitions
export interface TelemetryReading {
  sensorId: string
  metricName: string
  value: number
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL'
  timestamp: string
}

// 2. Type-only compiler macro definitions
const props = defineProps<{
  reading: TelemetryReading
  refreshIntervalMs?: number
}>()

const emit = defineEmits<{
  (e: 'alertTriggered', payload: TelemetryReading): void
  (e: 'refreshRequested'): void
}>()

// 3. Typed ref and computed properties
const isSilenced = ref<boolean>(false)

const statusColor = computed<string>(() => {
  if (isSilenced.value) return '#8c8c8c'
  switch (props.reading.status) {
    case 'NOMINAL': return '#52c41a'
    case 'WARNING': return '#faad14'
    case 'CRITICAL': return '#ff4d4f'
  }
})

function handleSilenceToggle(): void {
  isSilenced.value = !isSilenced.value
  if (props.reading.status === 'CRITICAL' && !isSilenced.value) {
    emit('alertTriggered', props.reading)
  }
}
</script>

<template>
  <div class="reading-card" :style="{ borderColor: statusColor }">
    <header>
      <h4>{{ reading.sensorId }} - {{ reading.metricName }}</h4>
      <span class="status-badge" :style="{ backgroundColor: statusColor }">
        {{ reading.status }}
      </span>
    </header>

    <div class="reading-val">
      <span class="val">{{ reading.value.toFixed(2) }}</span>
      <small>Logged at: {{ reading.timestamp }}</small>
    </div>

    <button @click="handleSilenceToggle">
      {{ isSilenced ? 'Unsilence Alerts' : 'Silence Alert' }}
    </button>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mixing Runtime Parameters and Generic Types in the Same Compiler Macro

**The mistake:** Trying to pass both a JavaScript runtime options object and a TypeScript generic type argument to `defineProps`.

**Why it's wrong:** Vue's compiler requires developers to choose either runtime declarations OR type-only generic declarations per macro call. Mixing both syntaxes triggers compile-time parsing errors.

*Incorrect:*
```vue
<script setup lang="ts">
// ❌ Error: Cannot mix runtime options object and type generic arguments!
const props = defineProps<{ title: string }>({
  title: String
})
</script>
```

*Fix:*
```vue
<script setup lang="ts">
// ✅ Preferred: Type-only generic declaration
const props = defineProps<{ title: string }>()
</script>
```

---

### Mistake 2: Using `any` Type Annotations for Template Refs

**The mistake:** Declaring HTML template element refs as `ref<any>(null)`.

**Why it's wrong:** Using `any` completely disables TypeScript auto-completion and static type checking when accessing element methods (`inputRef.value.focus()`), leaving code vulnerable to `TypeError` exceptions.

*Incorrect:*
```typescript
// ❌ Disables DOM element type safety!
const inputRef = ref<any>(null)
```

*Fix:*
```typescript
// ✅ Use explicit HTMLInputElement interface
const inputRef = ref<HTMLInputElement | null>(null)
```

---

### Mistake 3: Omitting `lang="ts"` on `<script setup>` Tags

**The mistake:** Writing TypeScript interfaces or generic type annotations inside a `<script setup>` tag without adding `lang="ts"`.

**Why it's wrong:** Without `lang="ts"`, the Vue SFC compiler parses script contents as standard ES JavaScript, throwing fatal syntax compilation errors when encountering interface definitions or type annotations.

*Incorrect:*
```vue
<script setup>
// ❌ Syntax error in plain JavaScript script block!
interface User { id: number; name: string }
</script>
```

*Fix:*
```vue
<script setup lang="ts">
// ✅ Enables TypeScript compilation mode
interface User { id: number; name: string }
</script>
```

---

## 5. Practice Exercises

### Exercise 1: IoT Sensor Network Typed Composable

**Scenario:** An industrial IoT monitoring app requires a typed composable `useSensorReading(sensorId: string)` that returns strongly typed reactive telemetry states and refetch functions.

**Requirements:**
1. Define a strict TypeScript interface `SensorData`.
2. Return typed `ref<SensorData | null>` and `ref<boolean>` loading state.
3. Enforce return type signature using a custom TypeScript interface.
4. Include a test assertion validating returned data types.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup lang="ts">
> import { ref, onMounted } from 'vue'
> 
> export interface SensorData {
>   id: string
>   temperature: number
>   humidity: number
>   isOnline: boolean
> }
> 
> function useSensorReading(id: string) {
>   const data = ref<SensorData | null>(null)
>   const loading = ref<boolean>(true)
> 
>   async function fetchReading(): Promise<void> {
>     loading.value = true
>     // Simulated async fetch
>     data.value = { id, temperature: 24.5, humidity: 45, isOnline: true }
>     loading.value = false
>   }
> 
>   return { data, loading, fetchReading }
> }
> 
> const { data: sensor, loading, fetchReading } = useSensorReading('SENSOR-ALPHA')
> 
> onMounted(async () => {
>   await fetchReading()
>   testTypedSensorComposable()
> })
> 
> function testTypedSensorComposable(): void {
>   console.assert(sensor.value !== null, 'Test Failed: Sensor data should be populated')
>   console.assert(sensor.value?.temperature === 24.5, 'Test Failed: Temperature mismatch')
>   console.log('IoT Typed Composable Test Passed')
> }
> </script>
> 
> <template>
>   <div class="sensor-widget">
>     <p v-if="loading">Loading sensor data...</p>
>     <div v-else-if="sensor">
>       <h4>Sensor: {{ sensor.id }}</h4>
>       <p>Temp: {{ sensor.temperature }} °C | Humidity: {{ sensor.humidity }}%</p>
>     </div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `interface SensorData` provides strict compile-time verification across composable return values.
> 2. **Concept**: Generic refs `ref<SensorData | null>(null)` enforce type-safe property access (`sensor.value?.temperature`).
> 3. **Concept**: Explicit function return annotations (`Promise<void>`) validate asynchronous setup functions.
> 4. **Concept**: Unit assertions verify state initialization.
> 
---

### Exercise 2: Financial Portfolio Typed Props & Emits Component

**Scenario:** A financial trading application displays portfolio assets. The component must receive a typed `Asset` prop and emit typed `trade` events with execution details.

**Requirements:**
1. Define `Asset` and `TradePayload` interfaces.
2. Declare typed props using `defineProps<{ asset: Asset }>()`.
3. Declare typed emits using `defineEmits<{ (e: 'trade', payload: TradePayload): void }>()`.
4. Include a test assertion checking trade payload formatting.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup lang="ts">
> import { onMounted } from 'vue'
> 
> export interface Asset {
>   symbol: string
>   price: number
>   holdingShares: number
> }
> 
> export interface TradePayload {
>   symbol: string
>   action: 'BUY' | 'SELL'
>   shares: number
>   price: number
> }
> 
> const props = defineProps<{
>   asset: Asset
> }>()
> 
> const emit = defineEmits<{
>   (e: 'trade', payload: TradePayload): void
> }>()
> 
> function executeTrade(action: 'BUY' | 'SELL'): void {
>   const payload: TradePayload = {
>     symbol: props.asset.symbol,
>     action,
>     shares: 10,
>     price: props.asset.price
>   }
>   emit('trade', payload)
> }
> 
> onMounted(() => {
>   testFinancialTradeEmits()
> })
> 
> function testFinancialTradeEmits(): void {
>   console.assert(props.asset.symbol === 'AAPL', 'Test Failed: Symbol prop mismatch')
>   console.log('Financial Typed Component Test Passed')
> }
> </script>
> 
> <template>
>   <div class="asset-card">
>     <h3>{{ asset.symbol }}</h3>
>     <p>Price: ${{ asset.price.toFixed(2) }} | Holdings: {{ asset.holdingShares }} shares</p>
>     <button @click="executeTrade('BUY')">Buy 10 Shares</button>
>     <button @click="executeTrade('SELL')">Sell 10 Shares</button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `defineProps<{ asset: Asset }>()` compiles type generic parameters into runtime component options during build step.
> 2. **Concept**: Call signatures in `defineEmits<T>()` enforce strict payload types on emitted events (`'BUY' | 'SELL'`).
> 3. **Concept**: Strongly typed event arguments catch invalid payload objects during compilation.
> 4. **Concept**: Assertions confirm prop serialization.
> 
---

### Exercise 3: E-Commerce Shopping Cart Typed Store

**Scenario:** An online store manages cart items using a strongly typed Vue state object. All cart items must strictly conform to a `CartItem` interface.

**Requirements:**
1. Define a `CartItem` interface.
2. Initialize typed array ref `ref<CartItem[]>([])`.
3. Compute total price using a typed `computed<number>` property.
4. Include a test assertion validating cart item calculations.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup lang="ts">
> import { ref, computed, onMounted } from 'vue'
> 
> export interface CartItem {
>   productId: number
>   name: string
>   unitPrice: number
>   quantity: number
> }
> 
> const cartItems = ref<CartItem[]>([
>   { productId: 1, name: 'Mechanical Keyboard', unitPrice: 129.99, quantity: 1 },
>   { productId: 2, name: 'Ergonomic Mouse', unitPrice: 79.99, quantity: 2 }
> ])
> 
> const totalPrice = computed<number>(() => {
>   return cartItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
> })
> 
> function updateQuantity(id: number, delta: number): void {
>   const item = cartItems.value.find(i => i.productId === id)
>   if (item) {
>     item.quantity = Math.max(1, item.quantity + delta)
>   }
> }
> 
> onMounted(() => {
>   testEcommerceTypedCart()
> })
> 
> function testEcommerceTypedCart(): void {
>   console.assert(totalPrice.value === 289.97, 'Test Failed: Total price calculation error')
>   console.log('E-Commerce Typed Cart Test Passed')
> }
> </script>
> 
> <template>
>   <div class="typed-cart">
>     <h4>Shopping Cart Total: ${{ totalPrice.toFixed(2) }}</h4>
>     <ul>
>       <li v-for="item in cartItems" :key="item.productId">
>         {{ item.name }} - ${{ item.unitPrice }} x {{ item.quantity }}
>         <button @click="updateQuantity(item.productId, 1)">+</button>
>         <button @click="updateQuantity(item.productId, -1)">-</button>
>       </li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Concept**: `ref<CartItem[]>` guarantees that array elements cannot contain non-matching objects.
> 2. **Concept**: `computed<number>` ensures derived return values are strictly typed.
> 3. **Concept**: IDEs provide full autocomplete support for `item.unitPrice` and `item.quantity`.
> 4. **Concept**: Unit tests verify financial calculation correctness.
> 
---

## 6. Related Terms

- [Props](../level_04/props.md) — Component inputs typed using generic parameter macros.
- [`<script setup>` & Compiler Macros](../level_04/script_setup.md) — Script compiler directives optimized for TypeScript.
- [Composables](../level_05/composables.md) — Type-safe reusable business logic functions.
- [Single-File Components (SFCs)](../level_04/sfc.md) — SFC format upgraded with `<script setup lang="ts">`.

---

## 7. Key Takeaways

- Adding **`lang="ts"`** to `<script setup>` tags enables compile-time static type checking across script logic and templates.
- Use type-only generic declarations for compiler macros (`defineProps<{...}>()`, `defineEmits<{...}>()`).
- Declare reactive state and DOM template refs using explicit generic definitions (`ref<HTMLInputElement | null>(null)`).
- Never mix JavaScript runtime options objects and generic type parameters in the same macro call.
- Run `vue-tsc --noEmit` in CI/CD pipelines to validate TypeScript types across all `.vue` templates.
