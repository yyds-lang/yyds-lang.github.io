<template>
  <section class="h-full overflow-y-auto border border-zinc-800 rounded-2xl bg-zinc-900/70 p-4 lg:h-auto space-y-6 lg:overflow-visible md:p-8 sm:p-6">
    <p class="text-xs text-zinc-400 tracking-[0.2em] uppercase">
      Minimal Viable
    </p>
    <h2 class="text-2xl font-semibold leading-tight sm:text-3xl">
      YYDS 音乐生成器
    </h2>
    <p class="max-w-2xl text-zinc-300">
      基于
      <a
        href="https://github.com/plugine/yyds"
        target="_blank"
        rel="noopener noreferrer"
        class="text-emerald-300 underline decoration-emerald-500/60 underline-offset-2 hover:text-emerald-200"
      >
        plugine/yyds
      </a>
      实现的在线音乐生成器。
    </p>
    <div class="flex flex-col gap-3 xs:flex-row">
      <RouterLink
        to="/studio"
        class="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm text-emerald-950 font-semibold transition hover:bg-emerald-400"
      >
        打开 Studio
      </RouterLink>
    </div>
  </section>
</template>
