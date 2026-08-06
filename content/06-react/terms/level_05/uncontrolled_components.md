# Uncontrolled Components

> **Level 5 — DOM & Event Handling**
> A form input pattern where form element values are managed natively by the browser DOM rather than React state, accessing input data on-demand using refs.

---

## 1. Prerequisites

- [Controlled Components](controlled_components.md) — Understanding the primary state-driven form handling pattern to evaluate alternative trade-offs.
- [`useRef` Hook](../level_04/use_ref.md) — The hook used to grab direct references to DOM input nodes.
- [Declarative Programming](../level_01/declarative_programming.md) — Contrast between React declarative state updates and imperative DOM reads.

---

## 2. Term Category

**Component Pattern (DOM reference form handling)**: An Uncontrolled Component in React is a form input element (such as `<input>`, `<textarea>`, or `<select>`) that maintains its own internal data state natively inside the browser DOM, bypassing React component state updates on every keystroke.

Rather than binding element `value` attributes to React state and listening to `onChange` events to drive re-renders, Uncontrolled Components rely on native browser input behavior. Developers pass an initial starting value using `defaultValue` (or `defaultChecked`) and query current input values on-demand—typically during form submission—by dereferencing DOM elements via React `useRef` handles (`inputRef.current.value`).

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"

Controlled Components (binding every single keystroke to React state) provide extreme UI control and immediate validation, but they trigger a full component re-render on *every single typed character*. For massive forms containing dozens of inputs or complex nested layouts, triggering 50 component re-renders while typing a paragraph introduces perceptible input lag and performance bottlenecks.

Uncontrolled Components solve this by stepping back and allowing the browser DOM to handle input keystrokes natively without triggering React re-renders. Additionally, certain native browser elements—most notably `<input type="file" />`—are strictly read-only for security reasons in the browser DOM security model; their values cannot be programmatically set by JavaScript state. Uncontrolled Components provide an essential mechanism for reading file selections and lightweight form data directly from the DOM when submitted.

### (2) Reality Metaphor

Imagine a physical suggestion box located in a hotel lobby.

In a **Controlled Component** system, a front desk clerk stands next to the box. Every time a guest writes a single letter on a card, the clerk inspects the letter, writes it down in a central ledger book (**updating React state**), and re-types the letter onto the card before letting the guest continue typing.

In an **Uncontrolled Component** system, the guest writes their complete suggestion card at their own pace without interruption (**native DOM handling**). Once finished, the guest drops the completed card into the locked suggestion box. The hotel manager unlocks the box and reads the suggestion card only once at the end of the day (**reading DOM values via `useRef` on submit**).

### (3) React Code Examples

#### Short Snippet

```jsx
import React, { useRef } from 'react';

function SimpleUncontrolledInput() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Read input value directly from DOM node on submit
    alert(`Submitted value: ${inputRef.current.value}`);
  };

  // Uses defaultValue instead of value; no onChange handler required
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={inputRef} defaultValue="Default Query" />
      <button type="submit">Search</button>
    </form>
  );
}

export default SimpleUncontrolledInput;
```

#### Fuller Example

```jsx
import React, { useRef } from 'react';

function HeavySettingsForm({ onSave }) {
  // Direct DOM references for form fields
  const serverUrlRef = useRef(null);
  const maxRetriesRef = useRef(null);
  const enableLoggingRef = useRef(null);
  const logFileRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Collect values on-demand from DOM nodes on form submission
    const configData = {
      serverUrl: serverUrlRef.current.value,
      maxRetries: parseInt(maxRetriesRef.current.value, 10),
      enableLogging: enableLoggingRef.current.checked,
      // File inputs MUST be read from files array
      logFile: logFileRef.current.files[0] ? logFileRef.current.files[0].name : null
    };

    onSave(configData);
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <h3>Server Gateway Settings (Uncontrolled Form)</h3>

      <div>
        <label htmlFor="serverUrl">Server Endpoint URL:</label>
        <input
          id="serverUrl"
          type="text"
          ref={serverUrlRef}
          defaultValue="https://api.gateway.internal"
        />
      </div>

      <div>
        <label htmlFor="maxRetries">Max Retry Attempts:</label>
        <input
          id="maxRetries"
          type="number"
          ref={maxRetriesRef}
          defaultValue={3}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            ref={enableLoggingRef}
            defaultChecked={true}
          />
          Enable Verbose System Logging
        </label>
      </div>

      <div>
        <label htmlFor="logFile">Upload Diagnostic Configuration (File Input):</label>
        {/* File inputs MUST be uncontrolled in React */}
        <input
          id="logFile"
          type="file"
          ref={logFileRef}
        />
      </div>

      <button type="submit">Save Gateway Configuration</button>
    </form>
  );
}

export default HeavySettingsForm;
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Passing the `value` Prop Instead of `defaultValue` on Uncontrolled Inputs

**The mistake:** Writing `<input ref={inputRef} value="Initial Text" />` when attempting to build an uncontrolled input.

**Why it's wrong:** Passing a fixed `value` prop binds the element to a static value in React's reconciliation engine. Without an `onChange` handler to update state, React locks the DOM element as read-only. Use `defaultValue` for text/select inputs or `defaultChecked` for checkboxes.

*Incorrect:*
```jsx
function BadUncontrolled() {
  const inputRef = useRef(null);
  // ❌ Passing value locks input read-only!
  return <input ref={inputRef} value="Initial" />;
}
```

*Fix:*
```jsx
function GoodUncontrolled() {
  const inputRef = useRef(null);
  // Use defaultValue to set initial content while allowing free typing
  return <input ref={inputRef} defaultValue="Initial" />;
}
```

### Mistake 2: Attempting to Control `<input type="file" />` with React State

**The mistake:** Writing `<input type="file" value={fileState} onChange={e => setFileState(e.target.value)} />`.

**Why it's wrong:** For security reasons, browser DOM security models prevent JavaScript from programmatically setting the `value` of a file input. Passing `value` to a file input throws a DOMException error in browsers. File inputs MUST always be uncontrolled in React.

*Incorrect:*
```jsx
function FileUpload() {
  const [file, setFile] = useState('');
  // ❌ Throws DOM error trying to bind value to file input!
  return <input type="file" value={file} onChange={(e) => setFile(e.target.value)} />;
}
```

*Fix:*
```jsx
function FileUpload() {
  const fileRef = useRef(null);
  // Use uncontrolled ref to access e.target.files on demand
  return <input type="file" ref={fileRef} />;
}
```

### Mistake 3: Mixing `useState` and `useRef` for the Same Form Field Redundantly

**The mistake:** Creating both a `useState` state variable and a `useRef` node handle to manage the exact same input element.

**Why it's wrong:** Maintaining redundant state and refs for a single input creates duplicate code paths, increases memory overhead, and defeats the performance benefit of uncontrolled inputs. Choose controlled components when instant validation is required, or uncontrolled components when reading data on submission is sufficient.

*Incorrect:*
```jsx
function RedundantForm() {
  const [name, setName] = useState('');
  const nameRef = useRef(null); // ❌ Unnecessary double management
  return <input value={name} ref={nameRef} onChange={(e) => setName(e.target.value)} />;
}
```

*Fix:*
```jsx
function CleanForm() {
  const [name, setName] = useState(''); // Controlled approach
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

---

## 5. Practice Exercises

### Exercise 1: IoT Factory Calibration Uncontrolled Preset Form

**Scenario:** You are creating a factory calibration tool where technicians enter 20 numeric sensor calibration offsets. Typing causes excessive re-render lag in controlled mode. Implement the form using uncontrolled inputs with `useRef` and `defaultValue`.

**Requirements:**
1. Maintain 3 numeric calibration inputs using `useRef` handles.
2. Initialize inputs with `defaultValue` numbers.
3. Collect all values on form submit into a clean telemetry payload.
4. Include runtime test assertions for ref payload collection.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef } from 'react';
> 
> function CalibrationPresetForm({ onCalibrate }) {
>   const tempOffsetRef = useRef(null);
>   const pressureOffsetRef = useRef(null);
>   const humidityOffsetRef = useRef(null);
> 
>   const handleSubmit = (e) => {
>     e.preventDefault();
>     const payload = {
>       tempOffset: parseFloat(tempOffsetRef.current.value) || 0,
>       pressureOffset: parseFloat(pressureOffsetRef.current.value) || 0,
>       humidityOffset: parseFloat(humidityOffsetRef.current.value) || 0
>     };
>     if (onCalibrate) onCalibrate(payload);
>   };
> 
>   return (
>     <form onSubmit={handleSubmit} className="calibration-form">
>       <h3>Sensor Calibration Offsets</h3>
>       <div>
>         <label>Temperature Offset (°C):</label>
>         <input type="number" step="0.1" ref={tempOffsetRef} defaultValue={0.5} />
>       </div>
>       <div>
>         <label>Pressure Offset (kPa):</label>
>         <input type="number" step="0.1" ref={pressureOffsetRef} defaultValue={-1.2} />
>       </div>
>       <div>
>         <label>Humidity Offset (%):</label>
>         <input type="number" step="0.1" ref={humidityOffsetRef} defaultValue={0.0} />
>       </div>
>       <button type="submit">Apply Offsets</button>
>     </form>
>   );
> }
> 
> export function testCalibrationPresetForm() {
>   const res = CalibrationPresetForm({ onCalibrate: null });
>   console.assert(res.props.children[1].props.children[1].props.defaultValue === 0.5, 'Default value check');
> }
> ```
>
> #### Technical Explanation
> 1. **Zero Re-Render Typing**: Allows technicians to type calibration figures freely without triggering component re-renders.
> 2. **Default Value Initialization**: Sets starting numbers using `defaultValue` without locking the input fields.
> 3. **On-Demand DOM Read**: Extracts numeric values directly from `ref.current.value` during `handleSubmit`.
> 4. **Float Parsing Defense**: Parses raw string DOM values safely with `parseFloat()`.
> 
### Exercise 2: Financial Audit Log CSV File Upload Form

**Scenario:** Implement an institutional financial audit log upload interface. The form takes a financial batch reference code string and an uploaded CSV file using `<input type="file" />`.

**Requirements:**
1. Use `useRef` handles for batch reference code and file upload inputs.
2. Read selected file object metadata (`file.name`, `file.size`) on submit.
3. Handle missing file selection gracefully with alert notices.
4. Include runtime test assertions for file input structure.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef } from 'react';
> 
> function AuditLogUploadForm({ onUpload }) {
>   const batchIdRef = useRef(null);
>   const fileInputRef = useRef(null);
> 
>   const handleSubmit = (e) => {
>     e.preventDefault();
>     const batchId = batchIdRef.current.value;
>     const selectedFile = fileInputRef.current.files[0];
> 
>     if (!selectedFile) {
>       alert('Please select a valid CSV audit file to upload.');
>       return;
>     }
> 
>     onUpload({
>       batchId,
>       fileName: selectedFile.name,
>       fileSize: selectedFile.size,
>       fileObj: selectedFile
>     });
>   };
> 
>   return (
>     <form onSubmit={handleSubmit} className="audit-upload-form">
>       <h3>Financial Audit Log Upload</h3>
>       <div>
>         <label>Batch Reference ID:</label>
>         <input type="text" ref={batchIdRef} defaultValue="BATCH-2026-001" />
>       </div>
>       <div>
>         <label>Select Audit CSV File:</label>
>         {/* File inputs MUST be uncontrolled */}
>         <input type="file" accept=".csv" ref={fileInputRef} />
>       </div>
>       <button type="submit">Upload Audit Log</button>
>     </form>
>   );
> }
> 
> export function testAuditLogUploadForm() {
>   const res = AuditLogUploadForm({ onUpload: null });
>   console.assert(res.props.children[2].props.children[1].props.type === 'file', 'File input type verification');
> }
> ```
>
> #### Technical Explanation
> 1. **Native File Access**: Uses `fileInputRef.current.files[0]` to inspect uploaded file metadata directly from the DOM node.
> 2. **Uncontrolled File Compliance**: Strictly avoids setting `value` on the file input element to conform to browser DOM security models.
> 3. **Validation Guard**: Checks for `selectedFile` presence before executing processing callbacks.
> 4. **Default Text Pre-filling**: Pre-populates `batchIdRef` using `defaultValue` for rapid workflow processing.
> 
### Exercise 3: Healthcare Patient EHR Rapid Notes Input Form

**Scenario:** Create a medical EHR consultation note form with a massive `<textarea>` where doctors type long-form clinical notes during patient visits. Use uncontrolled components to maximize editor typing smoothness.

**Requirements:**
1. Wrap `<textarea>` with a `useRef` DOM handle.
2. Pre-fill initial notes using `defaultValue`.
3. Provide a "Reset to Default" button using `inputRef.current.value = defaultValue`.
4. Include runtime test assertions for note editor mounting.

> [!check]- Answer
>
> #### Implementation
> ```jsx
> import React, { useRef } from 'react';
> 
> function ClinicalNotesEditor({ initialNotes = '', onSaveNotes }) {
>   const notesRef = useRef(null);
> 
>   const handleSave = (e) => {
>     e.preventDefault();
>     if (onSaveNotes) {
>       onSaveNotes(notesRef.current.value);
>     }
>   };
> 
>   const handleReset = () => {
>     if (notesRef.current) {
>       notesRef.current.value = initialNotes;
>     }
>   };
> 
>   return (
>     <form onSubmit={handleSave} className="clinical-notes-form">
>       <h3>Patient Clinical EHR Notes</h3>
>       <textarea
>         ref={notesRef}
>         defaultValue={initialNotes}
>         rows={10}
>         placeholder="Enter clinical examination notes..."
>         className="notes-area"
>       />
>       <div className="btn-group">
>         <button type="submit">Save Clinical Note</button>
>         <button type="button" onClick={handleReset}>Reset to Original</button>
>       </div>
>     </form>
>   );
> }
> 
> export function testClinicalNotesEditor() {
>   const res = ClinicalNotesEditor({ initialNotes: 'Patient stable.', onSaveNotes: null });
>   console.assert(res.props.children[1].props.defaultValue === 'Patient stable.', 'Clinical note defaultValue verification');
> }
> ```
>
> #### Technical Explanation
> 1. **High-Performance Editing**: Prevents 60fps re-rendering during rapid long-form medical text typing.
> 2. **Imperative DOM Reset**: Demonstrates valid imperative DOM value resetting (`notesRef.current.value = initialNotes`) for uncontrolled fields.
> 3. **Textarea Defaulting**: Uses `defaultValue` on `<textarea>` nodes rather than child text node interpolation.
> 4. **Clean Component Boundary**: Exposes clean JS data strings to parent components via `onSaveNotes`.
> 
---

## 6. Related Terms

- [Controlled Components](controlled_components.md) — The state-driven alternative for form inputs.
- [`useRef` Hook](../level_04/use_ref.md) — The primary hook enabling direct DOM node references.
- [Declarative Programming](../level_01/declarative_programming.md) — Contrast with imperative DOM value extraction.
- [Synthetic Events](synthetic_events.md) — Handling `onSubmit` synthetic events on uncontrolled forms.

---

## 7. Key Takeaways

- Uncontrolled Components let the browser DOM manage form input state natively, accessing data on-demand via `useRef`.
- Use `defaultValue` and `defaultChecked` to set starting values without locking the input elements.
- Uncontrolled Components eliminate typing re-renders, offering superior performance for massive forms and text editors.
- File inputs (`<input type="file" />`) MUST always be implemented as Uncontrolled Components in React due to browser DOM security rules.
- Avoid mixing `useState` and `useRef` redundantly for the exact same input element.
