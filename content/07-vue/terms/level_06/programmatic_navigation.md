# Programmatic Navigation (`useRouter` / `useRoute`)

> **Level 6 — Routing (Vue Router)**
> Navigating between routes using JavaScript code (such as `router.push('/dashboard')`) inside component functions instead of HTML links.

---

## 1. Prerequisites

- [Vue Router](vue_router.md) — The core routing library.
- [Composition API](../level_01/composition_api.md) — The custom hook paradigm.
- [Navigation Guards](navigation_guards.md) — Routing middleware.

---

## 2. Term Category

**Vue Ecosystem (Routing API / Composition API Hooks)**: Programmatic Navigation is the technique of executing URL route transitions using JavaScript API methods (`router.push()`, `router.replace()`, `router.go()`) inside component methods, composables, or event handlers. In Vue 3 Composition API, developers access router controller instance methods and active route state via `useRouter()` and `useRoute()` composable hooks.

Unlike declarative navigation using `<RouterLink to="...">`—which renders standard HTML `<a>` anchor tags for user clicks—programmatic navigation is executed via JavaScript logic. It is typically triggered after asynchronous side effects, such as form submissions, payment gateway API calls, or timer expirations. In React Router v6+, this functionality is provided by `useNavigate()` and `useLocation()`. Vue Router separates router action methods (`useRouter()`) from current route state inspection (`useRoute()`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
While declarative `<RouterLink>` tags excel at rendering navigation menus and static links, web applications frequently require navigation triggered by imperative business logic. For example, when a user submits a credit card payment form, the app must perform an asynchronous API request, validate the response token, update global state, and *then* navigate to `/checkout/success`.

You cannot use a simple HTML link for this workflow because navigation must wait for the API call to succeed. Programmatic Navigation provides JavaScript methods (`router.push()`) that allow developers to trigger route transitions imperatively from code, passing dynamic parameters, query strings, and custom state objects.

### (2) Reality Metaphor
Think of Programmatic Navigation like an Automated Airport Passenger Tram System controlled by a central dispatch computer. A declarative `<RouterLink>` is like a fixed staircase—passengers walk up the steps whenever they choose. Programmatic Navigation (`router.push()`), by contrast, is like an automated tram door: passengers step inside, the system verifies ticket validation and baggage scans (async API calls), and only after all checks pass does the central dispatch computer lock the doors and launch the tram toward Terminal B (the target route).

### (3) Vue Code Examples

#### Short Snippet
```vue
<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter() // Instance method controller
const route = useRoute()   // Reactive current route location state

function navigateToDashboard() {
  // Push new location onto browser history stack
  router.push('/dashboard')
}
</script>

<template>
  <button @click="navigateToDashboard">Go to Dashboard</button>
  <p>Current Path: {{ route.fullPath }}</p>
</template>
```

#### Fuller Example
```vue
<!-- UserLoginForm.vue (Async API login with programmatic navigation) -->
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Simulate async authentication API request
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username.value === 'admin' && password.value === 'secret') {
          resolve({ token: 'jwt-xyz-123' })
        } else {
          reject(new Error('Invalid username or password'))
        }
      }, 600)
    })

    localStorage.setItem('authToken', 'jwt-xyz-123')

    // Check if user was redirected to login from a protected page
    const redirectPath = route.query.redirect || '/dashboard'

    // Replace current history entry so pressing Back does not return to login form
    router.replace(String(redirectPath))
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-card">
    <h2>System Authorization</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Authenticating...' : 'Sign In' }}
      </button>
    </form>
    <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
  </div>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Destructuring Properties Directly from `useRoute()`

**The mistake:** Destructuring properties directly from the object returned by `useRoute()` (`const { params } = useRoute()`).

**Why it's wrong:** The object returned by `useRoute()` is a reactive Proxy. Direct ES6 destructuring extracts primitive copies of `params` or `query` at setup time, severing Vue's reactivity link. Subsequent URL parameter changes will not be tracked.

*Incorrect:*
```javascript
// ❌ Destructuring breaks route reactivity!
const { params } = useRoute();
console.log(params.id);
```

*Fix:* Keep the route object intact, or wrap destructured properties in `toRefs()`:
```javascript
const route = useRoute();
console.log(route.params.id); // Access reactive route properties via route reference
```

---

### Mistake 2: Confusing `router.push()` with `router.replace()`

**The mistake:** Using `router.push('/dashboard')` after a successful login or logout action.

**Why it's wrong:** `router.push()` adds a new entry to the browser history stack. After logging in, if the user clicks the browser Back button, they are pushed back to the `/login` page. `router.replace()` replaces the current history entry, preventing unwanted back-navigation.

*Incorrect:*
```javascript
// ❌ User can click Back button and land back on login form:
router.push('/login');
```

*Fix:* Use `router.replace()` for authentication transitions and redirects:
```javascript
// Replaces active history entry:
router.replace('/login');
```

---

### Mistake 3: Attempting to Access `this.$router` inside `<script setup>`

**The mistake:** Writing `this.$router.push('/dashboard')` inside Composition API `<script setup>`.

**Why it's wrong:** Inside `<script setup>`, code executes prior to component instance binding, and `this` is `undefined`. Access router instance methods using the `useRouter()` composable hook.

*Incorrect:*
```vue
<script setup>
function goToSettings() {
  this.$router.push('/settings'); // ❌ TypeError: Cannot read properties of undefined
}
</script>
```

*Fix:*
```vue
<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

function goToSettings() {
  router.push('/settings');
}
</script>
```

---

## 5. Practice Exercises

### Exercise 1: E-Commerce Checkout Form Success Navigation

**Scenario:** An e-commerce payment component processes credit card transactions. Upon receiving payment confirmation, navigate programmatically to named route `'order-confirmation'` passing parameter `orderId`.

**Requirements:**
1. Use `useRouter()` inside `<script setup>`.
2. Navigate using named route object `router.push({ name: 'order-confirmation', params: { orderId: 'ORD-990' } })`.
3. Include error handling for failed transactions.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- PaymentCheckout.vue -->
> <script setup>
> import { ref } from 'vue';
> import { useRouter } from 'vue-router';
> 
> const router = useRouter();
> const isProcessing = ref(false);
> 
> async function processPayment() {
>   isProcessing.value = true;
>   try {
>     // Simulate payment processing delay
>     await new Promise(r => setTimeout(r, 500));
>     const generatedOrderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
>     
>     // Navigate programmatically using named route descriptor
>     await router.push({
>       name: 'order-confirmation',
>       params: { orderId: generatedOrderId }
>     });
>   } catch (err) {
>     alert('Payment failed: ' + err.message);
>   } finally {
>     isProcessing.value = false;
>   }
> }
> </script>
> 
> <template>
>   <div class="checkout-box">
>     <button :disabled="isProcessing" @click="processPayment">
>       {{ isProcessing ? 'Authorizing Payment...' : 'Pay Now' }}
>     </button>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Named Route Navigation**: `router.push({ name, params })` decouples navigation calls from raw URL path strings.
> 2. **Async Integration**: Executes navigation cleanly inside `async/await` transaction handlers.
> 3. **State Guarding**: Disables submit button via `isProcessing` ref during in-flight network calls.
> 4. **History Stack Entry**: Adds confirmation page entry to browser history stack.
> 
---

### Exercise 2: Financial Application Session Timeout Token Logout

**Scenario:** A banking portal runs an inactivity timer composable `useSessionTimer()`. When the session expires, execute `router.replace('/login')` with query parameter `reason=timeout`.

**Requirements:**
1. Import `useRouter()`.
2. Execute `router.replace()` passing path and query object `{ path: '/login', query: { reason: 'timeout' } }`.
3. Include test assertions for route replacement.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { useRouter } from 'vue-router';
> 
> export function useSessionLogout() {
>   const router = useRouter();
> 
>   function handleSessionTimeout() {
>     // Clear security tokens
>     localStorage.removeItem('sessionToken');
>     
>     // Replace history entry to prevent back-navigation into sensitive screens
>     router.replace({
>       path: '/login',
>       query: { reason: 'timeout' }
>     });
>   }
> 
>   return { handleSessionTimeout };
> }
> 
> // Technical Assertion Test
> const { handleSessionTimeout } = useSessionLogout();
> console.assert(typeof handleSessionTimeout === 'function', 'Timeout handler defined');
> ```
>
> #### Technical Explanation
> 1. **History Replacement**: `router.replace()` overwrites active browser history, blocking Back button access to cached banking screens.
> 2. **Query String Injection**: `query: { reason: 'timeout' }` appends `?reason=timeout` to the destination URL.
> 3. **Security Encapsulation**: Clears local token storage before initiating route replacement.
> 4. **Reusable Composable**: Encapsulates session expiration logic cleanly inside a JavaScript helper module.
> 
---

### Exercise 3: Healthcare Telehealth Dynamic Filter Navigation (`router.push` with query)

**Scenario:** A hospital ER dashboard filters incoming patients by triage priority. Selecting a priority filter updates URL query parameters without reloading the page (`/er/dashboard?priority=critical`).

**Requirements:**
1. Read active query using `useRoute()`.
2. Update query parameters using `router.push({ query: { priority: selectedPriority } })`.
3. Maintain existing non-conflicting query parameters.

> [!check]- Answer
>
> #### Implementation
> ```vue
> <!-- ErDashboard.vue -->
> <script setup>
> import { ref, watch } from 'vue';
> import { useRouter, useRoute } from 'vue-router';
> 
> const router = useRouter();
> const route = useRoute();
> 
> const selectedPriority = ref(route.query.priority || 'all');
> 
> function applyFilter(priority) {
>   selectedPriority.value = priority;
>   
>   // Preserve existing query params while updating 'priority'
>   router.push({
>     query: {
>       ...route.query,
>       priority: priority === 'all' ? undefined : priority
>     }
>   });
> }
> </script>
> 
> <template>
>   <div class="er-dashboard">
>     <h2>Triage Filter</h2>
>     <button @click="applyFilter('all')">All</button>
>     <button @click="applyFilter('critical')">Critical Only</button>
>     <button @click="applyFilter('stable')">Stable Only</button>
>     <p>Active Priority Filter: {{ route.query.priority || 'All' }}</p>
>   </div>
> </template>
> ```
>
> #### Technical Explanation
> 1. **Query Parameter Update**: `router.push({ query })` dynamically syncs UI filter state with the URL query string.
> 2. **Parameter Preservation**: `{ ...route.query }` retains existing search parameters when updating filter keys.
> 3. **Clean URL Cleanup**: Setting parameter to `undefined` strips redundant `?priority=all` strings from the browser URL bar.
> 4. **Shareable Deep Links**: Enables users to bookmark or share filtered dashboard URLs directly.
> 
---

## 6. Related Terms

- [Vue Router](vue_router.md) — The routing ecosystem package.
- [Navigation Guards](navigation_guards.md) — Global, per-route, or in-component middleware.
- [Router View / Router Link](router_view_link.md) — Template elements for displaying and declaring route links.

---

## 7. Key Takeaways

- **Programmatic Navigation** executes route transitions via JavaScript API calls inside setup scripts, composables, or event handlers.
- Use **`useRouter()`** to access router action methods (`push`, `replace`, `go`); use **`useRoute()`** to inspect current route location state.
- Use **`router.push()`** to append new entries to the browser history stack for standard navigation.
- Use **`router.replace()`** after authentication or redirects to overwrite the current history entry, preventing Back button loops.
- Do **not** destructure properties directly from `useRoute()`—keep the route object intact to preserve Vue's reactive proxy tracking.
