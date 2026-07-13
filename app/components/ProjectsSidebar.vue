<script setup lang="ts">
const data = inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')
if (!data) {
  throw new Error('projectsNetwork not provided')
}

// top level items
const currentCategory = computed(() => {
  return data?.value?.categories.find(
    (category) => category.slug === useRoute().query.category,
  )
})
const currentProject = computed(() => {
  return data?.value?.projects.find(
    (project) => project.slug === useRoute().query.project,
  )
})
const currentWork = computed(() => {
  return data?.value?.projects
    .filter((project) =>
      project.works?.some((work) => work.slug === useRoute().query.work),
    )
    .flatMap((project) => project.works ?? [])
    .find((work) => work.slug === useRoute().query.work)
})
const currentWorkForm = computed(() => {
  // get any work form that matches the current query from any project, work, or related in the network
  return data?.value?.projects
    .filter(
      (project) =>
        project.workForm?.some(
          (form) => form.slug === useRoute().query.workForm,
        ) ||
        project.works?.some(
          (work) =>
            work.workForm?.some(
              (form) => form.slug === useRoute().query.workForm,
            ) ||
            work.related?.some((related) =>
              related.workForm?.some(
                (form) => form.slug === useRoute().query.workForm,
              ),
            ),
        ) ||
        project.related?.some((related) =>
          related.workForm?.some(
            (form) => form.slug === useRoute().query.workForm,
          ),
        ),
    )
    .flatMap((project) => {
      // get all work forms from the project, its works, and its related works
      return [
        ...(project.workForm ?? []),
        ...(project.works?.flatMap((work) => work.workForm ?? []) ?? []),
        ...(project.works?.flatMap(
          (work) =>
            work.related?.flatMap((related) => related.workForm ?? []) ?? [],
        ) ?? []),
        ...(project.related?.flatMap((related) => related.workForm ?? []) ??
          []),
      ]
    })
    .find((form) => form.slug === useRoute().query.workForm)
})
const currentYear = computed(() => {
  return useRoute().query.year
})
const currentRelatedProject = computed(() => {
  return data?.value?.projects
    .filter(
      (project) =>
        project.works?.some((work) =>
          work.related?.some(
            (related) =>
              related.slug === useRoute().query.related &&
              related._type === 'relatedProject',
          ),
        ) ||
        project.related?.some(
          (related) =>
            related.slug === useRoute().query.related &&
            related._type === 'relatedProject',
        ),
    )
    .flatMap((project) => [
      ...(project.related ?? []),
      ...(project.works?.flatMap((work) => work.related ?? []) ?? []),
    ])
    .find(
      (related) =>
        related.slug === useRoute().query.related &&
        related._type === 'relatedProject',
    )
})
const currentEvent = computed(() => {
  return data?.value?.projects
    .filter(
      (project) =>
        project.works?.some((work) =>
          work.related?.some(
            (related) =>
              related.slug === useRoute().query.event &&
              related._type === 'event',
          ),
        ) ||
        project.related?.some(
          (related) =>
            related.slug === useRoute().query.event &&
            related._type === 'event',
        ),
    )
    .flatMap((project) => [
      ...(project.related ?? []),
      ...(project.works?.flatMap((work) => work.related ?? []) ?? []),
    ])
    .find(
      (related) =>
        related.slug === useRoute().query.event && related._type === 'event',
    )
})

// derived items based on the current selection
const currentProjects = computed(() => {
  if (currentCategory?.value) {
    return data?.value?.projects.filter((project) =>
      project.category?.some(
        (category) => category.slug === currentCategory?.value?.slug,
      ),
    )
  }
  if (currentWorkForm?.value) {
    return data?.value?.projects.filter((project) =>
      project.workForm?.some(
        (form) => form.slug === currentWorkForm?.value?.slug,
      ),
    )
  }
  if (currentYear?.value) {
    return data?.value?.projects.filter((project) => {
      let allYears = [
        ...getWorkYears(project.dates),
        ...(project.works?.flatMap((work) => getWorkYears(work.dates)) || []),
        ...(project.related?.flatMap((related) =>
          getWorkYears(related.dates),
        ) || []),
      ]
      return allYears.includes(parseInt(currentYear.value as string))
    })
  }
  return []
})
const currentWorks = computed(() => {
  if (currentProject?.value) {
    return currentProject.value.works
  }
  if (currentWorkForm?.value) {
    return data?.value?.projects
      .filter((project) =>
        project.works?.some((work) =>
          work.workForm?.some(
            (form) => form.slug === currentWorkForm?.value?.slug,
          ),
        ),
      )
      .flatMap((project) => project.works ?? [])
  }
  if (currentYear?.value) {
    return data?.value?.projects
      .filter((project) => {
        let allYears =
          project.works?.flatMap((work) => getWorkYears(work.dates)) || []
        return allYears.includes(parseInt(currentYear.value as string))
      })
      .flatMap(
        (project) =>
          project.works?.filter((work) => {
            let allYears = getWorkYears(work.dates)
            return allYears.includes(parseInt(currentYear.value as string))
          }) ?? [],
      )
  }
  return []
})
const currentRelatedWorks = computed(() => {
  if (currentProject?.value) {
    return currentProject.value.related ?? []
  }
  if (currentWork?.value) {
    return currentWork.value.related ?? []
  }
  if (currentWorkForm?.value) {
    return data?.value?.projects
      .flatMap((project) => [
        project,
        ...(project.works ?? []),
        ...(project.related ?? []),
      ])
      .flatMap((work) =>
        ['work', 'project'].includes(work._type) ? (work.related ?? []) : [],
      )
      .filter((related) =>
        related.workForm?.some(
          (form) => form.slug === currentWorkForm?.value?.slug,
        ),
      )
  }
  if (currentYear?.value) {
    return data?.value?.projects
      .flatMap((project) => project.related ?? [])
      .filter((related) => {
        let allYears = getWorkYears(related.dates)
        return allYears.includes(parseInt(currentYear.value as string))
      })
  }
  return []
})
</script>

<template>
  <div class="projects-sidebar">
    <div v-if="currentCategory">
      <h1 class="projects-sidebar__title">
        <div class="node-selected">
          <BaseNode
            :link="{ to: `?category=${currentCategory?.slug}` }"
            :node-type="currentCategory?._type"
          >
            {{ currentCategory?.name }}
          </BaseNode>
        </div>
      </h1>
      <div
        v-if="currentCategory?.description"
        class="projects-sidebar__description"
      >
        <BaseBlocks :blocks="currentCategory?.description" />
      </div>
      <BaseFigure v-if="currentCategory.image" :image="currentCategory.image" />
    </div>

    <div v-if="currentWorkForm" class="projects-sidebar__title">
      <div class="node-selected">
        <BaseNode
          :link="{ to: `?workForm=${currentWorkForm?.slug}` }"
          :node-type="currentWorkForm._type"
        >
          {{ currentWorkForm?.name }}
        </BaseNode>
      </div>
      <div
        v-if="currentWorkForm?.description"
        class="projects-sidebar__description"
      >
        <SanityContent :value="currentWorkForm.description" />
      </div>
    </div>

    <div v-if="currentProject" class="projects-sidebar__title">
      <WorkCard :work="currentProject" />
    </div>

    <div v-if="currentWork" class="projects-sidebar__title">
      <!-- <h3>Current Work</h3> -->
      <WorkCard :work="currentWork" />
    </div>

    <div v-if="currentRelatedProject" class="projects-sidebar__title">
      <!-- <h3>Current Related Project</h3> -->
      <WorkCard :work="currentRelatedProject" />
    </div>

    <div v-if="currentEvent" class="projects-sidebar__title">
      <!-- <h3>Current Event</h3> -->
      <WorkCard :work="currentEvent" />
    </div>

    <div v-if="currentYear" class="projects-sidebar__title">
      <!-- <h3>Current Year</h3> -->
      <BaseNode :link="{ to: `?year=${currentYear}` }" node-type="year">{{
        currentYear
      }}</BaseNode>
    </div>

    <section v-if="currentProjects?.length">
      <h3>Projects</h3>
      <ul>
        <li v-for="project in currentProjects" :key="project._id">
          <!-- <h3>{{ project.title }}</h3> -->
          <WorkCard :work="project" :inline="true" />
          <!-- <p v-if="project.description">
            <SanityContent :value="project.description" />
          </p> -->
        </li>
      </ul>
    </section>

    <section v-if="currentWorks?.length">
      <h3>Works</h3>
      <ul>
        <li v-for="work in currentWorks" :key="work._id">
          <!-- <h3>{{ work.title }}</h3> -->
          <WorkCard :work="work" :inline="true" />
          <!-- <p v-if="work.description">
            <SanityContent :value="work.description" />
          </p> -->
        </li>
      </ul>
    </section>

    <section v-if="currentRelatedWorks?.length">
      <h3>Related</h3>
      <ul>
        <li v-for="work in currentRelatedWorks" :key="work._id">
          <!-- <h3>{{ work.title }}</h3> -->
          <WorkCard :work="work" :inline="true" />
          <!-- <p v-if="work.description">
            <SanityContent :value="work.description" />
          </p> -->
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.projects-sidebar__title {
  margin: 0 0 1rem;
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
    animation: fade-reveal 0.1s ease 0.1s forwards;
  }
}
.projects-sidebar__description {
  padding: 0.25rem;
  margin-bottom: 1rem;
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
section {
  border-top: 1px solid;
  margin-top: 2rem;
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
    border-top: none;
    z-index: 1;
    animation: fade-reveal 0.1s ease 0.3s forwards;
  }
}
ul {
  list-style: none;
  padding: 0 0 0 1rem;
}
li {
  padding: 0;
  &:before {
    content: '•';
    display: inline-block;
    width: 1rem;
    margin-left: -1rem;
  }
}
</style>
