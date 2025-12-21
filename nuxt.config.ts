// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  modules: [
    "@formkit/auto-animate",
    "@vee-validate/nuxt",
    "@nuxtjs/i18n",
    "@clerk/nuxt",
    "shadcn-nuxt",
    "@nuxt/icon",
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
  imports: {
    dirs: ["mvc"],
  },
});
