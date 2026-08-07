# Options API

> **Level 1 — Core Concepts & Reactivity**
> The legacy object-based component authoring model in Vue, where component logic is organized into predefined options properties like `data`, `methods`, and `computed`.

---

## 1. Prerequisites

- [Components](../level_04/components.md) — The fundamental UI building blocks defined via options objects.
- [Declarative Rendering](declarative_rendering.md) — The rendering model managed by Options API components.

---

## 2. Term Category

**Vue Component Paradigm / Legacy Authoring Syntax (Options Object Model)**: The Options API is Vue's classic component structure introduced in Vue 1 and 2, and fully supported in Vue 3 for backward compatibility. Component options are declared as a single options object with dedicated properties (`data()`, `methods`, `computed`, `watch`, lifecycle hooks).

During instance initialization, Vue processes this options object, converting `data()` returns into reactive proxies and binding option methods to the internal component instance (`this`). While easy to learn for beginners and applicable in client/server components, it suffers from rigid code splitting and poor TypeScript inference compared to the Composition API.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In early frontend development, structured component standards were non-existent. Developers frequently created haphazard object literal patterns or messy class abstractions. The Options API was designed to establish an intuitive, beginner-friendly convention: every Vue component followed an identical, predictable structure.

State belonged in `data()`, actions in `methods`, cached calculations in `computed`, side effects in `watch`, and lifecycle handlers in dedicated lifecycle hooks (`mounted`, `created`). This declarative blueprint made Vue exceptionally approachable and easy to learn.

However, as applications scaled to enterprise complexity, the Options API revealed structural limitations:
1. **Logical Fragmentation**: In a 1,000-line component managing three features (e.g., search, pagination, cart), code for a single feature was physically fragmented across `data`, `methods`, and `computed` buckets.
2. **Reuse Flaws**: Reusing stateful logic relied on Mixins, which introduced implicit dependencies, namespace collisions, and opaque source tracking.
3. **TypeScript Barriers**: Inferring types across `this` contexts required complex TypeScript wrapper abstractions.

These drawbacks led directly to the creation of the modern **Composition API**.

### (2) Reality Metaphor
Imagine filing paperwork in a pre-labeled accordian folder (Options API) versus organizing documents in modular project binders (Composition API).

In the accordian folder, all receipts must go in Slot A (Data), all contracts in Slot B (Methods), and all summaries in Slot C (Computed). If you are working on "Project Alpha", its receipt is in Slot A, its contract in Slot B, and its summary in Slot C. To review Project Alpha, you must flip between three different slots every time.

The Composition API gives you dedicated project binders. You place Project Alpha's receipts, contract, and summary together in Binder 1, and Project Beta's documents in Binder 2.

### (3) Vue Code Examples

#### Short Snippet
```vue
<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<template>
  <button @click="increment">Count: {{ count }} (Double: {{ doubleCount }})</button>
</template>
```

#### Fuller Example
```vue
<script>
export default {
  name: 'UserProfileEditor',
  data() {
    return {
      user: {
        firstName: 'Sarah',
        lastName: 'Connor',
        role: 'Administrator'
      },
      isEditing: false,
      saving: false
    }
  },
  computed: {
    fullName() {
      return `${this.user.firstName} ${this.user.lastName}`
    },
    isAdmin() {
      return this.user.role === 'Administrator'
    }
  },
  methods: {
    toggleEdit() {
      this.isEditing = !this.isEditing
    },
    async saveProfile() {
      this.saving = true
      try {
        // Simulated async API save operation
        await new Promise(resolve => setTimeout(resolve, 500))
        this.isEditing = false
      } finally {
        this.saving = false
      }
    }
  },
  mounted() {
    console.log(`User Profile loaded for: ${this.fullName}`)
  }
}
</script>

<template>
  <div class="profile-card">
    <h2>{{ fullName }} <span v-if="isAdmin">(Admin)</span></h2>

    <div v-if="isEditing">
      <input v-model="user.firstName" placeholder="First Name" />
      <input v-model="user.lastName" placeholder="Last Name" />
      <button :disabled="saving" @click="saveProfile">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <button v-else @click="toggleEdit">Edit Profile</button>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Omission of `this` When Accessing Component Properties

**The mistake:** Accessing data or methods inside option functions without the `this` prefix (e.g. writing `count++` inside a method).

**Why it's wrong:** In the Options API, `data`, `methods`, and `computed` properties are bound to the component instance via `this`. Omitting `this` searches for a local JavaScript variable in scope and throws a `ReferenceError`.

*Incorrect:*
```javascript
methods: {
  increment() {
    count++ // ❌ ReferenceError: count is not defined!
  }
}
```

*Fix:*
```javascript
methods: {
  increment() {
    this.count++ // Correctly accesses instance property via 'this'
  }
}
```

---

### Mistake 2: Defining Methods or Computed Properties with ES6 Arrow Functions

**The mistake:** Declaring option methods using arrow syntax (e.g. `methods: { increment: () => { this.count++ } }`).

**Why it's wrong:** Arrow functions bind `this` lexically to the parent scope (window/undefined) rather than the Vue component instance. Accessing `this.count` inside an arrow option method will throw a `TypeError`.

*Incorrect:*
```javascript
methods: {
  increment: () => {
    this.count++ // ❌ 'this' is lexically bound to window/undefined!
  }
}
```

*Fix:*
```javascript
methods: {
  increment() {
    this.count++ // Standard function syntax binds 'this' to component instance
  }
}
```

---

### Mistake 3: Returning Plain Objects from `data` Option in Component Definitions

**The mistake:** Declaring `data: { count: 0 }` as a plain object literal instead of a factory function.

**Why it's wrong:** When `data` is a plain object, all instantiated component instances share the exact same memory reference. Mutating state in one instance mutates state across all instances globally.

*Incorrect:*
```javascript
export default {
  data: { count: 0 } // ❌ Shared object reference across component instances!
}
```

*Fix:*
```javascript
export default {
  data() {
    return { count: 0 } // Returns a fresh data object per instance
  }
}
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Discount Checkout Calculator

**Scenario:** A legacy Vue 2 component needs to calculate order cart discounts using the Options API structure.
**Requirements:**
1. Declare `data()` returning `cartTotal` and `promoCode`.
2. Implement `computed` `discountedTotal` applying 10% for code `'SAVE10'`.
3. Implement `method` `applyCode(code)`.
4. Validate calculation via assertions.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> export default {
>   name: 'CartCheckout',
>   data() {
>     return {
>       cartTotal: 150,
>       promoCode: ''
>     }
>   },
>   computed: {
>     discountedTotal() {
>       if (this.promoCode === 'SAVE10') {
>         return this.cartTotal * 0.9
>       }
>       return this.cartTotal
>     }
>   },
>   methods: {
>     applyCode(code) {
>       this.promoCode = code
>     }
>   },
>   created() {
>     // Verification assertions
>     console.assert(this.discountedTotal === 150, 'Initial total should be 150')
>     this.applyCode('SAVE10')
>     console.assert(this.discountedTotal === 135, 'Total should be 135 with SAVE10')
>   }
> }
> ```
>
> #### Technical Explanation
> 1. **Data factory function**: `data()` returns a fresh state object per instance invocation.
> 2. **Instance `this` binding**: `this.cartTotal` and `this.promoCode` dereference options through instance proxies.
> 3. **Computed caching**: `discountedTotal` recalculates only when `promoCode` or `cartTotal` mutates.
> 4. **Lifecycle invocation**: `created()` hook runs during instance setup before DOM mounting.
> 
---

### Exercise 2: Industrial Networking Device Gateway Monitor

**Scenario:** A gateway monitoring component tracks connected IoT devices and displays status logs using Options API.
**Requirements:**
1. Declare `data()` with `devices` array and `activeFilter` string.
2. Compute `filteredDevices` based on status filter.
3. Provide method `disconnectDevice(id)`.
4. Assert filtering behavior.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> export default {
>   name: 'DeviceGateway',
>   data() {
>     return {
>       devices: [
>         { id: 'DEV-01', status: 'online' },
>         { id: 'DEV-02', status: 'offline' }
>       ],
>       activeFilter: 'all'
>     }
>   },
>   computed: {
>     filteredDevices() {
>       if (this.activeFilter === 'all') return this.devices
>       return this.devices.filter(d => d.status === this.activeFilter)
>     }
>   },
>   methods: {
>     disconnectDevice(id) {
>       const dev = this.devices.find(d => d.id === id)
>       if (dev) dev.status = 'offline'
>     }
>   },
>   created() {
>     console.assert(this.filteredDevices.length === 2, 'Should display 2 devices initially')
>     this.activeFilter = 'offline'
>     console.assert(this.filteredDevices.length === 1, 'Should display 1 offline device')
>   }
> }
> ```
>
> #### Technical Explanation
> 1. **Option compartmentalization**: State, computed state, and methods reside in separated structural sections.
> 2. **`this` access in methods**: Methods mutate array contents by referencing `this.devices`.
> 3. **Computed filtering**: `filteredDevices` reacts automatically to mutations on `activeFilter` or `devices`.
> 4. **No script setup**: Options API uses `export default { ... }` configuration objects.
> 
---

### Exercise 3: Financial Analytics Portfolio Metric Tracker

**Scenario:** A portfolio manager calculates asset balances and gains using Options API options.
**Requirements:**
1. Track `cash` and `stockValue` in `data()`.
2. Compute `totalNetWorth` in `computed`.
3. Provide `depositCash(amount)` method.
4. Verify net worth calculation via test assertion.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> export default {
>   name: 'PortfolioTracker',
>   data() {
>     return {
>       cash: 5000,
>       stockValue: 12000
>     }
>   },
>   computed: {
>     totalNetWorth() {
>       return this.cash + this.stockValue
>     }
>   },
>   methods: {
>     depositCash(amount) {
>       this.cash += amount
>     }
>   },
>   created() {
>     console.assert(this.totalNetWorth === 17000, 'Net worth should equal 17000')
>     this.depositCash(3000)
>     console.assert(this.totalNetWorth === 20000, 'Net worth should equal 20000 after deposit')
>   }
> }
> ```
>
> #### Technical Explanation
> 1. **Standard method binding**: `depositCash` uses standard function syntax so `this` points to component.
> 2. **Derivation rules**: `totalNetWorth` derives data without side effects.
> 3. **Legacy compatibility**: Options API works seamlessly in Vue 2 and Vue 3 projects alike.
> 4. **Refactoring paths**: Options API components can be systematically refactored into Composition API `<script setup>` syntax.
> 
---

## 6. Related Terms

- [Composition API](composition_api.md) — The modern replacement for the Options API in Vue 3.
- [Vue Instance](vue_instance.md) — The component instance context accessed via `this`.
- [Reactive State](../level_02/reactive_state.md) — The underlying reactivity created by the `data()` option.
- [Computed Properties](../level_02/computed_properties.md) — The derived evaluation option inside Options API components.

---

## 7. Key Takeaways

- The **Options API** organizes component code into fixed option properties (`data`, `methods`, `computed`, `watch`).
- Accessing state or methods inside Options API components requires prefixing properties with `this.`.
- Always use standard ES6 method syntax rather than arrow functions to maintain correct `this` binding.
- `data` MUST be a factory function returning a fresh object to prevent shared state leaks across instances.
- While fully supported in Vue 3, new greenfield projects should prefer the **Composition API**.
