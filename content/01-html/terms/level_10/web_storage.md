# Web Storage (Local/Session Storage)

> **Level 10 — Canvas, SVG & Storage**
> HTML5 APIs that allow web applications to store data locally within the user's browser securely and efficiently.

---

## 1. Prerequisites
- [DOM (Document Object Model)](../level_09/dom.md) — Web Storage is accessed via JavaScript through the global `window` object.
- [`<script>`](../level_08/script.md) — You must use JavaScript to read and write to Web Storage.

---

## 2. Term Category
- **HTML5 API**

---

## 3. Environment Context
- **HTML5 Standard**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before HTML5, if a website wanted to remember something about a user (like their preferred "Dark Mode" setting, or the items in their shopping cart), the only option was to use **Cookies**. Cookies are terrible for storing application data: they only hold 4 Kilobytes of data, and worse, they are automatically sent to the server over the network on *every single HTTP request*, slowing down the website unnecessarily.
The W3C introduced the **Web Storage API** in HTML5 to solve this. It provides two JavaScript objects: `localStorage` and `sessionStorage`. 
- They can hold at least 5 Megabytes of data (huge compared to cookies).
- The data is stored strictly on the user's hard drive and is NEVER sent to the server automatically.
- **`localStorage`** saves data forever (until the user manually clears their browser cache).
- **`sessionStorage`** saves data only until the user closes the browser tab.

### (2) Reality Metaphor
**Cookies** are like a nametag you wear on your shirt. Every time you talk to an employee in a store, they read your nametag. It's good for identification, but you wouldn't write your entire shopping list on your nametag.
**Web Storage** is like a personal notebook you keep in your pocket. You can write 5 Megabytes of notes in it (like your shopping list or your dark mode preference). The store employees never see the notebook; only you (the browser) can read it when you need it.

### (3) Code Examples

#### Short Snippet
```javascript
// Saving a preference that will last forever
localStorage.setItem("theme", "dark_mode");

// Retrieving the preference later (even after restarting the computer!)
const userTheme = localStorage.getItem("theme");
```

#### Fuller Example
```html
<button id="cartBtn">Add to Cart</button>
<p>Items in cart: <span id="count">0</span></p>

<script>
  // 1. When the page loads, check if they already have items in Local Storage
  let cartCount = localStorage.getItem('cart_total') || 0;
  document.getElementById('count').innerText = cartCount;

  // 2. When they click the button, update the count AND save it to Local Storage
  document.getElementById('cartBtn').addEventListener('click', () => {
    cartCount++;
    document.getElementById('count').innerText = cartCount;
    
    // Save it so it survives a page refresh!
    localStorage.setItem('cart_total', cartCount);
  });
</script>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Storing sensitive data in Local Storage

**The mistake:** Using `localStorage.setItem('user_password', 'secret123')` or storing sensitive authentication tokens (like JWTs) in Local Storage.

**Why it's wrong:** Web Storage is incredibly convenient, but it is **NOT secure**. Any JavaScript running on the page has full access to `localStorage`. If your website accidentally imports a malicious third-party script, that script can instantly read everything in Local Storage and steal the user's passwords or session tokens (this is called an XSS attack). Sensitive data should be handled securely by the server, often using `HttpOnly` cookies.

### Mistake 2: Trying to store Arrays or Objects directly

**The mistake:** Doing `localStorage.setItem('user', { name: "John", age: 30 })`.

**Why it's wrong:** Web Storage can *only* save plain strings. If you try to save a JavaScript Object, it will forcefully convert it to the useless string `"[object Object]"`. You must convert Objects into JSON strings using `JSON.stringify()` before saving them, and convert them back using `JSON.parse()` when reading them.

---



### Mistake 3: Storing Sensitive Auth JWT Tokens in `localStorage` (XSS Attack Vector)

**The mistake:** Writing `localStorage.setItem('authToken', token)`.

**Why it's wrong:** Data stored in `localStorage` is accessible to ANY JavaScript running on the origin domain. If an XSS vulnerability exists, attackers can steal tokens. Use `HttpOnly` cookies.

*Incorrect:*
```html
localStorage.setItem('jwt', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```html
// Set auth tokens in server HttpOnly, Secure cookies
```

### Mistake 4: Forgetting to Stringify Objects Before Saving to Web Storage (`localStorage.setItem('user', obj)`)

**The mistake:** Writing `localStorage.setItem('user', { name: 'Alice' })`.

**Why it's wrong:** Web Storage stores data strictly as string primitives! Passing an object implicitly calls `.toString()`, storing literal string `"[object Object]"`. Use `JSON.stringify()`.

*Incorrect:*
```html
localStorage.setItem('user', { id: 1 }); // ❌ Stores string '[object Object]'!
```

*Fix:*
```html
localStorage.setItem('user', JSON.stringify({ id: 1 }));
```



### Mistake 5: Storing Sensitive Auth JWT Tokens in `localStorage` (XSS Attack Vector)

**The mistake:** Writing `localStorage.setItem('authToken', token)`.

**Why it's wrong:** Data stored in `localStorage` is accessible to ANY JavaScript running on the origin domain. If an XSS vulnerability exists, attackers can steal tokens. Use `HttpOnly` cookies.

*Incorrect:*
```html
localStorage.setItem('jwt', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```html
// Set auth tokens in server HttpOnly, Secure cookies
```

### Mistake 6: Forgetting to Stringify Objects Before Saving to Web Storage (`localStorage.setItem('user', obj)`)

**The mistake:** Writing `localStorage.setItem('user', { name: 'Alice' })`.

**Why it's wrong:** Web Storage stores data strictly as string primitives! Passing an object implicitly calls `.toString()`, storing literal string `"[object Object]"`. Use `JSON.stringify()`.

*Incorrect:*
```html
localStorage.setItem('user', { id: 1 }); // ❌ Stores string '[object Object]'!
```

*Fix:*
```html
localStorage.setItem('user', JSON.stringify({ id: 1 }));
```



### Mistake 7: Storing Sensitive Auth JWT Tokens in `localStorage` (XSS Attack Vector)

**The mistake:** Writing `localStorage.setItem('authToken', token)`.

**Why it's wrong:** Data stored in `localStorage` is accessible to ANY JavaScript running on the origin domain. If an XSS vulnerability exists, attackers can steal tokens. Use `HttpOnly` cookies.

*Incorrect:*
```html
localStorage.setItem('jwt', token); // ❌ Vulnerable to XSS token theft!
```

*Fix:*
```html
// Set auth tokens in server HttpOnly, Secure cookies
```

### Mistake 8: Forgetting to Stringify Objects Before Saving to Web Storage (`localStorage.setItem('user', obj)`)

**The mistake:** Writing `localStorage.setItem('user', { name: 'Alice' })`.

**Why it's wrong:** Web Storage stores data strictly as string primitives! Passing an object implicitly calls `.toString()`, storing literal string `"[object Object]"`. Use `JSON.stringify()`.

*Incorrect:*
```html
localStorage.setItem('user', { id: 1 }); // ❌ Stores string '[object Object]'!
```

*Fix:*
```html
localStorage.setItem('user', JSON.stringify({ id: 1 }));
```

## 6. Practice Exercises

### Exercise 1: Session vs Local

**Problem:** A user is filling out a massive 5-page insurance form. If they accidentally close the browser tab, you want their progress to be lost for security reasons. However, if they just refresh the page, the data should stay. Should you save their draft in `localStorage` or `sessionStorage`?

**Expected output:**
> [!check]- Answer
> ```text
> `sessionStorage`. It is designed perfectly for this. It survives page reloads, but is instantly wiped clean the second the specific browser tab is closed.
> ```
> - Which one lives forever, and which one dies with the tab?
> 
---



### Exercise 2: localStorage vs sessionStorage Comparison

**Problem:** Compare `localStorage` vs `sessionStorage` persistence lifespan.

**Expected output:**
> [!check]- Answer
> ```text
> localStorage persists indefinitely until cleared; sessionStorage expires when browser tab/window closes.
> ```
> ```text
> localStorage persists indefinitely until cleared; sessionStorage expires when browser tab/window closes.
> ```
>
> **Explanation:** `sessionStorage` scope is limited to active tab sessions.
> 
---

### Exercise 3: JSON Parsing Web Storage Objects

**Problem:** Write JS line safely retrieving and parsing JSON object `'settings'` from `localStorage`.

**Expected output:**
> [!check]- Answer
> ```text
> const settings = JSON.parse(localStorage.getItem('settings') || '{}');
> ```
> ```javascript
> const settings = JSON.parse(localStorage.getItem('settings') || '{}');
> ```
>
> **Explanation:** `JSON.parse()` deserializes string data back into JavaScript objects.
> 
## 7. Related Terms
- [`<script>`](../level_08/script.md) — Web Storage is an API accessed entirely through JavaScript.
- [Content Security Policy (CSP) & HTML Security](security.md) — Securing local database structures against injection exploits.
- [Geolocation API](geolocation.md) — Related concept: Geolocation API.

---

## 8. Key Takeaways
- The HTML5 Web Storage API provides `localStorage` (persistent) and `sessionStorage` (temporary).
- It replaces Cookies for storing application data (like shopping carts or UI preferences).
- It only stores plain strings; use JSON to store complex data.
- **NEVER** store sensitive data (passwords, secure tokens) in Web Storage due to XSS vulnerability risks.
