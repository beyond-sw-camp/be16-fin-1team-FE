<template>
  <div class="milestone-card" :class="{ completed: progress === 100 }">
    <!-- 겹쳐진 링 구조 -->
    <div class="ring-wrapper">
      <svg class="ring" viewBox="0 0 200 200">
        <!-- 그라데이션 및 필터 정의 -->
        <defs>
          <!-- 진행률 링용 그라데이션 (노란색) -->
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFF8D8;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#FFE364;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#F4CE53;stop-opacity:1" />
          </linearGradient>
          
          <!-- 완료된 링용 그라데이션 (초록색) -->
          <linearGradient id="completedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#81C784;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#4CAF50;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#388E3C;stop-opacity:1" />
          </linearGradient>
          
          <!-- 링 바깥쪽 그림자 필터 -->
          <filter id="ringShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(0, 0, 0, 0.15)" flood-opacity="1"/>
            <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="rgba(255, 227, 100, 0.3)" flood-opacity="1"/>
          </filter>
          
          <!-- 완료된 링용 그림자 필터 -->
          <filter id="completedShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="rgba(0, 0, 0, 0.15)" flood-opacity="1"/>
            <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="rgba(76, 175, 80, 0.3)" flood-opacity="1"/>
          </filter>
        </defs>
        
        <!-- 회색 배경 링 -->
        <circle class="bg-ring" cx="100" cy="100" r="85" stroke-width="25" fill="none" />
        <!-- 진행률 링 (애니메이션) -->
        <circle
          class="progress-ring"
          :class="{ completed: progress === 100 }"
          cx="100"
          cy="100"
          r="85"
          stroke-width="25"
          fill="none"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="animatedOffset"
          stroke-linecap="round"
        />
        
        <!-- 링 위에 스톤명 텍스트 (SVG -90도 회전 보정: 텍스트를 90도 회전하여 원래 방향 유지) -->
        <g transform="rotate(90 100 100)">
          <text 
            class="stone-name-text"
            x="100"
            y="70"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ name }}
          </text>
        </g>
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
import { computed, ref, watch, onMounted } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  dday: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false },
});

// 원형 둘레 계산 (r=85 기준, stroke-width=18)
const radius = 85;
const circumference = 2 * Math.PI * radius;
const fullOffset = circumference; // 완전히 숨겨진 상태

// 애니메이션된 offset
const animatedOffset = ref(fullOffset);

function animateProgress(targetProgress: number) {
  const duration = 1500; // 1.5초
  const targetOffset = circumference - (circumference * targetProgress) / 100;
  const start = animatedOffset.value;
  const end = targetOffset;
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // ease-out 효과
    const easeOut = 1 - Math.pow(1 - progress, 3);
    animatedOffset.value = start + (end - start) * easeOut;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      animatedOffset.value = end;
    }
  }

  requestAnimationFrame(update);
}

// 이전 활성 상태를 추적
const wasActive = ref(props.isActive);

watch(
  () => props.isActive,
  (isActive) => {
    // 비활성 → 활성으로 변경될 때만 애니메이션 시작
    if (isActive && !wasActive.value) {
      // 게이지를 0에서 시작하여 현재 progress까지 애니메이션
      animatedOffset.value = fullOffset; // 완전히 숨겨진 상태에서 시작
      animateProgress(props.progress);
    } else if (!isActive) {
      // 비활성일 때는 즉시 업데이트
      const targetOffset = circumference - (circumference * props.progress) / 100;
      animatedOffset.value = targetOffset;
    }
    wasActive.value = isActive;
  },
  { immediate: true }
);

watch(
  () => props.progress,
  (newProgress) => {
    // 활성 상태일 때 progress가 변경되면 애니메이션
    if (props.isActive) {
      animatedOffset.value = fullOffset; // 다시 0에서 시작
      animateProgress(newProgress);
    }
  }
);

onMounted(() => {
  if (props.isActive) {
    // 활성 상태로 마운트되면 애니메이션
    animatedOffset.value = fullOffset;
    animateProgress(props.progress);
  } else {
    // 비활성 상태면 즉시 표시
    const targetOffset = circumference - (circumference * props.progress) / 100;
    animatedOffset.value = targetOffset;
  }
  wasActive.value = props.isActive;
});
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
  transition: transform 0.3s ease;
  pointer-events: none;
}


/* 링 컨테이너 */
.ring-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
}

/* SVG 기본 */
.ring {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

/* 회색 배경 링 */
.bg-ring {
  stroke:rgb(232, 232, 232);
  opacity: 0.9;
}

/* 진행률 링 */
.progress-ring {
  stroke: url(#progressGradient); /* 그라데이션 적용 */
  stroke-linecap: round;
  transition: stroke 0.5s ease;
  filter: url(#ringShadow); /* 링 바깥쪽 그림자 필터 적용 */
}

/* 완료된 스톤(100%) 색상 변경 */
.progress-ring.completed {
  stroke: url(#completedGradient); /* 완료된 링용 그라데이션 */
  filter: url(#completedShadow); /* 완료된 링용 그림자 필터 */
}

/* 링 위 스톤명 텍스트 */
.stone-name-text {
  font-size: 17px;
  font-weight: 600;
  fill: #1C0F0F;
  letter-spacing: -0.3px;
  pointer-events: none;
  user-select: none;
}

/* 중앙 내용 */
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 5;
}

.dday {
  font-size: 24px;
  font-weight: 700;
  color: #1C0F0F;
  margin-top: 30px;
  margin-bottom: 0px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.percent {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin-top: 5px;
  opacity: 0.9;
}
</style>
