// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  sourcemap: false,
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  experimental: {
    payloadExtraction: true,
  },
  runtimeConfig: {
    upstash: {
      redisUrl: process.env.UPSTASH_REDIS_REST_URL,
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  },
  nitro: {
    devStorage: {
      redis: {
        driver: "fs",
        base: "./data/app",
      },
    },
    storage: {
      cache: {
        driver: "upstash",
      },
      redis: {
        driver: "upstash",
        base: "app:",
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    },
  },
  routeRules: {
    // Cache API responses for 60 seconds with stale-while-revalidate
    "/api/items/**": {
      cache: { name: "items", maxAge: 60 * 60 * 24 * 30, swr: true },
    },
    "/api/orders": { cache: { name: "orders", maxAge: 20 * 60, swr: true } },
  },
  modules: [
    "@formkit/auto-animate",
    "@vee-validate/nuxt",
    "@nuxtjs/i18n",
    "@clerk/nuxt",
    "shadcn-nuxt",
    "@nuxt/icon",
    "@vueuse/nuxt",
    "@nuxt/hints",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  icon: {
    mode: "css",
    cssLayer: "base",
  },
  shadcn: {
    prefix: "UI",
    componentDir: "@/components/ui",
  },
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "fr", name: "Français", file: "fr.json" },
    ],
    strategy: "no_prefix",
  },
});
