# Nuxt Payload (SSR State Transfer)

> **Level 4 — Composables & State**
> The serialized data package compiled during server rendering and embedded within the HTML output, allowing the client browser to hydrate reactive state instantly without making duplicate network requests.

---

## 1. Prerequisites
- [Hydration](../level_01/hydration.md) — The process that consumes this payload package to achieve page interactivity.
- [`useState` Hook](use_state.md) — The global state container whose data is transferred via this payload.

---

## 2. Term Category

**Rendering Strategy** (SSR-to-Client State Payload): `NuxtPayload` serializes server state, fetched data, and state hydration objects into JSON payloads transferred to the client.



---

## 3. Explanation

### Environment Context
- **Server & Client** (Serialized on the server during compile time and parsed on the client browser during hydration bootstrapping).

### (1) Design Motivation — "Why did we design this?"
Server-Side Rendering (SSR) executes your code on the server, loading components, performing database queries, and executing fetch requests to build the final HTML. 

If this server-side state is not sent to the browser, the client-side Vue application starting up in the browser has no memory of what happened on the server. The client would have to:
1.  Initialize all state as empty.
2.  Re-fetch the exact same database records and API endpoints.
3.  Re-render the components.

This causes a **"double-fetching"** performance penalty and triggers a **Hydration Mismatch** because the client DOM is momentarily blank before data loads. 

The **Nuxt Payload** solves this: it bundles the server's state into a serialized JSON block, embedding it directly into the initial HTML document body. The client reads this payload and updates its local reactive memory instantly before rendering.

---

### (2) The Payload Cycle
The state lifecycle progresses as follows:

```
[Server] executes useFetch('/api/user') ➔ returns { name: 'Alex' }
[Server] renders HTML ➔ embeds { name: 'Alex' } inside <script type="application/json"> payload
                                      │
                                      ▼
[Browser] downloads HTML ➔ renders the markup instantly
[Browser] executes client Vue code ➔ parses the embedded payload JSON
[Browser] hydrates state ➔ initializes useFetch cache with { name: 'Alex' } (No network fetch!)
```

---

### (3) Serialization via Devalue
Standard `JSON.stringify` does not support complex JavaScript structures like `Date` objects, `Map`, `Set`, `RegExp`, or custom error classes (they get serialized as empty objects or strings). 

Nuxt uses **`devalue`** under the hood to compile the payload. This custom serializer preserves:
-   `Date` instances
-   `Map` and `Set` collections
-   Negative and infinite numbers (`-0`, `Infinity`, `NaN`)
-   Custom routing errors

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Storing unserializable values in shared state cache

**The mistake:** Storing class instances with functions, database connections, or socket closures inside `useState` or data-fetching caches:

```typescript
// Inside a composable or server API route
// BAD: Class instances with functions cannot be serialized!
const dbConnection = useState('db', () => new DatabaseClient());
```

**Why it's wrong:** While the `DatabaseClient` instance works fine on the server runtime, the Nuxt payload serializer will fail to compile it because functions, circular references, and closures cannot be serialized into JSON. This will crash the build or trigger rendering warnings.

**Golden Rule:** Keep your `useState` and data-fetching cache values clean. Only store raw data structures (objects, arrays, strings, numbers, Dates, Maps, Sets). Do not store function instances or active connection handlers in serializable state.

---

### Mistake 2: Passing Heavy Un-Serialized Data Classes in Nuxt Payload (Serialization Crash)

**The mistake:** Storing raw class instances or functions inside `useAsyncData` or `useState`.

**Why it's wrong:** Nuxt Payload uses devalue to serialize data from server to client HTML payload `<script>`. Classes and functions cannot be serialized, throwing a payload serialization error.

*Incorrect:*
```typescript
const data = await useAsyncData('key', () => new CustomClass()); // ❌ Devalue serialization error!
```

*Fix:*
```vue
const data = await useAsyncData('key', () => ({ id: 1, name: 'Plain Object' })); // Plain JSON objects
```

---

### Mistake 3: Duplicate Fetching by Bypassing Nuxt Payload Serialization

**The mistake:** Using native `$fetch` directly in component setup instead of `useFetch` or `useAsyncData`.

**Why it's wrong:** Native `$fetch` executes on the server during SSR, but because it doesn't store data in `nuxtApp.payload`, the client re-fetches the API call during hydration (double fetch bug).

*Incorrect:*
```vue
<script setup>
const data = await $fetch('/api/user'); // ❌ Executes on server AND client hydration!
</script>
```

*Fix:*
```vue
<script setup>
const { data } = await useFetch('/api/user'); // Serializes data into payload, preventing client re-fetch
</script>
```


---

## 5. Practice Exercises

### Exercise 1: Inspecting Serialized SSR Hydration Payloads

**Scenario:**
Inspect the serialized `window.__NUXT__` payload object generated during server rendering in the browser console.

**Requirements:**
1. Access `useNuxtApp().payload`.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> const nuxtApp = useNuxtApp();
> 
> onMounted(() => {
>   console.log("Hydrating Nuxt State Payload:", nuxtApp.payload);
>   console.log("Fetched Data Cache:", nuxtApp.payload.data);
>   console.log("Shared State Keys:", nuxtApp.payload.state);
> });
> </script>
> 
> <template>
>   <div>
>     <p>Payload Inspection View</p>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. `NuxtPayload` serializes server state, `useState()` values, and `useFetch()` data into an inline JSON script during SSR.
> 2. The client hydrates Vue state directly from `window.__NUXT__` without re-fetching API data over the network.
> 3. Prevents duplicate API data fetching during client hydration.
> 
---

### Exercise 2: Registering Custom Payload Reducers with `definePayloadReducer`

**Scenario:**
Register a custom payload reducer to serialize custom JavaScript `Set` or `Map` objects safely across SSR boundaries.

**Requirements:**
1. Code `definePayloadReducer` plugin setup.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // plugins/payload.ts
> export default defineNuxtPlugin(() => {
>   definePayloadReducer("CustomSet", (data) => data instanceof Set && Array.from(data));
>   definePayloadReviver("CustomSet", (data) => new Set(data as any[]));
> });
> ```
> 
> #### Technical Explanation
>
> 1. Standard `JSON.stringify` converts non-serializable objects (`Map`, `Set`, `Date`, custom classes) into plain strings or empty objects.
> 2. `definePayloadReducer` and `definePayloadReviver` enable rich data structure serialization across server-client boundaries.
> 3. De-value serialization engine feature in Nuxt 3.
> 
---

### Exercise 3: Reducing Hydration Payload Size

**Scenario:**
Optimize a `useFetch()` call using `pick` or `transform` options to exclude unused heavy properties from `NuxtPayload`.

**Requirements:**
1. Use `transform` to return small payload subset.

> [!check]- Answer
>
> #### Implementation
>
> ```vue
> <script setup lang="ts">
> // Strips heavy unused fields before serializing into NuxtPayload
> const { data: userSummary } = await useFetch("/api/user/large-profile", {
>   transform: (user: any) => ({
>     id: user.id,
>     username: user.username
>   })
> });
> </script>
> 
> <template>
>   <div>
>     <p>User: {{ userSummary?.username }}</p>
>   </div>
> </template>
> ```
> 
> #### Technical Explanation
>
> 1. Unfiltered API responses append large JSON blobs to `NuxtPayload`, increasing initial HTML document byte size.
> 2. `transform` or `pick` strips unnecessary API properties on the server before payload serialization.
> 3. Reduces initial HTML payload download latency.
> 
---


## 6. Related Terms
- [Hydration](../level_01/hydration.md) — The process that uses this payload to align client components.
- [`useState` Hook](use_state.md) — The state mechanism serialized inside the payload.

---

## 7. Key Takeaways
- The Nuxt Payload is a serialized state block embedded inside the SSR HTML.
- It prevents client-side double-fetching and hydration mismatches.
- It is powered by `devalue`, supporting Dates, Maps, Sets, and special numbers.
- Do not store unserializable structures (like classes with methods or connections) in state.
- Client hydration reads the payload to bootstrap Vue state instantly.
