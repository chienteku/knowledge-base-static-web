# JavaScript Terms: Zero to Hero

A progressive glossary of essential JavaScript terms, ordered to build knowledge from the ground up.

---

## Level 1 — Foundations

> Core syntax and concepts every JavaScript beginner encounters first.

| # | Term | Description |
|---|------|-------------|
| 1 | **ECMAScript** (ecmascript.md) | The official specification that defines the JavaScript language standard. |
| 2 | **Variable** (variable.md) | A named container for storing data values. |
| 3 | **`let`** (let.md) | Block-scoped variable declaration. Allows reassignment and prevents redeclaration in the same scope. |
| 4 | **`const`** (const.md) | Block-scoped variable declaration that cannot be reassigned after its initial assignment. |
| 5 | **`var`** (var.md) | Function-scoped or globally-scoped variable declaration (legacy, pre-ES6). |
| 6 | **Primitive Types** (primitive_types.md) | Basic immutable data types: `String`, `Number`, `Boolean`, `Undefined`, `Null`, `Symbol`, `BigInt`. |
| 7 | **String** (string.md) | A sequence of characters representing text, enclosed in quotes (`"`, `'`, or `` ` ``). |
| 8 | **Number** (number.md) | Represents both integer and floating-point numbers. |
| 9 | **Boolean** (boolean.md) | A logical entity having two values: `true` or `false`. |
| 10 | **`undefined`** (undefined.md) | A variable that has been declared but has not yet been assigned a value. |
| 11 | **`null`** (null.md) | An intentional assignment value representing the absence of any object value. |
| 12 | **`BigInt`** (bigint.md) | Primitive for arbitrarily large integers (`123n`). |
| 13 | **Type Coercion** (type_coercion.md) | Automatic or implicit conversion of values from one data type to another by the JavaScript engine. |
| 14 | **`typeof`** (typeof.md) | Operator that returns a string indicating the type of the unevaluated operand. |
| 15 | **Dynamic & Weak Typing** (dynamic_weak_typing.md) | Types attach to values at runtime; JS auto-coerces. |
| 16 | **Statement** (statement.md) | An instruction that performs an action (e.g., `let x = 5;`). |
| 17 | **Expression** (expression.md) | Any valid unit of code that resolves to a single value (e.g., `5 + 5`). |
| 18 | **Operator** (operator.md) | Symbol that performs an operation on operands (umbrella concept). |
| 19 | **Arithmetic Operators** (arithmetic_operators.md) | `+ - * / % **` for math on numbers. |
| 20 | **Increment / Decrement (`++` / `--`)** (increment_decrement.md) | Add/subtract one; prefix vs postfix. |
| 21 | **Assignment Operators** (assignment_operators.md) | `=`, `+=`, `-=`, `*=`, … store/update values. |
| 22 | **Comparison Operators** (comparison_operators.md) | `> < >= <=` compare two values, yielding a Boolean. |
| 23 | **Strict vs Loose Equality (`===` vs `==`)** (strict_vs_loose_equality.md) | Identity comparison with/without type coercion; `!==`/`!=`. |
| 24 | **Ternary / Conditional Operator (`? :`)** (ternary_operator.md) | Inline one-expression `if/else`. |
| 25 | **Operator Precedence & Associativity** (operator_precedence.md) | The order operators evaluate in an expression. |
| 26 | **`NaN`** (nan.md) | "Not-a-Number"; result of invalid math; not equal to itself. |
| 27 | **`Infinity` / `-Infinity`** (infinity.md) | Numeric value beyond the max representable number. |
| 28 | **Comments** (comments.md) | Notes in code ignored by the engine: Line (`//`) and Block (`/* */`). |
| 29 | **`console.log()`** (console_log.md) | A built-in function to print output to the web console, commonly used for debugging. |
| 30 | **Automatic Semicolon Insertion (ASI)** (asi.md) | How/when JS inserts missing semicolons; pitfalls. |

---

## Level 2 — Control Flow & Data Structures

> Branching, looping, and organizing basic data.

| # | Term | Description |
|---|------|-------------|
| 31 | **`if` / `else`** (if_else.md) | Conditional branching; executes code blocks based on truthy or falsy conditions. |
| 32 | **`switch`** (switch.md) | Evaluates an expression, matching its value to a `case` clause to execute associated statements. |
| 33 | **`for` Loop** (for_loop.md) | A loop that repeats until a specified condition evaluates to false. |
| 34 | **`while` Loop** (while_loop.md) | A loop that executes a block of code as long as the specified condition evaluates to true. |
| 35 | **`do...while`** (do_while.md) | Similar to `while`, but guaranteed to execute the code block at least once. |
| 36 | **`break` / `continue`** (break_continue.md) | Exit a loop early / skip to next iteration. |
| 37 | **Truthy / Falsy** (truthy_falsy.md) | Values that evaluate to `true` or `false` in a boolean context. Falsy values: `false`, `0`, `""`, `null`, `undefined`, `NaN`. |
| 38 | **Logical Operators** (logical_operators.md) | Operators (`&&`, `\|\|`, `!`) combine or invert boolean values. |
| 39 | **Array** (array.md) | A high-level, list-like object for storing an ordered collection of multiple values. |
| 40 | **Array Index & `.length`** (array_index_length.md) | Zero-based positional access and size of an array. |
| 41 | **Object** (object.md) | A collection of key-value pairs representing properties and methods. |
| 42 | **Property** (property.md) | An association between a name (key) and a value within an object. |
| 43 | **Property Access (dot vs bracket notation)** (property_access.md) | `obj.key` vs `obj["key"]`; dynamic keys. |
| 44 | **Method** (method.md) | A function that is stored as a property of an object. |
| 45 | **String Methods** (string_methods.md) | `slice`, `split`, `toUpperCase`, `includes`, `trim`, … |
| 46 | **Number Methods & Parsing** (number_methods.md) | `parseInt`, `parseFloat`, `toFixed`, `Number()`. |
| 47 | **`Math` object** (math_object.md) | Built-in math utilities (`round`, `random`, `max`…). |
| 48 | **`Date` object** (date_object.md) | Representing and manipulating dates/times. |

---

## Level 3 — Functions & Scope

> Reusable blocks of code and where variables live.

| # | Term | Description |
|---|------|-------------|
| 49 | **Function** (function.md) | A reusable block of code designed to perform a particular task. |
| 50 | **Function Declaration** (function_declaration.md) | Defines a named function using the `function` keyword (hoisted). |
| 51 | **Function Expression** (function_expression.md) | A function assigned to a variable (not hoisted). |
| 52 | **First-Class Function** (first_class_function.md) | The concept that functions in JS are treated as values that can be assigned, passed, and returned. |
| 53 | **Arrow Function** (arrow_function.md) | A shorter syntax (`() => {}`) for function expressions that lexically binds the `this` value. |
| 54 | **Parameters** (parameters.md) | The named variables listed in the function definition. |
| 55 | **Arguments** (arguments.md) | The actual values passed to the function when it is invoked. |
| 56 | **`return` Statement** (return_statement.md) | Ends function execution and specifies a value to be returned to the caller. |
| 57 | **Recursion** (recursion.md) | A function that calls itself until a base case. |
| 58 | **Pure Function & Side Effects** (pure_function.md) | Output depends only on input; no external mutation. |
| 59 | **Scope** (scope.md) | The current context of execution in which values and expressions are visible or can be referenced. |
| 60 | **Global Scope** (global_scope.md) | Variables declared outside of any function or block, accessible from anywhere. |
| 61 | **Local / Function Scope** (local_scope.md) | Variables declared within a function, accessible only inside that function. |
| 62 | **Block Scope** (block_scope.md) | Variables declared inside a `{ }` block (`let` and `const`), accessible only within that block. |
| 63 | **Lexical (Static) Scope / Environment** (lexical_scope.md) | Scope determined by *where* code is written, not called. |
| 64 | **Hoisting** (hoisting.md) | JavaScript's default behavior of moving variable and function declarations to the top of their scope before code execution. |
| 65 | **Closure** (closure.md) | A function bundled together with references to its surrounding lexical environment, allowing it to "remember" variables from its parent scope. |
| 66 | **Higher-Order Function** (higher_order_function.md) | A function that takes one or more functions as arguments, or returns a function. |
| 67 | **Callback Function** (callback_function.md) | A function passed into another function as an argument to be executed later. |
| 68 | **Anonymous Function** (anonymous_function.md) | A function without a name (often a callback/expression). |

---

## Level 4 — Iteration & Array Methods

> Functional approaches to transforming and iterating over data.

| # | Term | Description |
|---|------|-------------|
| 69 | **Mutating vs Non-mutating Methods** (mutating_vs_non_mutating.md) | Which array methods change the original vs return new. |
| 70 | **`push` / `pop` / `shift` / `unshift`** (push_pop_shift_unshift.md) | Add/remove at the end/start of an array (mutating). |
| 71 | **`slice` / `splice`** (slice_splice.md) | Copy a sub-array (pure) vs insert/remove in place (mutating). |
| 72 | **`concat` / `join` / `split`** (concat_join_split.md) | Merge arrays / array→string / string→array. |
| 73 | **`indexOf` / `includes` / `findIndex`** (indexof_includes_findindex.md) | Search for elements/positions in an array. |
| 74 | **`sort` / `reverse`** (sort_reverse.md) | Order elements (with comparator) / reverse order. |
| 75 | **`forEach()`** (for_each.md) | Executes a provided function once for each array element without returning a new array. |
| 76 | **`map()`** (map.md) | Creates a new array populated with the results of calling a provided function on every element. |
| 77 | **`flat` / `flatMap`** (flat_flatmap.md) | Flatten nested arrays / map-then-flatten. |
| 78 | **`filter()`** (filter.md) | Creates a new array with all elements that pass the test implemented by the provided function. |
| 79 | **`reduce()`** (reduce.md) | Executes a reducer function on each element, resulting in a single cumulative output value. |
| 80 | **`find()`** (find.md) | Returns the value of the first element in the provided array that satisfies the testing function. |
| 81 | **`some()`** (some.md) | Tests whether at least one element in the array passes the test implemented by the provided function. |
| 82 | **`every()`** (every.md) | Tests whether all elements in the array pass the test implemented by the provided function. |
| 83 | **`Array.from` / `Array.of` / `Array.isArray`** (array_from_of_isarray.md) | Create arrays from iterables/args; type-check. |
| 84 | **`for...of`** (for_of.md) | Iterates over the values of iterable objects like Arrays, Strings, Maps, and Sets. |
| 85 | **`for...in`** (for_in.md) | Iterates over the enumerable string properties (keys) of an object. |
| 86 | **Method Chaining** (method_chaining.md) | Calling array methods in sequence (`.filter().map()…`). |

---

## Level 5 — DOM & Browser Environment

> Interacting with the webpage and user events.

| # | Term | Description |
|---|------|-------------|
| 87 | **DOM (Document Object Model)** (dom.md) | An object-oriented programming interface representing the HTML document as a tree of nodes. |
| 88 | **Node** (node.md) | A single point in the DOM tree, which can be an element, text, or comment. |
| 89 | **`window` object / BOM** (window_bom.md) | The browser global object hosting timers, location, etc. |
| 90 | **`document` object** (document_object.md) | Entry point to the DOM tree for a page. |
| 91 | **`document.querySelector()`** (document_queryselector.md) | Returns the first Element within the document that matches the specified CSS selector. |
| 92 | **`querySelectorAll` & NodeList** (queryselectorall_nodelist.md) | Select *all* matching elements; iterate a NodeList. |
| 93 | **`getElementById` / `getElementsByClassName`** (getelementbyid_legacy.md) | Legacy element selection APIs. |
| 94 | **DOM Traversal** (dom_traversal.md) | `parentNode`, `children`, `nextSibling`, `closest`. |
| 95 | **DOM Manipulation (`createElement`, `appendChild`, `remove`)** (dom_manipulation.md) | Create/insert/delete nodes dynamically. |
| 96 | **`innerHTML` / `textContent` / `innerText`** (innerhtml_textcontent.md) | Read/write element content (HTML vs text). |
| 97 | **`classList` & `setAttribute`/`getAttribute`** (classlist_attributes.md) | Modify element classes and attributes. |
| 98 | **Event** (event.md) | An action or occurrence (e.g., click, keypress) recognized by the software that can be reacted to. |
| 99 | **Event Listener** (event_listener.md) | A procedure that waits for an event to occur on a specific element (`addEventListener`). |
| 100 | **Event object** (event_object.md) | The object passed to listeners (`target`, `type`, `key`). |
| 101 | **`event.target` vs `event.currentTarget`** (event_target_currenttarget.md) | Element that fired vs element the listener is on. |
| 102 | **Event Bubbling** (event_bubbling.md) | The process where an event propagates from the target element up through its ancestors. |
| 103 | **Event Capturing** (event_capturing.md) | The process where an event propagates from the outermost ancestor down to the target element. |
| 104 | **Event Delegation** (event_delegation.md) | A pattern of attaching a single event listener to a parent element to handle events on multiple children. |
| 105 | **`event.preventDefault()`** (event_preventdefault.md) | A method to prevent the browser's default action for a specific event (e.g., preventing a form submission). |
| 106 | **`event.stopPropagation()`** (event_stoppropagation.md) | Prevents further propagation (bubbling or capturing) of the current event. |
| 107 | **`DOMContentLoaded` / `load` events** (domcontentloaded_load.md) | Lifecycle events for when the page/DOM is ready. |
| 108 | **Web Storage (`localStorage` / `sessionStorage`)** (web_storage.md) | Persist key/value string data in the browser. |
| 109 | **Timers (`setTimeout` / `setInterval` / `clearTimeout`)** (timers.md) | Schedule deferred/repeated callbacks. |
| 110 | **Execution Context** (execution_context.md) | The abstract environment where JavaScript code is evaluated and executed. |
| 111 | **JavaScript Engine** (javascript_engine.md) | The program (like V8) that actually parses, compiles, and executes JavaScript code. |

---

## Level 6 — Asynchronous JavaScript

> Non-blocking code and network requests.

| # | Term | Description |
|---|------|-------------|
| 112 | **Synchronous** (synchronous.md) | Execution of code sequentially, one line at a time, blocking subsequent execution until finished. |
| 113 | **Asynchronous** (asynchronous.md) | Execution of code without blocking the main thread, allowing other operations to continue. |
| 114 | **Event Loop** (event_loop.md) | The mechanism that coordinates the execution of synchronous code and asynchronous callbacks. |
| 115 | **Call Stack** (call_stack.md) | A LIFO (Last In, First Out) stack that keeps track of function calls. |
| 116 | **Callback Hell** (callback_hell.md) | Deeply nested callbacks that make asynchronous code difficult to read and maintain. |
| 117 | **Promise** (promise.md) | An object representing the eventual completion (or failure) of an asynchronous operation. States: Pending, Fulfilled, Rejected. |
| 118 | **`.then()` / `.catch()`** (then_catch.md) | Methods chained onto Promises to handle fulfilled values or rejected errors. |
| 119 | **`Promise.resolve` / `Promise.reject`** (promise_static.md) | Create already-settled promises. |
| 120 | **Promise Chaining** (promise_chaining.md) | Sequencing `.then()` calls; returning values/promises. |
| 121 | **`Promise.all` / `allSettled` / `race` / `any`** (promise_combinators.md) | Combinators for running promises in parallel. |
| 122 | **`async` / `await`** (async_await.md) | Syntactic sugar built on top of Promises, making asynchronous code read synchronously. |
| 123 | **Error Handling (`try`/`catch`/`finally`)** (error_handling.md) | Structured exception handling flow. |
| 124 | **`throw` statement** (throw_statement.md) | Raise an exception to unwind the call stack. |
| 125 | **`Error` object & Error Types** (error_object.md) | `Error`, `TypeError`, `RangeError`, custom errors. |
| 126 | **`try/catch` with `async/await`** (try_catch_async_await.md) | Error handling for awaited promises. |
| 127 | **Fetch API** (fetch_api.md) | A modern, Promise-based interface for making HTTP network requests (`fetch()`). |
| 128 | **`AbortController`** (abortcontroller.md) | Cancel in-flight fetches/async operations. |
| 129 | **`for await...of` / Async Iterators** (for_await_of.md) | Iterating over asynchronously produced values. |
| 130 | **Microtask Queue** (microtask_queue.md) | A high-priority queue for Promise callbacks (`.then`), executed immediately after the current call stack clears. |
| 131 | **Macrotask Queue** (macrotask_queue.md) | A lower-priority queue for API callbacks like `setTimeout` and `setInterval`. |
| 132 | **Web Workers** (web_workers.md) | Run scripts on background threads. |

---

## Level 7 — Objects & Prototypes

> Object-oriented JavaScript and inheritance.

| # | Term | Description |
|---|------|-------------|
| 133 | **Reference vs Value (copy semantics)** (reference_vs_value.md) | Primitives copy by value; objects/arrays by reference. |
| 134 | **Shallow Copy vs Deep Copy** (shallow_vs_deep_copy.md) | Copying top-level vs fully nested structures. |
| 135 | **`JSON` / `JSON.stringify` / `JSON.parse`** (json.md) | Serialize/parse the JSON data-interchange format. |
| 136 | **`Object.assign`** (object_assign.md) | Copy own enumerable props into a target object. |
| 137 | **`Object.freeze` / `Object.seal`** (object_freeze_seal.md) | Make objects immutable / non-extensible. |
| 138 | **`Object.keys()`** (object_keys.md) | Returns an array of a given object's own enumerable string-keyed property names. |
| 139 | **`Object.values()`** (object_values.md) | Returns an array of a given object's own enumerable string-keyed property values. |
| 140 | **`Object.entries()`** (object_entries.md) | Returns an array of a given object's own enumerable string-keyed property `[key, value]` pairs. |
| 141 | **Shorthand Properties & Methods** (shorthand_properties_methods.md) | `{ x }` and `{ method() {} }` object shorthands. |
| 142 | **Computed Property Names** (computed_property_names.md) | Dynamic object keys via `{ [expr]: value }`. |
| 143 | **Getters & Setters** (getters_setters.md) | Accessor properties (`get`/`set`) that run on access. |
| 144 | **`this` Keyword** (this_keyword.md) | A dynamic reference that typically refers to the object executing the current function. |
| 145 | **`call` / `apply` / `bind`** (call_apply_bind.md) | Explicitly bind the `this` context for a function. |
| 146 | **Default `this` Binding Rules** (default_this_binding.md) | Implicit, explicit, default, and `new` binding rules. |
| 147 | **Prototype** (prototype.md) | An internal object from which other objects inherit properties and methods. |
| 148 | **Prototypal Inheritance** (prototypal_inheritance.md) | JavaScript's mechanism for objects to inherit features from one another via the prototype chain. |
| 149 | **Prototype Chain** (prototype_chain.md) | The linked series of prototypes used by the engine to resolve property lookups. |
| 150 | **`hasOwnProperty` / `Object.getPrototypeOf`** (hasownproperty_getprototypeof.md) | Distinguish own vs inherited properties. |
| 151 | **`Object.create`** (object_create.md) | Create an object with an explicit prototype. |
| 152 | **Constructor Function** (constructor_function.md) | A standard function invoked with the `new` keyword used to create multiple instances of an object. |
| 153 | **`new` Keyword** (new_keyword.md) | Creates an instance of a user-defined object type or a built-in object type. |
| 154 | **`instanceof`** (instanceof.md) | Test whether an object is built from a constructor. |
| 155 | **Class** (class.md) | ES6 syntactic sugar over constructor functions and prototypal inheritance. |
| 156 | **`extends`** (extends.md) | Keyword used in class declarations to create a child class that inherits from a parent class. |
| 157 | **`super`** (super.md) | Keyword used to call the constructor or methods of an object's parent class. |
| 158 | **Static Methods & Properties** (static_methods_properties.md) | Class members on the class itself, not instances. |
| 159 | **Private Class Fields (`#`)** (private_class_fields.md) | Truly private members inside a class. |

---

## Level 8 — Modern JavaScript (ES6+)

> Syntax improvements and modern features.

| # | Term | Description |
|---|------|-------------|
| 160 | **Destructuring** (destructuring.md) | Syntax for extracting values from arrays or properties from objects into distinct variables. |
| 161 | **Spread Syntax (`...`)** (spread_syntax.md) | Expands an iterable into individual elements (useful for merging arrays or copying objects). |
| 162 | **Rest Parameter (`...`)** (rest_parameter.md) | Collects multiple function arguments and condenses them into a single array parameter. |
| 163 | **Template Literals** (template_literals.md) | String literals enclosed by backticks (`` ` ``) allowing embedded expressions via `${}`. |
| 164 | **Tagged Template Literals** (tagged_template_literals.md) | Functions that process template literal parts. |
| 165 | **Default Parameters** (default_parameters.md) | Allows named function parameters to be initialized with default values if no value is passed. |
| 166 | **Optional Chaining (`?.`)** (optional_chaining.md) | Safely accesses deeply nested object properties without manually checking if each reference is valid. |
| 167 | **Nullish Coalescing (`??`)** (nullish_coalescing.md) | Logical operator returning the right-hand operand when the left-hand is exactly `null` or `undefined`. |
| 168 | **Logical Assignment (`??=`, `||=`, `&&=`)** (logical_assignment.md) | Combine logical ops with assignment. |
| 169 | **Modules (`import`/`export`)** (modules.md) | A standard way to split code into separate files for organization and reuse. |
| 170 | **Named vs Default Exports** (named_vs_default_exports.md) | Two module export styles and their import syntax. |
| 171 | **Dynamic `import()`** (dynamic_import.md) | Load modules on demand, returning a Promise. |
| 172 | **Map** (map.md) | A collection of keyed data items that allows keys of any type (unlike plain Objects). |
| 173 | **Set** (set.md) | A collection of unique values of any type, primitive or object. |
| 174 | **`WeakMap` / `WeakSet`** (weakmap_weakset.md) | Collections with garbage-collectable keys. |
| 175 | **Symbol** (symbol.md) | A unique and immutable primitive data type often used as object keys. |
| 176 | **Iterators & Iterables (protocol)** (iterators_iterables.md) | The `[Symbol.iterator]()` / `next()` contract. |
| 177 | **`globalThis`** (globalthis.md) | Standard reference to the global object anywhere. |

---

## Level 9 — Advanced Concepts & Patterns

> Refining execution control and deep language features.

| # | Term | Description |
|---|------|-------------|
| 178 | **IIFE** (iife.md) | Immediately Invoked Function Expression; a function that runs as soon as it is defined. |
| 179 | **Strict Mode (`"use strict"`)** (strict_mode.md) | An opt-in mode that enforces stricter parsing and error handling in JavaScript. |
| 180 | **Regular Expressions (`RegExp`)** (regexp.md) | Pattern matching for strings. |
| 181 | **`structuredClone`** (structuredclone.md) | Built-in deep-cloning API. |
| 182 | **Generator (`function*`)** (generator.md) | Functions that can be paused and later resumed, yielding multiple values one by one (`yield`). |
| 183 | **Proxy** (proxy.md) | An object used to intercept and define custom behavior for fundamental operations (e.g., property lookup). |
| 184 | **`Reflect`** (reflect.md) | Methods mirroring Proxy trap operations. |
| 185 | **Currying** (currying.md) | Transforming a function that takes multiple arguments into a sequence of nested functions taking one argument each. |
| 186 | **Partial Application** (partial_application.md) | Fixing some arguments of a function. |
| 187 | **Memoization** (memoization.md) | An optimization technique that caches the results of expensive function calls to avoid recalculation. |
| 188 | **Debounce** (debounce.md) | A technique ensuring a function is only executed after a specified time has elapsed since its last invocation. |
| 189 | **Throttle** (throttle.md) | A technique ensuring a function is executed at most once within a specified time period. |
| 190 | **Garbage Collection** (garbage_collection.md) | The engine's automatic memory management process that removes unreachable objects. |
| 191 | **Immutability** (immutability.md) | Never mutating data; producing new copies instead. |
| 192 | **Functional Programming & Composition** (functional_programming.md) | Composing pure functions; `compose`/`pipe`. |
| 193 | **Design Patterns (Module, Singleton, Observer, Factory)** (design_patterns.md) | Reusable solution templates in JS. |

---

## Level 10 — Ecosystem & Tooling

> The broader world of JavaScript development.

| # | Term | Description |
|---|------|-------------|
| 194 | **Node.js** (node_js.md) | A cross-platform JavaScript runtime environment that executes code outside a web browser (e.g., servers). |
| 195 | **npm** (npm.md) | Node Package Manager; the default registry and manager for sharing and installing JS libraries. |
| 196 | **`package.json`** (package_json.md) | A manifest file holding project metadata, scripts, and dependency lists. |
| 197 | **Semantic Versioning & Lockfiles** (semver_lockfiles.md) | `^`/`~` ranges and `package-lock.json`. |
| 198 | **CommonJS vs ES Modules (`require` vs `import`)** (commonjs_vs_esm.md) | Node's legacy module system vs the ES standard. |
| 199 | **Alternative Runtimes (Deno / Bun)** (alternative_runtimes.md) | Modern JS/TS runtimes beyond Node.js. |
| 200 | **Runtime vs Compile Time** (runtime_vs_compile_time.md) | When code is checked/transformed vs executed. |
| 201 | **Transpiler vs Compiler** (transpiler_vs_compiler.md) | Source-to-source vs source-to-machine translation. |
| 202 | **Babel** (babel.md) | A JavaScript compiler used to convert modern ES6+ code into backwards-compatible JS for older browsers. |
| 203 | **Polyfill** (polyfill.md) | A piece of code that provides modern functionality on older browsers that do not natively support it. |
| 204 | **TypeScript** (typescript.md) | A superset of JavaScript developed by Microsoft that adds optional static typing to the language. |
| 205 | **Bundler** (bundler.md) | A tool (like Webpack or Vite) that combines multiple JS files and assets into optimized bundles for the browser. |
| 206 | **Specific Bundlers (Webpack / Vite / Rollup / esbuild)** (specific_bundlers.md) | Concrete bundling tools and their trade-offs. |
| 207 | **Tree Shaking & Code Splitting** (tree_shaking_code_splitting.md) | Removing dead code / lazy-loading bundles. |
| 208 | **Minification & Source Maps** (minification_source_maps.md) | Shrinking code; mapping bundles back to source. |
| 209 | **Linter (ESLint) & Formatter (Prettier)** (linter_formatter.md) | Static analysis and auto-formatting tools. |
| 210 | **Browser DevTools & Debugging** (browser_devtools.md) | Inspecting, breakpoints, `debugger`, profiling. |
| 211 | **Unit Testing (Jest / Vitest)** (unit_testing.md) | Automated test runners and assertions. |
| 212 | **SPA** (spa.md) | Single Page Application; a web app that dynamically rewrites the current page without requiring full page reloads. |
| 213 | **JSX** (jsx.md) | A syntax extension popularized by React that allows writing HTML-like markup inside JavaScript. |
| 214 | **Framework vs Library (React / Vue / Angular)** (framework_vs_library.md) | Inversion-of-control distinction; where JSX fits. |
| 215 | **Web APIs vs the Language** (web_apis_vs_language.md) | Distinguishing engine (ECMAScript) from host APIs. |

---

> **Total: 215 terms** covering JavaScript from variable declaration to ecosystem tooling.
