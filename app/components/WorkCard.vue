<template>
  <article class="work-card" :class="{ inline: inline }">
    <BaseFigure v-if="!inline && work.media?.length" :image="work.media?.[0]" />
    <h3 :class="{ 'node-selected': $route.query[work._type] === work.slug }">
      <BaseNode
        :link="{
          to: `?${work._type === 'relatedProject' ? 'related' : work._type}=${work.slug}`,
        }"
        :node-type="work._type"
        >{{ work.title }}</BaseNode
      >
    </h3>

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

    <div v-if="work.artist?.length" class="work-card__artist">
      <BaseNode
        v-for="artist in work.artist"
        :key="artist._id"
        :link="{ to: `?artist=${artist.slug}` }"
        node-type="artist"
        >{{ artist.name }}</BaseNode
      >
    </div>

    <div v-if="work._type === 'event'">
      <BaseNode
        :link="{ to: `?eventType=${work.eventType}` }"
        node-type="eventType"
        >{{ work.eventType }}</BaseNode
      >
    </div>

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
  align-items: center;
  flex-wrap: wrap;
}

.work-card__description {
  max-height: 10rem;
  overflow: hidden;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2rem;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 1)
    );
  }
}

.work-card__artist {
  opacity: 0.6;
}

h3 {
  margin: 0;
}
</style>
