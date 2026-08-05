# `v-if` / `v-show`

> **Level 3 — Directives**
> The two directives used for Conditional Rendering in Vue. They allow you to show or hide elements based on a JavaScript boolean, but they achieve it in fundamentally different ways under the hood.

---

## 1. Prerequisites
- [Directives](directives.md) — The category these belong to.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The philosophy of hiding things via state rather than `display: none`.
---

## 2. Term Category
- **Vue Directive**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications constantly need to show or hide things. "Show the Login button if the user is not authenticated. Show the Dashboard if they are."
Instead of writing JavaScript `if` statements that manually add or remove DOM nodes, Vue allows you to put the `if` statement directly onto the HTML tag.

### (2) `v-if`: The Destroyer
When you use `v-if`, Vue physically destroys the element and removes it from the real DOM when the condition is `false`. When it becomes `true`, Vue completely rebuilds the component from scratch.

```html
<!-- If isVisible is false, this <div> completely ceases to exist in the browser DOM -->
<div v-if="isVisible">
  <h1>I am a heavy component!</h1>
</div>
<div v-else>
  <p>I show up when it's false!</p>
</div>
```

### (3) `v-show`: The Hider
When you use `v-show`, Vue renders the element, mounts it to the DOM, and keeps it there forever. If the condition is `false`, Vue simply adds the inline CSS style `display: none;` to hide it visually.

```html
<!-- If isVisible is false, this becomes: <div style="display: none;"> -->
<div v-show="isVisible">
  <h1>I am always in the DOM!</h1>
</div>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using `v-if` for frequently toggled items

**The mistake:** A developer creates an accordion dropdown menu that opens and closes when clicked. They use `v-if="isOpen"` on the dropdown content.

**Why it's wrong:** `v-if` has a high "Toggle Cost". Destroying and rebuilding DOM nodes every time a user clicks the accordion causes unnecessary CPU work and sluggish animations.
**Golden Rule:** If an element toggles on and off very frequently (like a dropdown menu, modal, or tab), use **`v-show`** (which just changes CSS). If an element rarely changes (like an Admin panel vs a User panel), use **`v-if`** to save memory.

---

### Mistake 2: Using `v-if` for High-Frequency Visibility Toggles (Performance Overhead)

**The mistake:** Using `v-if="isOpen"` for a dropdown menu toggled 50 times per minute.

**Why it's wrong:** `v-if` physically mounts and unmounts DOM nodes and component trees on every toggle. For high-frequency toggles, `v-show` toggles CSS `display: none` without unmounting nodes.

*Incorrect:*
```vue
<!-- High frequency toggle causing repeated DOM creation/destruction -->
<Dropdown v-if="isOpen" />
```

*Fix:*
```vue
<!-- High frequency toggle using CSS display property -->
<Dropdown v-show="isOpen" />
```

---

### Mistake 3: Expecting `v-show` to Prevent Initial Component Mounting Execution

**The mistake:** Using `v-show="user !== null"` on a component accessing `user.name` when `user` is initially `null`.

**Why it's wrong:** `v-show` ALWAYS renders and mounts the element in the DOM (setting `display: none`). It cannot guard against `TypeError: Cannot read properties of null` during initial mount. Use `v-if` for null guards.

*Incorrect:*
```vue
<div v-show="user !== null">{{ user.name }}</div> <!-- ❌ Throws TypeError on initial render! -->
```

*Fix:*
```vue
<div v-if="user !== null">{{ user.name }}</div> <!-- Guards component rendering -->
```


---

## 6. Practice Exercises

### Exercise 1: The Heavy API Call

**Problem:** You have a `<Dashboard>` component. Inside its `mounted()` lifecycle hook, it makes 5 massive API requests. The user is on the Login screen, so `isLoggedIn` is false. 
If you write `<Dashboard v-show="isLoggedIn" />`, what terrible thing happens?

**Expected output:**
> [!check]- Answer
> ```text
> The Dashboard will still execute its `mounted()` hook and make all 5 API calls in the background!
> Because `v-show` physically mounts the component to the DOM (it just hides it with CSS), the component fully initializes. 
> You MUST use `v-if` here to prevent the component from existing and executing its code before the user logs in!
> ```
> - Does `v-show` prevent a component from mounting?

---

### Exercise 2: v-if / v-else-if / v-else Chain Pattern

**Problem:** Write template conditional chain rendering `Admin`, `Member`, or `Guest` based on string `role`.

**Expected output:**
> [!check]- Answer
> ```html
> <div v-if="role === 'admin'">Admin</div>
> <div v-else-if="role === 'member'">Member</div>
> <div v-else>Guest</div>
> ```
> - `v-else-if` and `v-else` must immediately follow `v-if` elements.
> 
> ```html
> <div v-if="role === 'admin'">Admin Dashboard</div>
> <div v-else-if="role === 'member'">Member Area</div>
> <div v-else>Guest Welcome</div>
> ```

---

### Exercise 3: v-if vs v-show Trade-Off Matrix

**Problem:** Compare `v-if` vs `v-show` across:
1. Initial render cost
2. Toggle cost
3. Lifecycle hooks execution on toggle

**Expected output:**
> [!check]- Answer
> ```text
> 1. v-if has lower initial render cost (lazy if false); v-show has higher initial render cost
> 2. v-if has higher toggle cost (DOM destruction); v-show has low toggle cost (CSS display toggle)
> 3. v-if triggers unmount/mount hooks; v-show triggers zero lifecycle hooks on toggle
> ```
> - `v-if` -> Lazy initial render, high toggle cost, triggers lifecycle hooks.
> - `v-show` -> High initial render, low toggle cost (CSS display), no lifecycle hooks.
> 
> ```text
> Use v-if for rare toggles / null guards; Use v-show for frequent toggles.
> ```


---

## 7. Related Terms
- [Component Lifecycle](../level_04/component_lifecycle.md) — `v-if` triggers the Mount/Unmount lifecycles. `v-show` does not.
- [Reactive State](../level_02/reactive_state.md) — The boolean data that controls these directives.
- [`v-for` (List Rendering) & `:key`](v_for_key.md) — Related concept: `v-for` (List Rendering) & `:key`.
- [Async Components](../level_08/async_components.md) — Related concept: Async Components.
- [KeepAlive](../level_08/keepalive.md) — Related concept: KeepAlive.
- [Transitions & Animations](../level_10/transition.md) — Related concept: Transitions & Animations.
- [Directives](directives.md) — Directives.
- [Template Syntax](../level_01/template_syntax.md) — Template syntax.
---

## 8. Key Takeaways
- **`v-if`** completely destroys and rebuilds elements in the DOM. Use it for elements that change rarely, or to prevent heavy components from running before they are needed.
- **`v-if`** supports `v-else-if` and `v-else` chains.
- **`v-show`** renders the element permanently, but toggles its visibility using CSS `display: none`. 
- Use **`v-show`** for elements that toggle very frequently (like menus) to save CPU power.
