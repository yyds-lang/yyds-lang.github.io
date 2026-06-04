<template>
  <section class="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8">
    <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Minimal Viable</p>
    <h2 class="text-3xl font-semibold leading-tight">YYDS 音乐生成器</h2>
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
    <div class="flex gap-3">
      <RouterLink
        to="/studio"
        class="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
      >
        打开 Studio
      </RouterLink>
    </div>
  </section>
</template>
