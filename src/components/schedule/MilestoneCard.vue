<template>
  <div class="milestone-card" :class="{ completed: progress === 100 }">
    <!-- 스톤명 -->
    <div class="milestone-title">{{ name }}</div>

    <!-- 겹쳐진 링 구조 -->
    <div class="ring-wrapper">
      <svg class="ring" viewBox="0 0 160 160">
        <!-- 회색 배경 링 -->
        <circle class="bg-ring" cx="80" cy="80" r="70" stroke-width="12" fill="none" />
        <!-- 진행률 링 -->
        <circle
          class="progress-ring"
          cx="80"
          cy="80"
          r="70"
          stroke-width="12"
          fill="none"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="offset"
        />
      </svg>

      <!-- 중앙 내용 -->
      <div class="center">
        <div class="dday">D-{{ dday }}</div>
        <div class="percent">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  dday: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
});

// 원형 둘레 계산 (r=70 기준)
const circumference = 2 * Math.PI * 70;
const offset = computed(() => circumference - (circumference * props.progress) / 100);
</script>

<style scoped>
/* 전체 카드 */
.milestone-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.milestone-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

/* 스톤명 */
.milestone-title {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 20px;
  color: #222;
}

/* 링 컨테이너 */
.ring-wrapper {
  position: relative;
  width: 180px;
  height: 180px;
}

/* SVG 기본 */
.ring {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

/* 회색 배경 링 */
.bg-ring {
  stroke: #e5e5e5;
}

/* 진행률 링 */
.progress-ring {
  stroke: #f5c518; /* Orbit 포인트 노랑 */
  transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
  stroke-linecap: round;
}

/* hover 시 약간 밝은 노랑 */
.milestone-card:hover .progress-ring {
  stroke: #ffdd55;
}

/* 완료된 스톤(100%) 색상 변경 */
.milestone-card.completed .progress-ring {
  stroke: #4caf50; /* 초록색 */
}

/* 중앙 내용 */
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.dday {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.percent {
  margin-top: 4px;
  font-size: 15px;
  color: #666;
}
</style>
