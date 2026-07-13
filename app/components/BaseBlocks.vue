<template>
  <div class="blocks">
    <SanityContent :value="blocks" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  blocks: any
}>()
</script>

<style>
.blocks {
  p {
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
