# Callback Props vs Events for Async Operations

## Problem

When a Vue component emits events during async operations (like API calls), the
parent component may not receive those events if the child component unmounts
before the async operation completes.

### Example Scenario

```vue
<!-- Parent: conditionally renders child based on data -->
<ChildComponent
  v-if="items.length === 0"
  @created="addItem"
  @success="handleSuccess"
  @error="handleError"
/>
```

```vue
<!-- Child: emits events during async operation -->
<script setup>
  const emit = defineEmits(["created", "success", "error"]);

  async function submit(data) {
    emit("created", data); // ✅ Works - component still mounted

    await $fetch("/api/item", {
      onResponse() {
        emit("success"); // ❌ May not work - component may be unmounted
      },
      onResponseError() {
        emit("error"); // ❌ May not work - component may be unmounted
      },
    });
  }
</script>
```

**What happens:**

1. User submits form
2. `@created` fires → parent adds item to array → `items.length` becomes 1
3. `v-if="items.length === 0"` becomes false → child unmounts
4. API response arrives → `emit('success')` fires but parent never receives it

## Solution: Use Callback Props for Post-Unmount Operations

Callback props are closures that capture the parent's scope. They execute in the
parent's context regardless of whether the child component is still mounted.

### Child Component

```vue
<script setup>
  const emit = defineEmits<{
    (e: 'created', v: ItemData): void;  // Keep as event - fires before unmount
  }>();

  const props = defineProps<{
    onSuccess?: () => void;  // Callback prop - works after unmount
    onError?: () => void;    // Callback prop - works after unmount
  }>();

  async function submit(data) {
    emit('created', data);  // Event for synchronous operations

    await $fetch('/api/item', {
      onResponse() {
        props.onSuccess?.();  // ✅ Callback executes in parent's scope
      },
      onResponseError() {
        props.onError?.();    // ✅ Callback executes in parent's scope
      }
    });
  }
</script>
```

### Parent Component

```vue
<ChildComponent
  v-if="items.length === 0"
  @created="(v) => addItem(v)"
  :on-success="
    () => {
      console.log('Success!');
      refreshData();
    }
  "
  :on-error="
    () => {
      rollbackOptimisticUpdate();
    }
  "
/>
```

## When to Use Each Pattern

| Pattern                      | Use When                                        |
| ---------------------------- | ----------------------------------------------- |
| **Events (`@event`)**        | Operation completes while component is mounted  |
| **Callback Props (`:on-x`)** | Operation may complete after component unmounts |

## Guidelines

1. **Synchronous or pre-unmount operations**: Use events

   - Form validation results
   - Optimistic UI updates (before async starts)
   - User interactions

2. **Async operations that may outlive the component**: Use callback props
   - API response handlers
   - Timeout callbacks
   - Any operation that runs after the action that triggers unmount

## Related Patterns

This pattern is commonly used with **optimistic UI updates**:

1. `@created` → Immediately update UI (optimistic)
2. Component unmounts due to UI change
3. `:on-success` → Confirm update, refresh data
4. `:on-error` → Rollback optimistic update
