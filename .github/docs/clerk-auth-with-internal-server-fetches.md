# Clerk Auth with Internal Server Fetches

## Problem

When a client-side or SSR request uses `useRequestFetch()`, the initial request
to our Nitro API includes the current cookies and headers. That is enough for
Clerk middleware on the first hop.

The problem appears when that API handler makes another internal request with
raw `$fetch()`:

```typescript
const requestFetch = useRequestFetch();

await requestFetch(`/api/order/${orderId}/metadata/customer`);
```

```typescript
// Inside server/api/order/[orderId]/metadata/customer.get.ts
const customer = await $fetch(`/api/customer/${customerId}`);
```

This can produce a `401 Unauthenticated` in Clerk middleware for the nested
`/api/customer/:id` request.

---

## Why `useRequestFetch()` Was Not Enough

`useRequestFetch()` only forwards request headers and cookies for the request
that originates from the current app context.

That means it helps on this hop:

1. Browser or SSR app -> `/api/order/:orderId/metadata/customer`

It does **not** automatically propagate auth context for this second hop created
inside the server handler:

2. `/api/order/:orderId/metadata/customer` -> `/api/customer/:id`

A raw server-side `$fetch()` starts a new internal request. That new request
does not automatically inherit the current `H3Event` context used by Clerk
middleware.

So the first request is authenticated, but the second one may reach middleware
without the auth context Clerk expects.

---

## Fix

Use `event.$fetch()` for authenticated internal API calls made from a Nitro
event handler:

```typescript
export default defineEventHandler(async (event) => {
  const customer = await event.$fetch(`/api/customer/${customerId}`);
});
```

`event.$fetch()` keeps the nested request bound to the current request event, so
internal hops preserve the active request context instead of starting clean.

---

## Rule

- Use `useRequestFetch()` when the app is calling the server and you need
  request headers or cookies forwarded.
- Use `event.$fetch()` when a server handler makes another internal API call
  that depends on the current authenticated request context.
- Avoid raw `$fetch()` for protected internal server-to-server hops unless you
  are explicitly rebuilding the required auth headers yourself.

---

## Example from This Codebase

This issue occurred in `.github/docs` context because:

1. `app/stores/orderPreview.ts` called `/api/order/:orderId/metadata/customer`
   with `useRequestFetch()`.
2. `server/api/order/[orderId]/metadata/customer.get.ts` then called
   `/api/customer/:id` with raw `$fetch()`.
3. Clerk middleware authenticated the first request, but the second request
   could fail with `401`.

The fix was to replace raw `$fetch()` with `event.$fetch()` in the server
handler.
