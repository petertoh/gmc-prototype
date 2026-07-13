<template>
  <figure class="figure">
    <div
      class="figure__image-container"
      :style="{
        '--image-aspect-ratio': aspectRatio,
      }"
    >
      <SanityImage
        v-if="image"
        :asset-id="image?.asset?._id"
        w="600"
        auto="format"
      />
    </div>
    <figcaption v-if="image?.caption" class="figure__caption t-caption">
      <BaseBlocks :blocks="image?.caption" />
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
const props = defineProps<{
  image: ProjectsNetworkQueryResult['categories'][number]['image']
}>()

const aspectRatio = computed(() => {
  const width = props.image?.asset?.metadata?.dimensions?.width
  const height = props.image?.asset?.metadata?.dimensions?.height
  return width && height ? width / height : undefined
})
</script>

<style scoped>
.figure {
  display: flex;
  flex-direction: column;
  margin: 0 0 1rem;
  width: 100%;
  img {
    width: 100%;
    height: auto;
  }
}
.figure__image-container {
  width: 100%;
  height: auto;
  aspect-ratio: var(--image-aspect-ratio);
  position: relative;
  &:after {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    border: 1px solid black;
    z-index: 1;
    animation: fade-reveal 0.1s ease 0.2s forwards;
  }
}

.figure__caption {
  opacity: 0.6;
  margin-top: 0.5em;
}
</style>
