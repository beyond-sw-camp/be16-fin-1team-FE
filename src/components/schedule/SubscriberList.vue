<script setup>
import { ref, onMounted } from "vue";
import { useSharedCalendarStore } from "@/stores/sharedCalendar";

const store = useSharedCalendarStore();
const workspaceId = localStorage.getItem("selectedWorkspaceId");
const showSetting = ref(false);

onMounted(() => {
  store.loadAllSchedules(workspaceId);
});

const deleteSub = async (id) => {
  await store.deleteSubscription([id], workspaceId);
};
</script>

<template>
  <div>
    <h3>📅 구독한 유저</h3>
    <ul class="sub-list">
      <li v-for="sub in store.subscriptions" :key="sub.id">
        <span>{{ sub.targetUserId }}</span>
        <button @click="deleteSub(sub.id)" class="delete-btn">❌</button>
      </li>
    </ul>

    <button @click="showSetting = !showSetting" class="gear-btn">⚙️ 관리</button>

    <div v-if="showSetting" class="setting-modal">
      <input type="text" placeholder="추가할 유저 ID" v-model="newUser" />
      <button @click="store.addSubscription(workspaceId, [newUser])">추가</button>
    </div>
  </div>
</template>

<style scoped>
.sub-list {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}
.sub-list li {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}
.gear-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin-top: 10px;
}
.setting-modal {
  margin-top: 10px;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 8px;
}
.delete-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}
</style>
