<script setup>
import { ref, computed } from "vue";
import { useScheduleStore } from "@/stores/schedule";
import TaskCompleteConfirmModal from "@/components/modal/TaskCompleteConfirmModal.vue";
import TaskDeleteConfirmModal from "@/components/modal/TaskDeleteConfirmModal.vue";
import TrashIcon from "@/assets/icons/calendar/trash-can.svg";

const store = useScheduleStore();
const tasks = computed(() => store.myTasks);

// ✅ 모달 상태
const showCompleteModal = ref(false);
const showDeleteModal = ref(false);
const selectedTask = ref(null);
const loading = ref(false);

// ✅ 체크박스 상태 관리
const checkedTasks = ref({});

// ✅ 완료 토글
function onToggleComplete(task) {
  if (task.isDone) return;
  checkedTasks.value[task.taskId] = true;
  selectedTask.value = task;
  showCompleteModal.value = true;
}

// ✅ 완료 확정
async function confirmComplete() {
  try {
    loading.value = true;
    await store.completeTask(selectedTask.value.taskId);
    await store.loadMyTasks();
    showCompleteModal.value = false;
  } catch (e) {
    console.error("❌ 태스크 완료 처리 실패:", e);
  } finally {
    loading.value = false;
  }
}

// ✅ 완료 모달 취소
function cancelCompleteModal() {
  if (selectedTask.value) {
    checkedTasks.value[selectedTask.value.taskId] = false;
  }
  showCompleteModal.value = false;
  selectedTask.value = null;
}

// ✅ 삭제 클릭
function onDelete(task) {
  selectedTask.value = task;
  showDeleteModal.value = true;
}

// ✅ 삭제 확정
async function confirmDelete() {
  try {
    loading.value = true;
    await store.removeTask(selectedTask.value.taskId);
    await store.loadMyTasks();
    showDeleteModal.value = false;
  } catch (e) {
    console.error("❌ 태스크 삭제 실패:", e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="task-card">
    <h3 class="title">내 태스크</h3>

    <div class="content-wrapper">
      <div v-if="store.loading" class="loading">불러오는 중...</div>

      <div v-else-if="!tasks || tasks.length === 0" class="empty">
        담당 중인 태스크가 없습니다.
      </div>

      <!-- ✅ 태스크 목록 -->
      <div v-else class="task-list-container">
        <ul class="task-list">
          <li
            v-for="t in tasks"
            :key="t.taskId"
            class="task-item"
            :class="{ done: t.isDone }"
          >
            <div class="task-left">
              <input
                type="checkbox"
                class="task-checkbox"
                :checked="t.isDone || checkedTasks[t.taskId]"
                :disabled="t.isDone"
                @change="onToggleComplete(t)"
              />
              <div class="task-info">
                <div class="task-name" :class="{ done: t.isDone }">
                  {{ t.taskName }}
                </div>
                <div class="task-meta">
                  <span class="project">{{ t.projectName }}</span>
                  <span class="stone">｜{{ t.stoneName }}</span>
                  <span class="date">
                    {{ new Date(t.startTime).toLocaleDateString() }} ~
                    {{ new Date(t.endTime).toLocaleDateString() }}
                  </span>
                </div>
              </div>
            </div>

            <div class="task-actions">
              <span class="status" :class="{ complete: t.isDone }">
                {{ t.isDone ? "완료" : "진행중" }}
              </span>
              <img
                :src="TrashIcon"
                class="trash-icon"
                alt="삭제"
                @click="onDelete(t)"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- ✅ 완료 모달 -->
    <TaskCompleteConfirmModal
      :show="showCompleteModal"
      :taskName="selectedTask?.taskName"
      :loading="loading"
      @close="cancelCompleteModal"
      @confirm="confirmComplete"
    />

    <!-- ✅ 삭제 모달 -->
    <TaskDeleteConfirmModal
      :show="showDeleteModal"
      :taskName="selectedTask?.taskName"
      :loading="loading"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
/* ✅ 전체 카드 */
.task-card {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  padding: 0;
  box-sizing: border-box;
}

/* ✅ 타이틀 고정 */
.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
  color: #1C0F0F;
  margin: 0 10px;
  padding: 20px 10px 15px;
  border-bottom: 1px solid rgb(233, 233, 233);
  flex-shrink: 0;
}

/* ✅ 내용 컨테이너 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 0;
  padding: 0 16px 12px 16px;
}

/* ✅ 태스크가 없을 때도 카드 크기 유지 */
.task-list-container {
  height: 250px;
  overflow-y: auto;
  padding-top: 8px; /* 🔹 첫 번째 태스크와 타이틀 간 간격 일정 */
  padding-bottom: 12px;
}
.task-list-container::-webkit-scrollbar {
  width: 6px;
}
.task-list-container::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 4px;
}

/* ✅ 빈 상태 메시지 */
.loading,
.empty {
  color: #888;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  margin-top: 100px;
}

/* ✅ 리스트 내부 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 0 6px;
  box-sizing: border-box;
}

/* ✅ 태스크 카드 */
.task-item {
  border-radius: 12px;
  padding: 14px 18px;
  transition: 0.25s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* ✅ 진행중 / 완료 색상 구분 */
.task-item:not(.done) {
  background-color: #FFF8D8;
}
.task-item.done {
  background-color: #f5f5f5;
  opacity: 0.7;
  text-decoration: line-through;
}

/* ✅ hover 효과 */
.task-item:not(.done):hover {
  background-color: #FFE364;
  transform: translateY(-2px);
}
.task-item.done:hover {
  background-color: #f5f5f5;
}

/* ✅ 내부 레이아웃 */
.task-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.task-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #f4ce53;
  cursor: pointer;
}
.task-checkbox:disabled {
  cursor: not-allowed;
}
.task-info {
  display: flex;
  flex-direction: column;
}
.task-name {
  font-weight: 600;
  color: #222;
}
.task-name.done {
  color: #999;
  text-decoration: line-through;
}
.task-meta {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

/* ✅ 오른쪽 액션 */
.task-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status {
  font-weight: 600;
  font-size: 13px;
  color: #666;
}
.status.complete {
  color: #40916c;
}
.trash-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: 0.2s;
}
.trash-icon:hover {
  transform: scale(1.1);
}
</style>
