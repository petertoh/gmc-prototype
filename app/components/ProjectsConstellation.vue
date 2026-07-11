<script setup lang="ts">
const data = inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')

const getWorkYears = (w) => {
  if (!w.dates) return []
  if (w.dates.dateFormat === 'year' && w.dates.startYear) {
    const startYear = w.dates.startYear.split('-')[0]
    if (w.dates.onGoing) {
      return [startYear]
    }
    if (w.dates.endYear) {
      const endYear = w.dates.endYear.split('-')[0]
      if (parseInt(endYear) - parseInt(startYear) > 1) {
        const yearsBetween = Array.from(
          { length: parseInt(endYear) - parseInt(startYear) - 1 },
          (_, i) => (parseInt(startYear) + i + 1).toString(),
        )
        return [startYear, ...yearsBetween, endYear]
      }
      return [startYear, endYear]
    }
    return [startYear]
  }
  if (w.dates.dateFormat === 'dateTime' && w.dates.startTime) {
    const startTime = new Date(w.dates.startTime).getFullYear()
    if (w.dates.onGoing) {
      return [startTime]
    }
    if (w.dates.endTime) {
      const endYear = new Date(w.dates.endTime).getFullYear()
      if (endYear - startTime > 1) {
        const yearsBetween = Array.from(
          { length: endYear - startTime - 1 },
          (_, i) => startTime + i + 1,
        )
        return [startTime, ...yearsBetween, endYear]
      }
      return [startTime, endYear]
    }
    return [startTime]
  }
  return []
}

const works = computed(() => {
  const allWorks: any[] = []
  data?.value?.projects?.forEach((project) => {
    if (project.works?.length) {
      project.works.forEach((work) => {
        allWorks.push(work)
      })
    }
  })
  return allWorks
})

const relatedWorks = computed(() => {
  const allWorks: any[] = []
  data?.value?.projects?.forEach((project) => {
    if (project.related?.length) {
      project.related.forEach((relatedWork) => {
        allWorks.push(relatedWork)
      })
    }
    if (project.works?.length) {
      project.works.forEach((work) => {
        if (work.related?.length) {
          work.related.forEach((relatedWork) => {
            allWorks.push(relatedWork)
          })
        }
      })
    }
  })
  return allWorks
})

const years = computed(() => {
  const allYears: number[] = []
  data?.value?.projects?.forEach((project) => {
    if (project.dates) {
      if (!allYears.includes(getWorkYears(project)[0])) {
        allYears.push(...getWorkYears(project))
      }
      if (project.related?.length) {
        project.related.forEach((relatedWork) => {
          if (!allYears.includes(getWorkYears(relatedWork)[0])) {
            allYears.push(...getWorkYears(relatedWork))
          }
        })
      }
      if (project.works?.length) {
        project.works.forEach((work) => {
          if (!allYears.includes(getWorkYears(work)[0])) {
            allYears.push(...getWorkYears(work))
          }
          if (work.related?.length) {
            work.related.forEach((relatedWork) => {
              if (!allYears.includes(getWorkYears(relatedWork)[0])) {
                allYears.push(...getWorkYears(relatedWork))
              }
            })
          }
        })
      }
    }
  })
  return Array.from(new Set(allYears)).sort((a, b) => a - b)
})

const workForms = computed(() => {
  const allWorkForms: any[] = []
  data?.value?.projects?.forEach((project) => {
    if (project.workForm?.length) {
      project.workForm.forEach((form) => {
        if (!allWorkForms.some((f) => f._id === form._id)) {
          allWorkForms.push(form)
        }
      })
    }
    if (project.works?.length) {
      project.works.forEach((work) => {
        if (work.workForm?.length) {
          work.workForm.forEach((form) => {
            if (!allWorkForms.some((f) => f._id === form._id)) {
              allWorkForms.push(form)
            }
          })
        }
      })
    }
  })
  return allWorkForms
})

onMounted(() => {
  setTimeout(() => {
    const container = document.querySelector('.projects-constellation')
    const containerDimensions = { width: 0, height: 0 }
    if (container) {
      const { width, height } = container.getBoundingClientRect()
      containerDimensions.width = width
      containerDimensions.height = height
    }
    const nodes = document.querySelectorAll(
      '.projects-constellation__node-container',
    )
    if (!nodes.length) {
      console.log('No nodes found')
      return
    }
    const itemsToPlace = Array.from(nodes)?.map((node) => {
      const { width, height } = node.getBoundingClientRect()
      return { width, height, node }
    })
    generatePositions(containerDimensions, itemsToPlace)
  }, 100)
})

/**
 * Generates non-overlapping random positions for a set of items within a container.
 * @param {Object} container - Dimensions of the parent area { width, height }.
 * @param {Array} items - List of items with dimensions [{ width, height }, ...].
 * @param {number} maxAttempts - Safety limit to prevent infinite loops.
 * @returns {Array} Array of objects containing positioned items { x, y, width, height }.
 */
function generatePositions(container, items, maxAttempts = 500) {
  console.log('Generating positions for items:', { container, items })
  const placedItems = []

  for (const item of items) {
    let placed = false
    let attempts = 0

    while (!placed && attempts < maxAttempts) {
      attempts++

      // 1. Generate random coordinates within the boundary constraints
      const totalWidth = container.width - item.width
      const totalHeight = container.height - item.height
      const randomX = Math.floor(
        Math.random() * totalWidth - totalWidth / 2 - item.width / 2,
      )
      const randomY = Math.floor(
        Math.random() * totalHeight - totalHeight / 2 - item.height / 2,
      )

      const newItem = {
        x: randomX,
        y: randomY,
        width: item.width,
        height: item.height,
      }

      // 2. Check for collisions against already placed items
      const hasOverlap = placedItems.some((existingItem) =>
        checkOverlap(newItem, existingItem),
      )

      // 3. Keep if safe, otherwise retry
      if (!hasOverlap) {
        placedItems.push(newItem)

        if (item.node) {
          item.node.style.transform = `translateX(${newItem.x}px) translateY(${newItem.y}px)`
        }

        placed = true
      }
    }

    if (!placed) {
      console.warn(
        `Could not find a non-overlapping spot for item after ${maxAttempts} attempts.`,
      )
    }
  }

  return placedItems
}

/**
 * Checks if two rectangular items overlap.
 */
function checkOverlap(rect1, rect2) {
  return !(
    rect1.x + rect1.width <= rect2.x || // rect1 is completely to the left
    rect1.x >= rect2.x + rect2.width || // rect1 is completely to the right
    rect1.y + rect1.height <= rect2.y || // rect1 is completely above
    rect1.y >= rect2.y + rect2.height // rect1 is completely below
  )
}

const activeCategories = ref<string[]>([])
const activeProjects = ref<string[]>([])
const activeWorks = ref<string[]>([])
const activeRelatedWorks = ref<string[]>([])
const activeYears = ref<number[]>([])
const activeWorkForms = ref<string[]>([])
// const route = useRoute()
watch(() => useRoute().query, filterActiveItems, { immediate: true })

function filterActiveItems(newQuery) {
  console.log('New query:', newQuery)
  if (typeof newQuery.category === 'string') {
    activeCategories.value = [newQuery.category]

    const projects =
      data?.value?.projects
        ?.filter((project) =>
          project.category?.some((cat) => cat.slug === newQuery.category),
        )
        .map((project) => project.slug) || []
    activeProjects.value = projects

    const aw =
      projects
        .map((projectSlug) => {
          const project = data?.value?.projects?.find(
            (p) => p.slug === projectSlug,
          )
          return project?.works?.map((work) => work.slug) || []
        })
        .flat() || []
    activeWorks.value = aw

    const rw =
      projects
        .map((projectSlug) => {
          const project = data?.value?.projects?.find(
            (p) => p.slug === projectSlug,
          )
          return [
            ...(project?.related?.map((related) => related.slug) || []),
            ...(project?.works?.flatMap(
              (work) => work.related?.map((related) => related.slug) || [],
            ) || []),
          ]
        })
        .flat() || []
    activeRelatedWorks.value = rw

    activeYears.value = [
      ...(data?.value?.projects
        ?.filter((p) => projects.includes(p.slug))
        ?.map((project) => getWorkYears(project) || [])
        .flat() || []),
      ...(works?.value
        ?.filter((w) => aw.includes(w.slug))
        .map((work) => getWorkYears(work) || [])
        .flat() || []),
      ...(relatedWorks?.value
        ?.filter((w) => rw.includes(w.slug))
        .map((work) => getWorkYears(work) || [])
        .flat() || []),
    ]

    activeWorkForms.value = [
      ...(data?.value?.projects
        ?.filter((p) => projects.includes(p.slug))
        ?.map((project) => project.workForm || [])
        .flat() || []),
      ...(works?.value
        ?.filter((w) => aw.includes(w.slug))
        ?.map((work) => work.workForm || [])
        .flat() || []),
      ...(relatedWorks?.value
        ?.filter((w) => rw.includes(w.slug))
        ?.map((work) => work.workForm || [])
        .flat() || []),
    ].map((form) => form.slug)
  } else if (typeof newQuery.project === 'string') {
    const project = data?.value?.projects?.find(
      (p) => p.slug === newQuery.project,
    )
    if (!project) return
    activeProjects.value = [newQuery.project]
    activeCategories.value = project.category?.map((cat) => cat.slug) || []
    activeWorks.value = project.works?.map((work) => work.slug) || []
    const arw = [
      ...(project.related?.map((work) => work.slug) || []),
      ...(project.works?.flatMap(
        (work) => work.related?.map((related) => related.slug) || [],
      ) || []),
    ]
    activeRelatedWorks.value = arw || []
    activeYears.value = [
      ...(getWorkYears(project) || []),
      ...(project.works?.flatMap((work) => getWorkYears(work) || []) || []),
      ...(arw?.flatMap((slug) => {
        const work = relatedWorks?.value?.find((w) => w.slug === slug)
        return getWorkYears(work) || []
      }) || []),
    ]
    activeWorkForms.value = [
      ...(project.workForm?.map((form) => form.slug) || []),
      ...(project.works?.flatMap(
        (work) => work.workForm?.map((form) => form.slug) || [],
      ) || []),
      ...(arw?.flatMap((slug) => {
        const work = relatedWorks?.value?.find((w) => w.slug === slug)
        return work?.workForm?.map((form) => form.slug) || []
      }) || []),
    ]
  } else if (typeof newQuery.work === 'string') {
    const work = works?.value?.find((w) => w.slug === newQuery.work)
    if (!work) return
    const parentProject = data?.value?.projects?.find((p) =>
      p.works?.some((w) => w.slug === work.slug),
    )
    if (!parentProject) return
    activeCategories.value =
      parentProject.category?.map((cat) => cat.slug) || []
    activeProjects.value = parentProject ? [parentProject.slug] : []
    activeWorks.value = [newQuery.work]
    activeRelatedWorks.value = work.related?.map((w) => w.slug) || []
    activeYears.value = [
      ...(getWorkYears(work) || []),
      ...(work.related?.flatMap((w) => getWorkYears(w) || []) || []),
    ]
    activeWorkForms.value = [
      ...(work.workForm?.map((form) => form.slug) || []),
      ...(work.related?.flatMap(
        (w) => w.workForm?.map((form) => form.slug) || [],
      ) || []),
    ]
  } else if (typeof newQuery.related === 'string') {
    const relatedWork = relatedWorks?.value?.find(
      (w) => w.slug === newQuery.related,
    )
    if (!relatedWork) return
    activeRelatedWorks.value = [newQuery.related]
    const parentWorks = works?.value?.filter((w) =>
      w.related?.some((rw) => rw.slug === relatedWork.slug),
    )
    let parentProjects = data?.value?.projects?.filter((p) =>
      p.related?.some((w) => w.slug === relatedWork.slug),
    )
    if (parentWorks?.length) {
      parentProjects = data?.value?.projects?.filter((p) =>
        p.works?.some((w) => parentWorks.some((pw) => pw.slug === w.slug)),
      )
    }
    if (!parentProjects?.length) return
    activeCategories.value =
      parentProjects.flatMap((p) => p.category?.map((cat) => cat.slug) || []) ||
      []
    activeProjects.value = parentProjects.map((p) => p.slug) || []
    activeWorks.value = parentWorks.map((w) => w.slug) || []
    activeYears.value = getWorkYears(relatedWork) || []
    activeWorkForms.value = relatedWork.workForm?.map((form) => form.slug) || []
  } else if (typeof newQuery.year === 'string') {
    const year = newQuery.year
    if (!year) return
    activeYears.value = [year]
    const rw =
      relatedWorks?.value
        ?.filter((w) => getWorkYears(w)?.includes(year))
        ?.map((w) => w.slug) || []
    activeRelatedWorks.value = rw
    const aw =
      works?.value
        ?.filter(
          (w) =>
            getWorkYears(w)?.includes(year) ||
            w.related?.some((r) => rw.includes(r.slug)),
        )
        ?.map((w) => w.slug) || []
    activeWorks.value = aw
    const ap =
      data?.value?.projects
        ?.filter(
          (p) =>
            getWorkYears(p)?.includes(year) ||
            p.works?.some((w) => aw.includes(w.slug)),
        )
        ?.map((p) => p.slug) || []
    activeProjects.value = ap
    activeCategories.value =
      data?.value?.categories
        ?.filter((c) => ap.includes(c.slug))
        ?.map((c) => c.slug) || []
    activeWorkForms.value = [
      ...(rw
        ?.map((slug) => {
          const work = relatedWorks?.value?.find((w) => w.slug === slug)
          return work?.workForm?.map((form) => form.slug) || []
        })
        .flat() || []),
      ...(aw
        ?.map((slug) => {
          const work = works?.value?.find((w) => w.slug === slug)
          return work?.workForm?.map((form) => form.slug) || []
        })
        .flat() || []),
      ...(ap
        ?.map((slug) => {
          const project = data?.value?.projects?.find((p) => p.slug === slug)
          return (
            project?.works?.flatMap(
              (w) => w.workForm?.map((form) => form.slug) || [],
            ) || []
          )
        })
        .flat() || []),
    ]
  } else if (typeof newQuery.workForm === 'string') {
    const workForm = newQuery.workForm
    if (!workForm) return
    activeWorkForms.value = [workForm]
    const rw =
      relatedWorks?.value
        ?.filter((w) => w.workForm?.some((form) => form.slug === workForm))
        ?.map((w) => w.slug) || []
    activeRelatedWorks.value = rw
    const aw =
      works?.value
        ?.filter(
          (w) =>
            w.workForm?.some((form) => form.slug === workForm) ||
            w.related?.some((w) => rw.includes(w.slug)),
        )
        ?.map((w) => w.slug) || []
    activeWorks.value = aw
    const ap =
      data?.value?.projects
        ?.filter(
          (p) =>
            p.workForm?.some((form) => form.slug === workForm) ||
            p.works?.some((w) => aw.includes(w.slug)),
        )
        ?.map((p) => p.slug) || []
    activeProjects.value = ap
    activeCategories.value =
      data?.value?.categories
        ?.filter((c) =>
          data?.value?.projects?.some(
            (p) =>
              ap.includes(p.slug) &&
              p.category?.some((cat) => cat.slug === c.slug),
          ),
        )
        ?.map((c) => c.slug) || []
  } else {
    activeCategories.value = []
    activeProjects.value = []
    activeWorks.value = []
    activeRelatedWorks.value = []
    activeYears.value = []
    activeWorkForms.value = []
  }
}
</script>

<template>
  <div class="projects-constellation">
    <nav v-if="data?.categories?.length">
      <div
        v-for="(category, index) in data.categories"
        :key="category.slug"
        class="projects-constellation__node-container"
        :class="{
          'node-active':
            activeCategories.includes(category.slug) ||
            $route.params.categorySlug === category.slug,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <BaseNode
          :link="{ to: { query: { category: category.slug } } }"
          :node-type="category._type"
          >{{ category.name }}</BaseNode
        >
      </div>
    </nav>
    <nav v-if="data?.projects?.length">
      <div
        v-for="(project, index) in data.projects"
        :key="project._id"
        class="projects-constellation__node-container"
        :class="{
          'node-active': activeProjects.includes(project.slug),
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <BaseNode
          :link="{ to: `?project=${project.slug}` }"
          :node-type="project._type"
          >{{ project.title }}</BaseNode
        >
      </div>
    </nav>
    <nav v-if="works?.length">
      <div
        v-for="(work, index) in works"
        :key="work._id"
        class="projects-constellation__node-container"
        :class="{
          'node-active': activeWorks.includes(work.slug),
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <BaseNode
          :link="{ to: `?work=${work.slug}` }"
          :node-type="work._type"
          >{{ work.title }}</BaseNode
        >
      </div>
    </nav>
    <nav v-if="relatedWorks?.length">
      <div
        v-for="(work, index) in relatedWorks"
        :key="work._id"
        class="projects-constellation__node-container"
        :class="{
          'node-active': activeRelatedWorks.includes(work.slug),
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <BaseNode
          :link="{ to: `?related=${work.slug}` }"
          :node-type="work._type"
          >{{ work.title }}</BaseNode
        >
      </div>
    </nav>
    <nav v-if="years?.length">
      <div
        v-for="(year, index) in years"
        :key="year"
        class="projects-constellation__node-container"
        :class="{
          'node-active': activeYears.includes(year),
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <BaseNode :link="{ to: `?year=${year}` }" :node-type="'year'">{{
          year
        }}</BaseNode>
      </div>
    </nav>
    <nav v-if="workForms?.length">
      <div
        v-for="(form, index) in workForms"
        :key="form._id"
        class="projects-constellation__node-container"
        :class="{
          'node-active': activeWorkForms.includes(form.slug),
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <BaseNode
          :link="{ to: `?workForm=${form.slug}` }"
          :node-type="form._type"
          >{{ form.name }}</BaseNode
        >
      </div>
    </nav>
  </div>
</template>

<style scoped>
.projects-constellation {
  display: flex;
  position: relative;
  width: calc(100% - 6rem);
  margin: 0 auto;
  height: calc(100dvh - 6rem);
}

.projects-constellation__node-container {
  --translate-x: -50%;
  --translate-y: -50%;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(var(--translate-x), var(--translate-y));
  transition: transform 0.25s ease-in-out;

  .projects-constellation:has(.node-active) &:not(.node-active) {
    visibility: hidden;
  }
}
</style>
