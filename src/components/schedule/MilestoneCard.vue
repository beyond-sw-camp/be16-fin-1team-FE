<script setup lang="ts">
defineProps<{ name: string; dday: number; progress: number }>();

const dText = (dday: number) => {
  if (dday > 0) return `D - ${dday}`;
  if (dday === 0) return "D - DAY";
  return `D + ${Math.abs(dday)}`;
};
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span class="title">마일스톤</span>
      <span class="name">{{ name }}</span>
    </div>
    <div class="ring-wrap">
      <svg viewBox="0 0 120 120" class="ring">
        <circle cx="60" cy="60" r="42" class="ring-bg"/>
        <circle :stroke-dasharray="`${progress * 2.64} 999`" cx="60" cy="60" r="42" class="ring-fg"/>
        <circle cx="60" cy="60" r="28" class="ring-bg secondary"/>
      </svg>
      <div class="center">
        <div class="d-text">{{ dText(dday) }}</div>
        <div class="percent">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card { background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.06); padding:16px 20px; }
.card-header { display:flex; align-items:baseline; gap:12px; }
.title { font-weight:700; font-size:14px; color:#555; }
.name { font-weight:600; font-size:14px; color:#111; }
.ring-wrap { position:relative; width:100%; height:220px; display:grid; place-items:center; }
.ring { width:220px; height:220px; transform:rotate(-90deg); }
.ring-bg { fill:none; stroke:#e6e6e6; stroke-width:14; }
.ring-bg.secondary { stroke:#d9d9d9; stroke-width:12; r:28; }
.ring-fg { fill:none; stroke:#f3c403; stroke-linecap:round; stroke-width:14; }
.center { position:absolute; text-align:center; }
.d-text { font-weight:800; font-size:22px; color:#333; letter-spacing:0.5px; }
.percent { margin-top:6px; color:#888; font-size:14px; }
</style>
