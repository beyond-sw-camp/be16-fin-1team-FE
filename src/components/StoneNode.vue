<template>
  <div class="stone-node" :class="{ 'root-stone': isRoot }">
    <!-- 도넛 게이지 배경 -->
    <div class="donut-background" :class="{ 'root-donut': isRoot }"></div>
    
    <!-- 도넛 게이지 진행률 -->
    <div 
      class="donut-progress" 
      :class="{ 'root-donut': isRoot }"
      :style="progressStyle"
    ></div>
    
    <!-- 스톤 내용 -->
    <div class="stone-content">
      <div class="stone-name">{{ label }}</div>
      <div class="stone-milestone">{{ milestone || 0 }}%</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  milestone: {
    type: Number,
    default: 0
  },
  isRoot: {
    type: Boolean,
    default: false
  }
})

// 진행률에 따른 스타일 계산
const progressStyle = computed(() => {
  const progress = props.milestone || 0
  const radius = props.isRoot ? 90 : 75
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress / 100)
  
  return {
    '--progress': progress,
    '--circumference': circumference,
    '--stroke-dashoffset': strokeDashoffset,
    '--rotation': `${-90 + (progress * 3.6)}deg`
  }
})
</script>

<style scoped>
.stone-node {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #FFEE93;
  border: 3px solid #FFFFFF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-family: 'Pretendard', sans-serif;
}

.stone-node.root-stone {
  background: #FFDD44;
}

.donut-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid #B6A28E;
  pointer-events: none;
}

.donut-background.root-donut {
  border-width: 16px;
  border-color: #AEC3B0;
}

.donut-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top: 4px solid #4A90E2;
  border-right: 4px solid #4A90E2;
  pointer-events: none;
  transform: rotate(var(--rotation, -90deg));
  transition: transform 0.8s ease-in-out;
  animation: progressFill 1s ease-out;
}

.donut-progress.root-donut {
  border-width: 16px;
  border-top-color: #4A90E2;
  border-right-color: #4A90E2;
}

@keyframes progressFill {
  from {
    transform: rotate(-90deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: rotate(var(--rotation, -90deg)) scale(1);
    opacity: 1;
  }
}

.stone-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #1C0F0F;
  pointer-events: none;
}

.root-stone .stone-content {
  color: #F8F8F2;
}

.stone-name {
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  margin-bottom: 4px;
  word-break: break-word;
}

.stone-milestone {
  font-weight: 600;
  font-size: 11px;
  color: #4A90E2;
}

.root-stone .stone-milestone {
  font-weight: 700;
  font-size: 12px;
}

/* 0%일 때는 도넛이 보이지 않도록 */
.donut-progress[style*="--progress: 0"] {
  opacity: 0;
}

/* 100%일 때는 완전한 원 */
.donut-progress[style*="--progress: 100"] {
  border: 4px solid #4A90E2;
  border-top-color: #4A90E2;
  border-right-color: #4A90E2;
  border-bottom-color: #4A90E2;
  border-left-color: #4A90E2;
}

.donut-progress.root-donut[style*="--progress: 100"] {
  border-width: 16px;
}
</style>
