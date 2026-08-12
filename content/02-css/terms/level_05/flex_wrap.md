# `flex-wrap`

> **Level 5 — Layouts — Flexbox**
> The property that tells the Flex Container whether its children should shrink to fit on a single line, or wrap onto multiple lines if they run out of space.

---

## 1. Prerequisites
- [Flexbox (Concept) & `display: flex`](flex_parent.md) — Must be applied to the parent container.

---

## 2. Term Category

**Flexbox Property (Universal Modern Standard)**: `flex-wrap` is a fundamental concept in this technology stack. **Level 5 — Layouts — Flexbox**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
By default, Flexbox is incredibly stubborn. If you put ten 200px boxes inside a Flex Container that is only 500px wide, Flexbox will refuse to break them into two rows. Instead, it will forcibly shrink all ten boxes down to 50px so they all fit on a single horizontal line!
Often, this is not what we want. If we are building a photo gallery, we want the photos to maintain their size, and if they run out of room on the screen, we want them to cleanly wrap down to a second row (like words wrapping in a paragraph). 
The W3C created **`flex-wrap`** to allow developers to turn off the stubborn "single-line" default.

### (2) The Core Values
- **`nowrap` (Default)**: All children will be squished onto a single line, regardless of their defined widths.
- **`wrap`**: Children will maintain their width. If they hit the edge of the container, they will break onto a new line below.
- **`wrap-reverse`**: They will break onto a new line, but the new line will be added *above* the current line (rarely used).

### (3) Reality Metaphor
Imagine typing a sentence in Microsoft Word.
`nowrap` is like typing on a typewriter where the paper never moves; you just type smaller and smaller letters until they are all squished onto one line.
`wrap` is how normal typing works. When you hit the right margin, the carriage returns and you start typing on the line below.

### (4) Code Examples

#### The Photo Gallery Grid
```css
.gallery-container {
  display: flex;
  
  /* The Magic Wrap */
  /* If the photos don't fit horizontally, push the overflow to a new row! */
  flex-wrap: wrap; 
}

.photo {
  /* We want the photos to stay exactly 300px wide. */
  /* Without flex-wrap on the parent, Flexbox would ignore this and shrink them! */
  width: 300px; 
}
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Wondering why `width` is being ignored

**The mistake:** Setting `.child { width: 400px; }`, and watching in frustration as the child stubbornly renders at `150px` wide on the screen.

**Why it's wrong:** You forgot that Flexbox defaults to `flex-wrap: nowrap`. If the parent container isn't wide enough to hold all the 400px children, Flexbox will override your `width` property and crush the children until they fit. If you want them to actually be 400px, you must apply `flex-wrap: wrap;` to the parent so they have permission to spill onto a new line.

---



### Mistake 2: Expecting Flex Items to Wrap Automatically Without Setting `flex-wrap: wrap`

**The mistake:** Placing 10 items of width 200px in a 500px flex container expecting them to wrap onto multiple lines.

**Why it's wrong:** By default, flex containers have `flex-wrap: nowrap`. Flex items shrink to force fit on a single line unless `flex-wrap: wrap` is declared.

*Incorrect:*
```css
.grid { display: flex; } /* ❌ Shrinks 10 items onto 1 crowded line! */
```

*Fix:*
```css
.grid { display: flex; flex-wrap: wrap; } /* Permits multi-line item wrapping */
```

### Mistake 3: Using `flex-wrap: wrap` Without Specifying `flex-basis` or `width` on Items

**The mistake:** Adding `flex-wrap: wrap` to a flex container where child items have zero width or basis.

**Why it's wrong:** Without a min width or `flex-basis`, wrapped flex items shrink down to content size instead of wrapping predictably into grid rows.

*Incorrect:*
```css
.item { flex: 1; } /* Wraps unpredictably without basis */
```

*Fix:*
```css
.item { flex: 1 1 250px; } /* Wraps onto new line when container falls below 250px */
```

## 5. Practice Exercises

### Exercise 1: Building Responsive Wrapping Tag Collections with flex-wrap: wrap

**Scenario:** An author styles a collection of filter tag buttons that wrap gracefully across multiple lines using `flex-wrap: wrap`.

**Requirements:**
1. Apply `display: flex; flex-wrap: wrap; gap: 0.5rem;` to tag container.
2. Verify tags wrap without clipping.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .filter-tags-container {
>   display: flex;
>   flex-wrap: wrap;              /* Enables multi-line tag wrapping */
>   gap: 0.5rem;
>   padding: 1rem;
>   background-color: #f8fafc;
> }
>
> .tag-btn {
>   padding: 0.375rem 0.875rem;
>   background-color: #e2e8f0;
>   color: #1e293b;
>   border-radius: 9999px;
>   font-size: 0.875rem;
> }
> ```
>
> #### Technical Explanation
>
> 1. **The `flex-wrap` Property**: Controls whether flex items are forced onto a single line (`nowrap`) or allowed to wrap onto multiple lines (`wrap`, `wrap-reverse`).
> 2. **`flex-wrap: nowrap` Default**: By default, flex containers use `nowrap`, attempting to squeeze all items onto a single line.
> 3. **Responsive Wrapping**: Setting `flex-wrap: wrap` allows variable-length tags to flow naturally onto additional rows as viewport width shrinks.
> 
---

### Exercise 2: Multi-Row Product Gallery Layout with Uniform Wrapped Spacing

**Scenario:** Styles a product card gallery using wrapped flex rows.

**Requirements:**
1. Apply `flex-wrap: wrap` and `gap: 1.5rem`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .product-gallery {
>   display: flex;
>   flex-wrap: wrap;
>   gap: 1.5rem;
> }
>
> .gallery-card {
>   flex: 1 1 16rem;              /* Minimum 16rem before wrapping */
> }
> ```
>
> #### Technical Explanation
>
> 1. **Combining Wrap with Flex Basis**: Pairing `flex-wrap: wrap` with `flex: 1 1 16rem` creates automatic multi-column grid layouts.
> 2. **Column Wrapping Trigger**: When container width drops below 16rem per card, cards automatically wrap to the next line.
> 3. **No Breakpoint Overheads**: Achieves responsive multi-row layout without writing manual media query breakpoints.
> 
---

### Exercise 3: Handling flex-wrap: nowrap Overflow Scrolling on Mobile Touchscreens

**Scenario:** Creates a horizontally scrollable mobile filter bar using `flex-wrap: nowrap` and `overflow-x: auto`.

**Requirements:**
1. Apply `flex-wrap: nowrap; overflow-x: auto;`.

> [!check]- Answer
>
> #### Implementation
>
> ```css
> .mobile-scroll-bar {
>   display: flex;
>   flex-wrap: nowrap;            /* Forces single row */
>   overflow-x: auto;             /* Enables horizontal touch scrolling */
>   gap: 0.75rem;
>   padding: 0.5rem;
>   -webkit-overflow-scrolling: touch;
> }
> ```
>
> #### Technical Explanation
>
> 1. **Single-Row Touch Carousel**: `flex-wrap: nowrap` combined with `overflow-x: auto` builds mobile swipeable pill bars.
> 2. **Touch Momentum**: The `-webkit-overflow-scrolling: touch` property provides smooth momentum scrolling on iOS devices.
> 3. **Non-Wrapping Guarantee**: Guarantees filter buttons stay in a single horizontal carousel line.
## 6. Related Terms
- [`gap` (Grid Gap)](../level_06/gap.md) — When items wrap to a new line, you need a way to put space between the rows.
- [`align-content`](align_content.md) — Distributes multiple rows of wrapped items.
- [`display: flex` — Flexbox Container](display_flex.md) — Related concept: `display: flex`.

---

## 7. Key Takeaways
- `flex-wrap: nowrap` is the default. It squishes children to fit on one line.
- `flex-wrap: wrap` allows children to keep their width and wrap to new lines.
- This is essential for building responsive layouts like photo galleries and card grids.
