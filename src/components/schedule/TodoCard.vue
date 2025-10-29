<template>
  <div class="todo-card">
    <!-- 헤더 영역 -->
    <div class="todo-header">
        <div class="left-group">
        <span class="todo-title">개인 To-Do</span>
        <button class="calendar-btn" @click="toggleCalendar">📅</button>

            <!-- 날짜 선택 팝업 (📅 버튼 바로 밑으로 이동) -->
            <div v-if="showCalendar" class="calendar-popup" @click.stop>
                <input
                type="date"
                v-model="selectedDate"
                @change="filterByDate"
                class="calendar-input"
                />
            </div>
        </div>

      <button class="add-btn" @click="openCreateModal">＋ To-Do 추가</button>
    </div>

    <!-- 현재 날짜 표시 -->
    <div class="selected-date">{{ formatDate(selectedDate) }}</div>

    <!-- To-Do 목록 -->
    <div v-if="todoStore.todos.length === 0" class="empty">
      등록된 To-Do가 없습니다.
    </div>

    <ul class="todo-list">
      <li
        v-for="todo in todoStore.todos"
        :key="todo.id"
        :class="['todo-item', todo.isCompleted ? 'done' : 'active']"
        @click="openEditModal(todo)"
      >
        <input
          type="checkbox"
          class="todo-checkbox"
          :checked="todo.isCompleted"
          @change.stop="toggleCompletion(todo)"
        />
        <span class="todo-text">{{ todo.calendarName }}</span>
      </li>
    </ul>

    <!-- To-Do 추가 모달 -->
    <teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-box add-modal">
          <h2 class="modal-title">새로운 To-Do 추가</h2>

          <div class="modal-body">
            <!-- 할 일 입력 -->
            <label class="field">
              <span class="label">할 일 *</span>
              <input
                v-model="newName"
                type="text"
                placeholder="할 일을 입력하세요"
                class="input-box"
              />
            </label>

            <!-- 날짜 입력 -->
            <label class="field">
              <span class="label">날짜 *</span>
              <input v-model="newDate" type="date" class="input-box" :min="today" />
            </label>

            <!-- 북마크 등록 체크 -->
            <label class="field checkbox">
              <input type="checkbox" v-model="newBookmark" />
              <span>북마크 등록 (자주 사용하는 To-Do)</span>
            </label>

            <!-- 북마크 리스트 (스크롤 가능) -->
            <div class="bookmark-list" v-if="bookmarkList.length > 0">
              <p class="bookmark-title">📌 북마크 목록</p>
              <ul>
                <li
                  v-for="bm in bookmarkList"
                  :key="bm.id"
                  class="bookmark-item"
                >
                  <div class="bookmark-content" @click="selectBookmark(bm)">
                    ⭐ {{ bm.calendarName }}
                  </div>
                  <!-- 🗑️ 휴지통 버튼 -->
                  <img
                    src="@/assets/icons/calendar/trash-can.svg"
                    class="trash-icon"
                    alt="delete bookmark"
                    title="북마크 해제"
                    @click.stop="confirmUnbookmark(bm.id)"
                  />
                </li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel" @click="closeCreateModal">취소</button>
            <button class="confirm" @click="createTodo">추가</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 북마크 해제 확인 모달 -->
    <teleport to="body">
      <div v-if="showUnbookmarkConfirm" class="modal-overlay" @click.self="showUnbookmarkConfirm = false">
        <div class="confirm-box shake">
          <div class="warning-icon">⭐</div>
          <h3 class="confirm-title">북마크를 해제하시겠습니까?</h3>
          <p class="confirm-text">이 To-Do는 북마크 목록에서 제외됩니다.</p>
          <div class="confirm-actions">
            <button class="cancel" @click="showUnbookmarkConfirm = false">취소</button>
            <button class="danger" @click="unbookmark">해제</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 수정 모달 -->
    <teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-box edit-modal">
          <h2 class="modal-title">To-Do 수정 / 삭제</h2>
          <div class="modal-body">
            <label class="field">
              <span>할 일 *</span>
              <input v-model="editName" type="text" />
            </label>

            <label class="field">
              <span>날짜 *</span>
              <input v-model="editDate" type="date" />
            </label>

            <label class="field checkbox">
              <input type="checkbox" v-model="editBookmark" />
              <span>북마크 등록</span>
            </label>
          </div>

          <div class="modal-footer space-between">
            <button class="delete" @click="openDeleteConfirm">삭제</button>
            <div>
              <button class="cancel" @click="closeEditModal">취소</button>
              <button class="confirm" @click="updateTodo">수정</button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 삭제 확인 모달 -->
    <teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm">
        <div class="confirm-box shake">
          <div class="warning-icon">⚠️</div>
          <h3 class="confirm-title">정말 삭제하시겠습니까?</h3>
          <p class="confirm-text">삭제한 To-Do는 복구할 수 없습니다.</p>
          <div class="confirm-actions">
            <button class="cancel" @click="closeDeleteConfirm">취소</button>
            <button class="danger" @click="deleteTodo">삭제</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import { useTodoStore } from "@/stores/todo";
import axios from "axios";

const todoStore = useTodoStore();
const workspaceId = localStorage.getItem("selectedWorkspaceId");
const today = new Date().toISOString().split("T")[0];

// 상태 관리
const showCalendar = ref(false);
const selectedDate = ref(today);
const showCreateModal = ref(false);
const newName = ref("");
const newDate = ref("");
const newBookmark = ref(false);
const bookmarkList = ref([]);
const showEditModal = ref(false);
const editId = ref(null);
const editName = ref("");
const editDate = ref("");
const editBookmark = ref(false);
const showDeleteConfirm = ref(false);
const showUnbookmarkConfirm = ref(false);
const targetUnbookmarkId = ref(null);

onMounted(() => {
  todoStore.loadTodosByDate(workspaceId, selectedDate.value);
});

const toggleCalendar = () => (showCalendar.value = !showCalendar.value);
const formatDate = (d) => (d ? d.replaceAll("-", ".") : "");

const filterByDate = async () => {
  await todoStore.loadTodosByDate(workspaceId, selectedDate.value);
  showCalendar.value = false;
};

/** 완료 토글 */
const toggleCompletion = async (todo) => {
  if (todo.isCompleted) await todoStore.uncompleteTodo(todo.id);
  else await todoStore.completeTodo(todo.id);
  await todoStore.loadTodosByDate(workspaceId, selectedDate.value);
};

/** To-Do 추가 */
const openCreateModal = async () => {
  newName.value = "";
  newDate.value = today;
  newBookmark.value = false;
  showCreateModal.value = true;

  // 모든 To-Do 불러오기
  await todoStore.loadAllTodos(workspaceId);

  // 북마크 항목만 필터링
  bookmarkList.value = todoStore.allTodos.filter((t) => t.bookmark);
};


const closeCreateModal = () => (showCreateModal.value = false);

const selectBookmark = (bm) => {
  newName.value = bm.calendarName;
  newDate.value = selectedDate.value;
};

/** 북마크 해제 확인 모달 열기 */
const confirmUnbookmark = (todoId) => {
  targetUnbookmarkId.value = todoId;
  showUnbookmarkConfirm.value = true;
};

/** 실제 북마크 해제 수행 */
const unbookmark = async () => {
  try {
    const todoId = targetUnbookmarkId.value;
    const todo = bookmarkList.value.find((b) => b.id === todoId);
    if (!todo) return;

    await axios.put(`/user-service/todo/${todoId}`, {
      calendarName: todo.calendarName,
      date: todo.startedAt?.split("T")[0] || today,
      bookmark: false,
    });

    bookmarkList.value = bookmarkList.value.filter((b) => b.id !== todoId);
    showUnbookmarkConfirm.value = false;
    console.log("북마크 해제 완료:", todoId);
  } catch (err) {
    console.error("❌ 북마크 해제 실패:", err);
    alert("북마크 해제 중 오류가 발생했습니다.");
  }
};

const createTodo = async () => {
  if (!newName.value || !newDate.value) return alert("필수 항목을 입력하세요.");
  await todoStore.addTodo({
    workspaceId,
    name: newName.value,
    bookmark: newBookmark.value,
    date: newDate.value,
  });
  closeCreateModal();
  await todoStore.loadTodosByDate(workspaceId, selectedDate.value);
};

/** 수정 */
const openEditModal = (todo) => {
  editId.value = todo.id;
  editName.value = todo.calendarName;
  editDate.value = todo.startedAt?.split("T")[0] || selectedDate.value;
  editBookmark.value = todo.bookmark;
  showEditModal.value = true;
};
const closeEditModal = () => (showEditModal.value = false);

const updateTodo = async () => {
  try {
    await axios.put(`/user-service/todo/${editId.value}`, {
      calendarName: editName.value,
      date: editDate.value,
      bookmark: editBookmark.value,
    });
    alert("수정되었습니다.");
    closeEditModal();
    await todoStore.loadTodosByDate(workspaceId, selectedDate.value);
  } catch (e) {
    console.error(e);
    alert("수정 중 오류 발생");
  }
};

/** 삭제 */
const openDeleteConfirm = () => (showDeleteConfirm.value = true);
const closeDeleteConfirm = () => (showDeleteConfirm.value = false);
const deleteTodo = async () => {
  try {
    await axios.delete(`/user-service/todo/${editId.value}`);
    alert("삭제되었습니다.");
    closeDeleteConfirm();
    closeEditModal();
    await todoStore.loadTodosByDate(workspaceId, selectedDate.value);
  } catch (e) {
    console.error(e);
    alert("삭제 중 오류 발생");
  }
};
</script>

<style scoped>
.todo-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-group {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.calendar-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  border-radius: 50%;
  padding: 6px;
  transition: all 0.25s ease;
}

/* hover 시 노란색 강조 효과 */
.calendar-btn:hover {
  background: #f4ce53;
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(244, 206, 83, 0.4);
}

.calendar-btn:hover {
  transform: scale(1.1);
  color: #f5c518;
}

.add-btn {
  background: #000;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

/* 달력 팝업 */
.calendar-popup {
  position: absolute;
  top: 50%; /* 버튼 세로 중앙 기준 */
  left: calc(100% + 8px); /* 버튼 오른쪽에 약간 띄워서 */
  transform: translateY(-50%); /* 세로 중앙 정렬 */
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

/* To-Do 리스트 */
.todo-list {
  margin-top: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 10px 14px;
  transition: 0.25s;
  cursor: pointer;
}
.todo-item.active {
  background: #f4ce53;
  color: #000;
}
.todo-item.done {
  background: #f5f5f5;
  color: #777;
  text-decoration: line-through;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #000;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 15px;
}

/* 모달 공통 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  width: 420px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 삭제 확인 모달 */
.confirm-box {
  background: #fff;
  border-radius: 12px;
  padding: 30px 32px;
  width: 400px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: shake 0.4s ease;
}

.warning-icon {
  font-size: 40px;
  color: #f4ce53;
  margin-bottom: 10px;
}
.confirm-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}
.confirm-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}
.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
.confirm-actions .cancel {
  background: #e0e0e0;
  padding: 8px 16px;
  border-radius: 6px;
}
.confirm-actions .danger {
  background: #ff5858;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
}

/* 애니메이션 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-4px); }
}

/* 추가 모달 리디자인 */
.add-modal {
  width: 500px;
  padding: 36px 40px;
}

.add-modal .modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #222;
  text-align: center;
  margin-bottom: 8px;
}

.add-modal .modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 6px;
}

/* 스크롤바 디자인 */
.add-modal .modal-body::-webkit-scrollbar {
  width: 6px;
}
.add-modal .modal-body::-webkit-scrollbar-thumb {
  background: #f5c518;
  border-radius: 4px;
}
.add-modal .modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* 입력 필드 */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.input-box {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  transition: 0.2s;
}
.input-box:focus {
  border-color: #f5c518;
  box-shadow: 0 0 0 2px rgba(245, 197, 24, 0.25);
}

/* 체크박스 */
.field.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

/* 북마크 리스트 */
.bookmark-list {
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-top: 10px;
  max-height: 180px;
  overflow-y: auto;
}

.bookmark-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.bookmark-item {
  background: #fafafa;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.bookmark-item:hover {
  background: #fff3c4;
}

/* 버튼 영역 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.modal-footer .cancel {
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
}

.modal-footer .confirm {
  background: #f5c518;
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
}

.bookmark-item {
  background: #fafafa;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trash-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
  opacity: 0.6;
  transition: 0.2s;
}

.trash-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}


/* 수정 모달 전체 스타일 */
.modal-box.edit-modal {
  width: 440px;
  padding: 32px 36px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.25s ease;
}

/* 제목 영역 */
.edit-modal .modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #222;
  text-align: center;
  border-bottom: 2px solid #f4ce53;
  padding-bottom: 10px;
}

/* 입력 필드 스타일 */
.edit-modal .modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.edit-modal label span {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

.edit-modal input[type="text"],
.edit-modal input[type="date"] {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.edit-modal input:focus {
  border-color: #f4ce53;
  box-shadow: 0 0 0 2px rgba(244, 206, 83, 0.3);
  outline: none;
}

/* 하단 버튼 정렬 */
.edit-modal .modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

/* 삭제 버튼 */
.edit-modal .delete {
  background: #fff3f3;
  color: #ff5858;
  border: 1px solid #ffb0b0;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.edit-modal .delete:hover {
  background: #ff5858;
  color: white;
}

/* 취소 / 수정 버튼 그룹 */
.edit-modal .modal-footer .cancel,
.edit-modal .modal-footer .confirm {
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: 600;
  transition: 0.2s;
}

.edit-modal .cancel {
  background: #f2f2f2;
  color: #333;
  border: 1px solid #ddd;
}
.edit-modal .cancel:hover {
  background: #e0e0e0;
}

.edit-modal .confirm {
  background: #f4ce53;
  color: #000;
  border: none;
}
.edit-modal .confirm:hover {
  background: #ffdb5c;
}

/* 체크박스 영역 */
.edit-modal .field.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 14px;
  color: #444;
}

/* 부드러운 fade-in 효과 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


</style>
