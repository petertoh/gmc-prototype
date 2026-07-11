<script setup lang="ts">
const props = defineProps<{
  date: ProjectsNetworkQueryResult['projects'][number]['dates']
  linkToYear: boolean
}>()

const linkToYears = computed(() => {
  if (props.linkToYear && props.date?.startYear) {
    if (!props.date?.endYear) {
      return `/year/?years=${props.date.startYear.split('-')[0]}`
    } else {
      return `/year/?years=${props.date.startYear.split('-')[0]}-${props.date.endYear.split('-')[0]}`
    }
  }
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  if (props.date.dateFormat === 'year' && props.date?.startYear) {
    const startYear = props.date.startYear.split('-')[0]
    if (props.date.onGoing) {
      return `${startYear} - Present`
    }
    if (props.date.endYear) {
      return `${startYear} - ${props.date.endYear.split('-')[0]}`
    }
    return `${startYear}`
  } else if (props.date.dateFormat === 'dateTime' && props.date?.startTime) {
    if (props.date.onGoing) {
      return `${props.date.startTime} - Present`
    }
    if (props.date.endTime) {
      return `${props.date.startTime} - ${props.date.endTime}`
    }
    return `${props.date.startTime}`
  }

  return ''
})
</script>

<template>
  <BaseNode
    v-if="linkToYears"
    :link="{ to: `?years=${linkToYears}` }"
    node-type="year"
  >
    <span>{{ formattedDate }}</span>
  </BaseNode>
  <span v-else>{{ formattedDate }}</span>
</template>
