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

        <div class="share-row">
          <label class="field-label">일정 공개 여부</label>
          <input id="shared" type="checkbox" v-model="editForm.isShared" class="checkbox" />
        </div>
      </div>

      <div v-else class="loading">⏳ 일정 정보를 불러오는 중...</div>

      <!-- 푸터 -->
      <footer class="modal-footer">
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
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";

const props = defineProps({
  visible: Boolean,
  eventId: String,
});
const emit = defineEmits(["update:visible", "updated", "deleted"]);

const userId = localStorage.getItem("id");
const workspaceId = localStorage.getItem("selectedWorkspaceId");

const schedule = ref(null);
const editForm = ref({});

// 일정 정보 불러오기
watch(
  () => props.eventId,
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
      `/user-service/shared-calendars/${props.eventId}?workspaceId=${workspaceId}`,
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
      `/user-service/shared-calendars/${props.eventId}?workspaceId=${workspaceId}`,
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
};
</script>

<style scoped>
/* ===== Overlay & Container ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(3px);
}

.modal-container {
  width: 440px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: fadeIn 0.25s ease-out;
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ===== Header ===== */
.modal-header {
  background: #fff8e1;
  padding: 18px 22px;
  border-bottom: 1px solid #f2e3a5;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

/* ===== Body ===== */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  background: #fffdf9;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.field-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.field-input:focus {
  outline: none;
  border-color: #ffcd4d;
  box-shadow: 0 0 0 2px rgba(255, 205, 77, 0.2);
}

.readonly {
  font-size: 14px;
  color: #555;
  background: #fafafa;
  padding: 8px 10px;
  border-radius: 6px;
}

/* 공개 여부 */
.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #ffcd4d;
}

/* ===== Footer ===== */
.modal-footer {
  padding: 12px 20px;
  text-align: right;
  background: #fafafa;
  border-top: 1px solid #eee;
}

.btn-edit,
.btn-delete,
.btn-close {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit {
  background: #ffcd4d;
  color: #333;
}
.btn-edit:hover {
  background: #ffd86c;
}

.btn-delete {
  background: #ff7777;
  color: white;
}
.btn-delete:hover {
  background: #ff5a5a;
}

.btn-close {
  background: #f5f5f5;
  color: #333;
}
.btn-close:hover {
  background: #e8e8e8;
}

/* ===== 기타 ===== */
.loading {
  text-align: center;
  padding: 24px;
  color: #666;
}

/* 애니메이션 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
