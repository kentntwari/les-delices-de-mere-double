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
  // routeRules: {
  //   // Cache API responses for 60 seconds with stale-while-revalidate
  //   "/api/items/**": { swr: 60 },
  //   "/api/orders": { swr: 30 },
  // },
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