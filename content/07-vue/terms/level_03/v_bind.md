# `v-bind`

> **Level 3 — Directives**
> A Vue directive used to dynamically bind a JavaScript variable to an HTML attribute (like `src`, `href`, `class`, or `disabled`).

---

## 1. Prerequisites
- [Directives](directives.md) — The category `v-bind` belongs to.
- [Reactive State](../level_02/reactive_state.md) — The data `v-bind` listens to.

---

## 2. Term Category
- **Vue Directive**

---

## 3. Environment Context
- **Vue Templates**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you write `<img src="user.avatar" />`, the browser will literally look for a file named `user.avatar` on your server and return a 404 error. The browser thinks it is a literal string.
To tell Vue, *"Wait, `user.avatar` is a JavaScript variable, please evaluate it!"*, you must use **`v-bind`**.

### (2) The Shorthand Syntax (`:`)
Because `v-bind` is the most frequently used directive in Vue, typing `v-bind:` hundreds of times gets tedious. 
Vue provides a shorthand: you simply replace `v-bind:` with a single colon `:`.

```html
<!-- Long, explicit way -->
<a v-bind:href="websiteUrl">Click Here</a>
<img v-bind:src="imageUrl" v-bind:alt="imageDescription" />

<!-- The modern, standard shorthand (Just use the colon!) -->
<a :href="websiteUrl">Click Here</a>
<img :src="imageUrl" :alt="imageDescription" />
```

### (3) Class and Style Binding
`v-bind` is particularly powerful for CSS classes. You can pass it an object where the key is the class name, and the value is a boolean determining if the class should be applied.
```html
<!-- If `hasError` is true, it adds the 'text-red' class -->
<div :class="{ 'text-red': hasError, 'text-green': isSuccess }">
  Status Message
</div>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting the colon when passing props

**The mistake:** A developer has a `<VideoPlayer>` component that takes a `speed` prop. They want the speed to be the number `2`.
They write: `<VideoPlayer speed="2" />`

**Why it's wrong:** Without the colon, Vue treats the attribute as a static string. It passes the *string* `"2"` into the component. If the component tries to do `speed * 5`, it might result in a JavaScript type error or unexpected behavior.
**Golden Rule:** If you want to pass a JavaScript Number, Boolean, Array, or Object as a prop, you MUST use the `:` shorthand. (`<VideoPlayer :speed="2" />` correctly evaluates the number 2 in JS).

---

### Mistake 2: Passing Numeric/Boolean Literal Values Without `v-bind` (String Coercion Trap)

**The mistake:** Writing `<MyComponent count="10" is-active="true" />` expecting props to be numeric `10` and boolean `true`.

**Why it's wrong:** Without `v-bind` (`:`), props pass as raw literal STRINGS (`"10"` and `"true"`). Use `:count="10"` and `:is-active="true"` to pass JS primitive values.

*Incorrect:*
```vue
<MyComponent count="10" is-active="true" /> <!-- ❌ Passes string '10' and string 'true'! -->
```

*Fix:*
```vue
<MyComponent :count="10" :is-active="true" /> <!-- Passes number 10 and boolean true -->
```

---

### Mistake 3: Using Mustaches Inside `v-bind` Directives (`:src="{{ url }}"`)

**The mistake:** Writing `<img :src="{{ logo }}">`.

**Why it's wrong:** `v-bind` values are evaluated directly as JavaScript expressions. Adding mustache `{{ }}` inside `v-bind` creates a template syntax error.

*Incorrect:*
```vue
<img :src="{{ logo }}"> <!-- ❌ Syntax error! Do not mix v-bind with mustaches! -->
```

*Fix:*
```vue
<img :src="logo"> <!-- Plain JS variable expression -->
```


---

## 6. Practice Exercises

### Exercise 1: Dynamic Disabling

**Problem:** You have a `const isSubmitting = ref(false)`. How do you ensure the `<button>` is disabled while the form is submitting?

**Expected output:**
> [!check]- Answer
> ```html
> <button :disabled="isSubmitting">Submit</button>
> 
> // When isSubmitting is true, the button is disabled. 
> // When it is false, Vue automatically removes the disabled attribute!
> ```
> - Bind the HTML `disabled` attribute to the reactive variable.
> 
---

### Exercise 2: Dynamic Class and Style Binding

**Problem:** Write template bindings for:
1. Dynamic class `active` toggled by boolean `isActive` (`:class="{ active: isActive }"`)
2. Dynamic inline color style (`:style="{ color: activeColor }"`)

**Expected output:**
> [!check]- Answer
> ```html
> <div :class="{ active: isActive }">Class</div>
> <div :style="{ color: activeColor }">Style</div>
> ```
> - Class object syntax: `{ className: booleanCondition }`.
> - Style object syntax: `{ cssProperty: jsVariable }`.
> 
> ```html
> <div :class="{ active: isActive, 'text-danger': hasError }">Class</div>
> <div :style="{ color: activeColor, fontSize: fontSize + 'px' }">Style</div>
> ```
> 
---

### Exercise 3: Same-Name Attribute Binding Shorthand (Vue 3.4+)

**Problem:** What shorthand syntax introduced in Vue 3.4 replaces `:id="id"` or `:src="src"` when attribute name matches variable name?

**Expected output:**
> [!check]- Answer
> ```text
> :id or :src (e.g. <img :src />)
> ```
> - Vue 3.4 introduced same-name attribute binding shorthand.
> 
> ```html
> <!-- Same-name shorthand -->
> <img :src /> <!-- Equivalent to :src="src" -->
> <div :id />  <!-- Equivalent to :id="id" -->
> ```
> 
> 
---

## 7. Related Terms
- [Directives](directives.md) — The parent concept.
- [Props](../level_04/props.md) — `v-bind` is how you pass variables down to child components as props.
- [Custom Directives (`v-*`)](custom_directives.md) — Related concept: Custom Directives (`v-*`).
- [`v-model`](v_model.md) — Related concept: `v-model`.
- [`v-on`](v_on.md) — Related concept: `v-on`.

---

## 8. Key Takeaways
- **`v-bind`** tells Vue to treat an HTML attribute's value as JavaScript instead of a static string.
- You should almost always use the shorthand syntax: a single colon (`:`).
- It is incredibly powerful for conditionally applying CSS classes using objects (`:class="{ active: isActive }"`).
- You must use it to pass non-string data types (Numbers, Booleans, Objects) as props to child components.
