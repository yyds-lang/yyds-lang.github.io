<script setup lang="ts">
const route = useRoute()
const navOpen = ref(false)

const navLinkClass = 'rounded-md px-3 py-1.5 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100'
const navLinkActiveClass = 'bg-zinc-800 text-zinc-100'
const drawerLinkClass = 'flex items-center gap-3 rounded-lg px-4 py-3 text-base text-zinc-200 transition hover:bg-zinc-800'
const drawerLinkActiveClass = 'bg-emerald-500/15 text-emerald-300'

watch(() => route.path, () => {
  navOpen.value = false
})

function closeNavOnDesktop(): void {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    navOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', closeNavOnDesktop)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', closeNavOnDesktop)
})
</script>

<template>
  <div class="bg-zinc-950 text-zinc-100 lg:min-h-screen">
    <div
      class="mx-auto flex h-dvh max-w-7xl flex-col gap-5 overflow-hidden px-4 py-2 sm:px-6 lg:h-auto lg:min-h-screen lg:gap-0 lg:overflow-visible lg:py-0"
    >
      <header class="shrink-0 lg:py-2">
        <div
          class="flex items-center justify-between border border-zinc-800 rounded-xl bg-zinc-900/80 px-3 py-2"
        >
        <RouterLink
          to="/"
          class="text-sm text-zinc-100 font-semibold tracking-[0.2em] uppercase transition hover:text-emerald-300"
        >
          YYDS
        </RouterLink>

        <button
          type="button"
          class="h-9 w-9 inline-flex items-center justify-center rounded-lg text-zinc-300 transition lg:hidden hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="打开菜单"
          @click="navOpen = true"
        >
          <span class="i-lucide-menu h-5 w-5" aria-hidden="true" />
        </button>

        <nav class="hidden items-center gap-1 text-sm lg:flex">
          <RouterLink
            to="/"
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
          >
            首页
          </RouterLink>
          <RouterLink
            to="/studio"
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
          >
            Studio
          </RouterLink>
        </nav>
        </div>
      </header>

      <SideDrawer v-model="navOpen" mobile-only title="导航">
      <RouterLink
        to="/"
        :class="drawerLinkClass"
        :active-class="drawerLinkActiveClass"
      >
        <span class="i-lucide-house h-5 w-5" aria-hidden="true" />
        首页
      </RouterLink>
      <RouterLink
        to="/studio"
        :class="drawerLinkClass"
        :active-class="drawerLinkActiveClass"
      >
        <span class="i-lucide-music-2 h-5 w-5" aria-hidden="true" />
        Studio
      </RouterLink>
      </SideDrawer>

      <main class="min-h-0 flex-1 overflow-hidden lg:flex-none lg:overflow-visible lg:pb-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
