<script setup lang="ts">
interface Breadcrumb {
  link: { query: Record<string, any> }
  label: string
}

const projectsNetwork =
  inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')
const breadcrumbs = useState<Breadcrumb[]>('breadcrumbs', () => [])
watch(
  () => useRoute().query,
  (newQuery) => {
    let label = Object.values(newQuery).join(', ')
    const queryType = Object.keys(newQuery)[0]
    if (!queryType) return
    if (queryType === 'project') {
      const projectTitle =
        projectsNetwork?.value?.projects?.find(
          (project) => project.slug === newQuery.project,
        )?.title ?? ''
      label = 'Project: ' + projectTitle
    } else if (queryType === 'category') {
      const categoryTitle =
        projectsNetwork?.value?.categories?.find(
          (category) => category.slug === newQuery.category,
        )?.name ?? ''
      label = 'Category: ' + categoryTitle
    } else if (queryType === 'work') {
      const workTitle =
        projectsNetwork?.value?.projects
          ?.flatMap((project) => project.works ?? [])
          .find((work) => work.slug === newQuery.work)?.title ?? ''
      label = 'Work: ' + workTitle
    } else if (queryType === 'related') {
      const relatedTitle =
        projectsNetwork?.value?.projects
          ?.flatMap((project) => [project, ...(project.works ?? [])])
          .find((work) => work.slug === newQuery.related)?.title ?? ''
      label = 'Related: ' + relatedTitle
    } else if (queryType === 'workForm') {
      const workFormTitle =
        projectsNetwork?.value?.projects
          ?.flatMap((project) => [project, ...(project.works ?? [])])
          .find((work) =>
            work.workForm?.some((form) => form.slug === newQuery.workForm),
          )
          ?.workForm?.find((form) => form.slug === newQuery.workForm)?.name ??
        ''
      label = 'Form: ' + workFormTitle
    } else if (queryType === 'year') {
      label = 'Year: ' + label
    } else if (queryType === 'years') {
      label = 'Years: ' + label
    }
    // Update breadcrumbs based on the new query
    breadcrumbs.value = [
      ...breadcrumbs.value,
      {
        link: { query: newQuery },
        label,
      },
    ]
  },
)
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <!-- <h1>GMC Prototype</h1> -->
      <nav class="layout__header-links">
        <NuxtLink to="/" class="layout__header-link">Tree</NuxtLink>/
        <NuxtLink to="/constellation" class="layout__header-link"
          >Constellation</NuxtLink
        >
      </nav>
      <nav class="layout__breadcrumbs">
        <template v-for="(breadcrumb, i) in breadcrumbs" :key="i">
          <NuxtLink :to="breadcrumb.link" class="layout__breadcrumb">{{
            breadcrumb.label
          }}</NuxtLink>
          <span
            v-if="i < breadcrumbs.length - 1"
            class="layout__breadcrumb-separator"
            >></span
          >
        </template>
      </nav>
    </header>
    <main class="layout__content">
      <slot />
    </main>
    <aside class="layout__sidebar">
      <ProjectsSidebar />
    </aside>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-areas:
    'header header'
    'content sidebar';
  grid-template-columns: 1fr 30rem;
  grid-template-rows: auto 1fr;
  height: 100vh;
  padding: 1rem;
}
.layout__header {
  grid-area: header;
  display: flex;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid;
}

.layout__header-links {
  display: flex;
  gap: 0.5rem;
}

.layout__header-link {
  &.router-link-exact-active {
    color: blue;
  }
}

.layout__breadcrumbs {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5em;
  overflow-x: auto;
  position: relative;
  flex: 1;
  /* hide scrollbar */
  scrollbar-width: none; /* For Firefox */
  &::-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
  }
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 50%;
    background: linear-gradient(to right, white, rgba(255, 255, 255, 0));
    pointer-events: none;
    z-index: 1;
  }
}
.layout__breadcrumb {
  white-space: nowrap;
  &:hover {
    color: blue;
  }
  &:not(:last-child) {
    opacity: 0.4;
    &:hover {
      opacity: 1;
    }
  }
}
.layout__breadcrumb-separator {
  opacity: 0.4;
}

.layout__content {
  grid-area: content;
  padding: 1rem;
  overflow-y: auto;
}

.layout__sidebar {
  grid-area: sidebar;
  padding: 1rem;
  border-left: 1px solid;
  overflow-y: auto;
}
.layout__header {
  grid-area: header;
  display: flex;
  border-bottom: 1px solid;
}

nav {
  display: flex;
  /* margin: 0.25rem 0 0.25rem calc(0rem - 0.25rem); */
}
a {
  text-decoration: none;
  color: inherit;
}
/* a.router-link-exact-active {
  background-color: blue;
  color: white;
  border-color: blue;
} */
</style>
