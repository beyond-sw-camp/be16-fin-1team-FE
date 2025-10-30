<template>
  <div class="schedule-layout">
    <!-- 상단 고정 탭 -->
    <div class="schedule-tabs">
      <button
        :class="['tab', active === 'home' ? 'active' : '']"
        @click="$router.push('/schedule/home')"
      >
        일정 홈
      </button>
      <button
        :class="['tab', active === 'project' ? 'active' : '']"
        @click="$router.push('/schedule/project')"
      >
        프로젝트 캘린더
      </button>
      <button
        :class="['tab', active === 'shared' ? 'active' : '']"
        @click="$router.push('/schedule/shared')"
      >
        공유 캘린더
      </button>
      <!-- 밑줄 애니메이션 라인 -->
      <div class="underline" :style="underlineStyle"></div>
    </div>

    <!-- 하위 콘텐츠 -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const active = ref("home");

// 라우트에 따라 활성 탭 결정
watch(
  () => route.path,
  (path) => {
    if (path.includes("/schedule/project")) active.value = "project";
    else if (path.includes("/schedule/shared")) active.value = "shared";
    else active.value = "home";
  },
  { immediate: true }
);

// underline 애니메이션용 스타일 계산
const underlineStyle = computed(() => {
  const map = {
    home: "0px",
    project: "120px",
    shared: "280px",
  };
  return {
    transform: `translateX(${map[active.value] || 0})`,
  };
});
</script>

<style scoped>
.schedule-layout {
  width: 100%;
}

/* 탭 헤더 컨테이너 */
.schedule-tabs {
  position: relative;
  display: flex;
  align-items: center;
  gap: 36px;
  border-bottom: 2px solid #eaeaea;
  background: #fafafa;
  padding: 16px 40px 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); /* ✅ 얇은 그림자 */
  z-index: 10;
}

/* 기본 탭 스타일 */
.tab {
  position: relative;
  border: none;
  background: none;
  color: #888;
  font-weight: 600;
  font-size: 15px;
  padding-bottom: 8px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.25s ease;
}

/* 활성 탭 */
.tab.active {
  color: #000;
  font-weight: 700;
}

/* 밑줄 애니메이션 */
.underline {
  position: absolute;
  bottom: 0;
  left: 40px;
  width: 100px; /* 탭 밑줄 길이 */
  height: 2px;
  background-color: #f5c518;
  border-radius: 4px;
  transition: transform 0.3s ease;
}
</style>
