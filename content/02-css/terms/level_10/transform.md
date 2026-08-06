# `transform` (Scale, Translate, Rotate)

> **Level 10 — Transitions & Animations**
> The property used to physically manipulate an element's size, position, or rotation in 2D or 3D space, without affecting the document layout around it.

---

## 1. Prerequisites
- [The Box Model (Concept)](../level_02/box_model.md) — Normal properties like `margin` push other boxes around. `transform` ignores them!
- [`transition`](transition.md) — Transforms are almost always animated on `:hover`.

---

## 2. Term Category
- **Animation / Visual Property**

---

## 3. Environment Context
- **Universal Modern Standard** (The absolute most performant way to animate elements).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you want to move a button 10px to the right when you hover over it, you *could* change its `margin-left` from 0 to 10px. But this is terrible for performance! When you change `margin`, the browser has to recalculate the layout of every single element on the entire page (a "reflow"), which causes the animation to lag and stutter on cheap smartphones. 
The W3C created **`transform`** to manipulate elements using the computer's Graphics Card (GPU) instead of the CPU. A `transform` happens in a separate visual layer. It moves, scales, or rotates the element visually without ever touching the actual HTML layout.

### (2) The Three Core Functions
`transform` takes specific mathematical functions:
1. **`translate(x, y)`**: Moves the element left/right (x) and up/down (y).
2. **`scale(n)`**: Grows or shrinks the element. (`1` is normal, `1.1` is 10% larger, `0.5` is half size).
3. **`rotate(deg)`**: Spins the element (e.g., `45deg` or `180deg`).

### (3) Reality Metaphor
Imagine a row of wooden blocks on a table. 
Using `margin` to move a block is like physically shoving the block, which bumps into the other blocks and ruins the row. 
Using `transform: translate()` is like putting a hologram over the block. You can move the hologram around the room, make it bigger, or spin it, but the physical wooden blocks on the table remain completely untouched.

### (4) Code Examples

#### The Floating Card (Scale & Translate)
A very common modern design pattern: when you hover over a UI Card, it lifts up and gets slightly larger.
```css
.card {
  transition: transform 0.2s ease;
}

.card:hover {
  /* scale(1.05) makes it 5% larger.
     translateY(-10px) moves it 10 pixels UP towards the top of the screen. */
  transform: scale(1.05) translateY(-10px);
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to transform `display: inline` elements

**The mistake:** Applying `transform: scale(2);` to a `<span>` or an `<a>` tag, and nothing happens.

**Why it's wrong:** The `transform` property completely ignores `inline` elements (like standard text tags). The element MUST be `block` or `inline-block` for the graphics card to be able to grab it and manipulate it. 
**Solution:** Add `display: inline-block;` to the `<span>` first!

### Mistake 2: Overwriting transforms

**The mistake:**
```css
.box { transform: scale(1.5); }
.box:hover { transform: rotate(90deg); }
```

**Why it's wrong:** If you hover over the box, it will rotate 90 degrees, but it will instantly shrink back to its normal size! Why? Because the second `transform` completely overwrites the first one. If you want it to stay large AND rotate, you must chain them together on the hover state: `transform: scale(1.5) rotate(90deg);`.

---



### Mistake 3: Attempting to Apply `transform` to Inline Elements (`display: inline`)

**The mistake:** Writing `span { transform: scale(1.2); }` on inline spans.

**Why it's wrong:** CSS `transform` operations function ONLY on block-level, inline-block, or flex/grid items. `transform` properties are IGNORED on inline elements (`display: inline`).

*Incorrect:*
```css
span { transform: rotate(45deg); } /* ❌ Transform ignored on inline elements! */
```

*Fix:*
```css
span { display: inline-block; transform: rotate(45deg); }
```

### Mistake 4: Overwriting Multiple `transform` Functions in Subsequent Rulesets

**The mistake:** Setting `transform: translate(-50%, -50%);` on base class and `transform: scale(1.1);` on `:hover`.

**Why it's wrong:** Declaring `transform` in `:hover` REPLACES all previous transform functions completely! The hover state loses its `translate` offset, jumping position.

*Incorrect:*
```css
.box { transform: translate(-50%, -50%); }
.box:hover { transform: scale(1.1); } /* ❌ Overwrites translate offset! */
```

*Fix:*
```css
.box:hover { transform: translate(-50%, -50%) scale(1.1); } /* Include translate offset */
```



### Mistake 5: Attempting to Apply `transform` to Inline Elements (`display: inline`)

**The mistake:** Writing `span { transform: scale(1.2); }` on inline spans.

**Why it's wrong:** CSS `transform` operations function ONLY on block-level, inline-block, or flex/grid items. `transform` properties are IGNORED on inline elements (`display: inline`).

*Incorrect:*
```css
span { transform: rotate(45deg); } /* ❌ Transform ignored on inline elements! */
```

*Fix:*
```css
span { display: inline-block; transform: rotate(45deg); }
```

### Mistake 6: Overwriting Multiple `transform` Functions in Subsequent Rulesets

**The mistake:** Setting `transform: translate(-50%, -50%);` on base class and `transform: scale(1.1);` on `:hover`.

**Why it's wrong:** Declaring `transform` in `:hover` REPLACES all previous transform functions completely! The hover state loses its `translate` offset, jumping position.

*Incorrect:*
```css
.box { transform: translate(-50%, -50%); }
.box:hover { transform: scale(1.1); } /* ❌ Overwrites translate offset! */
```

*Fix:*
```css
.box:hover { transform: translate(-50%, -50%) scale(1.1); } /* Include translate offset */
```



### Mistake 7: Attempting to Apply `transform` to Inline Elements (`display: inline`)

**The mistake:** Writing `span { transform: scale(1.2); }` on inline spans.

**Why it's wrong:** CSS `transform` operations function ONLY on block-level, inline-block, or flex/grid items. `transform` properties are IGNORED on inline elements (`display: inline`).

*Incorrect:*
```css
span { transform: rotate(45deg); } /* ❌ Transform ignored on inline elements! */
```

*Fix:*
```css
span { display: inline-block; transform: rotate(45deg); }
```

### Mistake 8: Overwriting Multiple `transform` Functions in Subsequent Rulesets

**The mistake:** Setting `transform: translate(-50%, -50%);` on base class and `transform: scale(1.1);` on `:hover`.

**Why it's wrong:** Declaring `transform` in `:hover` REPLACES all previous transform functions completely! The hover state loses its `translate` offset, jumping position.

*Incorrect:*
```css
.box { transform: translate(-50%, -50%); }
.box:hover { transform: scale(1.1); } /* ❌ Overwrites translate offset! */
```

*Fix:*
```css
.box:hover { transform: translate(-50%, -50%) scale(1.1); } /* Include translate offset */
```

## 6. Practice Exercises

### Exercise 1: Performance Test

**Problem:** You want to animate a modal popup sliding down from the top of the screen. 
Option A: You animate `top: -100px;` to `top: 50%;`. 
Option B: You animate `transform: translateY(-100vh);` to `transform: translateY(0);`. 
Which option will look perfectly smooth on a cheap 5-year-old smartphone?

**Expected output:**
> [!check]- Answer
> ```text
> Option B (`transform`)! 
> Animating properties like `top`, `margin`, or `width` forces the CPU to recalculate the page layout 60 times a second, causing lag. Animating `transform` is handled by the GPU and is incredibly smooth.
> ```
> - Which one uses the Graphics Card instead of the CPU?
> 
---



### Exercise 2: Perfect 2D Center with Transform

**Problem:** Write CSS centering `.modal` absolutely using `top: 50%`, `left: 50%`, and `transform: translate(-50%, -50%)`.

**Expected output:**
> [!check]- Answer
> ```text
> .modal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
> ```
> ```css
> .modal {
>   position: absolute;
>   top: 50%;
>   left: 50%;
>   transform: translate(-50%, -50%);
> }
> ```
>
> **Explanation:** `translate(-50%, -50%)` offsets element by half its own width and height for exact centering.
> 
---

### Exercise 3: Hardware Accelerated GPU Layer Trigger

**Problem:** Which `transform` function forces GPU hardware acceleration layer creation (`transform: translateZ(0)` or `will-change`)?

**Expected output:**
> [!check]- Answer
> ```text
> transform: translateZ(0) (or transform: translate3d(0,0,0)).
> ```
> ```css
> .gpu-layer {
>   transform: translateZ(0);
> }
> ```
>
> **Explanation:** 3D transforms promote elements to dedicated GPU compositor layers for 60fps animations.
> 
## 7. Related Terms
- [`transition`](transition.md) — Without a transition, a transform just instantly snaps to its new shape/position.
- [`@keyframes` & `animation`](animation.md) — Complex animations that often chain multiple transforms together.
- [Stacking Context](../level_04/stacking_context.md) — Related concept: Stacking Context.

---

## 8. Key Takeaways
- `transform` manipulates elements visually without altering the page layout.
- **Translate** moves, **Scale** resizes, and **Rotate** spins.
- It is the most performant way to animate movement on the web (handled by the GPU).
- It does NOT work on `inline` elements; you must use `inline-block` or `block`.
