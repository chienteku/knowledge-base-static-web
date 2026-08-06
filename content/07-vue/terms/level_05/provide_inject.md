# Provide / Inject

> **Level 5 — Advanced Component Architecture**
> A mechanism to pass data from an ancestor component directly down to a deeply nested descendant component, completely bypassing intermediate components.

---

## 1. Prerequisites

- [Props](../level_04/props.md) — The standard way of passing data, which suffers from "Prop Drilling".
- [Components](../level_04/components.md) — Understanding the hierarchy of Vue apps.

---

## 2. Term Category

**Vue Architecture (Dependency Injection / Data Flow Pattern)**: Provide / Inject is Vue's native dependency injection mechanism designed to eliminate "prop drilling" across deep component trees. An ancestor component registers state, configuration, or service functions using `provide()`, making them accessible to any descendant component within its template hierarchy via `inject()`, regardless of component depth.

Unlike React's Context API—which forces re-rendering of context consumer components whenever the context provider object identity changes—Vue's Provide/Inject passes live reactive `ref` or `reactive` instances directly down the tree. Descendant components subscribe to specific reactive property dependencies, ensuring fine-grained updates without forcing intermediate components to declare unwanted props or trigger unneeded re-renders.

---

## 3. Explanation

### (1) Design Motivation — "Why did we design this?"
In complex Single-Page Applications, top-level settings (such as UI themes, active locale, or workspace authorization contexts) often need to be accessed by deeply nested leaf components—such as a button placed 12 levels down inside a toolbar modal. Passing these values step-by-step through every intermediate component via props creates severe maintenance friction known as "prop drilling." Intermediate components become cluttered with pass-through prop declarations they do not consume.

Provide / Inject solves this by establishing a dependency injection channel anchored to Vue's component instance tree. The ancestor calls `provide(key, value)`, placing the asset into its instance scope. Any child, grandchild, or deeply nested descendant can call `inject(key)`, querying up the component ancestor chain to resolve the closest matching provider key instantly.

### (2) Reality Metaphor
Think of Provide / Inject like a building's central HVAC utility duct network. Instead of room-to-room occupants manually passing buckets of warm air down the hallway (prop drilling), the main building basement installs a central climate controller (the `provide` call). Every room on every floor can simply plug a vent directly into the utility duct in the ceiling (the `inject` call) to pull conditioned air on demand. Rooms that do not need air conditioning simply ignore the ceiling duct without participating in bucket passing.

### (3) Vue Code Examples

#### Short Snippet
```vue
<!-- Ancestor.vue -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('dark')
provide('themeKey', theme)
</script>
```

```vue
<!-- Descendant.vue (10 levels deep) -->
<script setup>
import { inject } from 'vue'

const theme = inject('themeKey', 'light') // 'light' acts as default fallback
</script>

<template>
  <button :class="theme">Active Theme: {{ theme }}</button>
</template>
```

#### Fuller Example
```vue
<!-- WorkspaceProvider.vue (Ancestor Component) -->
<script setup>
import { provide, ref, readonly } from 'vue'

const activeWorkspace = ref({ id: 'ws-901', name: 'Production Grid', tier: 'enterprise' })
const userPermissions = ref(['READ', 'WRITE', 'EXECUTE'])

function updateWorkspaceName(newName) {
  activeWorkspace.value.name = newName
}

// Provide read-only state alongside authorized mutation methods
provide('workspaceContext', {
  workspace: readonly(activeWorkspace),
  permissions: readonly(userPermissions),
  updateWorkspaceName
})
</script>

<template>
  <div class="workspace-wrapper">
    <slot />
  </div>
</template>
```

```vue
<!-- WorkspaceHeader.vue (Descendant Component) -->
<script setup>
import { inject } from 'vue'

// Inject context with explicit default fallback
const context = inject('workspaceContext', null)

function handleRename() {
  if (context) {
    context.updateWorkspaceName('Staging Grid')
  }
}
</script>

<template>
  <header v-if="context" class="header">
    <h2>Workspace: {{ context.workspace.name }}</h2>
    <button @click="handleRename">Switch to Staging</button>
  </header>
</template>
```

---

## 4. Common Mistakes & Pitfalls

### Mistake 1: Mutating Injected Reactive State Directly inside Child Components

**The mistake:** A deeply nested descendant child component injects a reactive `theme` object and mutates it directly (`theme.value = 'dark'`).

**Why it's wrong:** Mutating injected state directly inside descendant components violates One-Way Data Flow. When multiple descendant components perform direct state mutations, tracing the origin of state bugs becomes impossible.

*Incorrect:*
```javascript
// Child component directly mutating injected ref state:
const userTheme = inject('userTheme');
function toggle() { userTheme.value = 'dark'; } // ❌ Direct mutation anti-pattern!
```

*Fix:*
```javascript
// Ancestor provides state wrapped in readonly() alongside explicit updater:
const theme = ref('light');
function setTheme(newTheme) { theme.value = newTheme; }
provide('themeContext', { theme: readonly(theme), setTheme });

// Child component calls updater method:
const { theme, setTheme } = inject('themeContext');
setTheme('dark'); // State modification occurs at source
```

---

### Mistake 2: Using Generic String Keys (Namespace Collision Risk)

**The mistake:** Providing dependencies using generic string keys like `provide('data', state)` or `provide('user', userState)`.

**Why it's wrong:** In large enterprise applications or reusable component libraries, generic string keys risk collisions with third-party plugins or sibling providers in the component tree.

*Incorrect:*
```javascript
provide('user', currentUser); // ❌ High risk of key collision in large apps
```

*Fix:*
```javascript
// Use ES6 Symbols for guaranteed injection key uniqueness:
export const USER_KEY = Symbol('userContext');
provide(USER_KEY, currentUser);
```

---

### Mistake 3: Providing Raw Non-Reactive Primitives Expecting Live Updates

**The mistake:** Passing raw JavaScript primitive variables to `provide()` expecting descendants to receive reactive updates.

**Why it's wrong:** Provide / Inject does not implicitly make plain primitives reactive. If you pass `provide('count', count)` where `count = 0` is a raw JS number, descendant components receive a static value snapshot created at setup time.

*Incorrect:*
```javascript
let count = 0;
provide('count', count); // ❌ Raw primitive snapshot; child won't see changes
```

*Fix:*
```javascript
import { ref } from 'vue';
const count = ref(0);
provide('count', count); // Ref wrapper preserves live reactive updates
```

---

## 5. Practice Exercises

### Exercise 1: Healthcare Patient Telemetry Monitoring Grid

**Scenario:** An intensive care unit (ICU) dashboard contains a top-level `PatientMonitor` component that provides real-time vital signs. Deeply nested bed-side card components must inject patient vitals and issue threshold alarm acknowledges.

**Requirements:**
1. Ancestor provides reactive `patientVitals` (`heartRate`, `oxygenSat`, `bp`) and an `acknowledgeAlarm(sensorId)` callback.
2. Descendant component injects `patientVitals` using a Symbol key.
3. Descendant safely triggers alarm acknowledgment via the provided callback.
4. Include test assertions validating fallback handling when injection is missing.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { ref, inject, provide, readonly } from 'vue';
> 
> export const PATIENT_KEY = Symbol('patientTelemetry');
> 
> export function usePatientProvider() {
>   const patientVitals = ref({ heartRate: 72, oxygenSat: 98, bp: '120/80' });
>   const acknowledgedAlarms = ref([]);
> 
>   function acknowledgeAlarm(sensorId) {
>     acknowledgedAlarms.value.push(sensorId);
>   }
> 
>   provide(PATIENT_KEY, {
>     vitals: readonly(patientVitals),
>     acknowledgeAlarm
>   });
> 
>   return { patientVitals, acknowledgedAlarms };
> }
> 
> export function usePatientConsumer() {
>   const defaultContext = {
>     vitals: ref({ heartRate: 0, oxygenSat: 0, bp: 'N/A' }),
>     acknowledgeAlarm: () => {}
>   };
>   return inject(PATIENT_KEY, defaultContext);
> }
> 
> // Verification Test
> const consumerData = usePatientConsumer();
> console.assert(consumerData.vitals.value.heartRate === 0, 'Fallback default returns heartRate 0');
> ```
>
> #### Technical Explanation
> 1. **Symbol Key Scope**: `PATIENT_KEY` prevents key namespace collision across medical subsystem modules.
> 2. **Read-Only Protection**: `readonly()` guards vital state against unauthorized mutation by nested UI views.
> 3. **Method Delegation**: `acknowledgeAlarm` delegates state mutation responsibility back to the primary provider component.
> 4. **Fallback Safety**: Providing explicit default objects inside `inject()` prevents `undefined` dereferencing errors during unit testing.
> 
---

### Exercise 2: E-Commerce Multi-Step Checkout Workflow

**Scenario:** A multi-step shopping cart checkout funnel manages step progression (`cart` -> `shipping` -> `payment` -> `confirmation`). The root step wizard component provides checkout state and navigation step functions to nested step views.

**Requirements:**
1. Root component provides `currentStep` ref and `nextStep()`, `prevStep()` helper functions.
2. Step 2 (`ShippingView.vue`) injects checkout state.
3. Ensure step transitions occur cleanly without direct primitive variable assignment.
4. Include assertions checking step boundary caps.

> [!check]- Answer
>
> #### Implementation
> ```javascript
> import { ref, inject, provide } from 'vue';
> 
> export const CHECKOUT_KEY = Symbol('checkoutWizard');
> 
> export function setupCheckoutProvider() {
>   const currentStep = ref(1);
>   const maxSteps = 4;
> 
>   function nextStep() {
>     if (currentStep.value < maxSteps) currentStep.value++;
>   }
> 
>   function prevStep() {
>     if (currentStep.value > 1) currentStep.value--;
>   }
> 
>   provide(CHECKOUT_KEY, { currentStep, nextStep, prevStep });
>   return { currentStep, nextStep, prevStep };
> }
> 
> export function setupCheckoutConsumer() {
>   return inject(CHECKOUT_KEY, {
>     currentStep: ref(1),
>     nextStep: () => {},
>     prevStep: () => {}
>   });
> }
> 
> // Technical Assertion Test
> const provider = setupCheckoutProvider();
> provider.nextStep();
> console.assert(provider.currentStep.value === 2, 'Step should advance to 2');
> ```
>
> #### Technical Explanation
> 1. **Encapsulated Boundaries**: `maxSteps` validation prevents out-of-bounds step progression within the provider closure.
> 2. **Subtree Access**: Any sub-component in the checkout view hierarchy can trigger `nextStep()` without prop forwarding.
> 3. **Reactivity Preservation**: Passing `currentStep` as a ref allows consuming steps to reactively render active indicators.
> 4. **Decoupled Steps**: Step components remain decoupled from parent layout structures.
> 
---

### Exercise 3: Industrial Robotics Controller (TypeScript Typed Injection)

**Scenario:** A factory automation system uses Vue 3 SFCs to monitor robotic arm cells. Provide a strongly-typed `RobotController` context across the factory layout.

**Requirements:**
1. Define a TypeScript interface `RobotController` with properties `armId`, `axisCoords`, and function `emergencyStop()`.
2. Export typed `InjectionKey<RobotController>`.
3. Demonstrate provider setup and consumer injection with full type guarantees.

> [!check]- Answer
>
> #### Implementation
> ```typescript
> import { ref, provide, inject, type InjectionKey, type Ref } from 'vue';
> 
> export interface RobotController {
>   armId: string;
>   axisCoords: Ref<{ x: number; y: number; z: number }>;
>   emergencyStop: () => void;
> }
> 
> export const ROBOT_KEY: InjectionKey<RobotController> = Symbol('RobotControllerKey');
> 
> export function provideRobotController(armId: string) {
>   const axisCoords = ref({ x: 0, y: 0, z: 150 });
> 
>   function emergencyStop() {
>     axisCoords.value = { x: 0, y: 0, z: 0 };
>     console.log(`EMERGENCY STOP TRIGGERED FOR ARM ${armId}`);
>   }
> 
>   const controller: RobotController = { armId, axisCoords, emergencyStop };
>   provide(ROBOT_KEY, controller);
>   return controller;
> }
> 
> export function useRobotController(): RobotController {
>   const controller = inject(ROBOT_KEY);
>   if (!controller) {
>     throw new Error('useRobotController must be used within a RobotController Provider!');
>   }
>   return controller;
> }
> ```
>
> #### Technical Explanation
> 1. **`InjectionKey<T>` Type Safety**: Vue's `InjectionKey` type utility binds TypeScript type interfaces to ES6 Symbols.
> 2. **Assertion Guards**: Throwing an explicit error in `useRobotController` when unprovided prevents null pointer exceptions.
> 3. **Ref Interface Consistency**: `Ref<{ x, y, z }>` typed properties maintain full IDE autocompletion and compile-time checks.
> 4. **Clean Abstraction**: Encapsulates safety-critical emergency routines within factory floor domain models.
> 
---

## 6. Related Terms

- [Props](../level_04/props.md) — The alternative that causes Prop Drilling.
- [Pinia](../level_07/pinia.md) — The ultimate solution for Global State.
- [Components](../level_04/components.md) — Component tree hierarchy.

---

## 7. Key Takeaways

- **Provide / Inject** passes data directly from ancestor components to deep descendants, solving "prop drilling."
- Ancestors call `provide(key, value)`; descendants retrieve assets using `inject(key, fallbackValue)`.
- Use **Symbol keys** (`Symbol('keyName')`) in production apps to eliminate namespace collision risks.
- Keep state mutations inside provider components—provide `readonly()` state refs alongside explicit mutation functions.
- Prefer dedicated global state libraries (like Pinia) for application-wide domain data, reserving Provide/Inject for localized UI hierarchy dependencies.
