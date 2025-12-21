<script lang="ts" setup>
  interface Props {
    currentStatus: IUserMeta["status"];
  }

  defineProps<Props>();

  const { isSignedIn } = useAuth();

  const { locale, locales } = useI18n();
</script>

<template>
  <header
    :class="[
      isSignedIn && currentStatus !== 'PENDING'
        ? 'border-b border-neutral-grey-500'
        : '',
    ]"
  >
    <nav
      class="container xl:h-22"
      :class="[isSignedIn ? 'flex items-center justify-between' : '']"
    >
      <ul
        v-show="isSignedIn"
        class="*:inline-block *:uppercase *:text-primary-1100 *:hover:text-primary-600 space-x-10"
      >
        <li>
          <NuxtLink to="/orders">{{ $t("links.orders") }}</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/customers">{{ $t("links.customers") }}</NuxtLink>
        </li>
        <li>
          <NuxtLink to="/menu">{{ $t("links.menu") }}</NuxtLink>
        </li>
      </ul>
      <figure v-show="isSignedIn" aria-roledescription="Logo" class="m-auto">
        <img
          class="block lg:w-24"
          src="/assets/logo/les-delices-de-mere-double.svg"
          alt="Les Délices de Mère-Double"
        />
      </figure>
      <UISelect :default-value="locale">
        <UISelectTrigger
          class="w-fit border-transparent inline-block space-x-2 float-right shadow-none *:data-[slot=select-value]:inline *:text-primary-1100"
        >
          <template #default>
            <Icon name="lucide:globe" size="20" class="align-middle" />
            <UISelectValue
              class="uppercase"
              :default="locale"
              :placeholder="locale"
            />
          </template>
          <template #icon>
            <Icon name="lucide:chevron-down" size="20" class="align-middle" />
          </template>
        </UISelectTrigger>
        <UISelectContent>
          <UISelectItem
            v-for="locale in locales"
            :key="locale.code"
            :value="locale.code"
            @select="$i18n.setLocale(locale.code)"
            class="uppercase"
          >
            {{ locale.code }}</UISelectItem
          >
        </UISelectContent>
      </UISelect>
    </nav>
    <div
      v-show="currentStatus === 'PENDING'"
      class="w-full lg:h-12 flex items-center  bg-accent-one-200 text-neutral-grey-900"
      role="banner"
    >
      <p class="container text-sm">
        {{ currentStatus === "PENDING" ? $t("banner.pending-status") : "" }}
      </p>
    </div>
  </header>
</template>
