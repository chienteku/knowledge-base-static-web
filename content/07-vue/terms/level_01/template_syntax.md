# Template Syntax

> **Level 1 — Core Concepts & Reactivity**
> Vue's HTML-based syntax that allows you to declaratively bind the rendered DOM to the underlying component's data using simple, readable tags.

---

## 1. Prerequisites
- [HTML](../../../01-html/terms/level_01/html.md) — Vue templates are just extended HTML.
- [Declarative Rendering](../level_01/declarative_rendering.md) — What the template syntax achieves.

---

## 2. Term Category
- **Vue Core Concept / Syntax**

---

## 3. Environment Context
- **Vue Single-File Components (`.vue` files)**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
React forces you to use JSX—JavaScript that *looks* like HTML. While powerful, JSX breaks the traditional mental model of web development (separating HTML, CSS, and JS).
Vue takes a different approach. A Vue template is just **100% valid HTML**. If you copy and paste a standard HTML file into a Vue template, it works perfectly. Vue then extends that standard HTML with special syntax (like `{{ }}` and `v-`) to allow JavaScript data to flow into the HTML. 
This makes Vue incredibly easy to learn for designers and traditional web developers.

### (2) Text Interpolation (The Mustache Syntax)
The most basic form of data binding is text interpolation using "Mustaches" (double curly braces).
```html
<template>
  <!-- The {{ message }} will be replaced by the JavaScript variable -->
  <h1>{{ message }}</h1>
  
  <!-- You can put basic JavaScript expressions inside them! -->
  <p>2 + 2 equals {{ 2 + 2 }}</p>
  <p>Welcome, {{ user.name.toUpperCase() }}</p>
</template>
```

### (3) Directives (The `v-` prefix)
Mustaches only work for text *inside* an HTML tag. If you want to change an HTML *attribute* (like the `src` of an image or the `disabled` state of a button), you cannot use mustaches. You must use Vue Directives.
```html
<template>
  <!-- BAD: This will not work! -->
  <img src="{{ imageUrl }}" />

  <!-- GOOD: Use a directive to bind attributes -->
  <img v-bind:src="imageUrl" />
</template>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Putting complex logic in Templates

**The mistake:** A developer writes:
`<div>{{ message.split('').reverse().join('') }}</div>`

**Why it's wrong:** Templates are supposed to be simple, declarative representations of your UI. Putting heavy JavaScript algorithms inside HTML makes the code unreadable and impossible to unit test.
**Golden Rule:** Keep templates simple. If the logic requires more than a simple ternary operator (`? :`), move it into a [Computed Property](../level_02/computed_properties.md) in your JavaScript.

---

### Mistake 2: Writing Complex Multi-Line Logic Expressions Inside Template Mustaches `{{ }}`

**The mistake:** Writing `{{ list.filter(x => x.active).map(x => x.name).join(', ') }}` inside HTML templates.

**Why it's wrong:** Templates should remain clean and declarative for readability. Heavy logic expressions inside mustaches bloat templates and reduce performance. Move logic to a `computed` property.

*Incorrect:*
```vue
<p>{{ items.filter(i => i.price > 100).map(i => i.name).reverse().join(' | ') }}</p> <!-- ❌ Heavy inline template logic! -->
```

*Fix:*
```vue
<!-- Template stays clean -->
<p>{{ expensiveItemNames }}</p>

<script setup>
const expensiveItemNames = computed(() => 
  items.value.filter(i => i.price > 100).map(i => i.name).reverse().join(' | ')
);
</script>
```

---

### Mistake 3: Using Raw `v-html` for User-Generated Input (Cross-Site Scripting XSS Vulnerability)

**The mistake:** Rendering un-sanitized user comment strings using `v-html="userComment"`.

**Why it's wrong:** `v-html` parses and executes raw HTML markup, allowing attackers to inject malicious `<script>` tags and execute XSS attacks. Use text interpolation `{{ }}` or sanitize HTML.

*Incorrect:*
```vue
<div v-html="userComment"></div> <!-- ❌ Vulnerable to XSS script injection! -->
```

*Fix:*
```vue
<div>{{ userComment }}</div> <!-- Escapes HTML tags safely -->
```


---

## 6. Practice Exercises

### Exercise 1: Valid vs Invalid Expressions

**Problem:** Which of the following expressions will cause a fatal error inside a Vue template `{{ }}`?
A) `user.age >= 18 ? 'Adult' : 'Child'`
B) `Math.random()`
C) `let x = 5`
D) `message.length`

**Expected output:**
```text
C is invalid.
Template mustaches can only contain single JavaScript EXPRESSIONS (things that resolve to a value). 
They cannot contain JavaScript STATEMENTS (like `let`, `if`, `for`, or `return`).
```

> [!check]- Answer
> - If you can't put it on the right side of an equals sign (`const result = ...`), you can't put it in a mustache.

---

### Exercise 2: Directive Shorthand Conversion

**Problem:** Convert full directive syntax to shorthand equivalents:
1. `v-bind:src="imgUrl"` 
2. `v-on:click="submitForm"` 
3. `v-slot:header` 

**Expected output:**
```text
1. :src="imgUrl"
2. @click="submitForm"
3. #header
```

> [!check]- Answer
> - `:` shorthand for `v-bind`
> - `@` shorthand for `v-on`
> - `#` shorthand for `v-slot`
> 
> ```html
> <img :src="imgUrl">
> <button @click="submitForm">Submit</button>
> <template #header>Header Content</template>
> ```

---

### Exercise 3: JavaScript Expressions in Mustaches

**Problem:** Which of the following is valid inside mustache `{{ }}`: A single JS expression or a multi-line JS statement?

**Expected output:**
```text
Only single JavaScript expressions (e.g. {{ ok ? 'YES' : 'NO' }}). Statements (var a = 1) or control flow (if/else) are invalid.
```

> [!check]- Answer
> - Mustaches accept expressions that evaluate to a value.
> 
> ```html
> <!-- Valid Expression -->
> {{ message.split('').reverse().join('') }}
> ```


---

## 7. Related Terms
- [Directives](../level_03/directives.md) — The special `v-` attributes used in templates.
- [Computed Properties](../level_02/computed_properties.md) — Where complex logic should live instead of the template.

---

## 8. Key Takeaways
- **Vue Template Syntax** is just valid HTML extended with special features.
- Use **`{{ }}` (Mustaches)** to inject JavaScript values into text.
- Mustaches only support single JavaScript expressions, not statements.
- You cannot use mustaches inside HTML attributes; you must use Directives (like `v-bind`).
- Keep logic in templates as simple as possible.
