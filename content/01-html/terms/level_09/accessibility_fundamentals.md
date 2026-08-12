# Accessibility (a11y) Fundamentals

> **Level 9 — DOM, Rendering & Accessibility**
> The design and development practice of building web interfaces that can be used by all people—including those with visual, auditory, motor, or cognitive disabilities—primarily by coding structured, keyboard-navigable HTML.

---

## 1. Prerequisites
- [Semantic HTML](../level_06/semantic_html.md) — The foundation of visual layout meaning.
- [`alt` Attribute](../level_03/alt.md) — The alternate text standard for media.
- [`<label>`](../level_05/label.md) — Form field associations.

---

## 2. Term Category

**Concept / Architecture (Universal Web Standards  and legally enforced by regulations like Section 508 in the US and the European Accessibility Act).)**: Accessibility (a11y) Fundamentals is a fundamental concept in this technology stack. **Level 9 — DOM, Rendering & Accessibility**

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
The internet is a universal resource, but users access websites in vastly different ways depending on their physical abilities:
-   **Visually Impaired Users:** Use **Screen Readers**—software that reads the page content aloud—or refreshable braille displays.
-   **Motor Impaired Users:** Cannot use a mouse. They navigate using keyboards, head pointers, or switch devices.
-   **Hearing Impaired Users:** Rely on text captions and visual alerts.
-   **Cognitive Impaired Users:** Require clear, structured layout formats with minimal distractions.

Web Accessibility (often written as **`a11y`**, representing the letter `a` followed by 11 letters, ending in `y`) is the practice of ensuring nobody is locked out of your site. 

Accessibility is not a feature you add at the very end of a project. It is a baseline coding standard. 

By writing clean, semantic HTML, you build a site that naturally cooperates with screen readers and keyboard input paths, without needing complicated fixes.

---

### (2) The WCAG POUR Principles
The international guidelines (Web Content Accessibility Guidelines) organize rules under four core pillars:

1.  **P**erceivable: Content must be presentable to users in ways they can detect (e.g. text alternative tags for pictures, high contrast colors).
2.  **O**perable: Users must be able to interact with the interface (e.g. keyboard navigation support, giving users enough time to read).
3.  **U**nderstandable: The language and operations must be clear and predictable (e.g. form error alerts that explain how to fix the input).
4.  **R**obust: The code must work across a wide range of current and future user agents (browsers, screen readers, tools).

---

### (3) The Core HTML Accessibility Rules

To build a compliant page, you must enforce these four markup guidelines:

#### 1. Always use semantic landmarks
Screen readers offer shortcuts that compile structural page headers (`<header>`, `<nav>`, `<main>`, `<aside>`) into navigation directories. Sighted users skip menus visually; screen readers skip menus by pressing a button to jump directly to the `<main>` landmark.

#### 2. Always link Labels to Inputs
Screen readers will not guess what a text box is for. You must connect them explicitly using the `<label for="id">` and `<input id="id">` attributes so the field's description is read aloud when focused.

#### 3. Manage focus states
Ensure all interactive elements (buttons, links) are tabbable. Avoid removing the focus indicator stylesheet ring (the blue outline that shows which button is focused) unless you are replacing it with a better custom style.

---

### (4) Code Examples

#### Inaccessible Card (Bad)
A visual card built entirely out of divs. Sighted users can click it, but screen readers are blind to it, and keyboard users cannot focus it:

```html
<!-- BAD: Inaccessible card element -->
<div class="card" onclick="goToArticle()">
  <img src="mountain.jpg">
  <div class="title">My Hiking Guide</div>
  <div class="desc">Click here to read.</div>
</div>
```

#### Accessible Card (Good)
```html
<!-- GOOD: Semantic, tabbable, and descriptive -->
<article class="card">
  <!-- Descriptive alt text -->
  <img src="mountain.jpg" alt="Snow-capped peak of Mount Hood at sunrise">
  
  <h2>My Hiking Guide</h2>
  
  <!-- Sighted users click, keyboard users can focus and hit enter -->
  <a href="/hiking-guide" aria-label="Read my Hiking Guide article">
    Read Full Article
  </a>
</article>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Writing vague "Click Here" link texts

**The mistake:** Writing links that rely on surrounding text for meaning:

```html
<p>
  To download our tax sheet, 
  <!-- BAD: Out of context, this link tells screen reader users nothing! -->
  <a href="taxes.pdf">click here</a>.
</p>
```

**Why it's wrong:** Screen reader users frequently navigate pages using a "Link List" shortcut—which pulls all page links out into a single audio list. If your links say "click here", "read more", and "link", the user will hear:
*"click here, link, click here, read more..."* which is completely useless.

**Fix: Make links self-descriptive out of context.**

```html
<p>
  To review the documents, download the 
  <!-- CORRECT: Clear out-of-context link description -->
  <a href="taxes.pdf">2026 Tax Sheet (PDF)</a>.
</p>
```

---



### Mistake 2: Relying Exclusively on Color to Convey Information (WCAG Color Contrast & Vision Deficit Violation)

**The mistake:** Indicating form input errors solely by changing border color to red without text error messages.

**Why it's wrong:** Color-blind or low-vision users cannot perceive color changes alone. Always supplement color indicators with text labels, icons, or error message strings.

*Incorrect:*
```html
<!-- Red border input with no error text message -->
```

*Fix:*
```html
<input aria-invalid="true" aria-describedby="err">
<span id="err" class="error">Error: Password is required</span>
```

### Mistake 3: Removing Focus Outlines (`outline: none`) Without Providing Custom Focus Styles

**The mistake:** Writing `*:focus { outline: none; }` in CSS stylesheets.

**Why it's wrong:** Removing visual focus outlines renders web pages completely unusable for keyboard-only users who rely on focus rings to track navigation. Always provide custom `:focus-visible` styles.

*Incorrect:*
```html
button:focus { outline: none; } /* ❌ Removes focus ring for keyboard users! */
```

*Fix:*
```html
button:focus-visible {
  outline: 3px solid blue; /* High visibility focus indicator */
}
```

## 5. Practice Exercises

### Exercise 1: Accessibility Audit

**Problem:** Identify three accessibility errors in the following code block:

```html
<body>
  <div class="header">
    <img src="banner.png">
  </div>
  <form>
    <span>Enter Age:</span>
    <input type="text">
  </form>
</body>
```

**Expected output:**
> [!check]- Answer
> ```text
> 1. The header uses a generic `<div class="header">` instead of the semantic `<header>` landmark tag.
> 2. The image `<img src="banner.png">` is missing a required `alt` attribute.
> 3. The text field uses a generic `<span>` instead of a semantic `<label>` tag, meaning screen readers will not link "Enter Age" to the input.
> ```
> - Think about semantic landmarks, form label bindings, and image fallback descriptions.
> 
---



### Exercise 2: POUR Accessibility Principles

**Problem:** List the 4 foundational principles of the Web Content Accessibility Guidelines (WCAG).

**Expected output:**
> [!check]- Answer
> ```text
> 1. Perceivable
> 2. Operable
> 3. Understandable
> 4. Robust
> ```
> ```text
> 1. Perceivable
> 2. Operable
> 3. Understandable
> 4. Robust
> ```
>
> **Explanation:** POUR principles guide accessible web content design.
> 
---

### Exercise 3: WCAG Minimum Color Contrast Ratio

**Problem:** What is the WCAG AA minimum required color contrast ratio for normal body text against background?

**Expected output:**
> [!check]- Answer
> ```text
> 4.5:1 ratio (3:1 for large text).
> ```
> ```text
> 4.5:1 ratio (3:1 for large text).
> ```
>
> **Explanation:** 4.5:1 contrast guarantees text readability for low-vision users.
> 
## 6. Related Terms
- [Semantic HTML](../level_06/semantic_html.md) — The foundation of structured layouts.
- [`alt` Attribute](../level_03/alt.md) — Media text descriptors.
- [`<label>`](../level_05/label.md) — Accessible form associations.
- [`tabindex` Attribute](../level_07/tabindex.md) — Managing keyboard focus sequences.
- [ARIA Attributes](aria_attributes.md) — Advanced accessibility extensions.

---

## 7. Key Takeaways
- Accessibility (a11y) means building web content usable by all people, including those with disabilities.
- WCAG is the global standard list for accessibility compliance, organized around the POUR principles.
- Use Semantic HTML landmarks to allow screen readers to skip navigation.
- Always provide descriptive `alt` tags on images and link inputs to `<label>` tags.
- Avoid vague link texts like "click here"; make links self-descriptive.
- Never disable the default browser focus ring styles without providing a clear visual fallback.
