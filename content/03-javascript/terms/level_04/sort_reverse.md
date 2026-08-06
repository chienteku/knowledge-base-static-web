# sort / reverse

> **Level 4 — Iteration & Array Methods**
> Order elements (with comparator) / reverse order.

---

## 1. Prerequisites
- [Array](../level_02/array.md) — A high-level, list-like object.
- [Callback Function](../level_03/callback_function.md) — A function passed as an argument to be executed later.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Organizing collections of data—sorting products by price, listing users alphabetically, or reversing a search results feed—is a daily programming requirement. JavaScript provides `.sort()` and `.reverse()` for this. 

However, they come with two major design caveats:
1. **They are mutating methods:** They modify the original array in-place rather than returning a sorted copy.
2. **Default lexicographical sort:** By default, `.sort()` converts all elements to string representations and compares their UTF-16 code unit values. This works fine for words, but fails catastrophically for numbers (e.g. `10` is sorted *before* `2` because the character `"1"` comes before `"2"` alphabetically).

To sort numbers or complex structures correctly, you must supply a **comparator callback function** to define custom sorting logic.

### (2) Reality Metaphor
Imagine a clerk sorting folders in a cabinet.
- **Default `.sort()`** is like a clerk who sorts files purely by the alphabetical spellings of their labels. If they see a folder labeled `"10"` and a folder labeled `"2"`, they file `"10"` first because `"1"` comes before `"2"`.
- **A Comparator Callback** is like giving the clerk a rules sheet. You hand them folders `A` and `B` and tell them: "Compare their mathematical weights. If the weight of `A` minus `B` is positive, slide `A` behind `B`."

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
const fruits = ["Banana", "Apple", "Cherry"];
fruits.sort(); // Mutates fruits to ["Apple", "Banana", "Cherry"]
fruits.reverse(); // Mutates fruits to ["Cherry", "Banana", "Apple"]

console.log(fruits); // ["Cherry", "Banana", "Apple"]
```

#### Fuller Example
```javascript
// A product price sorting catalog showing the number sorting bug and custom sorting
const prices = [100, 5, 25, 10, 2];

// 1. The default sort bug:
prices.sort();
console.log("Lexicographical (bugged) Sort:", prices); 
// [ 100, 10, 2, 25, 5 ] (because "1" < "2" < "5" alphabetically!)

// 2. The correct way: pass a comparator callback function
// The comparator receives pairs (a, b) and expects:
// - A negative value if 'a' should come before 'b'
// - A positive value if 'b' should come before 'a'
// - Zero if they are equal
prices.sort(function(a, b) {
  return a - b; // Ascending sort helper formula
});
console.log("Numeric Ascending Sort:", prices); // [ 2, 5, 10, 25, 100 ]

// 3. Sorting an array of objects by a key
const products = [
  { name: "Laptop", price: 999 },
  { name: "Mouse", price: 25 },
  { name: "Keyboard", price: 75 }
];

// Sort products descending by price (b - a)
products.sort((a, b) => b.price - a.price);
console.log("Products (Expensive first):", products);
// [ { name: 'Laptop', price: 999 }, { name: 'Keyboard', price: 75 }, { name: 'Mouse', price: 25 } ]
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Sorting Numbers without a Comparator Function

**The mistake:** Calling `prices.sort()` expecting numerical sorting.

**Why it's wrong:** As shown in the example, default sorting coerces numbers to strings first. This will sort `100` before `2`.

*Incorrect:*
```javascript
const list = [20, 5, 100];
list.sort(); 

console.log(list); // [100, 20, 5] (Oops!)
```

*Fix:*
```javascript
const list = [20, 5, 100];
list.sort((a, b) => a - b); // Ascending numeric sort

console.log(list); // [5, 20, 100]
```

### Mistake 2: Forgetting that `sort()` Mutates the Array

**The mistake:** Sorting a function argument array directly, causing unexpected side effects on the parent data reference.

**Why it's wrong:** Since `.sort()` mutates the original reference in-place, the caller's array will be modified permanently.

*Incorrect:*
```javascript
const data = [3, 1, 2];
const sorted = data.sort(); // Mutates 'data'!

console.log(data); // [1, 2, 3] (Original array was changed!)
```

*Fix:*
```javascript
const data = [3, 1, 2];

// Use spread syntax to clone the array before sorting
const sorted = [...data].sort();

console.log(data);   // [3, 1, 2] (Safe!)
console.log(sorted); // [1, 2, 3]
```

---

### Mistake 3: Unhandled Asynchronous Failures in Sort Reverse Operations

**The mistake:** Executing asynchronous operations within Sort Reverse without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/sort_reverse"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/sort_reverse");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in sort_reverse: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Sort Scores Descending

**Problem:** Complete the code to sort the numeric `scores` array in **descending** order (highest first) without mutating the original `scores` array.

```javascript
const scores = [80, 95, 60, 100, 75];

const sortedDesc = // Write clone and sort here

console.log("Original:", scores);
console.log("Sorted Descending:", sortedDesc);
```

**Expected output:**
> [!check]- Answer
> ```text
> Original: [ 80, 95, 60, 100, 75 ]
> Sorted Descending: [ 100, 95, 80, 75, 60 ]
> ```
> - Clone the array using `[...scores]`.
> - Call `.sort()` on the clone with a comparator callback `(a, b) => b - a`.
> 
---

### Exercise 2: Numeric Array Sorting

**Problem:** Sort `[40, 100, 1, 5, 25]` numerically in ascending order using compare function.

**Expected output:**
> [!check]- Answer
> ```text
> [ 1, 5, 25, 40, 100 ]
> ```
> ```javascript
> const nums = [40, 100, 1, 5, 25];
> nums.sort((a, b) => a - b);
> console.log(nums);
> ```
>
> **Explanation:** Comparator `(a, b) => a - b` sorts numbers in ascending order (negative yields `a < b`).
> 
---

### Exercise 3: Reversing Array Order in-place

**Problem:** Reverse `[1, 2, 3]` using `.reverse()`.

**Expected output:**
> [!check]- Answer
> ```text
> [ 3, 2, 1 ]
> ```
> ```javascript
> const arr = [1, 2, 3];
> arr.reverse();
> console.log(arr);
> ```
>
> **Explanation:** `.reverse()` mutates the array in-place, reversing element order.
> 
---

## 7. Related Terms
- [Comparison Operators](../level_01/comparison_operators.md) — The mathematical relations used inside comparators.
- [Mutating vs Non-mutating Methods](mutating_vs_non_mutating.md) — The core behavior classification that sort belongs to.

---

## 8. Key Takeaways
- `.sort()` and `.reverse()` modify the original array reference in-place (mutating).
- By default, `.sort()` orders elements alphabetically by converting them to strings, which breaks numeric sorting.
- To sort numbers or objects, always pass a comparator callback: `(a, b) => a - b` (for ascending) or `(b - a)` (for descending).
- Clone arrays using spread syntax `[...array].sort(...)` to prevent mutating shared data references.
