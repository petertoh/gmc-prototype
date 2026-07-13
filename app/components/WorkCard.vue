<template>
  <article class="work-card" :class="{ inline: inline }">
    <div v-if="!inline && work.media?.length" class="work-card__image">
      <SanityImage
        v-if="work.media?.length"
        :asset-id="work.media?.[0]?.asset?._id"
        w="600"
        auto="format"
      />
    </div>
    <h3 :class="{ 'node-selected': $route.query[work._type] === work.slug }">
      <BaseNode
        :link="{ to: `?${work._type}=${work.slug}` }"
        :node-type="work._type"
        >{{ work.title }}</BaseNode
      >
    </h3>
    <div v-if="!inline && work.artist?.length" class="work-card__artist">
      <BaseNode
        v-for="artist in work.artist"
        :key="artist._id"
        :link="{ to: `?artist=${artist.slug}` }"
        node-type="artist"
        >{{ artist.name }}</BaseNode
      >
    </div>
    <BaseDate v-if="work.dates" :date="work.dates" :link-to-year="true" />
    <template v-if="work.workForm?.length">
      <BaseNode
        v-for="form in work.workForm"
        :key="form._id"
        :link="{ to: `?workForm=${form.slug}` }"
        :node-type="form._type"
        >{{ form.name }}</BaseNode
      >
    </template>
    <template v-if="work.medium?.length">
      <BaseNode
        v-for="form in work.medium"
        :key="form._id"
        :link="{ to: `?medium=${form.slug}` }"
        :node-type="form._type"
        >{{ form.name }}</BaseNode
      >
    </template>

    <div v-if="!inline && work.description" class="work-card__description">
      <SanityContent :value="work.description" />
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  work: any
  inline?: boolean
}>()
</script>

<style scoped>
.work-card.inline {
  display: inline-flex;
}
.work-card__image {
  margin-bottom: 1rem;
  width: 100%;
  img {
    width: 100%;
    height: auto;
  }
}
.work-card__description {
}
h3 {
  margin: 0;
}
</style>
