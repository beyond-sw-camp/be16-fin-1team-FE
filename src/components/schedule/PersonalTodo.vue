<script setup lang="ts">
const props = defineProps<{ items:{id:string; title:string; done:boolean;}[] }>();
const emit = defineEmits<{
  (e:"toggle", id:string, done:boolean): void
}>();
</script>

<template>
  <div class="card">
    <div class="header">
      <span>개인 To-Do</span>
      <button class="add">+ To-Do 추가</button>
    </div>
    <ul class="list">
      <li v-for="t in props.items" :key="t.id" class="row">
        <label class="check">
          <input type="checkbox" :checked="t.done" @change="emit('toggle', t.id, !t.done)" />
          <span></span>
        </label>
        <div class="title" :class="{done:t.done}">{{ t.title }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card { background:#fff; border-radius:16px; box-shadow:0 8px 24px rgba(0,0,0,0.06); padding:16px; }
.header { display:flex; justify-content:space-between; align-items:center; font-weight:700; margin-bottom:8px; }
.add { border:none; background:#111; color:#fff; padding:6px 10px; border-radius:8px; cursor:pointer; }
.list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; }
.row { display:flex; align-items:center; gap:12px; }
.check { position:relative; width:20px; height:20px; }
.check input { display:none; }
.check span { position:absolute; inset:0; border-radius:6px; border:2px solid #c9c9c9; }
.check input:checked + span { background:#f3c403; border-color:#f3c403; }
.title { font-weight:500; }
.title.done { color:#999; text-decoration: line-through; }
</style>
