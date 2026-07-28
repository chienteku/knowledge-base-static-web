# `<textarea>`

> **Level 5 — Forms & User Input**
> A multi-line text input field.

---

## 1. Prerequisites
- [`<input>`](../level_05/input.md) — The single-line sibling to the textarea.
- [Element vs. Tag](../level_01/element_vs_tag.md) — Notice that `<textarea>` is NOT a void element!
- [Nesting](../level_01/nesting.md) — Since default text values are nested between the opening and closing tags.

---

## 2. Term Category
- **Form Element**

---

## 3. Environment Context
- **Universal Browser Support**

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
An `<input type="text">` is great for short data like a first name or an email address. But what if the user needs to write a 5-paragraph review, a long comment, or a bug report? A single-line input box would force them to type blindly off the edge of the screen.
The W3C created the `<textarea>` element for multi-line text input. Unlike `<input>`, it allows the user to press the "Enter" key to create physical line breaks in their text. It also usually features a native "drag handle" in the bottom right corner, allowing the user to click and drag to make the box physically larger on their screen.

### (2) Reality Metaphor
An `<input type="text">` is a single blank line on a form (e.g., "Name: ______").
A `<textarea>` is a large, empty ruled box at the bottom of the form that says "Please provide any additional comments below."

### (3) Code Examples

#### Short Snippet
```html
<!-- Use the 'rows' and 'cols' attributes to set the initial physical size -->
<label for="feedback">Your Feedback:</label>
<textarea id="feedback" name="user_feedback" rows="4" cols="50"></textarea>
```

#### Fuller Example
```html
<form action="/submit-comment">
  <label for="bio">Author Biography:</label>
  
  <!-- Any text placed BETWEEN the tags becomes the default value! -->
  <textarea id="bio" name="author_bio" rows="6">
Hi! My name is John.
I have been writing code for 5 years.
  </textarea>
  
  <button type="submit">Save Bio</button>
</form>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Trying to use a `value` attribute

**The mistake:** Trying to set the default text of a `<textarea>` using the `value` attribute (like you do with an `<input>`).

**Why it's wrong:** The `<textarea>` is NOT a void element. It has an opening and closing tag. Because of this, it does not use a `value` attribute. Instead, any text you place *between* the tags becomes the default value.

*Incorrect:*
```html
<textarea name="comment" value="Default text here"></textarea>
```

*Fix:*
```html
<textarea name="comment">Default text here</textarea>
```

### Mistake 2: Leaving whitespace between the tags

**The mistake:** Formatting your HTML code by putting the closing `</textarea>` tag on a new, indented line.

**Why it's wrong:** Because everything between the tags is treated as the exact value of the input, if you leave spaces or line breaks in your HTML code, the browser will literally insert those spaces into the text box! The user will have to manually delete your code's whitespace before they can start typing.

*Incorrect:*
```html
<!-- The user will see a bunch of blank spaces in the box! -->
<textarea name="comment">
</textarea>
```

*Fix:*
```html
<!-- Keep the tags touching if you want it to be empty! -->
<textarea name="comment"></textarea>
```

---



### Mistake 3: Attempting to Set `<textarea>` Initial Value Using `value="..."` Attribute

**The mistake:** Writing `<textarea value="Initial Text"></textarea>`.

**Why it's wrong:** `<textarea>` does NOT use a `value` attribute for initial content! Initial text MUST be placed between opening and closing tags `<textarea>Initial Text</textarea>`.

*Incorrect:*
```html
<textarea value="Hello World"></textarea> <!-- ❌ Value attribute is ignored! -->
```

*Fix:*
```html
<textarea>Hello World</textarea> <!-- Initial text placed inside content tags -->
```

### Mistake 4: Forgetting to Restrict Textarea Resizing in CSS (`resize: none` vs `resize: vertical`)

**The mistake:** Allowing default `<textarea>` free 2D resizing breaking website layout containers.

**Why it's wrong:** Unrestricted horizontal resizing allows users to drag textareas outside container boundaries. Restrict resizing to vertical-only `resize: vertical` or `resize: none`.

*Incorrect:*
```html
/* Default textarea permits horizontal resizing that breaks container widths */
```

*Fix:*
```html
textarea {
  resize: vertical; /* Permits vertical expansion only */
}
```

## 6. Practice Exercises

### Exercise 1: CSS Resizing

**Problem:** By default, users can click and drag the corner of a `<textarea>` to resize it in any direction. How can you use CSS to restrict them so they can only drag it taller, but not wider?

**Expected output:**
> [!check]- Answer
> ```text
> You use the CSS resize property: 
> `textarea { resize: vertical; }`
> ```
> - Search for "CSS textarea resize".

---



### Exercise 2: Configuring Textarea Dimensions and Max Length

**Problem:** Write `<textarea>` named `bio` with 4 rows, 50 columns, and max length 200 characters.

**Expected output:**
> [!check]- Answer
> ```text
> <textarea name="bio" rows="4" cols="50" maxlength="200"></textarea>
> ```
> ```html
> <textarea name="bio" rows="4" cols="50" maxlength="200"></textarea>
> ```
>
> **Explanation:** `rows`/`cols` specify initial box dimensions; `maxlength` enforces character limits.

---

### Exercise 3: Preserving Textarea Line Breaks

**Problem:** Which CSS property preserves multi-line line breaks entered inside a `<textarea>` when displaying text on a web page?

**Expected output:**
> [!check]- Answer
> ```text
> white-space: pre-wrap;
> ```
> ```css
> .output {
>   white-space: pre-wrap;
> }
> ```
>
> **Explanation:** `white-space: pre-wrap` preserves newlines and wraps text output.

## 7. Related Terms
- [`<input>`](../level_05/input.md) — The single-line equivalent for short data.
- [`placeholder` Attribute](../level_05/placeholder.md) — The visual cue comparison.
- [`value` Attribute (in Form Fields)](../level_05/value.md) — The value differences from textareas.
- [`name` Attribute (in Form Fields)](../level_05/name.md) — The textarea key name parameter.
- [`<label>`](../level_05/label.md) — The associated text label.

---

## 8. Key Takeaways
- The `<textarea>` element is used for long-form, multi-line text input.
- It is NOT a void element; it has opening and closing tags.
- You set its default text by placing content *between* the tags, not by using a `value` attribute.
- Be careful not to leave accidental whitespace between the tags in your HTML code.
