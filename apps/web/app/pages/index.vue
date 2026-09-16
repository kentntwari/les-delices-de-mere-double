<script lang="ts" setup>
  definePageMeta({
    name: "Home",
    middleware: [
      function (to, from) {
        return navigateTo("/orders");
      },
    ],
  });
</script>

<template></template>
