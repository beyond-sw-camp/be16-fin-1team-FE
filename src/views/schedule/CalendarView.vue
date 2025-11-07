<script setup>
import { ref, onMounted } from "vue";
import CalendarBase from "@/components/CalendarBase.vue";
import StoneDetailModal from "@/views/Project/StoneDetailModal.vue";
import http from "@/utils/http";

const events = ref([]);
const selected = ref(null);

const workspaceId = "ws_5";

const fetchEvents = async () => {
  const [stoneRes, taskRes] = await Promise.all([
    http.get(`/workspace-service/workspace/${workspaceId}/my-stones`),
    http.get(`/workspace-service/workspace/${workspaceId}/my-tasks`)
  ]);

  const stoneEvents = stoneRes.data.result.map(s => ({
    id: s.stoneId,
    title: `[스톤] ${s.stoneName}`,
    start: s.startTime,
    end: s.endTime,
    project: s.projectName,
    type: "STONE",
    color: "#A3B8FF",
  }));

  const taskEvents = taskRes.data.result.map(t => ({
    id: t.taskId,
    title: `[태스크] ${t.taskName}`,
    start: t.startTime,
    end: t.endTime,
    project: t.projectName,
    stone: t.stoneName,
    type: "TASK",
    color: "#FFD93D",
  }));

  events.value = [...stoneEvents, ...taskEvents];
};

onMounted(fetchEvents);
</script>

<template>
  <div class="calendar-container">
    <CalendarBase :events="events" @openStoneModal="selected = $event" />
    <StoneDetailModal
      v-if="selected"
      :stoneId="selected.id"
      :type="selected.type"
      @close="selected = null"
    />
  </div>
</template>


<style scoped>
.calendar-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  background-color: #fafafa;
  border-radius: 20px;
}
</style>
