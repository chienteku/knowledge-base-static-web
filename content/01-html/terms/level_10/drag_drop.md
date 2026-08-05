# Drag & Drop API

> **Level 10 — Canvas, SVG & Storage**
> An HTML5 API that enables native drag-and-drop interactions on webpages, allowing users to physically drag elements or files and drop them into designated zones.

---

## 1. Prerequisites
- [DOM (Document Object Model)](../level_09/dom.md) — Drag events are captured and handled via JavaScript DOM listeners.
- [`<script>`](../level_08/script.md) — The programming blocks that run the drag-drop logic.
- [Attribute](../level_01/attribute.md) — The parameters used to toggle draggability.

---

## 2. Term Category
- **HTML5 API / Concept**

---

## 3. Environment Context
- **Universal Browser Support** (Natively supported by all desktop browsers. Mobile touch screen devices do not support the native mouse drag-drop API natively, requiring touch-event libraries for fallbacks).

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Sighted users expect web applications to behave like desktop software:
-   Dragging a file from their desktop into an email window to upload it.
-   Dragging a task card from "To Do" to "In Progress" on a Kanban board (like Trello).
-   Rearranging items in a list.

In early web development, building drag-and-drop features required complex math. Developers had to listen to mouse movements (`mousedown`, `mousemove`, `mouseup`), calculate pixel coordinates on the fly, and update the absolute CSS positioning of elements.

HTML5 introduced the **Drag & Drop API** to handle this complexity. It tracks the element under the cursor automatically, handles visual ghost overlays (the semi-transparent preview image trailing the cursor), and raises events during each stage of the movement.

---

### (2) Making Elements Draggable
Normally, text and custom blocks are not draggable. To make any element draggable, add the global **`draggable="true"`** attribute:

```html
<div class="card" draggable="true">Drag Me!</div>
```
*(Note: Images (`<img>`) and hyperlinks (`<a>` with href) are draggable by default).*

---

### (3) The Drag & Drop Event Lifecycle
The API splits events between the item being dragged and the destination target (the drop zone):

#### 1. On the Draggable Element
-   `dragstart`: Fires when the user starts dragging. This is where you package the data you want to send.
-   `dragend`: Fires when the dragging stops (either by dropping or cancelling).

#### 2. On the Drop Zone (Target)
-   `dragover`: Fires continuously as the dragged element hovers over the drop zone.
-   `drop`: Fires when the user releases the mouse button, dropping the element.

---

### (4) The `dragover` Trap & `dataTransfer`
By default, web browsers block users from dropping items onto webpages (for instance, dropping an image file usually navigates the browser away to open the image file). 

To tell the browser that dropping is allowed, **you must cancel the default browser action inside the `dragover` event** by calling `event.preventDefault()`. If you forget this, the `drop` event will never fire!

The **`dataTransfer`** object is used to pass variables from the source to the target:
-   *Set data:* `event.dataTransfer.setData("text/plain", id)` (done inside `dragstart`).
-   *Get data:* `event.dataTransfer.getData("text/plain")` (done inside `drop`).

---

### (5) Code Examples

#### Short Snippet
Allowing drops on a div:

```javascript
// You MUST cancel the default block behavior inside dragover!
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault(); 
});
```

#### Fuller Example
Moving a text box between two containers:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Drag & Drop Demo</title>
  <style>
    .zone { width: 200px; height: 150px; border: 2px dashed gray; padding: 10px; margin: 10px; display: inline-block; vertical-align: top; }
    .item { padding: 10px; background-color: #f0f2f5; border: 1px solid black; cursor: grab; }
  </style>
</head>
<body>

  <h1>Task Manager</h1>

  <!-- Drop Zone 1 -->
  <div class="zone" id="todo-zone">
    <h3>To Do</h3>
    <!-- The Draggable Item -->
    <div class="item" id="task-1" draggable="true">Finish Homework</div>
  </div>

  <!-- Drop Zone 2 -->
  <div class="zone" id="done-zone">
    <h3>Completed</h3>
  </div>

  <script>
    const item = document.getElementById("task-1");
    const zones = document.querySelectorAll(".zone");

    // 1. Pack data when drag begins
    item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", e.target.id);
    });

    // 2. Configure zones to accept drops
    zones.forEach(zone => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault(); // MANDATORY: unlocks dropping!
      });

      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        // Retrieve the dragged element ID
        const itemId = e.dataTransfer.getData("text/plain");
        const draggedElement = document.getElementById(itemId);
        // Move the element into the drop zone container
        e.target.appendChild(draggedElement);
      });
    });
  </script>

</body>
</html>
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting `event.preventDefault()` inside the `dragover` listener

**The mistake:** Writing a correct `drop` listener, but finding that dropping does absolutely nothing and the cursor shows a "blocked" symbol.

**Why it's wrong:** The browser's default behavior is to reject drops on random tags. If you do not call `preventDefault()` during the `dragover` phase, the browser assumes you cannot drop here, cancelling the drop event before it starts.

---



### Mistake 2: Forgetting `draggable="true"` Attribute on Drag Source Elements

**The mistake:** Attempting to drag a `<div>` element without `draggable="true"`.

**Why it's wrong:** Only images and links are draggable by default in HTML. For standard elements (`<div>`, `<p>`), you MUST explicitly add `draggable="true"`.

*Incorrect:*
```html
<div id="card" ondragstart="drag(event)">Drag Me</div> <!-- ❌ Missing draggable attribute! -->
```

*Fix:*
```html
<div id="card" draggable="true" ondragstart="drag(event)">Drag Me</div>
```

### Mistake 3: Forgetting `event.preventDefault()` in `dragover` Handlers (Drop Prevention)

**The mistake:** Defining an `ondrop` listener without adding `event.preventDefault()` in the `ondragover` handler.

**Why it's wrong:** By default, browsers disallow dropping elements onto HTML containers. Calling `event.preventDefault()` inside `ondragover` is MANDATORY to allow drop events to fire.

*Incorrect:*
```html
function allowDrop(ev) {
  // ❌ Missing ev.preventDefault()! Drop event will fail to trigger!
}
```

*Fix:*
```html
function allowDrop(ev) {
  ev.preventDefault(); // Permits dropping elements onto container
}
```



### Mistake 4: Forgetting `draggable="true"` Attribute on Drag Source Elements

**The mistake:** Attempting to drag a `<div>` element without `draggable="true"`.

**Why it's wrong:** Only images and links are draggable by default in HTML. For standard elements (`<div>`, `<p>`), you MUST explicitly add `draggable="true"`.

*Incorrect:*
```html
<div id="card" ondragstart="drag(event)">Drag Me</div> <!-- ❌ Missing draggable attribute! -->
```

*Fix:*
```html
<div id="card" draggable="true" ondragstart="drag(event)">Drag Me</div>
```

### Mistake 5: Forgetting `event.preventDefault()` in `dragover` Handlers (Drop Prevention)

**The mistake:** Defining an `ondrop` listener without adding `event.preventDefault()` in the `ondragover` handler.

**Why it's wrong:** By default, browsers disallow dropping elements onto HTML containers. Calling `event.preventDefault()` inside `ondragover` is MANDATORY to allow drop events to fire.

*Incorrect:*
```html
function allowDrop(ev) {
  // ❌ Missing ev.preventDefault()! Drop event will fail to trigger!
}
```

*Fix:*
```html
function allowDrop(ev) {
  ev.preventDefault(); // Permits dropping elements onto container
}
```



### Mistake 6: Forgetting `draggable="true"` Attribute on Drag Source Elements

**The mistake:** Attempting to drag a `<div>` element without `draggable="true"`.

**Why it's wrong:** Only images and links are draggable by default in HTML. For standard elements (`<div>`, `<p>`), you MUST explicitly add `draggable="true"`.

*Incorrect:*
```html
<div id="card" ondragstart="drag(event)">Drag Me</div> <!-- ❌ Missing draggable attribute! -->
```

*Fix:*
```html
<div id="card" draggable="true" ondragstart="drag(event)">Drag Me</div>
```

### Mistake 7: Forgetting `event.preventDefault()` in `dragover` Handlers (Drop Prevention)

**The mistake:** Defining an `ondrop` listener without adding `event.preventDefault()` in the `ondragover` handler.

**Why it's wrong:** By default, browsers disallow dropping elements onto HTML containers. Calling `event.preventDefault()` inside `ondragover` is MANDATORY to allow drop events to fire.

*Incorrect:*
```html
function allowDrop(ev) {
  // ❌ Missing ev.preventDefault()! Drop event will fail to trigger!
}
```

*Fix:*
```html
function allowDrop(ev) {
  ev.preventDefault(); // Permits dropping elements onto container
}
```

## 6. Practice Exercises

### Exercise 1: Draggable Box Config

**Problem:** You have a custom element `<div id="box">Move Me</div>`. Write the HTML change to make this element draggable, and write the JavaScript listener that hides the box (e.g. setting `style.opacity = "0.5"`) when the user starts dragging it.

**Expected output:**
> [!check]- Answer
> ```html
> <div id="box" draggable="true">Move Me</div>
> 
> <script>
>   const box = document.getElementById('box');
>   box.addEventListener('dragstart', (e) => {
>     e.target.style.opacity = '0.5';
>   });
> </script>
> ```
> - Add the global `draggable` attribute.
> - Connect a listener for the `dragstart` event.

---



### Exercise 2: Drag DataTransfer Data Payload

**Problem:** Write `dragstart` JS code storing element ID `'card-1'` into `event.dataTransfer` payload.

**Expected output:**
> [!check]- Answer
> ```text
> function drag(ev) { ev.dataTransfer.setData('text/plain', ev.target.id); }
> ```
> ```javascript
> function drag(ev) {
>   ev.dataTransfer.setData('text/plain', ev.target.id);
> }
> ```
>
> **Explanation:** `dataTransfer.setData()` attaches drag payload data passed to drop targets.

---

### Exercise 3: HTML Drag & Drop Event Sequence

**Problem:** Order HTML Drag and Drop events sequence from start to finish:
`dragover`, `drop`, `dragstart`

**Expected output:**
> [!check]- Answer
> ```text
> 1. dragstart (on source element)
> 2. dragover (on target container)
> 3. drop (on target container)
> ```
> ```text
> 1. dragstart (on source element)
> 2. dragover (on target container)
> 3. drop (on target container)
> ```
>
> **Explanation:** Drag events track source pickup, target hover, and drop release.

## 7. Related Terms
- [DOM (Document Object Model)](../level_09/dom.md) — The parent interface hierarchy.
- [`data-*` Attributes](../level_07/data_attributes.md) — Used to store custom metadata identifiers on dragged items.

---

## 8. Key Takeaways
- The Drag & Drop API enables native mouse dragging and dropping.
- Make any element draggable by setting `draggable="true"`.
- You must call `event.preventDefault()` in the target's `dragover` listener to allow drops.
- Use `event.dataTransfer` to pass string data from the source element to the drop zone.
- Images and links are draggable by default; other tags require explicit toggle attributes.
