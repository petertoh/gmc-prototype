<template>
  <article>
    <BaseNode
      :link="{ to: `?${work._type}=${work._id}` }"
      :node-type="work._type"
      >{{ work.title }}</BaseNode
    >
    <BaseDate v-if="work.dates" :date="work.dates" :link-to-year="true" />
    <template v-if="work.workForm?.length">
      <BaseNode
        v-for="form in work.workForm"
        :key="form._id"
        :link="{ to: `?workForm=${form._id}` }"
        :node-type="form._type"
        >{{ form.name }}</BaseNode
      >
    </template>
    <template v-if="work.medium?.length">
      <BaseNode
        v-for="form in work.medium"
        :key="form._id"
        :link="{ to: `?medium=${form._id}` }"
        :node-type="form._type"
        >{{ form.name }}</BaseNode
      >
    </template>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  work: any
  subPath: string
}>()
</script>
