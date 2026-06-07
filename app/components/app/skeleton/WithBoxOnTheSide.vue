<script lang="ts" setup></script>

<template>
  <div class="mt-8 grid grid-cols-4 gap-4 *:animate-pulse">
    <div
      class="col-span-2 *:bg-neutral-grey-500 *:animate-pulse flex items-center gap-x-4"
    >
      <div class="w-40 h-10"></div>
      <div class="w-40 h-10"></div>
    </div>

    <div class="mt-4 *:bg-neutral-grey-500 col-span-4 grid grid-cols-7 gap-2">
      <div class="col-span-1 h-10"></div>
      <div class="col-span-1 h-10"></div>
      <div class="col-span-1 h-10"></div>
      <div class="col-span-1 h-10"></div>
    </div>

    <div class="mt-8 col-span-4 grid grid-cols-3">
      <div class="*:bg-neutral-grey-500 col-span-2 grid grid-cols-4 gap-4">
        <div class="col-span-4 w-full h-10"></div>
        <div class="col-span-4 w-full h-10"></div>
        <div class="col-span-4 w-full h-10"></div>
        <div class="col-span-4 w-full h-10"></div>
        <div class="col-span-4 w-full h-10"></div>
      </div>
      <div class="col-span-1 bg-neutral-grey-500 ml-6"></div>
    </div>
  </div>
</template>
