# Declarative Rendering

> **Level 1 — Core Concepts & Reactivity**
> A programming paradigm where you describe *what* the UI should look like based on the current state, and the framework figures out *how* to update the DOM to match it.

---

## 1. Prerequisites
- [Template Syntax](template_syntax.md) — How you declare the UI in Vue.
- [DOM (Document Object Model)](../../../01-html/terms/level_09/dom.md) — The imperative approach that declarative rendering replaces.

---

## 2. Term Category
- **Programming Paradigm**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Before frameworks like Vue, developers used **Imperative Programming** (Vanilla JS or jQuery). You had to write step-by-step instructions on *how* to change the UI.
*Imperative approach:* "Find the button with ID 'submit'. Check if the user input is empty. If it is empty, set the button's disabled attribute to true. If it has text, remove the disabled attribute."
This is exhausting, error-prone, and leads to spaghetti code. 
Vue uses **Declarative Rendering**. You simply declare the relationship: "The button is disabled IF the input is empty." Vue handles all the DOM manipulation in the background.

### (2) The State-UI Connection
In Vue, the UI is a pure reflection of your JavaScript Data (State). 
When the JavaScript Data changes, Vue automatically detects it and updates the HTML to match. You never manually touch the DOM.

```html
<!-- We DECLARE that this heading's text is tied to the 'name' variable -->
<h1>Hello, {{ name }}!</h1>

<script setup>
import { ref } from 'vue'

const name = ref("Alice")

// Imperative way (BAD): document.querySelector('h1').innerText = "Hello, Bob!"
// Declarative way (GOOD): Just change the data. Vue updates the h1 automatically!
name.value = "Bob"
</script>
```

### (3) The Core Philosophy
In declarative programming, you focus on the **Data**. If there is a bug on the screen, you don't debug the HTML; you debug the JavaScript object holding the data.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to manually touch the DOM

**The mistake:** A developer migrating from jQuery uses `document.getElementById('my-div').classList.add('active')` inside a Vue component to change its color.

**Why it's wrong:** You are fighting the framework. If you manually change the DOM, Vue doesn't know about it. The next time Vue renders, it might overwrite your manual change, causing bizarre bugs.
**Golden Rule:** Never touch the real DOM directly using `document.*`. Change the JavaScript state, and let Vue's declarative templates handle the DOM updates.

---

### Mistake 2: Mutating DOM Elements Directly via `document.getElementById` (Imperative Anti-Pattern)

**The mistake:** Writing `document.getElementById('title').textContent = newTitle` inside a Vue component.

**Why it's wrong:** Direct manual DOM manipulation bypasses Vue's Virtual DOM state management, causing state desynchronization and UI bugs. Update reactive state variables instead.

*Incorrect:*
```javascript
function updateTitle(newTitle) {
  document.getElementById('title').textContent = newTitle; // ❌ Manual DOM mutation!
}
```

*Fix:*
```javascript
const title = ref('Initial Title');
function updateTitle(newTitle) {
  title.value = newTitle; // Declarative state mutation triggers DOM update automatically
}
```

---

### Mistake 3: Attempting to Use Double Mustaches `{{ }}` Inside HTML Attribute Definitions

**The mistake:** Writing `<img src="{{ imageUrl }}">` in Vue templates.

**Why it's wrong:** Mustache interpolation `{{ }}` works ONLY for text content inside HTML tags. To bind dynamic values to HTML attributes, use the `v-bind` directive (`:src="imageUrl"`).

*Incorrect:*
```vue
<img src="{{ logoUrl }}"> <!-- ❌ Mustache syntax in HTML attribute! -->
```

*Fix:*
```vue
<img :src="logoUrl"> <!-- Use v-bind directive shorthand -->
```


---

## 6. Practice Exercises

### Exercise 1: Imperative vs Declarative

**Problem:** You want a `<p>` tag to show "Loading..." while fetching data, and then show the data once it arrives. How do the mental models differ between jQuery (Imperative) and Vue (Declarative)?

**Expected output:**
> [!check]- Answer
> ```text
> Imperative (jQuery): "Hide the data paragraph. Show the loading paragraph. Fetch the data. When it arrives, inject the data into the data paragraph. Hide the loading paragraph. Show the data paragraph."
> 
> Declarative (Vue): "Create an `isLoading` boolean. I declare that the loading paragraph only exists if `isLoading` is true. I declare the data paragraph exists if `isLoading` is false. I fetch the data. When it arrives, I set `isLoading = false`. Vue does the rest."
> ```
> - Imperative = Step-by-step commands. Declarative = Defining rules based on state.

---

### Exercise 2: Declarative State to Template Binding

**Problem:** Write a Vue template rendering message `<h1>Hello {{ user }}</h1>` with a dynamic button toggling `isLoggedIn` boolean state.

**Expected output:**
> [!check]- Answer
> ```html
> <template>
>   <h1>{{ isLoggedIn ? 'Hello ' + user : 'Please log in' }}</h1>
>   <button @click="isLoggedIn = !isLoggedIn">Toggle</button>
> </template>
> ```
> - Use mustache `{{ }}` syntax for text expressions.
> - Bind click handlers declaratively with `@click`.
> 
> ```vue
> <template>
>   <h1>{{ isLoggedIn ? 'Hello ' + user : 'Please log in' }}</h1>
>   <button @click="isLoggedIn = !isLoggedIn">Toggle</button>
> </template>
> ```

---

### Exercise 3: Imperative vs Declarative Paradigm

**Problem:** Distinguish between Imperative UI programming and Vue Declarative Rendering.

**Expected output:**
> [!check]- Answer
> ```text
> Imperative programming explicitly describes HOW to update the DOM step-by-step; Declarative rendering describes WHAT the UI should look like based on current state.
> ```
> - Imperative: Manual DOM step commands.
> - Declarative: Data-driven UI template mapping.
> 
> ```text
> Imperative -> Step-by-step DOM manipulation commands (HOW).
> Declarative -> State-driven UI declaration (WHAT).
> ```


---

## 7. Related Terms
- [Reactive State](../level_02/reactive_state.md) — The data that powers declarative rendering.
- [Template Syntax](template_syntax.md) — The tool used to declare the UI.

---

## 8. Key Takeaways
- **Declarative Rendering** allows you to describe the desired final state of the UI, rather than writing the step-by-step DOM manipulation to get there.
- In Vue, the UI is a direct reflection of your JavaScript state variables.
- When the state changes, the UI updates automatically.
- Never manually manipulate the DOM (`document.querySelector`) inside a Vue component.
