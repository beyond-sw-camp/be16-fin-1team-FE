<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <!-- 헤더 -->
      <header class="modal-header">
        <h2>일정 상세 정보</h2>
      </header>

      <!-- 본문 -->
      <div class="modal-body" v-if="schedule">
        <label class="field-label">일정명</label>
        <input class="field-input" v-model="editForm.calendarName" />

        <p class="readonly"><strong>작성자:</strong> {{ schedule.userName || "-" }}</p>

        <label class="field-label">시작일</label>
        <input class="field-input" type="datetime-local" v-model="editForm.startedAt" />

        <label class="field-label">종료일</label>
        <input class="field-input" type="datetime-local" v-model="editForm.endedAt" />

        <!-- ✅ 본인 일정인 경우에만 일정 공개 여부 표시 -->
        <div v-if="schedule?.userId === userId" class="share-row">
          <label class="field-label">일정 공개 여부</label>
          <input id="shared" type="checkbox" v-model="editForm.isShared" class="checkbox" />
        </div>
      </div>

      <div v-else class="loading">⏳ 일정 정보를 불러오는 중...</div>

      <!-- 푸터 -->
      <footer class="modal-footer">
        <div class="button-group">
          <button
            class="btn-edit"
            v-if="schedule?.userId === userId"
            @click="updateSchedule"
          >
            수정
          </button>
          <button
            class="btn-delete"
            v-if="schedule?.userId === userId"
            @click="deleteSchedule"
          >
            삭제
          </button>
          <button class="btn-close" @click="close">닫기</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";

const props = defineProps({
  visible: Boolean,
  scheduleId: String,
});
const emit = defineEmits(["update:visible", "updated", "deleted", "close"]);

const userId = localStorage.getItem("id");
const workspaceId = localStorage.getItem("selectedWorkspaceId");

const schedule = ref(null);
const editForm = ref({});

// 일정 정보 불러오기
watch(
  () => props.scheduleId,
  async (newId) => {
    if (!newId) return;
    try {
      const { data } = await axios.get(
        `/user-service/shared-calendars/detail/${newId}?workspaceId=${workspaceId}`,
        {
          headers: { "X-User-Id": userId },
        }
      );
      schedule.value = data.result || data;

      editForm.value = {
        calendarName: schedule.value.calendarName,
        startedAt: schedule.value.startedAt?.slice(0, 16),
        endedAt: schedule.value.endedAt?.slice(0, 16),
        isShared: schedule.value.isShared,
      };
    } catch (err) {
      console.error("❌ 일정 조회 실패:", err);
      alert(err.response?.data?.statusMessage || "일정 정보를 불러오지 못했습니다.");
    }
  },
  { immediate: true }
);

// 수정
const updateSchedule = async () => {
  try {
    await axios.put(
      `/user-service/shared-calendars/${props.scheduleId}?workspaceId=${workspaceId}`,
      {
        calendarName: editForm.value.calendarName,
        startedAt: editForm.value.startedAt,
        endedAt: editForm.value.endedAt,
        isShared: editForm.value.isShared,
      },
      {
        headers: { "X-User-Id": userId },
      }
    );
    alert("✅ 일정이 수정되었습니다.");
    emit("updated");
  } catch (err) {
    console.error("❌ 일정 수정 실패:", err);
    alert("일정 수정 실패");
  }
};

// 삭제
const deleteSchedule = async () => {
  if (!confirm("이 일정을 삭제하시겠습니까?")) return;
  try {
    await axios.delete(
      `/user-service/shared-calendars/${props.scheduleId}?workspaceId=${workspaceId}`,
      { headers: { "X-User-Id": userId } }
    );
    alert("🗑️ 일정이 삭제되었습니다.");
    emit("deleted");
    close();
  } catch (err) {
    console.error("❌ 일정 삭제 실패:", err);
    alert("일정 삭제 실패");
  }
};

const close = () => {
  emit("update:visible", false);
  emit("close");
};
</script>

<style scoped>
/* ===== Overlay & Container ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-container {
  width: 480px;
  max-width: 90vw;
  background: var(--surface, #ffffff);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--soft-elev, 0 8px 24px rgba(16, 24, 40, 0.12));
  overflow: hidden;
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border, #E4E7EC);
}

/* ===== Header ===== */
.modal-header {
  background: var(--brand-weak, #FFF4C2);
  padding: var(--gap-l, 20px) var(--gap-xl, 24px);
  border-bottom: 1px solid var(--border, #E4E7EC);
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong, #111418);
  letter-spacing: -0.01em;
}

/* ===== Body ===== */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--gap-m, 16px);
  padding: var(--gap-xl, 24px);
  background: var(--surface, #ffffff);
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #2C2F36);
  margin-bottom: var(--gap-xxs, 6px);
  display: block;
  letter-spacing: -0.01em;
}

.field-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border, #E4E7EC);
  font-size: 14px;
  color: var(--text-strong, #111418);
  background: var(--surface, #ffffff);
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  box-sizing: border-box;
}

.field-input:hover {
  border-color: var(--text-weak, #757B85);
}

.field-input:focus {
  outline: none;
  border-color: var(--brand, #FFCC33);
  box-shadow: 0 0 0 3px rgba(255, 204, 51, 0.1);
}

.field-input::placeholder {
  color: var(--text-weak, #757B85);
}

.readonly {
  font-size: 14px;
  color: var(--text, #2C2F36);
  background: var(--surface-2, #F8F9FB);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--divider, #EEF0F3);
  margin: 0;
}

.readonly strong {
  color: var(--text-strong, #111418);
  font-weight: 600;
}

/* 공개 여부 */
.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  margin-top: 4px;
}

.share-row .field-label {
  margin-bottom: 0;
}

.checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--brand, #FFCC33);
  transition: transform 0.2s ease;
}

.checkbox:hover {
  transform: scale(1.05);
}

/* ===== Footer ===== */
.modal-footer {
  padding: var(--gap-m, 16px) var(--gap-xl, 24px);
  background: var(--surface-2, #F8F9FB);
  border-top: 1px solid var(--divider, #EEF0F3);
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-xs, 10px);
  align-items: center;
}

.btn-edit,
.btn-delete,
.btn-close {
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.01em;
  min-width: 70px;
}

.btn-edit {
  background: var(--brand, #FFCC33);
  color: var(--text-strong, #111418);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-edit:hover {
  background: #FFD966;
  box-shadow: 0 2px 4px rgba(255, 204, 51, 0.2);
  transform: translateY(-1px);
}

.btn-edit:active {
  transform: translateY(0);
}

.btn-delete {
  background: var(--danger, #F87171);
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-delete:hover {
  background: #EF4444;
  box-shadow: 0 2px 4px rgba(248, 113, 113, 0.3);
  transform: translateY(-1px);
}

.btn-delete:active {
  transform: translateY(0);
}

.btn-close {
  background: var(--chip, #F0F2F6);
  color: var(--text, #2C2F36);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-close:hover {
  background: var(--divider, #EEF0F3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.btn-close:active {
  transform: translateY(0);
}

/* ===== 기타 ===== */
.loading {
  text-align: center;
  padding: var(--gap-xl, 24px);
  color: var(--text-weak, #757B85);
  font-size: 14px;
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
