<template>
  <div class="permission-list">
    <div class="permission-list-grid">
      <PermissionItem
        v-for="(permission, key) in permissionItems"
        :key="key"
        :label="permission.label"
        :subtext="permission.subtext"
        :enabled="permission.enabled"
      />
    </div>
  </div>
</template>

<script>
import PermissionItem from './PermissionItem.vue'

export default {
  name: 'PermissionList',
  components: {
    PermissionItem
  },
  props: {
    items: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    permissionItems() {
      const labels = {
        projectCreate: { label: '프로젝트 생성', subtext: '새 프로젝트를 생성할 수 있습니다' },
        stoneCreate: { label: '스톤 생성', subtext: '새 스톤을 생성할 수 있습니다' },
        projectFileView: { label: '프로젝트 파일 조회', subtext: '프로젝트 파일을 조회할 수 있습니다' },
        stoneFileView: { label: '스톤 파일 조회', subtext: '스톤 파일을 조회할 수 있습니다' },
        workspaceFileView: { label: '워크스페이스 파일 조회', subtext: '워크스페이스 파일을 조회할 수 있습니다' }
      }
      
      return Object.keys(labels).map(key => ({
        ...labels[key],
        enabled: this.items[key] || false
      }))
    }
  }
}
</script>

<style scoped>
.permission-list {
  display: flex;
  flex-direction: column;
  gap: var(--gap-l);
  flex: 1;
}

.permission-list-grid {
  display: flex;
  flex-direction: column;
  gap: var(--gap-l);
  flex: 1;
}
</style>
