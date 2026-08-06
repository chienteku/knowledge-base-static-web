# `text-shadow`

> **Level 7 — Text & List Formatting**
> The property used to paint a drop-shadow behind text, useful for creating 3D effects or making text readable over busy background images.

---

## 1. Prerequisites
- [`color` vs `background-color`](../level_03/color_vs_background.md) — The shadow needs a color value.
- [Color Values (hex, rgb, rgba, hsl, named)](../level_03/color_values.md) — Applying drop shadows to text elements.

---

## 2. Term Category
- **Typography / Visual Effect Property**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
If you place white text over a photograph of a bright, sunny beach, the text becomes invisible where it hits the white clouds or bright sand. 
To fix this, graphic designers use drop-shadows to separate the text from the background. The W3C created **`text-shadow`** to allow browsers to render these shadows natively, without requiring developers to upload pre-rendered Photoshop images of text.

### (2) The Four Values
To create a shadow, you must provide four specific values in exact order:
1. **X-Offset**: How far left/right to move the shadow. (Positive = Right, Negative = Left).
2. **Y-Offset**: How far up/down to move the shadow. (Positive = Down, Negative = Up).
3. **Blur Radius**: How blurry/soft the shadow is. (0 = sharp, solid copy).
4. **Color**: The color of the shadow (usually RGBA for transparency).

### (3) Reality Metaphor
Imagine holding a flashlight (the light source) above a wooden block letter on a table.
X/Y Offset is moving the flashlight around to change where the shadow falls.
Blur Radius is moving the flashlight higher or lower to make the shadow sharper or fuzzier.

### (4) Code Examples

#### The Classic Soft Drop Shadow
```css
.hero-title {
  color: white;
  /* Moves right 2px, down 2px, blurs by 4px, and uses 50% transparent black */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}
```

#### The Retro 3D Effect (No Blur)
By setting the blur to `0`, you get a solid, sharp copy of the text.
```css
.retro-text {
  color: yellow;
  /* Sharp red shadow down and to the right */
  text-shadow: 4px 4px 0px red;
}
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Making the shadow too dark and sharp

**The mistake:** Using `text-shadow: 5px 5px 0px black;` on paragraph text.

**Why it's wrong:** While sharp shadows are fun for massive titles or retro designs, they are completely unreadable for normal body text. If you want to use a shadow to improve readability, it should be subtle, highly blurred, and slightly transparent (`rgba`), so it acts as a soft dark glow rather than a distracting duplicate word.

---



### Mistake 2: Using Heavy Distracting `text-shadow` Blur Amounts That Make Text Unreadable

**The mistake:** Adding `text-shadow: 0 0 20px black;` to standard body paragraph text.

**Why it's wrong:** Excessive shadow blur creates fuzzy, unreadable text glyphs. Keep text shadows subtle for readability (e.g. `text-shadow: 1px 1px 2px rgba(0,0,0,0.5)`).

*Incorrect:*
```css
p { text-shadow: 0 0 25px black; } /* ❌ Fuzzy, unreadable text! */
```

*Fix:*
```css
p { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4); }
```

### Mistake 3: Confusing `text-shadow` (Text Glyphs) with `box-shadow` (Rectangular Box Container)

**The mistake:** Using `box-shadow` expecting it to cast shadows around letter glyph shapes.

**Why it's wrong:** `box-shadow` casts shadows around the rectangular element box boundary. `text-shadow` casts shadows around individual vector text character glyphs.

*Incorrect:*
```css
h1 { box-shadow: 2px 2px 5px black; } /* ❌ Casts shadow around rectangular box! */
```

*Fix:*
```css
h1 { text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5); } /* Casts shadow behind text glyphs */
```

## 6. Practice Exercises

### Exercise 1: The Glow Effect

**Problem:** How could you use `text-shadow` to make a neon sign that appears to glow in all directions, rather than casting a shadow to one specific side?

**Expected output:**
> [!check]- Answer
> ```text
> Set the X and Y offsets to 0! If the shadow doesn't move left/right or up/down, but has a large blur radius, it will peek out equally from all sides of the text, creating a glowing effect!
> `text-shadow: 0px 0px 10px limegreen;`
> ```
> - What happens if the flashlight is pointing straight down from perfectly above the letter?
> 
---



### Exercise 2: Text Shadow Parameter Syntax

**Problem:** Write `text-shadow` applying 2px right offset, 2px down offset, 4px blur, and 50% black alpha color.

**Expected output:**
> [!check]- Answer
> ```text
> text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
> ```
> ```css
> h1 {
>   text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
> }
> ```
>
> **Explanation:** `text-shadow` parameters are `offset-x offset-y blur-radius color`.
> 
---

### Exercise 3: Multiple Text Shadows

**Problem:** Write CSS applying double text shadow to create a glowing text effect.

**Expected output:**
> [!check]- Answer
> ```text
> text-shadow: 0 0 5px #fff, 0 0 10px #ff0000;
> ```
> ```css
> .glow {
>   text-shadow: 0 0 5px #fff, 0 0 10px #ff0000;
> }
> ```
>
> **Explanation:** Comma-separated `text-shadow` layers multiple glow shadows.
> 
## 7. Related Terms
- [`box-shadow` (Card Shadows)](../level_09/box_shadow.md) — The exact same concept, but applied to the entire Box Model container instead of just the text inside it!

---

## 8. Key Takeaways
- `text-shadow` takes 4 values: X-Offset, Y-Offset, Blur, Color.
- Positive X/Y values move the shadow Right and Down.
- It is crucial for making white text readable over varied background images.
- Set offsets to 0 with a high blur to create a "Glow" effect.
