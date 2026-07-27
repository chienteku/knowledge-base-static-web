# Date object

> **Level 2 — Control Flow & Data Structures**
> Representing and manipulating dates/times.

---

## 1. Prerequisites
- [Object](../level_02/object.md) — A collection of key-value pairs representing properties and methods.

---

## 2. Term Category
- **Language Core**

---

## 3. Environment Context
- **Universal**: Works everywhere (Browsers, Node.js, Deno, etc.)

---

## 4. Explanation

### (1) Design Motivation — "Why did we design this?"
Applications must frequently work with time: logging when a transaction occurred, setting a deadline for a task, or rendering calendars. To represent specific moments in time, JavaScript provides the built-in **`Date`** object constructor. 

Under the hood, a Date object represents time as a single integer: the number of milliseconds that have elapsed since **January 1, 1970, 00:00:00 UTC** (referred to as the Unix Epoch). When you instantiate a Date object, the engine pulls the current system clock time and creates a set of helper methods to let you easily extract years, months, days, hours, and minutes.

### (2) Reality Metaphor
A Date object is like a smart digital watch. 
- Calling `new Date()` is like buying a new watch that automatically initializes itself to the current moment.
- You can press side buttons on the watch to read the year, month, or current hour (these are getter methods like `.getFullYear()`).
- You can also manually pull out the watch dials to set the hands back to a historical birthday or forward to a future date (these are setter methods like `.setFullYear()`).

### (3) JavaScript Code Examples

#### Short Snippet
```javascript
// Instantiating a new Date object representing the current moment
const now = new Date();
console.log(now.toString()); // String representation of current date

// Getting specific date parts
console.log(now.getFullYear()); // e.g., 2026
console.log(now.getMonth());    // e.g., 6 (representing July; 0-indexed!)
console.log(now.getDate());     // e.g., 17 (day of the month)
```

#### Fuller Example
```javascript
// Scheduling a feature expiration deadline 30 days in the future
const registrationDate = new Date("2026-07-17T12:00:00"); // Parse specific ISO date
console.log("Registered on:", registrationDate.toDateString()); // "Registered on: Fri Jul 17 2026"

// Extract the Epoch timestamp (milliseconds since 1970)
const registrationTimestamp = registrationDate.getTime();
console.log("Timestamp (ms):", registrationTimestamp); 

// Calculate 30 days in milliseconds: days * hours * minutes * seconds * ms
const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

// Create a new Date object representing the deadline by adding milliseconds
const expirationDate = new Date(registrationTimestamp + thirtyDaysInMs);

console.log("Plan Expiration Date:", expirationDate.toDateString()); 
// "Plan Expiration Date: Sun Aug 16 2026"
```

---

## 5. Common Mistakes & Pitfalls

### Mistake 1: Forgetting that Months are Zero-Indexed

**The mistake:** Assuming `getMonth()` returns `1` for January, `2` for February, and so on.

**Why it's wrong:** In JavaScript's Date implementation, months are zero-indexed (starting at `0` for January and ending at `11` for December). Failing to account for this indexing scheme results in calendar math logic bugs.

*Incorrect:*
```javascript
const birthday = new Date("2026-05-10"); // May 10th

// Intent: print "Month of birthday: 5"
console.log("Month of birthday:", birthday.getMonth()); // Logs 4 (May is index 4!)
```

*Fix:*
```javascript
const birthday = new Date("2026-05-10");

// Add 1 to get the standard human-readable calendar month
const humanMonth = birthday.getMonth() + 1;
console.log("Month of birthday:", humanMonth); // 5
```

### Mistake 2: Creating a Date Object without the `new` keyword

**The mistake:** Declaring a Date object variable using `const date = Date();`.

**Why it's wrong:** Calling `Date()` as a regular function (without the `new` keyword) ignores all arguments and returns a plain `String` representation of the current time, rather than a Date object instance. You cannot call methods like `.getFullYear()` on a string.

*Incorrect:*
```javascript
const birthDate = Date("1995-12-17"); // Returns a string of current time!
console.log(typeof birthDate); // "string"

console.log(birthDate.getFullYear()); // TypeError: birthDate.getFullYear is not a function
```

*Fix:*
```javascript
const birthDate = new Date("1995-12-17"); // Correctly instantiates a Date object
console.log(typeof birthDate); // "object"
console.log(birthDate.getFullYear()); // 1995
```

---

### Mistake 3: Unhandled Asynchronous Failures in Date Object Operations

**The mistake:** Executing asynchronous operations within Date Object without wrapping `await` calls in `try...catch` blocks or chaining `.catch()`.

**Why it's wrong:** Unhandled promise rejections trigger `UnhandledPromiseRejectionWarning` in Node.js or unhandled rejection errors in modern browsers, leaving application state in corrupted or uncoordinated states.

*Incorrect:*
```javascript
async function processData() {
    const res = await fetch("/api/date_object"); // ❌ Unhandled network failure crashes execution flow
    const data = await res.json();
    return data;
}
```

*Fix:*
```javascript
async function processData() {
    try {
        const res = await fetch("/api/date_object");
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`Caught error in date_object: ${err.message}`);
        return null;
    }
}
```

## 6. Practice Exercises

### Exercise 1: Format Date String

**Problem:** Complete the function `getFormattedDate` to return a string in the format `YYYY-MM-DD` from a given Date object. Remember that months are zero-indexed.

```javascript
function getFormattedDate(dateObj) {
  const year = dateObj.getFullYear();
  // Extract month (+1)
  // Extract date
  // Return formatted string
}

const testDate = new Date("2026-07-17T00:00:00");
console.log(getFormattedDate(testDate));
```

**Expected output:**
```text
2026-7-17
```

> [!check]- Answer
> - Add `1` to `dateObj.getMonth()`.
> - Use `.getDate()` to get the day of the month.
> - Concatenate the values separated by hyphens.

---

### Exercise 2: Parsing ISO Date Strings safely

**Problem:** Create a Date from `"2026-01-01T00:00:00Z"` and print `date.getUTCFullYear()` and `date.getUTCMonth()`.

**Expected output:**
```text
2026
0
```

> [!check]- Answer
> ```javascript
> const d = new Date("2026-01-01T00:00:00Z");
> console.log(d.getUTCFullYear());
> console.log(d.getUTCMonth()); // 0 = January
> ```
>
> **Explanation:** UTC methods on `Date` return standardized UTC values independent of local machine timezones.

### Exercise 3: Calculating Date Differences in Days

**Problem:** Calculate the difference in days between two Date objects 48 hours apart.

**Expected output:**
```text
2
```

> [!check]- Answer
> ```javascript
> const d1 = new Date("2026-01-01");
> const d2 = new Date("2026-01-03");
> const diffDays = (d2 - d1) / (1000 * 60 * 60 * 24);
> console.log(diffDays);
> ```
>
> **Explanation:** Subtracting two Date objects yields their difference in milliseconds.

---

## 7. Related Terms
- [Timers](../level_05/timers.md) — Functions used to execute code after delays or periodically.
- [JSON](../level_07/json.md) — Text data representation (Note: JSON has no date type, so Date objects are serialized to strings).

---

## 8. Key Takeaways
- The `Date` object represents a single moment in time, stored as milliseconds since the Unix Epoch (January 1, 1970 UTC).
- You must instantiate Date objects using the `new` keyword (e.g. `new Date()`) to get a true Date object with access to time manipulation methods.
- Months are zero-indexed (`0` = January, `11` = December); days of the month (`.getDate()`) are 1-indexed.
- Use `.getTime()` to get the raw millisecond Epoch value, which is useful for performing date addition and subtraction calculations.
