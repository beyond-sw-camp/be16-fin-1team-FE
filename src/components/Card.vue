<template>
  <div 
    :class="['card-wrapper', { 'card-elevated': elevated, 'card-h-full': hFull }]"
    :style="wrapperStyle"
  >
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body" :style="bodyStyle">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    elevated: {
      type: Boolean,
      default: true
    },
    hFull: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    wrapperStyle() {
      const styles = {};
      if (this.hFull) {
        styles.height = '100%';
        styles.minHeight = '0';
      }
      return styles;
    },
    bodyStyle() {
      const styles = {};
      if (this.$slots.header) {
        styles.flex = '1';
        styles.overflowY = 'auto';
        styles.minHeight = '0';
      }
      return styles;
    }
  }
};
</script>

<style>
/* 카드 제목 크기 통일을 위한 CSS 변수 */
:root {
  --card-title-size: 18px;
  --card-title-weight: 700;
}
</style>

<style scoped>
.card-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
  min-height: 0;
}

.card-wrapper:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-elevated {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-h-full {
  height: 100%;
}

.card-header {
  flex-shrink: 0;
  border-bottom: 0;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-body {
  padding: 10px 10px 12px 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.card-body::-webkit-scrollbar {
  width: 6px;
}

.card-body::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.card-body::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 3px;
}

.card-body::-webkit-scrollbar-thumb:hover {
  background: #B0B0B0;
}
</style>
