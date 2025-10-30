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

// ✅ 체크박스 상태 관리 (완료 안 된 태스크만)
const checkedTasks = ref({});

// ✅ 체크박스 클릭 시
function onToggleComplete(task) {
  // 완료된 태스크는 클릭 불가
  if (task.isDone) return;

  // 체크 시 임시로 상태 반영
  checkedTasks.value[task.taskId] = true;
  selectedTask.value = task;
  showCompleteModal.value = true;
}

// ✅ 완료 처리 확정
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

// ✅ 완료 모달 취소 (체크 복원)
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

    <!-- ✅ 완료 처리 모달 -->
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
.task-card {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  padding: 24px 24px; /* ✅ 좌우 유지, 상하 동일하게 여유 */
  box-sizing: border-box;
}

/* ✅ 타이틀 */
.title {
  font-weight: 700;
  font-size: 18px;
  margin-top: 40px;
  margin-bottom: 10px; /* 🔹 타이틀 아래 여백 늘림 */
  color: #333;
  flex-shrink: 0;
}

/* ✅ 리스트 스크롤 */
.task-list-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 6px 12px 6px; /* 🔹 위·아래 여백 추가 (기존보다 넉넉하게) */
}
.task-list-container::-webkit-scrollbar {
  width: 6px;
}
.task-list-container::-webkit-scrollbar-thumb {
  background: #dcdcdc;
  border-radius: 4px;
}

/* ✅ 로딩 / 비어있을 때 */
.loading,
.empty {
  color: #888;
  font-size: 14px;
  text-align: center;
  margin-top: 40px;
}

/* ✅ 리스트 내부 여백 및 간격 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 🔹 카드 간 간격 살짝 확대 */
  width: 100%;
  padding: 20px 6px;
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
  background-color: #f4ce53;
}
.task-item.done {
  background-color: #f5f5f5;
  opacity: 0.7;
  text-decoration: line-through;
}

/* ✅ hover 시 */
.task-item:not(.done):hover {
  background-color: #f6d969;
  transform: translateY(-2px);
}
.task-item.done:hover {
  background-color: #f5f5f5;
  transform: none;
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

/* ✅ 오른쪽 액션 영역 */
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
