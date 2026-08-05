# `v-once` & `v-memo`

> **Level 8 — Performance & Optimization**
> Two advanced Vue directives used to heavily optimize the Virtual DOM rendering process by intentionally telling Vue to skip checking certain HTML elements for updates.

---

## 1. Prerequisites
- [Virtual DOM (Vue)](virtual_dom.md) — The diffing process that these directives try to skip.
- [Directives](../level_03/directives.md) — What these are.
---

## 2. Term Category
- **Vue Performance Directives**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Vue's Virtual DOM diffing algorithm is incredibly fast. However, if you are rendering a massive table with 5,000 rows, and a user clicks a button that updates one piece of unrelated state, Vue still has to spend CPU cycles checking if those 5,000 rows need to be updated.
**`v-once`** and **`v-memo`** are manual optimization escape hatches. They allow the developer to yell at the Vue compiler: *"Do NOT waste CPU cycles checking this element. I guarantee you it hasn't changed!"*

### (2) `v-once` (Render exactly ONE time)
If a block of HTML relies on data that will *never* change after the initial load (like an article's body text, or a user's static username), use `v-once`.
Vue will render it the first time, and then treat it as static HTML forever. It will completely skip it during future Virtual DOM diffs.

```html
<!-- This heading will render "Alice" once, and then ignore all future changes to `user.name` -->
<h1 v-once>Welcome, {{ user.name }}!</h1>
```

### (3) `v-memo` (Render ONLY if specific variables change)
Introduced in Vue 3.2, `v-memo` is the ultimate loop optimization tool. You pass it an array of dependencies. Vue will cache the HTML block. It will only re-render the block if one of those specific dependencies changes. (This is identical to React's `useMemo` dependency array).

```html
<!-- If we have 5000 users, and `selectedUserId` changes to 5... -->
<!-- Vue skips diffing 4999 users, and only re-renders the one user whose ID matches! -->
<div v-for="user in users" :key="user.id" v-memo="[user.id === selectedUserId]">
  <p>{{ user.name }}</p>
  <span v-if="user.id === selectedUserId">SELECTED!</span>
</div>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Premature Optimization

**The mistake:** A developer discovers `v-memo` and starts putting it on every single `<div>`, `<p>`, and `<button>` in their entire application.

**Why it's wrong:** Evaluating the `v-memo` dependency array costs CPU cycles! If the element is small, the cost of checking the `v-memo` array might actually be *slower* than just letting Vue do its standard Virtual DOM diffing.
**Golden Rule:** Only use `v-memo` on extremely large lists (`v-for` with 1,000+ items) or massively complex SVG/chart components. For 99% of UI components, Vue is already fast enough without manual optimization.

---

### Mistake 2: Using `v-memo` Without Providing Dependency Condition Arrays

**The mistake:** Writing `<div v-memo>` without passing a dependency array parameter.

**Why it's wrong:** `v-memo` requires an array of dependencies (`v-memo="[val1, val2]"`). If the array is omitted, it behaves identically to `v-once` (never updating).

*Incorrect:*
```vue
<div v-memo> <!-- ❌ Missing dependency array parameter! -->
  {{ name }}
</div>
```

*Fix:*
```vue
<div v-memo="[name, status]"> <!-- Re-renders ONLY if name or status changes -->
  {{ name }} - {{ status }}
</div>
```

---

### Mistake 3: Over-Using `v-once` on Elements Containing Dynamic Reactive Content

**The mistake:** Placing `v-once` on a user notification counter badge component `<span v-once>{{ unreadCount }}</span>`.

**Why it's wrong:** `v-once` permanently freezes the rendered HTML after initial mount. Future updates to `unreadCount` are completely ignored, displaying stale state to users.

*Incorrect:*
```vue
<span v-once>{{ unreadCount }}</span> <!-- ❌ Never updates when unreadCount changes! -->
```

*Fix:*
```vue
<span>{{ unreadCount }}</span> <!-- Normal dynamic rendering -->
```


---

## 6. Practice Exercises

### Exercise 1: The v-once Trap

**Problem:** You have a translation library. You render a button: `<button v-once>{{ $t('submit_button') }}</button>`. The user changes the app language from English to Spanish. The button text does not change! Why?

**Expected output:**
> [!check]- Answer
> ```text
> Because you used `v-once`! 
> `v-once` literally means "render this once and never, ever touch it again." Even though the `$t` function output changed due to the language swap, Vue completely ignored the button during the update cycle. 
> Remove `v-once` if the data can ever change during the user's session.
> ```
> - Read the literal translation of the directive's name.

---

### Exercise 2: v-memo List Optimization Pattern

**Problem:** Write `v-for` element list item using `v-memo="[item.id === selectedId]"` to optimize rendering performance in a 1,000-item list.

**Expected output:**
> [!check]- Answer
> ```html
> <li v-for="item in list" :key="item.id" v-memo="[item.id === selectedId]">
> ```
> - `v-memo` skips Virtual DOM diffing for items whose selected state hasn't changed.
> 
> ```html
> <li v-for="item in list" :key="item.id" v-memo="[item.id === selectedId]">
>   {{ item.name }}
> </li>
> ```

---

### Exercise 3: v-once vs v-memo Distinction

**Problem:** Distinguish between `v-once` and `v-memo` directives.

**Expected output:**
> [!check]- Answer
> ```text
> v-once renders an element tree once and never updates it; v-memo conditionally re-renders an element tree ONLY when specified dependency array values change.
> ```
> - `v-once` -> Never re-renders after initial mount.
> - `v-memo` -> Conditionally re-renders when dependency array values change.
> 
> ```text
> v-once is static; v-memo is conditionally memoized.
> ```


---

## 7. Related Terms
- [Virtual DOM (Vue)](virtual_dom.md) — What `v-once` and `v-memo` are explicitly optimizing.
- [Computed Properties](../level_02/computed_properties.md) — The JavaScript equivalent of caching derived logic.
- [`v-for` (List Rendering) & `:key`](../level_03/v_for_key.md) — Related concept: `v-for` (List Rendering) & `:key`.
---

## 8. Key Takeaways
- **`v-once`** renders a block of HTML exactly one time and never updates it again, saving CPU cycles during Virtual DOM diffing.
- **`v-memo="[deps]"`** caches a block of HTML and only re-evaluates it if the provided dependencies change.
- `v-memo` is the ultimate tool for optimizing massive `v-for` lists with thousands of items.
- Avoid **Premature Optimization**. Do not use these directives on small components; Vue's engine is already highly optimized.
