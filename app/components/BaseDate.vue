<script setup lang="ts">
const props = defineProps<{
  date: ProjectsNetworkQueryResult['projects'][number]['dates']
  linkToYear: boolean
}>()

const linkToYears = computed(() => {
  if (props.linkToYear && props.date?.startYear) {
    if (!props.date?.endYear) {
      return { query: { year: props.date.startYear.split('-')[0] } }
    } else {
      return {
        query: {
          year: `${props.date.startYear.split('-')[0]}-${props.date.endYear.split('-')[0]}`,
        },
      }
    }
  } else if (props.date?.dateFormat === 'dateTime' && props.date?.startTime) {
    return {
      query: { year: props.date.startTime.split('T')[0]?.split('-')[0] },
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
    const startTimeFormatted = new Date(props.date.startTime).toLocaleString(
      'en-US',
      { dateStyle: 'medium', timeStyle: 'short' },
    )
    if (props.date.onGoing) {
      return `${startTimeFormatted} - Present`
    }
    if (props.date.endTime) {
      return `${startTimeFormatted} - ${new Date(
        props.date.endTime,
      ).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
    }
    return `${startTimeFormatted}`
  }

  return ''
})
</script>

<template>
  <BaseNode v-if="linkToYears" :link="{ to: linkToYears }" node-type="year">
    <span>{{ formattedDate }}</span>
  </BaseNode>
  <span v-else>{{ formattedDate }}</span>
</template>
