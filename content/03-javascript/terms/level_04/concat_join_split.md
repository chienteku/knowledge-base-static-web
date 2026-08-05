# concat / join / split

> **Level 4 — Iteration & Array Methods**
> Merge arrays / array→string / string→array.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [String](../level_01/string.md) — A sequence of characters representing text.
---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
In programming, we constantly translate data between single raw text strings and structured arrays. For instance, you might receive a comma-separated string from a database (e.g. `"tag1,tag2,tag3"`) and need to parse it into an array of tags, or merge multiple arrays together, or serialize an array of names into a readable sentence. 

To bridge the gap between arrays and strings, JavaScript provides three standard, non-mutating helper methods:
- **`concat()` (Array method):** Merges two or more arrays and returns a new combined array.
- **`join(separator)` (Array method):** Combines all elements of an array into a single string, separated by a specified separator string.
- **`split(separator)` (String method):** Splits a string into an array of substrings based on a specified separator string.

All three methods are pure and do not modify their original targets.

### (2) Reality Metaphor
- **`concat`** is like snapping two train carriages together. You align the rear of train A and the front of train B, forming a longer train line.
- **`join`** is like threading individual beads (array elements) onto a thread to make a single necklace (string). You place a knot or separator bead (the separator argument) between each primary bead.
- **`split`** is the exact reverse: taking scissors and cutting the thread of a necklace at every knot, releasing the individual beads back into a collection box (array).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const list1 = ["A", "B"];
const list2 = ["C", "D"];

const merged = list1.concat(list2); // ["A", "B", "C", "D"] (concat)
const serialized = merged.join(" - "); // "A - B - C - D" (join)
const parsed = serialized.split(" - "); // ["A", "B", "C", "D"] (split)
```

#### Fuller Example
```javascript
// Processing CSV (Comma-Separated Values) logs and formatting categories
const userCSV = "Alice,Bob,Charlie,David";

// 1. Convert string list to an array using split()
// Note: split is a STRING method!
const usersList = userCSV.split(",");
console.log("Parsed Users Array:", usersList); // [ 'Alice', 'Bob', 'Charlie', 'David' ]

// 2. Add extra users by merging arrays using concat()
const extraUsers = ["Eve", "Frank"];
const fullUserList = usersList.concat(extraUsers);
console.log("Full User List:", fullUserList); // [ 'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank' ]

// 3. Serialize list back into a clean HTML-style tag string using join()
// Note: join is an ARRAY method!
const tagsDisplay = fullUserList.join(" | ");
console.log("UI Display String:", tagsDisplay); // "Alice | Bob | Charlie | David | Eve | Frank"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Swapping targets for `join` and `split`

**The mistake:** Trying to run `.split()` on an Array or `.join()` on a String.

**Why it's wrong:** `split` is exclusively a method of the `String` prototype because you split text. `join` is exclusively a method of the `Array` prototype because you combine list items. Swapping them throws a TypeError.

*Incorrect:*
```javascript
const tags = ["js", "html", "css"];
const joined = tags.split(","); // TypeError: tags.split is not a function

const text = "A,B,C";
const list = text.join("-"); // TypeError: text.join is not a function
```

*Fix:*
```javascript
const tags = ["js", "html", "css"];
const joined = tags.join(","); // Correct (Array -> String)

const text = "A,B,C";
const list = text.split(","); // Correct (String -> Array)
```

### Mistake 2: Expecting `concat()` to modify the array in-place

**The mistake:** Writing `list.concat(newList)` and expecting `list` to be mutated.

**Why it's wrong:** `.concat()` is a non-mutating method. It returns a new array; it does not change the caller.

*Incorrect:*
```javascript
const inventory = ["Hat"];
inventory.concat(["Shoes", "Socks"]);

console.log(inventory); // ["Hat"] (not updated!)
```

*Fix:*
```javascript
let inventory = ["Hat"];
inventory = inventory.concat(["Shoes", "Socks"]); // Reassign

console.log(inventory); // ["Hat", "Shoes", "Socks"]
```

---

### Mistake 3: Unhandled Asynchronous Failures in Concat Join Split Operations

**The mistake:** Executing asynchronous operations within Concat Join Split without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/concat_join_split"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/concat_join_split");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in concat_join_split: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Clean Tags

**Problem:** Complete the code to split the raw tag string `"coding, web , javascript"` by commas, remove any trailing/leading spaces from each tag, and join them back together with a hyphen (`"-"`).

```javascript
const rawTags = "coding, web , javascript";

// Split tags by comma
// Map/Clean tags (or manually target them)
// Join with hyphen
```

**Expected output:**
> [!check]- Answer
> ```text
> coding-web-javascript
> ```
> - Split by `","` first.
> - Since we are in Level 4, you can loop through the parsed array using a loop or `.map(tag => tag.trim())` to clean up the spaces.
> - Join the final array with `"-"`.

---

### Exercise 2: Joining Array Elements into CSV Strings

**Problem:** Join `["Apple", "Banana", "Cherry"]` with `", "` using `.join(", ")`.

**Expected output:**
> [!check]- Answer
> ```text
> Apple, Banana, Cherry
> ```
> ```javascript
> const fruits = ["Apple", "Banana", "Cherry"];
> console.log(fruits.join(", "));
> ```
>
> **Explanation:** `.join(separator)` concatenates array items into a single string with the specified delimiter.

---

### Exercise 3: Combining Arrays with `.concat()` vs Spread

**Problem:** Combine `[1, 2]` and `[3, 4]` using `.concat()`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 2, 3, 4 ]
> ```
> ```javascript
> const a = [1, 2];
> const b = [3, 4];
> console.log(a.concat(b));
> ```
>
> **Explanation:** `.concat()` merges arrays into a new array without mutating input arrays.

---

## 7. Related Terms
- [Spread Syntax (...)](../level_08/spread_syntax.md) — Alternative way to merge arrays: `[...arrA, ...arrB]`.
- [String Methods](../level_02/string_methods.md) — Generic text helper methods.
---

## 8. Key Takeaways
- `concat()` merges arrays and returns a new combined array without changing the inputs.
- `join(separator)` converts an Array to a String, placing the separator string between elements.
- `split(separator)` converts a String to an Array, cutting the text wherever the separator matches.
- Remember: `split` is a String method, while `join` and `concat` are Array methods.
