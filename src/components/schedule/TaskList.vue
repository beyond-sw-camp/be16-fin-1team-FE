<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ items: {id:string; title:string; startAt?:string; endAt?:string; done:boolean;}[] }>();
const emit = defineEmits<{
  (e:"toggle", id:string, done:boolean): void
}>();

const sorted = computed(() => {
  return [...props.items].sort((a,b)=> (a.done===b.done?0: a.done?1:-1));
});
</script>

<template>
  <div class="card">
    <div class="header">Task</div>
    <ul class="list">
      <li v-for="t in sorted" :key="t.id" class="row">
        <label class="check">
          <input type="checkbox" :checked="t.done" @change="emit('toggle', t.id, !t.done)" />
          <span></span>
        </label>
        <div class="meta">
          <div class="title" :class="{done:t.done}">{{ t.title }}</div>
          <div v-if="t.startAt || t.endAt" class="date">{{ t.startAt?.slice(0,10) }} ~ {{ t.endAt?.slice(0,10) }}</div>
          <div class="bar">
            <div class="fill" :style="{width: (t.done?100:40)+'%'}"></div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card { background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.06); padding:16px; }
.header { font-weight:700; margin-bottom:8px; }
.list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
.row { display:flex; align-items:center; gap:12px; }
.check { position:relative; width:20px; height:20px; }
.check input { display:none; }
.check span { position:absolute; inset:0; border-radius:6px; border:2px solid #c9c9c9; }
.check input:checked + span { background:#f3c403; border-color:#f3c403; }
.meta { flex:1; }
.title { font-weight:600; }
.title.done { color:#999; text-decoration: line-through; }
.date { color:#888; font-size:12px; margin-top:2px; }
.bar { height:10px; background:#f1f1f1; border-radius:8px; margin-top:8px; overflow:hidden; }
.fill { height:100%; background:#f3c403; width:40%; border-radius:8px; }
</style>
