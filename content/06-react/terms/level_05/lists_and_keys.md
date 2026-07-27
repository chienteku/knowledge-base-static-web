# Lists & Keys

> **Level 5 — DOM & Event Handling**
> The technique of transforming an array of JavaScript data into an array of JSX elements, and the strict requirement to provide a unique "Key" to each element for performance tracking.

---

## 1. Prerequisites
- [JSX](../level_01/jsx.md) — Understanding that JSX elements can be stored in arrays.
- [Virtual DOM](../level_01/virtual_dom.md) — How React diffs arrays of elements to find changes.

---

## 2. Term Category
- **React Syntax / List Rendering**

---

## 3. Environment Context
- **Universal**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Web apps are built on lists: a list of tweets, a list of shopping cart items, a list of users.
In React, you don't write a `for` loop to append HTML elements to the page. Instead, you use the functional JavaScript array method: **`.map()`**.
`.map()` takes an array of data (like strings or objects) and transforms it into an array of JSX elements. React is smart enough to take an array of JSX and render it directly to the screen!

```javascript
function TodoList() {
  const todos = ['Eat', 'Sleep', 'Code'];

  return (
    <ul>
      {todos.map((todo) => (
        <li>{todo}</li>
      ))}
    </ul>
  );
}
```

### (2) The "Key" Warning
If you run the code above, the UI will work, but the console will scream a bright red warning: *"Warning: Each child in a list should have a unique 'key' prop."*
**Why?** The Virtual DOM. 
Imagine you have a list of 1,000 items. You delete the item at index `2`. 
React looks at the old array and the new array. Without keys, React doesn't know you *deleted* item 2. It thinks you changed the text of item 2 to item 3, changed 3 to 4, changed 4 to 5, all the way down to 1,000! It will re-render 998 items.
By providing a unique `key` (like a database ID), React can instantly track elements. It says, "Oh, the element with `key='104'` is missing. I will just delete that one node from the DOM and leave the other 999 alone."

### (3) How to use Keys
You attach the `key` prop to the outermost element returned by the `.map()` function. It must be a string or number that uniquely identifies that item (usually a database ID).
```javascript
{users.map((user) => (
  <li key={user.id}>{user.name}</li>
))}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Using the Array Index as a Key

**The mistake:** A developer doesn't have an ID, so they use the `.map()` index parameter: `<li key={index}>`.

**Why it's wrong:** An index is NOT tied to the data; it's tied to the position. If you have `['A', 'B']`, `A` is index `0`. If you insert `Z` at the beginning (`['Z', 'A', 'B']`), `A` is now index `1`!
React sees that the element at `key=0` changed from 'A' to 'Z', so it forces a massive re-render, completely breaking component state and animations.
**Golden Rule:** Only use `index` as a last resort for lists that will NEVER be reordered, sorted, added to, or deleted from.

---



### Mistake 2: Using Array Indices as Component `key` Props for Dynamic Re-Orderable Lists

**The mistake:** Writing `items.map((item, index) => <Todo key={index} todo={item} />)` for a list that can be deleted or re-ordered.

**Why it's wrong:** Using array indices as keys breaks component state identity when items are added, deleted, or sorted. React associates internal state (like input text or accordion collapse state) by key, causing state misplacement bugs.

*Incorrect:*
```javascript
items.map((item, index) => <Todo key={index} todo={item} />); // ❌ State bugs on item re-order!
```

*Fix:*
```javascript
items.map(item => <Todo key={item.id} todo={item} />); // Stable item ID key
```

### Mistake 3: Generating Dynamic Keys During Render via `Math.random()` or `uuid()`

**The mistake:** Writing `items.map(item => <Todo key={Math.random()} todo={item} />)`.

**Why it's wrong:** Generating new keys during render forces React to unmount and re-create EVERY DOM element on EVERY single re-render, destroying component state and input focus.

*Incorrect:*
```javascript
items.map(item => <Todo key={Math.random()} todo={item} />); // ❌ Destroys DOM nodes every render!
```

*Fix:*
```javascript
Use persistent unique item data IDs: key={item.id}
```

## 6. Practice Exercises

### Exercise 1: The Wrapper Key

**Problem:** Look at this `.map()`. Where exactly should the `key` prop be placed?
```javascript
{posts.map(post => {
  return (
    <div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
    </div>
  )
})}
```

**Expected output:**
```text
The `key` belongs on the `<div>`.
It must ALWAYS be attached to the outermost element returned inside the map function.
`<div key={post.id}>`
```

> [!check]- Answer
> - React needs to track the entire "block" returned by the map.

---



### Exercise 2: Mapping Array to List Component with Key

**Problem:** Map array `products` returning `<li>` tags showing `name` and `price` with `key={product.id}`.

**Expected output:**
```text
function ProductList({ products }) { return <ul>{products.map(p => <li key={p.id}>{p.name} - ${p.price}</li>)}</ul>; }
```

> [!check]- Answer
> ```javascript
> function ProductList({ products }) {
>   return (
>     <ul>
>       {products.map(p => (
>         <li key={p.id}>{p.name} - ${p.price}</li>
>       ))}
>     </ul>
>   );
> }
> ```
>
> **Explanation:** Stable item keys allow React reconciliation to track item insertions and re-orders.

### Exercise 3: Where Key Props Must Be Placed

**Problem:** Where must `key` props be specified when extracting list items into custom child components? (Directly on the custom child component tag inside the `.map()` callback).

**Expected output:**
```text
Directly on the custom child component tag inside the .map() callback
```

> [!check]- Answer
> ```javascript
> // Correct:
> items.map(item => <ListItem key={item.id} item={item} />)
> ```
>
> **Explanation:** Keys belong on the immediate outer element returned inside the array map callback.

## 7. Related Terms
- [Virtual DOM](../level_01/virtual_dom.md) — The system that requires the Keys to perform efficient diffing.

---

## 8. Key Takeaways
- Use the `.map()` function to render lists of data in React.
- Every item returned by a `.map()` MUST have a unique `key` prop attached to its outermost element.
- React uses these Keys to efficiently track additions, deletions, and re-orderings in the Virtual DOM.
- Never use the array `index` as a key if the list can be reordered or modified; use a stable, unique ID (like a database ID).
