<template>
  <div class="stone-tree-node">
    <div 
      class="stone-node-item"
      :style="{ paddingLeft: `${level * 24 + 8}px` }"
      @click="toggleExpanded"
    >
      <span 
        v-if="hasChildren" 
        class="expand-icon"
        :class="{ expanded: isExpanded }"
      >
        ▶
      </span>
      <span v-else class="expand-icon-placeholder"></span>
      <span 
        class="stone-name"
        :title="`${stone.stoneName} (${stone.stoneId})`"
        @click.stop="handleStoneClick"
      >
        {{ stone.stoneName }}
      </span>
      <span class="stone-id">{{ stone.stoneId }}</span>
    </div>
    
    <div v-if="hasChildren && isExpanded" class="stone-node-children">
      <StoneTreeNode
        v-for="child in stone.childStone"
        :key="child.stoneId"
        :stone="child"
        :level="level + 1"
        @view-stone="$emit('view-stone', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "StoneTreeNode",
  props: {
    stone: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      default: 0
    }
  },
  
  data() {
    return {
      isExpanded: false
    };
  },
  
  computed: {
    hasChildren() {
      return this.stone.childStone && this.stone.childStone.length > 0;
    }
  },
  
  methods: {
    toggleExpanded() {
      if (this.hasChildren) {
        this.isExpanded = !this.isExpanded;
      }
    },
    
    handleStoneClick() {
      this.$emit('view-stone', this.stone);
    }
  }
};
</script>

<style scoped>
.stone-tree-node {
  user-select: none;
}

.stone-node-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  gap: 8px;
}

.stone-node-item:hover {
  background-color: #f5f5f5;
}

.expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #666;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.expand-icon-placeholder {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.stone-name {
  flex: 1;
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stone-name:hover {
  color: #1976d2;
  text-decoration: underline;
}

.stone-id {
  font-size: 12px;
  color: #999;
  font-family: monospace;
  flex-shrink: 0;
}

.stone-node-children {
  margin-left: 0;
}

</style>

