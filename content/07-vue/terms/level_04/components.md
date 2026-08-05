# Components

> **Level 4 — Components & Props**
> Reusable, self-contained building blocks of a Vue application that encapsulate their own HTML template, JavaScript logic, and CSS styling.

---

## 1. Prerequisites
- [Vue Instance](../level_01/vue_instance.md) — The root that holds all components.
- [Declarative Rendering](../level_01/declarative_rendering.md) — The logic components use internally.
---

## 2. Term Category
- **Vue Core Concept / Architecture**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In traditional web development, if you had a "User Profile Card" that appeared on 5 different pages, you had to copy and paste the HTML 5 times. If the design changed, you had to hunt down all 5 files and update them manually. 
Vue solves this with **Components**. You define the User Profile Card once. You give it a custom HTML tag name (like `<UserProfile>`). Then, you just use that custom tag anywhere in your app. It's the ultimate form of code reuse.

### (2) The Component Tree
A Vue application is not just one file; it is a **Tree of Components**.
- `<App>` (The Root Component)
  - `<Navbar>`
    - `<SearchBar>`
    - `<UserProfileIcon>`
  - `<MainContent>`
    - `<Sidebar>`
    - `<Feed>`
      - `<Post>` (Reused 10 times)

### (3) Isolation
The most important rule of a component is that it is **isolated**. 
If you use the `<Post>` component 10 times, Vue creates 10 separate, independent instances in memory. If you click a "Like" button inside the 3rd post, only the 3rd post's internal state changes. The other 9 posts are completely unaffected.

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Creating "God Components"

**The mistake:** A developer builds an entire page (Navigation, Sidebar, Feed, Footer) inside a single component file that is 3,000 lines long.

**Why it's wrong:** It completely defeats the purpose of components! It is impossible to test, impossible to reuse parts of the page elsewhere, and a nightmare to read.
**Golden Rule:** If a component is larger than 300 lines of code, or if a specific piece of UI (like a button or a card) appears in more than one place, extract it into its own smaller Component.

---

### Mistake 2: Using Single-Word Component Names (Naming Collisions)

**The mistake:** Naming a custom component `Header.vue` or `Item.vue`.

**Why it's wrong:** HTML5 standards introduce new tags over time. Single-word component names risk collision with standard HTML tags. Use multi-word component names (`AppHeader.vue`, `TodoItem.vue`).

*Incorrect:*
```javascript
// Component file named Header.vue
app.component('Header', Header); // ❌ Conflicts with HTML5 <header> tag!
```

*Fix:*
```javascript
// Multi-word component name
app.component('AppHeader', AppHeader); // Safe multi-word naming
```

---

### Mistake 3: Importing Components in `<script setup>` Without Registering Them (Vue 2 Habit)

**The mistake:** Adding `components: { ChildComponent }` options block inside `<script setup>`.

**Why it's wrong:** In `<script setup>`, imported components are automatically registered and made available to template syntax. Specifying a `components` object is unnecessary.

*Incorrect:*
```vue
<script setup>
import Child from './Child.vue';
export default { components: { Child } }; // ❌ Redundant Options API block in script setup!
</script>
```

*Fix:*
```vue
<script setup>
import Child from './Child.vue'; // Automatically registered and ready to use in <template>
</script>
```


---

## 6. Practice Exercises

### Exercise 1: Component Registration

**Problem:** You created a new file `Button.vue`. In your `App.vue`, you try to write `<Button />` in the template, but Vue throws an error: "Failed to resolve component". What did you forget to do?

**Expected output:**
> [!check]- Answer
> ```text
> You forgot to import it!
> In modern Vue (`<script setup>`), you simply need to import the component into the file where you want to use it:
> `import Button from './Button.vue'`
> Once imported, Vue automatically makes the `<Button>` tag available in the template.
> ```
> - Vue doesn't magically know where your files are.

---

### Exercise 2: SFC Component Import and Usage

**Problem:** Write Vue 3 `<script setup>` importing `BaseCard.vue` and rendering it with title prop `'News'` inside `<template>`.

**Expected output:**
> [!check]- Answer
> ```vue
> <script setup> import BaseCard from './BaseCard.vue'; </script> <template> <BaseCard title="News" /> </template>
> ```
> - Imported SFC components inside `<script setup>` are available directly in template.
> 
> ```vue
> <script setup>
> import BaseCard from './BaseCard.vue';
> </script>
> 
> <template>
>   <BaseCard title="News" />
> </template>
> ```

---

### Exercise 3: PascalCase vs kebab-case Component Naming

**Problem:** Why is PascalCase (`<UserCard />`) recommended for component tags inside Vue Single File Components (SFCs)?

**Expected output:**
> [!check]- Answer
> ```text
> PascalCase tags visually distinguish custom Vue components from native lowercase HTML elements (`<div>`, `<span>`).
> ```
> - PascalCase `<MyComponent />` distinguishes Vue components from native HTML elements.
> 
> ```html
> <AppHeader />
> ```


---

## 7. Related Terms
- [Single-File Components (SFCs)](sfc.md) — The physical file format used to write components.
- [Props](props.md) — How you pass data into a component.
- [Vue Instance](../level_01/vue_instance.md) — Related concept: Vue Instance.
- [Dynamic Components (`<component :is>`)](dynamic_components.md) — Related concept: Dynamic Components (`<component :is>`).
- [Fallthrough Attributes (`$attrs`)](fallthrough_attributes.md) — Related concept: Fallthrough Attributes (`$attrs`).
- [Teleport](../level_05/teleport.md) — Related concept: Teleport.
- [Transitions & Animations](../level_10/transition.md) — Related concept: Transitions & Animations.
- [Vue DevTools](../level_10/vue_devtools.md) — Related concept: Vue DevTools.
- [Vue Test Utils](../level_10/vue_test_utils.md) — Related concept: Vue Test Utils.
- [Slots](../level_05/slots.md) — Related concept: Slots.
- [Provide / Inject](../level_05/provide_inject.md) — Related concept: Provide / Inject.
---

## 8. Key Takeaways
- **Components** are reusable, isolated blocks of UI.
- They allow you to define custom HTML tags (like `<MyButton>`).
- Every Vue application is structured as a hierarchical **Component Tree**.
- Every time you use a component, a brand new, isolated instance is created in memory.
- Keep components small and focused on a single responsibility.
