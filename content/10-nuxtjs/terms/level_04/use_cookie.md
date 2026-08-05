# `useCookie` Hook

> **Level 4 — Composables & State**
> An auto-imported Nuxt composable that allows you to read, write, and reactively sync browser cookies seamlessly across both the Server and the Client.

---

## 1. Prerequisites
- [`useState` Hook](use_state.md) — Similar hook patterns.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — The rendering strategy where cookies enable server-accessible state configuration.

---

## 2. Term Category
- **State Management**

---

## 3. Environment Context
- **Server & Client**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard web development, reading a cookie on the server requires parsing the raw `req.headers.cookie` string. Reading a cookie on the client requires parsing the messy `document.cookie` string. Furthermore, if you change a cookie in the browser, your Vue components won't automatically re-render unless you manually trigger an update.

`useCookie` solves all of these problems simultaneously. It provides a unified, SSR-friendly API that works exactly the same way on the Node server as it does in the browser. Better yet, the cookie is **reactive**—if you update the cookie's value, the UI instantly updates.

### (2) Core Concept
Calling `useCookie('key')` returns a reactive Vue `Ref`. 
- If you read `.value`, Nuxt reads the cookie.
- If you change `.value`, Nuxt automatically sends the `Set-Cookie` header (on the server) or updates `document.cookie` (on the client).

```vue
<script setup lang="ts">
// If the cookie 'theme' doesn't exist, it defaults to 'light'
const theme = useCookie<string>('theme', {
  default: () => 'light',
  maxAge: 60 * 60 * 24 * 7 // Cookie expires in 7 days
});

const toggleTheme = () => {
  // Mutating the value automatically updates the physical browser cookie!
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};
</script>

<template>
  <div :class="theme">
    <p>Current theme: {{ theme }}</p>
    <button @click="toggleTheme">Toggle Theme</button>
  </div>
</template>
```

### (3) SSR Magic
Because cookies are sent to the server on every request, `useCookie` is the ultimate tool for persisting user preferences (like Dark Mode) or Auth Tokens. When the user visits the page, Nitro reads the cookie, renders the HTML using the `dark` theme, and sends the perfect HTML back to the browser. Zero flickering!

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use `localStorage` for SSR-critical data
**The mistake:** Storing an Auth Token or a Theme preference in `localStorage`.

**Why it's wrong:** The server cannot read `localStorage`. If you store the theme in `localStorage`, the server must guess what the theme is (usually guessing "light"). When the browser loads, it reads `localStorage`, realizes the user wants "dark", and flashes the screen from white to black (causing a Hydration Mismatch).
**Golden Rule:** If a piece of data affects how the page is visually rendered on initial load, it MUST be stored in a cookie using `useCookie` so the server can access it.

---

### Mistake 2: Mutating `useCookie()` Values directly in Un-Protected Client Scripts (Missing Cookie Options)

**The mistake:** Setting sensitive auth token `const token = useCookie('token'); token.value = 'abc'` without setting `sameSite` or `secure` options.

**Why it's wrong:** Default cookies omit security flags like `sameSite` and `secure`, exposing cookies to CSRF attacks. Configure security options in `useCookie`.

*Incorrect:*
```vue
const token = useCookie('token'); // Missing secure cookie options
```

*Fix:*
```vue
const token = useCookie('token', {
  maxAge: 86400,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
});
```

---

### Mistake 3: Attempting to Read `useCookie()` in Asynchronous Event Handlers Without Hydration Sync

**The mistake:** Expecting `useCookie` state changes on client to update native browser `document.cookie` synchronously without ref trigger.

**Why it's wrong:** `useCookie()` returns a Vue reactive `Ref`. Assigning `cookie.value = null` updates both cookie storage and reactive Vue state automatically.

*Incorrect:*
```vue
/* Manually parsing document.cookie after mutating useCookie ref */
```

*Fix:*
```vue
/* Mutate ref value directly: const session = useCookie('session'); session.value = null; */
```


---

## 6. Practice Exercises

### Exercise 1: Storing a JWT

**Problem:** You receive a JWT string from an API. Write the Nuxt code to store this token in a cookie named `auth_token` that expires when the browser closes (session cookie).

**Expected output:**
> [!check]- Answer
> ```typescript
> const authToken = useCookie('auth_token');
> authToken.value = 'eyJhbGciOiJIUz...'; 
> // Omitting 'maxAge' makes it a session cookie by default!
> ```
> - Initialize `useCookie('auth_token')` without configuring `maxAge` or `expires` parameters, then assign the value directly to `.value`.

---

### Exercise 2: useCookie Auth Session Pattern

**Problem:** Write `<script setup>` reading cookie `'auth_token'` with 7-day expiration (`maxAge: 604800`) and function `logout()` clearing the cookie.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup>
> const token = useCookie('auth_token', { maxAge: 604800 });
> function logout() {
>   token.value = null;
> }
> </script>
> ```
> - Setting `cookie.value = null` clears cookie storage.
> 
> ```vue
> <script setup>
> const authToken = useCookie('auth_token', {
>   maxAge: 604800, // 7 days in seconds
>   sameSite: 'lax'
> });
> 
> function logout() {
>   authToken.value = null; // Clears cookie on server and client
> }
> </script>
> ```

---

### Exercise 3: useCookie SSR Header Injection

**Problem:** How does `useCookie()` sync cookie changes made during server-side rendering (SSR) back to the browser?

**Expected output:**
> [!check]- Answer
> ```text
> Nitro automatically injects Set-Cookie HTTP response headers in the SSR HTTP response payload.
> ```
> - Injects `Set-Cookie` HTTP response headers during SSR.
> 
> ```text
> Server useCookie mutation -> Set-Cookie HTTP Response Header -> Browser Storage
> ```


---

## 7. Related Terms
- [`useState` Hook](use_state.md) — The non-persistent alternative to `useCookie`.
- [Universal Rendering (SSR)](../level_01/universal_rendering.md) — Why reading cookies on the server is so important.

---

## 8. Key Takeaways
- `useCookie` returns a reactive `Ref` linked to a physical browser cookie.
- It works flawlessly on both the Server and the Client.
- Mutating `.value` automatically updates the cookie.
- It is the preferred way to store data that the Server needs to know about (Auth, Themes, Language preferences).
