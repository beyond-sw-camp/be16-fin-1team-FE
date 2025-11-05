
<template>
  <div class="video-stream">
    <video ref="video" autoplay playsinline></video>
  </div>
</template>

<script>
export default {
  name: 'VideoStream',
  props: { streamManager: Object },
  mounted() { this.attach(this.streamManager); },
  beforeUnmount() { this.detach(this.streamManager); },
  watch: {
    streamManager(newSm, oldSm) {
      if (oldSm) this.detach(oldSm);
      if (newSm) this.attach(newSm);
    }
  },
  methods: {
    attach(sm) {
      if (!sm || !this.$refs.video) return;
      // ✅ 이미 붙어있으면 중복 방지
      const already = (sm.videos || []).some(v => v.video === this.$refs.video);
      if (!already) sm.addVideoElement(this.$refs.video);
      // console.log('New video element associated to ', sm);
    },
    detach(sm) {
      try {
        if (sm && this.$refs.video) sm.removeVideoElement(this.$refs.video);
      } catch (e) { /* no-op */ }
    }
  }
}
</script>

<style scoped>
.video-stream {
  width: 100%;
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: black;
  display: block;
}
</style>
