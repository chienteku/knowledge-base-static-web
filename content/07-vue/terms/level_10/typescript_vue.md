# TypeScript with Vue

> **Level 10 — Ecosystem & Tooling**
> The integration of static type checking into Vue components using the `lang="ts"` attribute, enabling type safety for props, emits, reactive state, and composables at build time.

---

## 1. Prerequisites
- [Props](../level_04/props.md) — Declaring data variables passed to components.
- [Single-File Components (SFCs)](../level_04/sfc.md) — Single-File Components.
- [`<script setup>` & Compiler Macros](../level_04/script_setup.md) — Compiler directives.

---

## 2. Term Category
- **Ecosystem Tool**

---

## 3. Environment Context
- **Build-Time**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In large-scale codebases, JavaScript's dynamic nature is double-edged. It makes rapid prototyping easy, but as the app grows, it leads to bugs: passing a string instead of a number, spelling property names incorrectly, or trying to render fields off an object that is occasionally `null`. 

TypeScript introduces static typing to solve this by checking for these issues during compilation rather than in the user's browser.

In Vue 2, using TypeScript was notoriously difficult. It required using class-based syntax and decorators (`vue-class-component`), which clashed with Vue's natural mental model. 

Vue 3 was written from the ground up in TypeScript. Paired with `<script setup>`, Vue 3 treats TypeScript as a first-class citizen. You don't need complex classes; you write standard Composition API code and let Vue's compiler analyze the generic types of your props, emits, and refs.

### (2) How it works under the hood
To activate type checking in a Single-File Component, you add the `lang="ts"` attribute to the script tag: `<script setup lang="ts">`.

Once enabled, Vue's compiler supports **Type-Only Declarations** in compiler macros using generic type parameters (arguments passed inside angle brackets `< >`).

- **Props:** Instead of passing runtime configurations (like `defineProps({ title: String })`), you specify compile-time types:
  ```typescript
  defineProps<{ title: string; count?: number }>()
  ```
  Vue's compiler intercepts this type during build compilation and automatically generates the equivalent runtime props definition so the Vue engine can still validate inputs.
- **Emits:** You define exact type-safe callbacks:
  ```typescript
  const emit = defineEmits<{
    (e: 'update', value: string): void
    (e: 'close'): void
  }>()
  ```
- **Refs:** You enforce the type of reactive data structures using generics:
  ```typescript
  const list = ref<string[]>([]) // Can only contain strings
  ```

### (3) Code Examples

#### Short Snippet
```vue
<script setup lang="ts">
import { ref } from 'vue'

// 1. Typed Props
const props = defineProps<{
  label: string
  isActive?: boolean // Optional prop
}>()

// 2. Typed Emits
const emit = defineEmits<{
  (e: 'select', id: number): void
}>()

// 3. Typed Ref State
const counter = ref<number>(0)
</script>

<template>
  <button :disabled="!isActive" @click="emit('select', counter)">
    {{ label }}: {{ counter }}
  </button>
</template>
```

#### Fuller Example
In this product list component, we define a structured `Product` interface and use it to type-check props and state, ensuring that the IDE and compiler guard against typos.

```vue
<!-- ProductCard.vue -->
<script setup lang="ts">
// 1. Define the type interface
export interface Product {
  id: number
  name: string
  price: number
  inStock: boolean
}

// 2. Type-only prop declaration
defineProps<{
  item: Product
}>()

const emit = defineEmits<{
  (e: 'purchase', product: Product): void
}>()
</script>

<template>
  <div class="card" :class="{ 'out-of-stock': !item.inStock }">
    <h4>{{ item.name }}</h4>
    <p>Price: ${{ item.price.toFixed(2) }}</p>
    
    <button 
      :disabled="!item.inStock" 
      @click="emit('purchase', item)"
    >
      Buy Now
    </button>
  </div>
</template>
```

```vue
<!-- App.vue (Parent) -->
<script setup lang="ts">
import { ref } from 'vue'
import ProductCard, { type Product } from './ProductCard.vue'

// Strict type array state
const productList = ref<Product[]>([
  { id: 1, name: 'Svelte Book', price: 29.99, inStock: true },
  { id: 2, name: 'Vue 3 Course', price: 99.00, inStock: false }
])

function handlePurchase(product: Product) {
  console.log(`Bought item #${product.id}: ${product.name}`)
}
</script>

<template>
  <div>
    <!-- Compiler throws errors if product details properties don't match Product interface -->
    <ProductCard 
      v-for="prod in productList" 
      :key="prod.id" 
      :item="prod"
      @purchase="handlePurchase"
    />
  </div>
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Mixing runtime and type-only declarations in the same macro call

**The mistake:** Trying to pass both a JavaScript configuration object and a TypeScript generic type to `defineProps`.

**Why it's wrong:** Vue's compiler needs you to choose one strategy. If you pass a type argument, Vue compiles the props options block automatically. If you provide both, the compiler will throw an parsing error.

*Incorrect:*
```vue
<script setup lang="ts">
// Error: Cannot mix runtime declaration and type generics!
const props = defineProps<{ title: string }>({
  title: String
})
</script>
```

*Fix:* Choose one syntax. For TypeScript development, always use the type-only generic declaration.
```vue
<script setup lang="ts">
const props = defineProps<{ title: string }>() // Correct!
</script>
```

**Golden Rule:** When using `lang="ts"`, prefer type-only generic declarations for compiler macros (`defineProps<{...}>()`) and omit runtime parameter objects.

---

### Mistake 2: Using `any` Type Annotations for Vue Template Refs

**The mistake:** Declaring `const inputRef = ref<any>(null)`.

**Why it's wrong:** Using `any` disables TypeScript auto-completion and type checking on DOM elements. Use explicit DOM interfaces (`ref<HTMLInputElement | null>(null)`).

*Incorrect:*
```typescript
const inputRef = ref<any>(null); // ❌ Disables type checking on DOM node!
```

*Fix:*
```typescript
const inputRef = ref<HTMLInputElement | null>(null); // Strongly-typed HTMLInputElement ref
```

---

### Mistake 3: Forgetting `lang="ts"` on `<script setup>` Tags

**The mistake:** Writing TypeScript interfaces inside a `<script setup>` tag omitting `lang="ts"`.

**Why it's wrong:** Without `lang="ts"`, the Vue compiler parses the script block as plain JavaScript, throwing syntax errors on TypeScript type annotations.

*Incorrect:*
```vue
<script setup>
interface User { id: number; } // ❌ Syntax error in plain JS script tag!
</script>
```

*Fix:*
```vue
<script setup lang="ts">
interface User { id: number; } // Enabled TypeScript support
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Typing state and ref inputs

**Problem:** Complete the script block of the search box component to typed-check the list ref so it only accepts `string` values, and the input ref so it only references an HTML input element (`HTMLInputElement`) or `null`.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// 1. Enforce string array types
const searchHistory = ref<string[]>([])

// 2. Enforce template DOM element types
const searchInputRef = ref<HTMLInputElement | null>(null)

function addSearch() {
  if (searchInputRef.value) {
    searchHistory.value.push(searchInputRef.value.value)
    searchInputRef.value.value = ''
  }
}
</script>

<template>
  <div>
    <input ref="searchInputRef" type="text" />
    <button @click="addSearch">Add</button>
  </div>
</template>
```

**Expected output:**
> [!check]- Answer
> ```text
> The refs are declared with exact generic type constraints: `ref<string[]>` and `ref<HTMLInputElement | null>`.
> ```
> - Add `<string[]>` to the history ref call.
> - Add `<HTMLInputElement | null>` to the DOM template ref call.

---

### Exercise 2: TypeScript Component Event Typing Pattern

**Problem:** Write Vue 3 `<script setup lang="ts">` `defineEmits` declaration for typed events: `'change'` (id: number) and `'update'` (text: string).

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup lang="ts"> const emit = defineEmits<{ (e: 'change', id: number): void; (e: 'update', text: string): void; }>(); </script>
> ```
> - Call signature syntax in `defineEmits<T>()` provides strong event payload typing.
> 
> ```vue
> <script setup lang="ts">
> const emit = defineEmits<{
>   (e: 'change', id: number): void;
>   (e: 'update', text: string): void;
> }>();
> </script>
> ```

---

### Exercise 3: vue-tsc Type Checking Command

**Problem:** Which CLI tool performs command-line TypeScript type checking across `.vue` Single File Components during CI/CD builds?

**Expected output:**
> [!check]- Answer
> ```text
> vue-tsc (Vue TypeScript Compiler)
> ```
> - `vue-tsc --noEmit` validates TypeScript types across all `.vue` templates.
> 
> ```bash
> npx vue-tsc --noEmit
> ```


---

## 7. Related Terms
- [Props](../level_04/props.md) — Component inputs.
- [`<script setup>` & Compiler Macros](../level_04/script_setup.md) — The sugar compilation syntax.
- [Composables](../level_05/composables.md) — Type-safe reusable business functions.
- [Single-File Components (SFCs)](../level_04/sfc.md) — Single File Components with TypeScript.

---

## 8. Key Takeaways
- Adding **`lang="ts"`** to the `<script setup>` block triggers compile-time TypeScript checks.
- Pair compiler macros (`defineProps`, `defineEmits`) with generic type parameters to enforce type safety without writing runtime type checks.
- Explicitly declare reactive ref structures using generic definitions (`ref<T>()`).
- Type definitions generate compile errors in IDEs and CLI builds during development, trapping bugs before code deploys.
- Never mix JavaScript option configuration parameters and generic type parameters within a compiler macro.
