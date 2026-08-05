# Directives

> **Level 3 — Directives**
> Special attributes provided by Vue, prefixed with `v-`, that apply reactive behavior to the rendered HTML DOM.

---

## 1. Prerequisites
- [Template Syntax](../level_01/template_syntax.md) — The HTML structure where directives are used.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The core philosophy directives implement.

---

## 2. Term Category
- **Vue Core Concept / Syntax**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In standard HTML, attributes are static. If you write `<img src="logo.png">`, the image source is permanently "logo.png". 
But in a modern web app, you need HTML attributes to change based on JavaScript variables. For example, if a user switches to Dark Mode, the `class` attribute needs to change.
React solves this by forcing you to write JavaScript (JSX). Vue solves this by providing **Directives**—special extended HTML attributes that tell Vue: *"Hey, treat the value of this attribute as a JavaScript expression, not a static string!"*

### (2) The Structure of a Directive
Directives always start with **`v-`**. 
A directive often takes an **argument** (denoted by a colon `:`) and a **modifier** (denoted by a dot `.`).

```html
<!-- `v-on` is the Directive. `click` is the argument. `prevent` is the modifier. -->
<form v-on:click.prevent="submitData"></form>
```

### (3) The Core Directives
Vue has a handful of built-in directives that handle 99% of your logic:
- `v-bind`: Syncs HTML attributes to state.
- `v-on`: Listens for DOM events (clicks, typing).
- `v-model`: Creates two-way data binding for forms.
- `v-if` / `v-show`: Conditionally renders HTML elements.
- `v-for`: Loops over arrays to render lists of elements.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using Mustaches inside HTML attributes

**The mistake:** A developer tries to dynamically change a button's `disabled` state like this:
`<button disabled="{{ isFormInvalid }}">Submit</button>`

**Why it's wrong:** [Mustaches (`{{ }}`)](../level_01/template_syntax.md) can ONLY be used for text content *between* HTML tags (e.g., `<p>{{ text }}</p>`). They absolutely cannot be used inside HTML attributes. 
**Golden Rule:** If you need to make an HTML attribute dynamic, you MUST use the `v-bind` directive.

---

### Mistake 2: Confusing Dynamic Directive Arguments (`:[attr]`) with Static Strings

**The mistake:** Writing `<a v-bind:[attrName]="url">` without declaring `attrName` as a reactive variable.

**Why it's wrong:** Dynamic directive arguments inside square brackets `:[arg]` evaluate as JavaScript expressions. If `attrName` is undefined, Vue issues a warning or evaluates to null.

*Incorrect:*
```vue
<a v-bind:[href]="url">Link</a> <!-- ❌ 'href' treated as JS variable href, not literal string 'href'! -->
```

*Fix:*
```vue
<a :[attributeName]="url">Link</a>

<script setup>
const attributeName = ref('href'); // Dynamic attribute name
</script>
```

---

### Mistake 3: Using Directive Names Without the `v-` Prefix in Templates

**The mistake:** Writing `<div if="show">Content</div>` instead of `<div v-if="show">`.

**Why it's wrong:** Vue directives MUST begin with the `v-` prefix. Standard HTML attributes like `if` or `for` are ignored by Vue's template compiler.

*Incorrect:*
```vue
<div if="isLoggedIn">Welcome</div> <!-- ❌ Plain HTML attribute ignored by Vue! -->
```

*Fix:*
```vue
<div v-if="isLoggedIn">Welcome</div> <!-- Valid Vue directive -->
```


---

## 6. Practice Exercises

### Exercise 1: Spot the Directive

**Problem:** Look at this Vue template. Identify all the standard HTML attributes, and identify all the Vue directives.
`<input type="text" class="input-box" v-model="username" v-on:keyup.enter="login" />`

**Expected output:**
> [!check]- Answer
> ```text
> Standard HTML attributes: `type`, `class`
> Vue Directives: `v-model`, `v-on`
> (Vue will evaluate the directives using JavaScript, and pass the standard HTML attributes straight to the browser untouched).
> ```
> - Look for the `v-` prefix!

---

### Exercise 2: Built-in Directive Mapping

**Problem:** Match directive to purpose:
1. `v-text` 
2. `v-html` 
3. `v-pre` 
4. `v-cloak` 

**Expected output:**
> [!check]- Answer
> ```text
> 1. Updates element textContent
> 2. Updates element innerHTML
> 3. Skips compilation for element and children
> 4. Hides un-compiled mustache templates until Vue mounts
> ```
> - `v-text` sets textContent safely.
> - `v-html` sets raw innerHTML.
> - `v-pre` skips template compilation.
> - `v-cloak` hides raw mustache templates during initial load.
> 
> ```html
> <span v-text="msg"></span>
> <div v-cloak>{{ msg }}</div>
> ```

---

### Exercise 3: v-once Directive Benefit

**Problem:** What performance benefit does `v-once` provide when placed on a static HTML element tree?

**Expected output:**
> [!check]- Answer
> ```text
> v-once renders the element tree once and skips all future updates, optimizing rendering performance for static content.
> ```
> - `v-once` caches rendered static DOM subtrees.
> 
> ```html
> <div v-once>Static Header: {{ title }}</div>
> ```


---

## 7. Related Terms
- [`v-bind`](v_bind.md) — The most common directive.
- [Template Syntax](../level_01/template_syntax.md) — Where directives live.
- [`v-for` (List Rendering) & `:key`](v_for_key.md) — List rendering directive.
- [Custom Directives (`v-*`)](custom_directives.md) — Creating your own directive lifecycle handlers.
- [Event, Key & Form Modifiers](modifiers.md) — Related concept: Event, Key & Form Modifiers.
- [`v-if` / `v-show`](v_if_show.md) — Related concept: `v-if` / `v-show`.
- [`v-model`](v_model.md) — Related concept: `v-model`.

---

## 8. Key Takeaways
- **Directives** are special HTML attributes prefixed with `v-`.
- They apply reactive, JavaScript-driven behavior directly to the DOM.
- They allow you to manipulate HTML attributes without writing imperative `document.querySelector` code.
- Mustaches (`{{ }}`) cannot be used inside HTML attributes; you must use directives instead.
