# Vue Ref Auto-Unwrapping in Templates

## The Problem

When using `provide`/`inject` with reactive state, you may notice that `.value`
is sometimes required in templates and sometimes not. This document explains
Vue's ref unwrapping behavior.

## Context: Our `interactionState` Example

```typescript
// In default.vue (provider)
provide<TProvidedInteractionState>(INJECT_FIRST_INTERACTION, {
  isFirstInteraction: computed(
    () => isFirstAppInteraction.value as "true" | "false"
  ),
  markAppAsInteracted,
});

// In menu/index.vue (consumer)
const interactionState = inject<TProvidedInteractionState>(
  INJECT_FIRST_INTERACTION,
  {
    isFirstInteraction: computed(() => "false" as const),
  }
);
```

In the template, we must use `.value`:

```vue
<section v-else-if="interactionState.isFirstInteraction.value && res?.data?.items?.length === 0">
```

**Why can't we omit `.value` like we normally do in templates?**

---

## When Vue Auto-Unwraps Refs

Vue **automatically unwraps** refs in templates when they are **top-level
properties** in `<script setup>`:

```vue
<script setup>
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
</script>

<template>
  <!-- ✅ Auto-unwrapped - no .value needed -->
  <p>{{ count }}</p>
  <p>{{ doubled }}</p>
  <div v-if="count > 0">Positive</div>
</template>
```

---

## When Vue Does NOT Auto-Unwrap Refs

Vue **does not unwrap** refs when they are **nested inside a plain object**:

```vue
<script setup>
  // Plain object containing refs
  const state = {
    count: ref(0),
    name: computed(() => "John"),
  };
</script>

<template>
  <!-- ❌ NOT auto-unwrapped - shows [object Object] or the ref itself -->
  <p>{{ state.count }}</p>
  <p>{{ state.name }}</p>

  <!-- ✅ Must use .value -->
  <p>{{ state.count.value }}</p>
  <p>{{ state.name.value }}</p>
</template>
```

### This applies to `inject()` because:

`inject()` returns a **plain object** (not a reactive proxy), so any `ref` or
`computed` properties inside it are **not** auto-unwrapped:

```typescript
// interactionState is a plain object { isFirstInteraction: ComputedRef<...> }
const interactionState = inject<TProvidedInteractionState>(...)

// In template:
interactionState.isFirstInteraction        // ← Returns the ComputedRef itself
interactionState.isFirstInteraction.value  // ← Returns the actual value
```

---

## The Rule

| Scenario                       | Auto-unwraps? | Example                                           |
| ------------------------------ | ------------- | ------------------------------------------------- |
| Top-level `ref`/`computed`     | ✅ Yes        | `const x = ref(0)` → `{{ x }}`                    |
| Inside `reactive()` object     | ✅ Yes        | `const s = reactive({ x: ref(0) })` → `{{ s.x }}` |
| Inside plain object            | ❌ No         | `const s = { x: ref(0) }` → `{{ s.x.value }}`     |
| From `inject()` (plain object) | ❌ No         | `const s = inject(...)` → `{{ s.prop.value }}`    |

---

## Alternative: Wrap with `reactive()`

If you want auto-unwrapping for injected state, wrap it with `reactive()`:

```typescript
const interactionState = reactive(
  inject<TProvidedInteractionState>(INJECT_FIRST_INTERACTION, {
    isFirstInteraction: computed(() => "false" as const),
  })
);

// Now in template - no .value needed:
// interactionState.isFirstInteraction
```

### Tradeoffs of `reactive()`:

- ✅ Cleaner template syntax
- ❌ Cannot destructure without losing reactivity
- ❌ Cannot reassign the whole object
- ❌ Hides that the property is a ref (less explicit)

---

## Our Decision

We chose to **keep `.value` explicit** in templates for injected state because:

1. It's clear that `isFirstInteraction` is a reactive computed property
2. Consistent with the rest of the codebase using `ref`/`computed`
3. Avoids potential pitfalls of `reactive()` (destructuring, reassignment)

---

## References

- [Vue Docs: Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue Docs: Ref Unwrapping in Templates](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#ref-unwrapping-in-templates)
