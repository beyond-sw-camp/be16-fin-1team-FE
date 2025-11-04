<template>
  <div class="section-card">
    <div class="section-card-header" v-if="title || subtitle">
      <h3 v-if="title" class="section-card-title">{{ title }}</h3>
      <p v-if="subtitle" class="section-card-subtitle">{{ subtitle }}</p>
    </div>
    <div class="section-card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SectionCard',
  props: {
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.section-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: 20px 24px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.section-card-header {
  margin-bottom: var(--gap-m);
  padding-bottom: var(--gap-m);
  border-bottom: 1px solid var(--divider);
}

.section-card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 var(--gap-xxs) 0;
}

.section-card-subtitle {
  font-size: 14px;
  color: var(--text-weak);
  margin: 0;
}

.section-card-content {
  color: var(--text);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
