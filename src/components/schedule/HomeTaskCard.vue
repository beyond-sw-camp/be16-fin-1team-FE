<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useScheduleStore } from "@/stores/schedule";
import { completeTask, deleteTask } from "@/services/stoneService";
import TaskCompleteConfirmModal from "@/components/modal/TaskCompleteConfirmModal.vue";
import TaskDeleteConfirmModal from "@/components/modal/TaskDeleteConfirmModal.vue";

const store = useScheduleStore();

// ✅ 모달 상태
const showComplete = ref(false);
const showDelete = ref(false);
const selectedTask = ref<{ id: string; title: string } | null>(null);

// ✅ 모달 핸들러
const openCompleteModal = (task) => {
  selectedTask.value = task;
  showComplete.value = true;
};
const openDeleteModal = (task) => {
  selectedTask.value = task;
  showDelete.value = true;
};

// ✅ 완료 처리
const confirmComplete = async () => {
  if (!selectedTask.value) return;
  await completeTask(selectedTask.value.id);
  const t = store.tasks.find((x) => x.id === selectedTask.value.id);
  if (t) t.done = true;
  showComplete.value = false;
};

// ✅ 삭제 처리
const confirmDelete = async () => {
  if (!selectedTask.value) return;
  await deleteTask(selectedTask.value.id);
  store.tasks = store.tasks.filter((x) => x.id !== selectedTask.value.id);
  showDelete.value = false;
};

// ✅ 마운트 시 내 담당 태스크 불러오기
onMounted(async () => {
  await store.loadMyTasks();
});

// ✅ 정렬 (미완 → 완료 순)
const sortedTasks = computed(() =>
  [...store.tasks].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
);
</script>

<template>
  <div class="task-card">
    <div class="header">
      <h3>내 태스크</h3>
    </div>

    <div v-if="store.loading" class="loading">불러오는 중...</div>

    <ul v-else-if="sortedTasks.length" class="task-list">
      <li v-for="t in sortedTasks" :key="t.id" class="task-row">
        <label class="check">
          <input type="checkbox" :checked="t.done" @change="openCompleteModal(t)" />
          <span></span>
        </label>
        <div class="meta">
          <div class="title" :class="{ done: t.done }">{{ t.title }}</div>
          <div v-if="t.startAt || t.endAt" class="date">
            {{ t.startAt?.slice(0, 10) }} ~ {{ t.endAt?.slice(0, 10) }}
          </div>
        </div>
        <button class="delete-btn" @click="openDeleteModal(t)">🗑</button>
      </li>
    </ul>

    <div v-else class="empty">담당 중인 태스크가 없습니다.</div>

    <!-- ✅ 완료/삭제 모달 -->
    <TaskCompleteConfirmModal
      :show="showComplete"
      :taskName="selectedTask?.title || ''"
      @close="showComplete = false"
      @confirm="confirmComplete"
    />
    <TaskDeleteConfirmModal
      :show="showDelete"
      :taskName="selectedTask?.title || ''"
      @close="showDelete = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.task-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 18px;
}

.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.check {
  position: relative;
  width: 20px;
  height: 20px;
}
.check input {
  display: none;
}
.check span {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  border: 2px solid #c9c9c9;
}
.check input:checked + span {
  background: #f3c403;
  border-color: #f3c403;
}

.meta {
  flex: 1;
}
.title {
  font-weight: 600;
}
.title.done {
  color: #999;
  text-decoration: line-through;
}
.date {
  color: #888;
  font-size: 12px;
}
.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}
.empty {
  color: #aaa;
  text-align: center;
  margin-top: 30px;
}
</style>
