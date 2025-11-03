<template>
  <Card>
    <template #header>
      <div class="pis-header with-inset-hr">
        <h3 class="pis-title">프로젝트 정보</h3>
        <slot name="meta" />
      </div>
    </template>

    <div class="pis-grid">
      <div class="pis-item">
        <div class="pis-icon progress">
          <div class="progress-circle">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path
                class="circle"
                :stroke-dasharray="`${progress}, 100`"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span class="progress-text">{{ progress }}%</span>
          </div>
        </div>
        <div class="pis-info">
          <div class="pis-value">{{ progress }}%</div>
          <div class="pis-label">프로젝트 진행률</div>
        </div>
      </div>

      <div class="pis-item">
        <div class="pis-icon stone">
          <img :src="gemIcon" alt="총 스톤" />
        </div>
        <div class="pis-info">
          <div class="pis-value">{{ stoneTotal }}</div>
          <div class="pis-label">총 스톤 수</div>
        </div>
      </div>

      <div class="pis-item">
        <div class="pis-icon stone-completed">
          <img :src="gemIcon" alt="완료 스톤" />
        </div>
        <div class="pis-info">
          <div class="pis-value">{{ stoneDone }} / {{ stoneTotal }}</div>
          <div class="pis-label">완료된 스톤 수</div>
        </div>
      </div>

      <div class="pis-item">
        <div class="pis-icon task">
          <img src="@/assets/icons/home/file-document.svg" alt="태스크" />
        </div>
        <div class="pis-info">
          <div class="pis-value">{{ taskTotal }}</div>
          <div class="pis-label">총 태스크 수</div>
        </div>
      </div>

      <div class="pis-item">
        <div class="pis-icon task-completed">
          <img src="@/assets/icons/home/file-document.svg" alt="완료 태스크" />
        </div>
        <div class="pis-info">
          <div class="pis-value">{{ taskDone }} / {{ taskTotal }}</div>
          <div class="pis-label">완료된 태스크 수</div>
        </div>
      </div>
    </div>
  </Card>
  
</template>

<script>
import Card from '@/components/Card.vue';
import gemIcon from '@/assets/icons/project/gem.png';

export default {
  name: 'ProjectInfoSection',
  components: { Card },
  props: {
    progress: { type: Number, default: 0 },
    stoneTotal: { type: Number, default: 0 },
    stoneDone: { type: Number, default: 0 },
    taskTotal: { type: Number, default: 0 },
    taskDone: { type: Number, default: 0 }
  },
  data() {
    return {
      gemIcon
    };
  }
};
</script>

<style scoped>
.pis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pis-title {
  margin: 0;
  font-size: var(--card-title-size);
  font-weight: var(--card-title-weight);
  color: #1a1a1a;
}

/* 인셋 밑줄 유틸 */
.with-inset-hr {
  position: relative;
  padding-bottom: 12px;
  --hr-inset: 16px;
  --hr-color: #e9eaee;
}

@media (min-width: 1280px) {
  .with-inset-hr { --hr-inset: 20px; }
}

.with-inset-hr::after {
  content: "";
  position: absolute;
  left: var(--hr-inset);
  right: var(--hr-inset);
  bottom: 0;
  height: 1px;
  background: var(--hr-color);
  pointer-events: none;
}

.pis-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media (min-width: 1024px) {
  .pis-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1440px) {
  .pis-grid { grid-template-columns: repeat(5, 1fr); }
}

.pis-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #eee;
}

.pis-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pis-icon img { width: 26px; height: 26px; }

.pis-icon.progress { background: #fff3e0; }
.pis-icon.stone { background: #e3f2fd; }
.pis-icon.stone-completed { background: #e8f5e9; }
.pis-icon.task { background: #e3f2fd; }
.pis-icon.task-completed { background: #e8f5e9; }

.pis-info { flex: 1; }
.pis-value { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
.pis-label { font-size: 13px; color: #666; }

.progress-circle { position: relative; width: 52px; height: 52px; }
.circular-chart { width: 52px; height: 52px; transform: rotate(-90deg); }
.circle-bg { fill: none; stroke: #e0e0e0; stroke-width: 3; }
.circle { fill: none; stroke: #ffa726; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.3s; }
.progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: 600; color: #ffa726; }
</style>


