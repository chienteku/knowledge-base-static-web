# Nuxt Payload (SSR State Transfer)

> **Level 4 — Composables & State**
> The serialized data package compiled during server rendering and embedded within the HTML output, allowing the client browser to hydrate reactive state instantly without making duplicate network requests.

---

## 1. Prerequisites
- [Hydration](../level_01/hydration.md) — The process that consumes this payload package to achieve page interactivity.
- [`useState` Hook](use_state.md) — The global state container whose data is transferred via this payload.
---

## 2. Term Category
- **State Management**

---

## 3. Environment Context
- **Server & Client** (Serialized on the server during compile time and parsed on the client browser during hydration bootstrapping).

---

## 4. Explanation

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

## 5. Common Mistakes & Pitfalls

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

## 6. Practice Exercises

### Exercise 1: Inspecting the Payload

**Problem:** You use `useFetch('/api/profile')` inside `app.vue`. Explain why the browser's Network tab shows zero outgoing HTTP requests to `/api/profile` when you refresh the page.

**Expected output:**
> [!check]- Answer
> ```text
> Because of the Nuxt Payload mechanism, the API response is fetched on the server during SSR, serialized, and embedded inside the initial HTML page payload. During hydration, Nuxt reads this embedded data directly to populate the useFetch cache, bypassing the need to trigger a browser network request.
> ```
> - Think about where the data is fetched first, and how the client obtains it.

---

### Exercise 2: Payload Inspection in HTML Source

**Problem:** Where is the serialized Nuxt Payload embedded in the server-rendered HTML document?

**Expected output:**
> [!check]- Answer
> ```text
> Inside a window.__NUXT__ script tag embedded at the bottom of the HTML <body>.
> ```
> - Nuxt Payload is embedded inside `<script>window.__NUXT__=...</script>`.
> 
> ```text
> Server Render -> Embed __NUXT__ Payload in HTML -> Client Hydrates Payload
> ```

---

### Exercise 3: Custom Payload Reducer Registration

**Problem:** Which plugin method allows registering custom serialization reducers for complex objects (e.g. Date or Map) in Nuxt Payload?

**Expected output:**
> [!check]- Answer
> ```text
> nuxtApp.provide('payload', ...) or createPayloadPlugin()
> ```
> - Custom payload plugins serialize non-primitive data types.
> 
> ```typescript
> export default defineNuxtPlugin((nuxtApp) => {
>   nuxtApp.hooks.hook('app:rendered', () => { ... });
> });
> ```


---

## 7. Related Terms
- [Hydration](../level_01/hydration.md) — The process that uses this payload to align client components.
- [`useState` Hook](use_state.md) — The state mechanism serialized inside the payload.
---

## 8. Key Takeaways
- The Nuxt Payload is a serialized state block embedded inside the SSR HTML.
- It prevents client-side double-fetching and hydration mismatches.
- It is powered by `devalue`, supporting Dates, Maps, Sets, and special numbers.
- Do not store unserializable structures (like classes with methods or connections) in state.
- Client hydration reads the payload to bootstrap Vue state instantly.
