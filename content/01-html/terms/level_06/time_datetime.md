# `<time>` & `datetime` Attribute

> **Level 6 — Semantic HTML5**
> An inline semantic element used to wrap human-friendly dates, times, or durations alongside a standardized, machine-readable `datetime` string.

---

## 1. Prerequisites
- [Semantic HTML](semantic_html.md) — Understanding the focus on machine-readable code.
- [Attribute](../level_01/attribute.md) — The parameter syntax used to configure tags.
---

## 2. Term Category
- **Inline Text Semantics**

---

## 3. Environment Context
- **Modern Browsers (HTML5)** (Introduced to help search engines, translation engines, and calendar software parse timestamps).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Humans represent dates and times in countless formatting variations:
-   "August 14th, 2026"
-   "14/08/26" (common in Europe)
-   "08/14/26" (common in the US)
-   "yesterday" or "three hours ago"

While a human reader understands these references easily based on context, computer programs (search crawlers, browser translation engines, or local calendar applications) struggle. For example, a search engine indexing an event date of "08/09/2026" doesn't know if the event is on August 9th or September 8th.

The W3C created the **`<time>` element** and **`datetime` attribute** to bridge this gap:
-   **Visible Content:** The human-friendly format users read on screen (e.g., "next Friday").
-   **`datetime` value:** The strict, standardized machine-friendly format indexers parse (e.g., `2026-08-14`).

---

### (2) Formatting the `datetime` string (ISO 8601)
The `datetime` attribute value must conform to standard date strings. The most common is **ISO 8601** (`YYYY-MM-DD`):
-   **Date only:** `datetime="2026-08-14"`
-   **Time only:** `datetime="19:00"` (24-hour format)
-   **Date and Time:** `datetime="2026-08-14T19:00:00"` (separated by a capital `T`)
-   **Date, Time, and Timezone:** `datetime="2026-08-14T19:00:00-08:00"`

---

### (3) Code Examples

#### Short Snippet
Basic date wrapping:

```html
<p>
  The concert is scheduled for 
  <!-- Human sees "August 14th"; Machine parses "2026-08-14" -->
  <time datetime="2026-08-14">August 14th</time>.
</p>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Blog Post metadata</title>
</head>
<body>

  <article>
    <header>
      <h1>Understanding the Gregorian Calendar</h1>
      <p>
        Published: 
        <!-- Machine-readable date stamp -->
        <time datetime="2026-07-19">July 19, 2026</time>
      </p>
    </header>

    <p>Calendars have evolved drastically over centuries...</p>

    <footer>
      <p>
        Next conference call: 
        <!-- Machine-readable Date, Time, and Timezone (EST) -->
        <time datetime="2026-07-20T10:00:00-05:00">tomorrow morning at 10:00 AM EST</time>.
      </p>
      <p>
        Class duration: 
        <!-- Machine-readable duration: 2 hours and 30 minutes -->
        <time datetime="PT2H30M">2.5 hours</time>.
      </p>
    </footer>
  </article>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Placing human text inside the `datetime` attribute

**The mistake:** Writing the readable text format inside the parameter value:

```html
<!-- BAD: Machines cannot parse this string! -->
<time datetime="August 14th, 2026">August 14th</time>
```

**Why it's wrong:** The `datetime` attribute is strictly designed for computer algorithms. If you pass unstructured text, parsing will fail, defeating the purpose of using the tag.

---



### Mistake 2: Omitting the Machine-Readable `datetime` Attribute on `<time>` Elements

**The mistake:** Writing `<time>Last Tuesday</time>` without a `datetime` attribute.

**Why it's wrong:** Relative human text ('Last Tuesday', '2 hours ago') is ambiguous to search engine crawlers and calendar tools. The `datetime` attribute provides machine-readable ISO 8601 timestamps.

*Incorrect:*
```html
<time>Yesterday</time> <!-- ❌ Ambiguous to web crawlers! -->
```

*Fix:*
```html
<time datetime="2026-07-24">Yesterday</time> <!-- ISO 8601 machine-readable date -->
```

### Mistake 3: Using Invalid Non-ISO Date Formats in `datetime` Attributes

**The mistake:** Writing `<time datetime="July 25th 2026">`.

**Why it's wrong:** The `datetime` attribute requires standardized ISO 8601 formats (`YYYY-MM-DD` or `YYYY-MM-DDThh:mm:ssZ`). Arbitrary string formats fail parsing.

*Incorrect:*
```html
<time datetime="12/25/2026">Christmas</time> <!-- ❌ Non-standard date format! -->
```

*Fix:*
```html
<time datetime="2026-12-25">Christmas</time>
```

## 6. Practice Exercises

### Exercise 1: Timestamp Formatting

**Problem:** Wrap the text "Christmas Day at 8 PM" in a `<time>` tag. Ensure the machine value is set to December 25th, 2026 at 20:00 (8:00 PM).

**Expected output:**
> [!check]- Answer
> ```html
> <time datetime="2026-12-25T20:00">Christmas Day at 8 PM</time>
> ```
> - The date prefix is `2026-12-25`.
> - Use a capital `T` to separate the date from the time.
> - The time suffix is `20:00` (8 PM in 24-hour time).

---



### Exercise 2: Writing Machine-Readable Time Elements

**Problem:** Write `<time>` element displaying text `'3:00 PM'` with machine-readable `datetime` for 15:00 UTC.

**Expected output:**
> [!check]- Answer
> ```text
> <time datetime="15:00">3:00 PM</time>
> ```
> ```html
> <time datetime="15:00">3:00 PM</time>
> ```
>
> **Explanation:** `datetime="15:00"` provides machine-readable 24-hour time format.

---

### Exercise 3: ISO 8601 Timestamp Formats

**Problem:** Write valid ISO 8601 `datetime` string for July 25, 2026 at 9:30 AM.

**Expected output:**
> [!check]- Answer
> ```text
> 2026-07-25T09:30
> ```
> ```html
> <time datetime="2026-07-25T09:30">July 25, 2026 at 9:30 AM</time>
> ```
>
> **Explanation:** ISO 8601 standard combines YYYY-MM-DD and T hh:mm.

## 7. Related Terms
- [Semantic HTML](semantic_html.md) — The parent layout context.
- [Attribute](../level_01/attribute.md) — The parameter concept.
---

## 8. Key Takeaways
- The `<time>` tag adds machine-readable semantics to visual dates and times.
- The `datetime` attribute hosts the standardized ISO 8601 date string.
- Search engines use `<time>` stamps to index events and display dates in search snippets.
- Browsers can offer smart features (like adding events to the user's calendar) using these tags.
- The visible text inside the tag remains fully customizable for user readability.
