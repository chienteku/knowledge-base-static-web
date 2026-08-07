# Template Syntax

> **Level 1 — Core Concepts & Reactivity**
> Vue's HTML-based template syntax that declaratively binds the rendered DOM to underlying component state using intuitive directives and mustache interpolations.

---

## 1. Prerequisites

- [HTML (HyperText Markup Language)](../../../01-html/terms/level_01/html.md) — Vue templates are 100% valid HTML extended with dynamic directives.

---

## 2. Term Category

**Vue Template Compiler / View Syntax (HTML Extension Spec)**: Vue Template Syntax is the declarative XML/HTML dialect used inside Single-File Components (`.vue`). Unlike React which mandates JSX (JavaScript syntax extensions), Vue templates are valid HTML markup enriched with special directives (`v-bind`, `v-on`, `v-model`, `v-if`, `v-for`) and mustache text interpolations (`{{ }}`).

At build time (via Vite / `@vue/compiler-sfc`), templates are compiled into highly optimized JavaScript Virtual DOM render functions. The compiler performs static analysis, hoisting invariant static DOM nodes and creating block trees that allow Vue's runtime to skip static elements entirely during re-render diffing across client and server environments.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In React, components are written in JSX. While JSX provides full JavaScript programmatic flexibility, it breaks the classic web development separation of concerns (HTML markup, CSS styling, and JavaScript logic). Designers and legacy web developers often find JSX code difficult to read due to inline function mappings, ternary operator trees, and HTML attribute renaming (`className`, `htmlFor`).

Vue chose a different path: **HTML-First Design**. Any standard HTML snippet copied from a web browser is valid Vue template code. Vue then extends this base HTML with readable syntax elements:
1. **Mustache Text Interpolation (`{{ }}`)**: Injects dynamic values directly into element text content.
2. **Directives (`v-*`)**: Special attributes prefixed with `v-` that apply reactive behaviors, conditional rendering, list rendering, and attribute bindings to target HTML elements.

This design retains the traditional web development mental model while compiling down to faster Virtual DOM render trees than uncompiled JSX runtime calls.

### (2) Reality Metaphor
Think of a standard printed form (HTML) versus a Smart Dynamic PDF Form (Vue Template).

A standard printed form has static text labels and fixed fill-in boxes. Once printed, nothing can change automatically. If the tax rate changes, you must throw away the paper and print a completely new form.

A Vue Template is a Smart Dynamic PDF Form. The structural lines, borders, and base text stay intact (HTML structural layout), but specific text fields are linked to live data feeds (`{{ totalAmount }}`), and certain sections appear or disappear dynamically based on checkboxes (`v-if="requiresShipping"`). You preserve familiar form layouts while automating content updates.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { ref } from 'vue'

const title = ref('Dashboard')
const isOnline = ref(true)
</script>

<template>
  <!-- Text interpolation & attribute directive binding -->
  <h1 :class="{ active: isOnline }">{{ title.toUpperCase() }}</h1>
  <p>Status: {{ isOnline ? 'Connected' : 'Offline' }}</p>
</template>
```

#### Fuller Example
```vue
<script setup>
import { ref, computed } from 'vue'

const newTodoText = ref('')
const todos = ref([
  { id: 1, text: 'Review Vue 3 Template Compiler Docs', completed: true },
  { id: 2, text: 'Refactor Legacy Options API Components', completed: false }
])

const activeCount = computed(() => todos.value.filter(t => !t.completed).length)

function addTodo() {
  if (!newTodoText.value.trim()) return
  todos.value.push({
    id: Date.now(),
    text: newTodoText.value.trim(),
    completed: false
  })
  newTodoText.value = ''
}

function toggleTodo(todo) {
  todo.completed = !todo.completed
}
</script>

<template>
  <div class="todo-app">
    <header>
      <h2>Task Manager ({{ activeCount }} Pending)</h2>
      <form @submit.prevent="addTodo">
        <input v-model="newTodoText" placeholder="Enter task title..." />
        <button type="submit">Add Task</button>
      </form>
    </header>

    <main>
      <ul>
        <li 
          v-for="todo in todos" 
          :key="todo.id" 
          :class="{ done: todo.completed }"
          @click="toggleTodo(todo)"
        >
          <span>{{ todo.text }}</span>
          <span v-if="todo.completed"> ✓</span>
        </li>
      </ul>
    </main>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Placing Heavy Business Logic or Chained Operations in Template Mustaches

**The mistake:** Writing complex, multi-line JavaScript algorithms directly inside template curly braces (e.g. `{{ items.filter(x => x.active).map(x => x.price * 1.2).reduce((a, b) => a + b, 0) }}`).

**Why it's wrong:** Templates should represent simple declarative views. Heavy inline expressions bloat templates, hinder readability, make code impossible to unit test, and re-execute unnecessarily on component updates.

*Incorrect:*
```vue
<p>{{ users.filter(u => u.age >= 18).map(u => u.name).sort().join(', ') }}</p> <!-- ❌ Heavy inline logic! -->
```

*Fix:*
```vue
<p>{{ sortedAdultUserNames }}</p> <!-- Keep template clean -->

<script setup>
const sortedAdultUserNames = computed(() => {
  return users.value
    .filter(u => u.age >= 18)
    .map(u => u.name)
    .sort()
    .join(', ')
})
</script>
```

---

### Mistake 2: Rendering Unsanitized HTML via `v-html` (Cross-Site Scripting XSS Risk)

**The mistake:** Binding untrusted user-generated content strings directly using `v-html="userComment"`.

**Why it's wrong:** `v-html` evaluates raw HTML string content, allowing malicious actors to inject `<script>` tags or malicious event attributes (`onload`, `onerror`) to execute Cross-Site Scripting (XSS) attacks.

*Incorrect:*
```vue
<div v-html="userComment"></div> <!-- ❌ Vulnerable to XSS attack injection! -->
```

*Fix:*
```vue
<div>{{ userComment }}</div> <!-- Text interpolation safely escapes raw HTML markup -->
```

---

### Mistake 3: Attempting JS Statements or Control Flow Inside Mustaches

**The mistake:** Placing JavaScript statements (like `if/else`, `let x = 1`, `return`, or `for` loops) inside mustache interpolations (`{{ if (ok) { return message } }}`).

**Why it's wrong:** Mustache interpolations support ONLY single JavaScript expressions (values that resolve to a single returned result, like ternaries or method calls). Statements cause template compilation errors.

*Incorrect:*
```vue
<p>{{ if (isLoggedIn) { 'Welcome' } }}</p> <!-- ❌ JS control flow statement in mustache! -->
```

*Fix:*
```vue
<p>{{ isLoggedIn ? 'Welcome' : 'Please Sign In' }}</p> <!-- Single ternary expression -->
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Product Catalog Directive Visualizer

**Scenario:** An e-commerce grid renders product listings with dynamic discount tags and availability alerts using standard template syntax.
**Requirements:**
1. Track `products` array with `{ id, name, price, isDiscounted }`.
2. Render catalog with `v-for` and `:key`.
3. Display price formatting using template expressions.
4. Verify key binding and rendering in test assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const products = ref([
>   { id: 101, name: '4K Gaming Monitor', price: 450, isDiscounted: true },
>   { id: 102, name: 'USB-C Docking Station', price: 120, isDiscounted: false }
> ])
> 
> const discountedCount = computed(() => products.value.filter(p => p.isDiscounted).length)
> 
> // Test assertion
> console.assert(discountedCount.value === 1, `Expected 1 discounted product, got ${discountedCount.value}`)
> </script>
> 
> <template>
>   <div class="catalog">
>     <h2>Catalog Items (On Sale: {{ discountedCount }})</h2>
>     <ul>
>       <li v-for="product in products" :key="product.id">
>         <h3>{{ product.name }}</h3>
>         <p>Price: ${{ product.price.toFixed(2) }}</p>
>         <span v-if="product.isDiscounted" class="badge">ON SALE</span>
>       </li>
>     </ul>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **`v-for` list rendering**: `v-for="product in products"` iterates over reactive collections efficiently.
> 2. **Key attribute binding**: `:key="product.id"` provides unique identifiers for Virtual DOM element tracking.
> 3. **Conditional directives**: `v-if="product.isDiscounted"` conditionally attaches sale badge elements.
> 4. **Text interpolation expressions**: `product.price.toFixed(2)` evaluates safe single expressions in mustaches.
> 
---

### Exercise 2: Industrial Healthcare Telemetry Alert Directive Engine

**Scenario:** Medical telemetry displays patient vitals with dynamic status tags bound via template syntax.
**Requirements:**
1. Track `heartRate` and `spo2` (blood oxygen) refs.
2. Render alert status with `v-if` / `v-else-if`.
3. Bind dynamic warning styles with `:style`.
4. Validate alert threshold condition via test.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const heartRate = ref(85)
> const spo2 = ref(98) // Oxygen percentage
> 
> const isCritical = computed(() => heartRate.value > 120 || spo2.value < 90)
> 
> const statusColor = computed(() => (isCritical.value ? '#ff4d4f' : '#52c41a'))
> 
> // Test assertion
> console.assert(isCritical.value === false, 'Vitals should be normal initially')
> heartRate.value = 130
> console.assert(isCritical.value === true, 'Heart rate 130 should trigger critical alert')
> </script>
> 
> <template>
>   <div class="vitals-monitor">
>     <h2>Patient Telemetry</h2>
>     <p :style="{ color: statusColor }">
>       Heart Rate: {{ heartRate }} BPM | SpO2: {{ spo2 }}%
>     </p>
> 
>     <div v-if="spo2 < 90" class="alert-box">CRITICAL OXYGEN HYPOXIA</div>
>     <div v-else-if="heartRate > 120" class="alert-box">TACHYCARDIA WARNING</div>
>     <div v-else class="normal-box">STABLE VITALS</div>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Dynamic style binding**: `:style="{ color: statusColor }"` evaluates dynamic style objects safely.
> 2. **Directives chains**: `v-if`, `v-else-if`, and `v-else` define clear structural branching.
> 3. **Automated escaping**: All dynamic values in text nodes automatically sanitize string output.
> 4. **Template compilation**: Template tags compile into Virtual DOM nodes during build time.
> 
---

### Exercise 3: Real-Time Financial Market Order Form Syntax Mapper

**Scenario:** A stock trading form binds input values and button states using template syntax directives.
**Requirements:**
1. Maintain `symbol` and `shares` refs.
2. Use `v-model` for dual binding.
3. Bind `:disabled` attribute when shares <= 0.
4. Verify validation assertion.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <script setup>
> import { ref, computed } from 'vue'
> 
> const symbol = ref('AAPL')
> const shares = ref(10)
> 
> const isValidOrder = computed(() => symbol.value.length > 0 && shares.value > 0)
> 
> // Verification test
> console.assert(isValidOrder.value === true, 'Order should be valid initially')
> shares.value = 0
> console.assert(isValidOrder.value === false, 'Order should be invalid when shares is 0')
> </script>
> 
> <template>
>   <form @submit.prevent>
>     <input v-model="symbol" placeholder="Symbol" />
>     <input v-model.number="shares" type="number" placeholder="Shares" />
>     <button :disabled="!isValidOrder" type="submit">
>       Execute Order ({{ symbol }}: {{ shares }} shares)
>     </button>
>   </form>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Two-way directive binding**: `v-model` synchronizes input values and script ref variables bi-directionally.
> 2. **Attribute binding**: `:disabled="!isValidOrder"` dynamically controls form submission eligibility.
> 3. **Event modifier**: `@submit.prevent` intercepts browser form submissions declaratively.
> 4. **Number modifier**: `v-model.number` automatically casts text input values to JavaScript numbers.
> 
---

## 6. Related Terms

- [Directives](../level_03/directives.md) — The specialized `v-` attributes used inside Vue templates.
- [Declarative Rendering](declarative_rendering.md) — The underlying rendering concept behind template syntax.
- [Computed Properties](../level_02/computed_properties.md) — The recommended home for complex logic extracted out of templates.
- [Virtual DOM (Vue)](../level_08/virtual_dom.md) — The compiled output produced by the Vue template compiler.

---

## 7. Key Takeaways

- Vue **Template Syntax** is 100% valid HTML extended with dynamic directives (`v-`) and mustache interpolations (`{{ }}`).
- Mustache curly braces `{{ }}` support ONLY single JavaScript expressions, never multi-line statements or control flow.
- Never use `v-html` for untrusted user inputs due to Cross-Site Scripting (XSS) risks.
- Keep templates clean: delegate complex calculations or array filtering to **Computed Properties**.
- Templates are compiled at build time into optimized Virtual DOM render functions, skipping static nodes automatically.
