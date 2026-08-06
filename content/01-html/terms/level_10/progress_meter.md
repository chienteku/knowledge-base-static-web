# `<progress>` & `<meter>` Elements

> **Level 10 — Canvas, SVG & Storage**
> Native HTML5 elements used to display dynamic task progress bars (progress) and static scalar measurements within a defined range (meter) without requiring JavaScript styling.

---

## 1. Prerequisites
- [Element vs. Tag](../level_01/element_vs_tag.md) — Base tag syntax.
- [`value` Attribute (in Form Fields)](../level_05/value.md) — The attribute used to declare current values.

---

## 2. Term Category
- **Form Element**

---

## 3. Environment Context
- **Universal Browser Support** (HTML5 elements rendered natively by all browsers. Browsers apply default visual stylings, which can be modified using CSS).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
We often need to show numerical measurements to users:
-   **Loading states:** Showing the progress of a file download (e.g., 40% completed).
-   **Scalar gauges:** Showing available disk storage (e.g. 80GB out of 100GB used), battery level, or password strength.

Before HTML5, developers built these components by nesting `<div>` elements inside each other and using JavaScript to change the width of the inner div (e.g., `<div style="width: 40%;">`).

This method had severe drawbacks:
1.  **Complexity:** Required CSS styles and JS logic just to show a bar.
2.  **Inaccessibility:** Screen readers read these elements as empty divs, completely blocking blind users from understanding the progress.

The W3C created **`<progress>`** and **`<meter>`** in HTML5 to provide accessible, native widgets built directly into the browser.

---

### (2) `<progress>` vs. `<meter>`
While they look similar, they serve different semantic purposes:

| Feature | `<progress>` Element | `<meter>` Element |
| :--- | :--- | :--- |
| **Semantic Meaning** | Completion progress of a dynamic task over time. | A static measurement within a known range (a gauge). |
| **Typical Use Case** | File downloads, loading screens, form completion steps. | Disk usage, battery level, voting results, password strength. |
| **Key Attributes** | `value` (current state), `max` (target total). | `value`, `min`, `max`, `low` (low threshold), `high` (high threshold), `optimum` (ideal target). |
| **Visual States** | Simple loading bar filling up. | Can change colors (green, yellow, red) based on threshold metrics. |

---

### (3) The `<meter>` Color Thresholds
The `<meter>` element is smart. If you define the boundaries using `low`, `high`, and `optimum`, the browser automatically shifts the visual color of the bar:
-   **Green:** The current value is in the `optimum` range.
-   **Yellow/Orange:** The value is approaching a warning threshold.
-   **Red:** The value has reached a critical low or high boundary.

---

### (4) Code Examples

#### Short Snippet
Basic progress and meter tags:

```html
<!-- Progress bar set to 70% -->
<progress value="70" max="100">70%</progress>

<!-- Fuel gauge set to 25% (low) -->
<meter value="0.25" min="0" max="1" low="0.3" high="0.8" optimum="0.9">25% full</meter>
```

#### Fuller Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Progress and Meter Demos</title>
</head>
<body>

  <h1>User Dashboard</h1>

  <section>
    <h2>1. Profile Setup Progress</h2>
    <p>Please complete your profile details:</p>
    <!-- Screen readers will read "4 of 5 steps completed" -->
    <p>
      Progress: 
      <progress value="4" max="5">4 out of 5 steps</progress>
    </p>
  </section>

  <hr>

  <section>
    <h2>2. Cloud Storage Usage</h2>
    <p>Your subscription includes 10GB of storage:</p>
    <!-- Renders in Red because value (9.2) is above the high threshold (8.0) -->
    <p>
      Storage: 
      <meter value="9.2" min="0" max="10" low="3" high="8" optimum="1">
        9.2 GB used
      </meter>
      (9.2 GB of 10 GB used)
    </p>
  </section>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Confusing the two elements

**The mistake:** Using `<progress>` to display disk space or using `<meter>` as a loading spinner:

```html
<!-- BAD: Disk usage is not a dynamic task progress! -->
<progress value="80" max="100">80% Disk space used</progress>
```

**Why it's wrong:** While they look visually identical in some browsers, screen readers announce them differently. A blind user hearing "loading progress 80%" on a static storage indicator will expect something to finish loading, leading to confusion.

**Fix:** Use `<meter>` for static metrics.

---



### Mistake 2: Confusing `<progress>` (Task Completion Bar) with `<meter>` (Gauge Measurement)

**The mistake:** Using `<progress>` to show disk space usage, or `<meter>` to show download completion.

**Why it's wrong:** `<progress>` represents task completion progress (0% to 100% finished loading). `<meter>` represents a scalar measurement within a known range (disk usage, battery level, temperature).

*Incorrect:*
```html
<progress value="80" max="100"></progress> <!-- Used for disk usage gauge -->
```

*Fix:*
```html
<meter value="80" min="0" max="100">80%</meter> <!-- Meter used for disk gauge -->
```

### Mistake 3: Omitting Fallback Text and Labels for `<progress>` and `<meter>` Elements

**The mistake:** Writing `<progress value="50" max="100"></progress>` without fallback text or accessible labels.

**Why it's wrong:** Without associated labels or inner fallback text, screen readers cannot communicate progress states to blind users. Use `aria-label` or `<label>`.

*Incorrect:*
```html
<progress value="40" max="100"></progress> <!-- Missing label context -->
```

*Fix:*
```html
<label for="p">File Download:</label>
<progress id="p" value="40" max="100">40%</progress>
```



### Mistake 4: Confusing `<progress>` (Task Completion Bar) with `<meter>` (Gauge Measurement)

**The mistake:** Using `<progress>` to show disk space usage, or `<meter>` to show download completion.

**Why it's wrong:** `<progress>` represents task completion progress (0% to 100% finished loading). `<meter>` represents a scalar measurement within a known range (disk usage, battery level, temperature).

*Incorrect:*
```html
<progress value="80" max="100"></progress> <!-- Used for disk usage gauge -->
```

*Fix:*
```html
<meter value="80" min="0" max="100">80%</meter> <!-- Meter used for disk gauge -->
```

### Mistake 5: Omitting Fallback Text and Labels for `<progress>` and `<meter>` Elements

**The mistake:** Writing `<progress value="50" max="100"></progress>` without fallback text or accessible labels.

**Why it's wrong:** Without associated labels or inner fallback text, screen readers cannot communicate progress states to blind users. Use `aria-label` or `<label>`.

*Incorrect:*
```html
<progress value="40" max="100"></progress> <!-- Missing label context -->
```

*Fix:*
```html
<label for="p">File Download:</label>
<progress id="p" value="40" max="100">40%</progress>
```



### Mistake 6: Confusing `<progress>` (Task Completion Bar) with `<meter>` (Gauge Measurement)

**The mistake:** Using `<progress>` to show disk space usage, or `<meter>` to show download completion.

**Why it's wrong:** `<progress>` represents task completion progress (0% to 100% finished loading). `<meter>` represents a scalar measurement within a known range (disk usage, battery level, temperature).

*Incorrect:*
```html
<progress value="80" max="100"></progress> <!-- Used for disk usage gauge -->
```

*Fix:*
```html
<meter value="80" min="0" max="100">80%</meter> <!-- Meter used for disk gauge -->
```

### Mistake 7: Omitting Fallback Text and Labels for `<progress>` and `<meter>` Elements

**The mistake:** Writing `<progress value="50" max="100"></progress>` without fallback text or accessible labels.

**Why it's wrong:** Without associated labels or inner fallback text, screen readers cannot communicate progress states to blind users. Use `aria-label` or `<label>`.

*Incorrect:*
```html
<progress value="40" max="100"></progress> <!-- Missing label context -->
```

*Fix:*
```html
<label for="p">File Download:</label>
<progress id="p" value="40" max="100">40%</progress>
```

## 6. Practice Exercises

### Exercise 1: Password Strength Gauge

**Problem:** Write the markup for a password strength gauge. The maximum score is 4. The password has a score of 1. Set the warning thresholds so a score of 1 displays as a warning color, and set the optimum score target to 4. Include screen-reader fallback text.

**Expected output:**
> [!check]- Answer
> ```html
> <meter value="1" min="0" max="4" low="2" high="3" optimum="4">Strength: 1 out of 4</meter>
> ```
> - Use the `<meter>` element.
> - Connect the `value` to `1` and `max` to `4`.
> - Set `low="2"` so 1 falls below the low threshold, triggering warning colors.
> - Set `optimum="4"`.
> 
---



### Exercise 2: Progress vs Meter Code Comparison

**Problem:** Write HTML for:
1. File upload 70% completed (`<progress>`)
2. Battery charge 90% level (`<meter>`)

**Expected output:**
> [!check]- Answer
> ```text
> 1. <progress value="70" max="100">70%</progress>
> 2. <meter value="0.9" min="0" max="1.0">90%</meter>
> ```
> ```html
> <!-- Progress bar -->
> <label>Upload: <progress value="70" max="100">70%</progress></label>
>
> <!-- Meter gauge -->
> <label>Battery: <meter value="0.9" min="0" max="1.0">90%</meter></label>
> ```
>
> **Explanation:** `<progress>` tracks task completion; `<meter>` measures scalar gauge values.
> 
---

### Exercise 3: Indeterminate Progress State

**Problem:** How do you create an indeterminate progress bar (loading spinner style) where completion % is unknown?

**Expected output:**
> [!check]- Answer
> ```text
> Omit the `value` attribute on `<progress>`.
> ```
> ```html
> <progress></progress> <!-- Indeterminate progress bar -->
> ```
>
> **Explanation:** Omitting the `value` attribute renders an indeterminate loading animation.
> 
## 7. Related Terms
- [`value` Attribute (in Form Fields)](../level_05/value.md) — The data value tag.
- [`<output>` Element](../level_05/output.md) — The semantic tag displaying calculation results.
- [`style` Attribute](../level_07/style.md) — Used for overriding default progress styles.
- [`<canvas>`](canvas.md) — Related concept: `<canvas>`.

---

## 8. Key Takeaways
- `<progress>` represents the completion progress of a dynamic task.
- `<meter>` represents a static scalar measurement within a known range (a gauge).
- Always include fallback text inside the tags (e.g. `70%`) for legacy browsers and screen reader accessibility.
- The `<meter>` element changes colors natively based on `low`, `high`, and `optimum` thresholds.
- Do not use `<progress>` for static metrics like storage or grades; use `<meter>` instead.
