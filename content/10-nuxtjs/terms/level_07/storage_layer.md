# Nitro Storage Layer (unstorage)

> **Level 7 — Server Engine (Nitro)**
> A built-in, universal key-value storage system inside Nitro that allows you to read and write data to Redis, the file system, or Cloudflare KV using a single, unified API.

---

## 1. Prerequisites
- [Nitro Engine](../level_01/nitro_engine.md) — The engine that manages this storage layer.
- [`nuxt.config.ts`](../level_06/nuxt_config.md) — Where you configure the storage drivers.

---

## 2. Term Category

**Server & Nitro Engine** (Unstorage KV Data Layer): Unstorage in Nitro provides a unified key-value storage layer supporting Redis, filesystem, memory, and Vercel KV drivers seamlessly.



---

## 3. Explanation

### Environment Context
- **Server Only**

### (1) Design Motivation — "Why did we design this?"
When building a backend, you often need to cache API responses or store temporary sessions. In development, saving this to a `.json` file on your hard drive is easy. But in production (like Vercel or Cloudflare), you don't have a hard drive; you must use a database like Redis. 

If you use a native Redis library, your app is permanently locked to Redis. If you decide to switch to Cloudflare KV or Vercel KV, you have to rewrite your entire codebase.

Nitro solves this using an underlying library called **unstorage**. It provides a single API (`useStorage()`). You write your code using this API, and in `nuxt.config.ts`, you map the storage to wherever you want (Redis in prod, local files in dev).

### (2) Core Concept
Inside any Nitro API route, you can call `useStorage()`.

```typescript
// server/api/stats.ts
export default defineEventHandler(async (event) => {
  const storage = useStorage('cache'); // Connect to the "cache" storage mount

  // 1. Try to get cached data
  const cachedData = await storage.getItem('homepage-stats');
  if (cachedData) return cachedData;

  // 2. If no cache, perform heavy database query
  const freshData = await performHeavyDatabaseQuery();

  // 3. Save to storage for the next request!
  await storage.setItem('homepage-stats', freshData);

  return freshData;
});
```

### (3) Configuring Drivers
By default, `useStorage` just saves data in the server's memory (RAM), which resets when the server restarts. To make it persistent, you configure "Mounts" in `nuxt.config.ts`.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      // Name of the mount (matches the string in useStorage)
      cache: {
        driver: 'redis',
        url: process.env.REDIS_URL
      }
    }
  }
})
```
Now, `storage.setItem` automatically talks to Redis, and your application code doesn't have to change at all!

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Relying on the default memory storage for critical production data
**The mistake:** Building an authentication system that saves active session IDs into `useStorage()` without configuring a persistent driver like Redis.

**Why it's wrong:** The default driver is in-memory. If your Nuxt app restarts, crashes, or is deployed as a serverless function (which scales up and down, creating multiple isolated memory instances), all session data is instantly erased, logging everyone out.
**Golden Rule:** Only use the default memory storage for caching temporary data that is safe to lose. For critical data, ALWAYS configure a persistent driver (Redis, MongoDB, FileSystem) in your `nuxt.config.ts`.

---

### Mistake 2: Using Local File System Storage (`fs` driver) on Ephemeral Serverless Hostings

**The mistake:** Configuring `useStorage('assets')` with local filesystem driver on Vercel or AWS Lambda.

**Why it's wrong:** Serverless containers have read-only or ephemeral filesystems. File writes to local disk are wiped when serverless containers terminate. Use persistent unstorage drivers (Redis, S3, MongoDB).

*Incorrect:*
```vue
/* Writing persistent data to local filesystem on Vercel deployment */
```

*Fix:*
```vue
/* Configure Redis or S3 unstorage drivers in nuxt.config.ts nitro.storage options */
```

---

### Mistake 3: Forgetting `await` When Calling Async Storage Methods (`getItem`, `setItem`)

**The mistake:** Writing `useStorage().setItem('db:user', data)` without `await`.

**Why it's wrong:** Nitro storage methods return Promises. Omitting `await` causes operations to execute un-handled in background, leading to race conditions.

*Incorrect:*
```typescript
useStorage().setItem('cache:key', value); // ❌ Missing await!
```

*Fix:*
```vue
await useStorage().setItem('cache:key', value); // Await storage operation
```


---

## 5. Practice Exercises

### Exercise 1: Storing and Retrieving Key-Value Data via `useStorage()`

**Scenario:**
Store and retrieve JSON cache items using Nitro's built-in `useStorage()` key-value layer.

**Requirements:**
1. Execute `useStorage().setItem("db:key", value)` and `getItem()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/cache.ts
> export default defineEventHandler(async (event) => {
>   const storage = useStorage();
>   
>   // Store data in key-value storage
>   await storage.setItem("db:user:101", { name: "Alice", role: "admin" });
>   
>   // Retrieve cached item
>   const cachedUser = await storage.getItem("db:user:101");
>   
>   return { cachedUser };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `useStorage()` provides access to Unstorage, Nitro's universal key-value storage abstraction.
> 2. Storage keys use colon-delimited namespaces (`db:user:101`).
> 3. Objects stored via `setItem()` are automatically JSON-serialized.
> 
---

### Exercise 2: Configuring Persistent Storage Mounts in `nuxt.config.ts`

**Scenario:**
Configure a Redis storage driver mount `redis` in `nuxt.config.ts` using `nitro.storage`.

**Requirements:**
1. Configure `nitro.storage` driver options in `nuxt.config.ts`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // nuxt.config.ts
> export default defineNuxtConfig({
>   nitro: {
>     storage: {
>       cache: {
>         driver: "redis",
>         host: "127.0.0.1",
>         port: 6379
>       }
>     }
>   }
> });
> ```
> 
> #### Technical Explanation
>
> 1. Unstorage supports swap-able storage drivers (memory, filesystem, Redis, Vercel KV, Cloudflare KV).
> 2. Mounting `cache` to Redis routes `useStorage('cache')` calls to Redis without changing application handler code.
> 3. Decouples storage implementation details from business logic.
> 
---

### Exercise 3: Listing and Removing Storage Keys

**Scenario:**
List all keys under a storage namespace and delete specific expired cache keys.

**Requirements:**
1. Use `storage.getKeys("cache:")` and `storage.removeItem()`.

> [!check]- Answer
>
> #### Implementation
>
> ```typescript
> // server/api/clear-cache.ts
> export default defineEventHandler(async (event) => {
>   const storage = useStorage("cache");
>   
>   // Get all keys starting with namespace 'cache:'
>   const keys = await storage.getKeys();
>   
>   // Remove specific item
>   await storage.removeItem("cache:user-list");
>   
>   return { clearedKey: "cache:user-list", totalRemaining: keys.length - 1 };
> });
> ```
> 
> #### Technical Explanation
>
> 1. `getKeys()` returns an array of active keys matching the storage namespace.
> 2. `removeItem(key)` deletes the specified key-value pair from storage.
> 3. Essential storage maintenance and cache invalidation operations.
> 
---


## 6. Related Terms
- [`server/api/` Routes](server_api_routes.md) — Where `useStorage` is typically executed.

---

## 7. Key Takeaways
- Nitro provides a unified key-value storage API via `useStorage()`.
- It decouples your code from specific databases (Redis, Cloudflare KV, etc.).
- You configure the underlying database "Drivers" in `nuxt.config.ts`.
- The default driver is temporary, in-memory RAM.
