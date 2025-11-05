<template>
  <div class="content-header">
    <h1 class="main-title">{{ title }}</h1>
    <p class="sub-title">{{ subtitle }}</p>
  </div>
</template>

<script>
export default {
  name: 'SectionHeader',
  props: {
    title: {
      type: String,
      default: '마이페이지'
    },
    subtitle: {
      type: String,
      default: '내 정보를 조회/수정하세요'
    }
  },
  mounted() {
    console.log('[SectionHeader] Component mounted');
    console.log('[SectionHeader] Title:', this.title);
    console.log('[SectionHeader] Subtitle:', this.subtitle);
    console.log('[SectionHeader] Element:', this.$el);
    console.log('[SectionHeader] Title element:', this.$el?.querySelector('.main-title'));
    console.log('[SectionHeader] Subtitle element:', this.$el?.querySelector('.sub-title'));
  }
}
</script>

<style scoped>
.content-header {
  max-width: 1600px;
  margin: 0 auto;
  padding: 30px 24px 0 48px;
}

.main-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 28px;
  line-height: 33px;
  color: #1C0F0F;
  margin: 0 0 15px 0;
  text-align: left;
}

.sub-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 22px;
  color: #666666;
  margin: 0;
  text-align: left;
}
</style>

