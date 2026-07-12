<script setup lang="ts">
type AnyWorkWithDates =
  | ProjectsNetworkQueryResult['projects'][number]
  | NonNullable<
      ProjectsNetworkQueryResult['projects'][number]['related']
    >[number]
  | NonNullable<ProjectsNetworkQueryResult['projects'][number]['works']>[number]
  | NonNullable<
      NonNullable<
        ProjectsNetworkQueryResult['projects'][number]['works']
      >[number]['related']
    >[number]

type AnyWorkWithWorkForm =
  | ProjectsNetworkQueryResult['projects'][number]
  | NonNullable<ProjectsNetworkQueryResult['projects'][number]['works']>[number]

type NodeRelationship = {
  ids: string[] // unique identifier for the relationship (from._id and to._id)
  from: { _id: string; _type: string; slug: string; x: number; y: number } // _id of the source node
  to: { _id: string; _type: string; slug: string; x: number; y: number } // _id of the target node
}

const data = inject<Ref<ProjectsNetworkQueryResult | null>>('projectsNetwork')

const projectsConstellation = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let CONTEXT: CanvasRenderingContext2D | null = null

// extract all GMC works
const works = computed<
  NonNullable<ProjectsNetworkQueryResult['projects'][number]['works']>[number][]
>(() => {
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

// extract all related works
const relatedWorks = computed<
  | NonNullable<
      NonNullable<
        ProjectsNetworkQueryResult['projects'][number]['works']
      >[number]['related']
    >[number][]
  | NonNullable<
      ProjectsNetworkQueryResult['projects'][number]['related']
    >[number][]
>(() => {
  const allWorks: any[] = []
  data?.value?.projects?.forEach((project) => {
    // include the project's related works directly
    if (project.related?.length) {
      project.related.forEach((relatedWork) => {
        allWorks.push(relatedWork)
      })
    }
    // include the related works of each work within the project
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

// extract all years from projects, works, and related works
const years = computed(() => {
  const allYears: number[] = []
  const addYearsFromWork = (w: AnyWorkWithDates) => {
    const wy = getWorkYears(w.dates)
    if (wy[0] && !allYears.includes(wy[0])) {
      allYears.push(...wy)
    }
  }
  data?.value?.projects?.forEach((project) => {
    addYearsFromWork(project)
    if (project.related?.length) {
      project.related.forEach(addYearsFromWork)
    }
    if (project.works?.length) {
      project.works.forEach((work) => {
        addYearsFromWork(work)
        if (work.related?.length) {
          work.related.forEach(addYearsFromWork)
        }
      })
    }
  })
  return Array.from(new Set(allYears)).sort((a, b) => a - b)
})

// extract all work forms from projects and works
const workForms = computed<
  | NonNullable<ProjectsNetworkQueryResult['projects'][number]['workForm']>
  | NonNullable<
      ProjectsNetworkQueryResult['projects'][number]['works']
    >[number]['workForm']
>(() => {
  const allWorkForms:
    | NonNullable<ProjectsNetworkQueryResult['projects'][number]['workForm']>
    | NonNullable<
        ProjectsNetworkQueryResult['projects'][number]['works']
      >[number]['workForm'] = []

  const addWorkFormsFromWork = (w: AnyWorkWithWorkForm) => {
    if (w.workForm?.length) {
      w.workForm.forEach((form) => {
        if (!allWorkForms.some((f) => f._id === form._id)) {
          allWorkForms.push(form)
        }
      })
    }
  }

  data?.value?.projects?.forEach((project) => {
    addWorkFormsFromWork(project)
    if (project.works?.length) {
      project.works.forEach(addWorkFormsFromWork)
    }
  })

  return allWorkForms
})

// nodes that are visible
const activeCategories = ref<string[]>([]) // slugs
const activeProjects = ref<string[]>([]) // slugs
const activeWorks = ref<string[]>([]) // slugs
const activeRelatedWorks = ref<string[]>([]) // slugs
const activeYears = ref<number[]>([]) // years
const activeWorkForms = ref<string[]>([]) // slugs

// canvas lines
const relationships = ref<NodeRelationship[]>([])
const activeRelationships = ref<NodeRelationship[]>([])

const handleClickOnContainer = (event: Event) => {
  // check if the click was on the container itself and not on any node
  if (
    projectsConstellation.value &&
    event.target === projectsConstellation.value
  ) {
    navigateTo({ query: {} })
  }
}

onMounted(() => {
  setTimeout(async () => {
    initNodePositions()
    await initConstellation()
    projectsConstellation.value?.addEventListener(
      'click',
      handleClickOnContainer,
    )
  }, 0)
})
onBeforeUnmount(() => {
  projectsConstellation.value?.removeEventListener(
    'click',
    handleClickOnContainer,
  )
})

watch(() => useRoute().query, filterActiveItems, { immediate: true })
watch(activeRelationships, drawCanvas)

function initNodePositions() {
  const containerDimensions = { width: 0, height: 0 }
  if (projectsConstellation.value) {
    const { width, height } =
      projectsConstellation.value.getBoundingClientRect()
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
    return { width, height, node: node as HTMLElement }
  })
  generatePositions(containerDimensions, itemsToPlace)
}

// generate non-overlapping random positions for a set of items within a container
function generatePositions(
  container: { width: number; height: number },
  items: { width: number; height: number; node: HTMLElement }[],
  maxAttempts = 500,
) {
  const placedItems: { x: number; y: number; width: number; height: number }[] =
    []
  const checkOverlap = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
  ) => {
    return !(
      rect1.x + rect1.width <= rect2.x || // rect1 is completely to the left
      rect1.x >= rect2.x + rect2.width || // rect1 is completely to the right
      rect1.y + rect1.height <= rect2.y || // rect1 is completely above
      rect1.y >= rect2.y + rect2.height // rect1 is completely below
    )
  }

  for (const item of items) {
    let placed = false
    let attempts = 0

    while (!placed && attempts < maxAttempts) {
      attempts++

      // generate random coordinates within the container bounds
      const randomX = Math.floor(Math.random() * (container.width - item.width))
      const randomY = Math.floor(
        Math.random() * (container.height - item.height),
      )

      const newItem = {
        x: randomX,
        y: randomY,
        width: item.width,
        height: item.height,
      }

      // check for collisions against already placed items
      const hasOverlap = placedItems.some((existingItem) =>
        checkOverlap(newItem, existingItem),
      )

      // keep if safe, otherwise retry
      if (!hasOverlap) {
        placedItems.push(newItem)

        if (item.node) {
          item.node.style.left = `${newItem.x}px`
          item.node.style.top = `${newItem.y}px`
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

async function filterActiveItems(newQuery: {
  category?: string
  project?: string
  work?: string
  related?: string
  year?: string
  workForm?: string
}) {
  // active category query
  if (typeof newQuery.category === 'string') {
    filterByCategory(newQuery.category)
  } else if (typeof newQuery.project === 'string') {
    filterByProject(newQuery.project)
  } else if (typeof newQuery.work === 'string') {
    filterByWork(newQuery.work)
  } else if (typeof newQuery.related === 'string') {
    filterByRelated(newQuery.related)
  } else if (typeof newQuery.year === 'string') {
    filterByYear(newQuery.year)
  } else if (typeof newQuery.workForm === 'string') {
    filterByWorkForm(newQuery.workForm)
  } else {
    resetActiveSelections()
  }
  updateActiveRelationships()
}

function filterByCategory(categorySlug: string) {
  const categoryToActivate = data?.value?.categories?.find(
    (cat) => cat.slug === categorySlug,
  )
  if (!categoryToActivate) return

  activeCategories.value = [categorySlug]

  const projectsToActivate =
    data?.value?.projects?.filter((project) =>
      project.category?.some((cat) => cat.slug === categorySlug),
    ) || []

  // const worksToActivate =
  //   projectsToActivate.flatMap((p) => p.works).filter((work) => !!work) || []

  // const relatedWorksToActivate =
  //   projectsToActivate.flatMap((project) => {
  //     return [
  //       ...(project?.related || []),
  //       ...(project?.works?.flatMap((work) => work.related || []) || []),
  //     ]
  //   }) || []

  const yearsToActivate = Array.from(
    new Set([
      ...projectsToActivate.flatMap(
        (project) => getWorkYears(project.dates) || [],
      ),
      // ...worksToActivate.flatMap((work) => getWorkYears(work.dates) || []),
      // ...relatedWorksToActivate.flatMap(
      //   (work) => getWorkYears(work.dates) || [],
      // ),
    ]),
  )

  const workFormsToActivate = Array.from(
    new Set(
      [
        ...(projectsToActivate.flatMap((p) => p.workForm || []).flat() || []),
        // ...worksToActivate.flatMap((work) => work.workForm || []),
        // ...relatedWorksToActivate.flatMap((work) => work.workForm || []),
      ].map((form) => form.slug),
    ),
  )

  // set state for all active nodes
  activeProjects.value = projectsToActivate.map((project) => project.slug)
  // activeWorks.value = worksToActivate
  //   .map((work) => work?.slug || '')
  //   .filter((slug) => slug)
  activeWorks.value = []
  // activeRelatedWorks.value = relatedWorksToActivate
  //   .map((work) => work?.slug || '')
  //   .filter((slug) => slug)
  activeRelatedWorks.value = []
  activeYears.value = yearsToActivate
  activeWorkForms.value = workFormsToActivate
}

function filterByProject(projectSlug: string) {
  const projectToActivate = data?.value?.projects?.find(
    (p) => p.slug === projectSlug,
  )
  if (!projectToActivate) return

  activeProjects.value = [projectSlug]

  // first go down the tree
  const worksToActivate = projectToActivate.works || []

  const relatedWorksToActivate = [
    ...(projectToActivate.related || []),
    // ...worksToActivate?.flatMap((work) => work.related || []),
  ]

  const yearsToActivate = Array.from(
    new Set([
      ...(getWorkYears(projectToActivate.dates) || []),
      ...(worksToActivate?.flatMap((work) => getWorkYears(work.dates) || []) ||
        []),
      ...(relatedWorksToActivate?.flatMap(
        (work) => getWorkYears(work.dates) || [],
      ) || []),
    ]),
  )

  const workFormsToActivate = Array.from(
    new Set([
      ...(projectToActivate.workForm?.map((form) => form.slug) || []),
      ...(worksToActivate?.flatMap(
        (work) => work.workForm?.map((form) => form.slug) || [],
      ) || []),
      ...(relatedWorksToActivate?.flatMap(
        (work) => work.workForm?.map((form) => form.slug) || [],
      ) || []),
    ]),
  )
  activeWorks.value = worksToActivate.map((work) => work.slug) || []
  activeRelatedWorks.value =
    Array.from(new Set(relatedWorksToActivate.map((work) => work.slug))) || []
  activeYears.value = yearsToActivate
  activeWorkForms.value = workFormsToActivate

  // now go up the tree
  activeCategories.value =
    projectToActivate.category?.map((cat) => cat.slug) || []
}

function filterByWork(workSlug: string) {
  const work = works?.value?.find((w) => w.slug === workSlug)
  if (!work) return

  activeWorks.value = [workSlug]

  // first go down the tree
  const relatedWorksToActivate = work.related?.filter((w) => !!w?.slug) || []

  const yearsToActivate = Array.from(
    new Set([
      ...(getWorkYears(work.dates) || []),
      // ...(relatedWorksToActivate?.flatMap((w) =>
      //   w?.dates ? getWorkYears(w.dates) : [],
      // ) || []),
    ]),
  )

  const workFormsToActivate = Array.from(
    new Set([
      ...(work.workForm?.map((form) => form.slug) || []),
      // ...(relatedWorksToActivate?.flatMap(
      //   (w) => w.workForm?.map((form) => form.slug) || [],
      // ) || []),
    ]),
  )

  activeRelatedWorks.value = relatedWorksToActivate.map((w) => w?.slug) || []
  activeYears.value = yearsToActivate
  activeWorkForms.value = workFormsToActivate

  // now go up the tree
  const parentProjects = data?.value?.projects?.filter((p) =>
    p.works?.some((w) => w.slug === work.slug),
  )
  if (!parentProjects?.length) return

  activeProjects.value = parentProjects.map((p) => p.slug)
  activeCategories.value =
    parentProjects.flatMap((p) => p.category || []).map((cat) => cat.slug) || []
}

function filterByRelated(relatedSlug: string) {
  const relatedWork = relatedWorks?.value?.find((w) => w.slug === relatedSlug)
  if (!relatedWork) return

  activeRelatedWorks.value = [relatedSlug]

  // first go down the tree
  activeYears.value = getWorkYears(relatedWork.dates) || []
  activeWorkForms.value = relatedWork.workForm?.map((form) => form.slug) || []

  // now go up the tree
  const worksToActivate = works?.value?.filter((w) =>
    w.related?.some((rw) => rw.slug === relatedWork.slug),
  )
  let projectsToActivate = data?.value?.projects?.filter((p) =>
    p.related?.some((w) => w.slug === relatedWork.slug),
  )
  if (worksToActivate?.length) {
    projectsToActivate = data?.value?.projects?.filter((p) =>
      p.works?.some((w) => worksToActivate.some((pw) => pw.slug === w.slug)),
    )
  }
  activeWorks.value = worksToActivate?.map((w) => w.slug) || []
  activeProjects.value = projectsToActivate?.map((p) => p.slug) || []
  activeCategories.value =
    projectsToActivate?.flatMap(
      (p) => p.category?.map((cat) => cat.slug) || [],
    ) || []
}

function filterByYear(year: string) {
  const yearInt = parseInt(year)
  if (isNaN(yearInt)) return
  const yearToActivate = years?.value?.find((y) => y === parseInt(year))
  if (!yearToActivate) return

  activeYears.value = [yearToActivate]

  // go up the tree
  const relatedWorksToActivate =
    relatedWorks?.value?.filter((w) =>
      getWorkYears(w.dates)?.includes(yearToActivate),
    ) || []
  const worksToActivate =
    works?.value?.filter(
      (w) =>
        getWorkYears(w.dates)?.includes(yearToActivate) ||
        w.related?.some(
          (rw) =>
            rw?.slug &&
            relatedWorksToActivate.some((rwa) => rwa.slug === rw.slug),
        ),
    ) || []
  const projectsToActivate =
    data?.value?.projects?.filter(
      (p) =>
        getWorkYears(p.dates)?.includes(yearToActivate) ||
        p.works?.some((w) =>
          worksToActivate.some((wa) => wa.slug === w.slug),
        ) ||
        p.related?.some(
          (rw) =>
            rw?.slug &&
            relatedWorksToActivate.some((rwa) => rwa.slug === rw.slug),
        ),
    ) || []
  const categoriesToActivate =
    data?.value?.categories?.filter((c) =>
      projectsToActivate.some((p) =>
        p.category?.some((cat) => cat.slug === c.slug),
      ),
    ) || []

  activeRelatedWorks.value = relatedWorksToActivate?.map((w) => w.slug) || []
  activeWorks.value = worksToActivate?.map((w) => w.slug) || []
  activeProjects.value = projectsToActivate?.map((p) => p.slug) || []
  activeCategories.value = categoriesToActivate?.map((c) => c.slug) || []
  activeWorkForms.value = [
    ...(relatedWorksToActivate?.flatMap(
      (w) => w.workForm?.map((form) => form.slug) || [],
    ) || []),
    ...(worksToActivate?.flatMap(
      (w) => w.workForm?.map((form) => form.slug) || [],
    ) || []),
    ...(projectsToActivate?.flatMap(
      (p) => p.workForm?.map((form) => form.slug) || [],
    ) || []),
  ]
}

function filterByWorkForm(workForm: string) {
  const workFormToActivate = workForms.value?.find((wf) => wf.slug === workForm)
  if (!workFormToActivate) return
  activeWorkForms.value = [workFormToActivate.slug]

  const relatedWorksToActivate =
    relatedWorks?.value?.filter((w) =>
      w.workForm?.some((form) => form.slug === workForm),
    ) || []
  const worksToActivate =
    works?.value?.filter(
      (w) =>
        w.workForm?.some((form) => form.slug === workForm) ||
        w.related?.some((rw) =>
          relatedWorksToActivate.some((rwa) => rwa.slug === rw.slug),
        ),
    ) || []
  const projectsToActivate =
    data?.value?.projects?.filter(
      (p) =>
        p.workForm?.some((form) => form.slug === workForm) ||
        p.works?.some((w) =>
          worksToActivate?.some((wa) => wa.slug === w.slug),
        ) ||
        p.related?.some((rw) =>
          relatedWorksToActivate.some((rwa) => rwa.slug === rw.slug),
        ),
    ) || []

  const yearsToActivate = Array.from(
    new Set([
      ...(relatedWorksToActivate?.flatMap((w) =>
        w?.dates ? getWorkYears(w.dates) : [],
      ) || []),
      ...(worksToActivate?.flatMap((w) =>
        w?.dates ? getWorkYears(w.dates) : [],
      ) || []),
      ...(projectsToActivate?.flatMap((p) =>
        p?.dates ? getWorkYears(p.dates) : [],
      ) || []),
    ]),
  )

  activeCategories.value =
    data?.value?.categories
      ?.filter((c) =>
        projectsToActivate?.some((p) =>
          p.category?.some((cat) => cat.slug === c.slug),
        ),
      )
      ?.map((c) => c.slug) || []
  activeRelatedWorks.value = relatedWorksToActivate?.map((w) => w.slug) || []
  activeWorks.value = worksToActivate?.map((w) => w.slug) || []
  activeProjects.value = projectsToActivate?.map((p) => p.slug) || []
  activeYears.value = yearsToActivate?.map((y) => y) || []
}

async function initConstellation() {
  setTimeout(async () => {
    // Create a canvas and draw lines connecting all [data-node] elements
    CONTEXT = canvas.value?.getContext('2d') || null
    if (!canvas.value || !CONTEXT) return

    const displayWidth = canvas.value.clientWidth
    const displayHeight = canvas.value.clientHeight

    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1

    // 1. Set the internal resolution multiplied by the DPR
    canvas.value.width = displayWidth * dpr
    canvas.value.height = displayHeight * dpr

    // 2. Set the CSS display size to your desired dimensions
    canvas.value.style.width = `${displayWidth}px`
    canvas.value.style.height = `${displayHeight}px`

    // 3. Scale the context so your drawing coordinates remain unchanged
    CONTEXT.scale(dpr, dpr)

    const containerRect = canvas.value.getBoundingClientRect()
    const nodes = Array.from(document.querySelectorAll('[data-node]'))

    const getNodeData = (node: Element) => {
      const data = JSON.parse(node.getAttribute('data-node') || '{}')
      const rect = node.getBoundingClientRect()
      const x = rect.left - containerRect.left + rect.width / 2
      const y = rect.top - containerRect.top + rect.height / 2
      return { data, x, y }
    }

    const addRelationship = (fromNodeData, x, y, toNode) => {
      const { data: toNodeData, x: targetX, y: targetY } = getNodeData(toNode)

      if (toNodeData._type === 'year') {
        toNodeData._id = `${toNodeData.year}`
        toNodeData.slug = `${toNodeData.year}`
      }

      const relationship: NodeRelationship = {
        ids: [fromNodeData._id, toNodeData._id],
        from: {
          _id: fromNodeData._id,
          _type: fromNodeData._type,
          slug: fromNodeData.slug,
          x,
          y,
        },
        to: {
          _id: toNodeData._id,
          _type: toNodeData._type,
          slug: toNodeData.slug,
          x: targetX,
          y: targetY,
        },
      }

      relationships.value.push(relationship)
    }

    nodes.forEach((node) => {
      const { data: nodeData, x, y } = getNodeData(node)

      if (nodeData._type === 'category') {
        const targetNodes = nodes.filter((n) => {
          const nData = JSON.parse(n.getAttribute('data-node') || '{}')
          return (
            nData._type === 'project' &&
            nData.category?.some((cat) => cat.slug === nodeData.slug)
          )
        })

        if (targetNodes?.length === 0) return

        targetNodes.forEach((node) => {
          addRelationship(nodeData, x, y, node)
        })
      } else if (nodeData._type === 'project') {
        const targetNodes = nodes.filter((n) => {
          const nData = JSON.parse(n.getAttribute('data-node') || '{}')
          return (
            (['work'].includes(nData._type) &&
              nData._type === 'work' &&
              nodeData.works?.some((work) => work._id === nData._id)) ||
            (nData._type === 'relatedProject' &&
              nodeData.related?.some((related) => related._id === nData._id)) ||
            (nData._type === 'workForm' &&
              nodeData.workForm?.some((form) => form._id === nData._id)) ||
            (nData._type === 'year' &&
              getWorkYears(nodeData.dates).includes(nData.year))
          )
        })
        if (targetNodes?.length === 0) return

        targetNodes.forEach((node) => {
          addRelationship(nodeData, x, y, node)
        })
      } else if (nodeData._type === 'work') {
        const targetNodes = nodes.filter((n) => {
          const nData = JSON.parse(n.getAttribute('data-node') || '{}')
          return (
            (nData._type === 'workForm' &&
              nodeData.workForm?.some((form) => form._id === nData._id)) ||
            (nData._type === 'relatedProject' &&
              nodeData.related?.some((related) => related._id === nData._id)) ||
            (nData._type === 'year' &&
              getWorkYears(nodeData.dates).includes(nData.year))
          )
        })
        if (targetNodes?.length === 0) return

        targetNodes.forEach((node) => {
          addRelationship(nodeData, x, y, node)
        })
      } else if (nodeData._type === 'relatedProject') {
        const targetNodes = nodes.filter((n) => {
          const nData = JSON.parse(n.getAttribute('data-node') || '{}')
          return (
            (nData._type === 'workForm' &&
              nData.workForm?.some((form) => form._id === nodeData._id)) ||
            (nData._type === 'year' &&
              getWorkYears(nodeData.dates).includes(nData.year))
          )
        })
        if (targetNodes?.length === 0) return

        targetNodes.forEach((node) => {
          addRelationship(nodeData, x, y, node)
        })
      }
    })
    updateActiveRelationships()
  }, 1000)
}

function resetActiveSelections() {
  activeCategories.value = [
    ...(data?.value?.categories?.map((cat) => cat.slug) || []),
  ]
  activeProjects.value = []
  activeWorks.value = []
  activeRelatedWorks.value = []
  activeYears.value = []
  activeWorkForms.value = []
  activeRelationships.value = []
}

function updateActiveRelationships() {
  if (
    !activeCategories.value.length &&
    !activeProjects.value.length &&
    !activeWorks.value.length &&
    !activeRelatedWorks.value.length &&
    !activeYears.value.length &&
    !activeWorkForms.value.length
  ) {
    activeRelationships.value = relationships.value
    return
  }
  const newActiveRelationships: NodeRelationship[] = []
  activeCategories.value.forEach((slug) => {
    const newRelationships = relationships.value.filter(
      (rel) =>
        rel.from._type === 'category' &&
        rel.from.slug === slug &&
        rel.to._type === 'project' &&
        activeProjects.value.includes(rel.to.slug),
    )
    if (newRelationships.length) {
      newActiveRelationships.push(...newRelationships)
    }
  })
  activeProjects.value.forEach((slug) => {
    const newRelationships = relationships.value.filter((rel) => {
      // move down the tree
      const isFromProject =
        rel.from._type === 'project' && rel.from.slug === slug
      if (!isFromProject) return false
      const projectToWork =
        rel.to._type === 'work' && activeWorks.value.includes(rel.to.slug)
      const projectToRelatedProject =
        rel.to._type === 'relatedProject' &&
        activeRelatedWorks.value.includes(rel.to.slug)
      const projectToWorkForm =
        rel.to._type === 'workForm' &&
        activeWorkForms.value.includes(rel.to.slug)
      const projectToYear =
        rel.to._type === 'year' &&
        activeYears.value.includes(parseInt(rel.to.slug))
      return (
        projectToWork ||
        projectToRelatedProject ||
        projectToWorkForm ||
        projectToYear
      )
    })
    if (newRelationships?.length) {
      newActiveRelationships.push(...newRelationships)
    }
  })
  activeWorks.value.forEach((slug) => {
    const activeRelationships = relationships.value.filter((rel) => {
      // move down the tree
      const isFromWork = rel.from._type === 'work' && rel.from.slug === slug
      if (!isFromWork) return false
      const workToRelatedProject =
        rel.to._type === 'relatedProject' &&
        activeRelatedWorks.value.includes(rel.to.slug)
      const workToYear =
        rel.to._type === 'year' &&
        activeYears.value.includes(parseInt(rel.to.slug))
      const workToWorkForm =
        rel.to._type === 'workForm' &&
        activeWorkForms.value.includes(rel.to.slug)
      return workToRelatedProject || workToYear || workToWorkForm
    })
    if (activeRelationships.length) {
      newActiveRelationships.push(...activeRelationships)
    }
  })
  activeRelatedWorks.value.forEach((slug) => {
    const activeRelationships = relationships.value.filter((rel) => {
      const isFromRelatedProject =
        rel.from._type === 'relatedProject' && rel.from.slug === slug
      if (!isFromRelatedProject) return false
      const relatedProjectToYear =
        rel.to._type === 'year' &&
        activeYears.value.includes(parseInt(rel.to.slug))
      const relatedProjectToWorkForm =
        rel.to._type === 'workForm' &&
        activeWorkForms.value.includes(rel.to.slug)
      return relatedProjectToYear || relatedProjectToWorkForm
    })
    if (activeRelationships.length) {
      newActiveRelationships.push(...activeRelationships)
    }
  })
  activeYears.value.forEach((year) => {
    const activeRelationships = relationships.value.filter((rel) => {
      const isToYear = rel.to._type === 'year' && rel.to.slug === `${year}`
      if (!isToYear) return false
      const yearFromWork =
        rel.from._type === 'work' && activeWorks.value.includes(rel.from.slug)
      const yearFromRelatedProject =
        rel.from._type === 'relatedProject' &&
        activeRelatedWorks.value.includes(rel.from.slug)
      const yearFromProject =
        rel.from._type === 'project' &&
        activeProjects.value.includes(rel.from.slug)
      return yearFromWork || yearFromRelatedProject || yearFromProject
    })
    if (activeRelationships.length) {
      newActiveRelationships.push(...activeRelationships)
    }
  })
  activeWorkForms.value.forEach((slug) => {
    const activeRelationships = relationships.value.filter((rel) => {
      const isFromWorkForm =
        rel.from._type === 'workForm' && rel.from.slug === slug
      if (!isFromWorkForm) return false
      const workFormFromWork =
        rel.to._type === 'work' && activeWorks.value.includes(rel.to.slug)
      const workFormFromRelatedProject =
        rel.to._type === 'relatedProject' &&
        activeRelatedWorks.value.includes(rel.to.slug)
      const workFormFromProject =
        rel.to._type === 'project' && activeProjects.value.includes(rel.to.slug)
      return (
        workFormFromWork || workFormFromRelatedProject || workFormFromProject
      )
    })
    if (activeRelationships.length) {
      newActiveRelationships.push(...activeRelationships)
    }
  })
  activeRelationships.value = newActiveRelationships
}

function drawCanvas() {
  if (!CONTEXT) return
  const containerRect = canvas.value?.getBoundingClientRect() || {
    width: 0,
    height: 0,
  }

  CONTEXT.clearRect(0, 0, containerRect.width, containerRect.height)

  CONTEXT.lineWidth = 3
  CONTEXT.strokeStyle = '#aeaeff'

  activeRelationships.value.reverse().forEach((relationship) => {
    CONTEXT?.beginPath()
    CONTEXT?.moveTo(relationship.from.x, relationship.from.y)
    CONTEXT?.lineTo(relationship.to.x, relationship.to.y)
    // CONTEXT?.quadraticCurveTo(
    //   Math.min(
    //     Math.max(
    //       relationship.from.x > relationship.to.x
    //         ? relationship.from.y > relationship.to.y
    //           ? relationship.from.x -
    //             (relationship.from.x - relationship.to.x) / 2
    //           : relationship.from.x +
    //             (relationship.to.x - relationship.from.x) / 2
    //         : relationship.from.y > relationship.to.y
    //           ? relationship.from.x -
    //             (relationship.from.x - relationship.to.x) / 2
    //           : relationship.from.x +
    //             (relationship.to.x - relationship.from.x) / 2,
    //       0,
    //     ),
    //     containerRect.width,
    //   ),
    //   Math.max(
    //     Math.min(
    //       relationship.from.y > relationship.to.y
    //         ? relationship.from.x < relationship.to.x
    //           ? relationship.from.y +
    //             (relationship.from.y - relationship.to.y) / 2
    //           : relationship.from.y -
    //             (relationship.from.y - relationship.to.y) / 2
    //         : relationship.from.x < relationship.to.x
    //           ? relationship.from.y -
    //             (relationship.to.y - relationship.from.y) / 2
    //           : relationship.from.y +
    //             (relationship.to.y - relationship.from.y) / 2,
    //       containerRect.height,
    //     ),
    //     0,
    //   ),
    //   relationship.to.x,
    //   relationship.to.y,
    // )
    if (CONTEXT) {
      if (relationship.to._type === 'relatedProject') {
        CONTEXT.lineWidth = 2
        CONTEXT.setLineDash([8, 2])
      } else if (
        relationship.to._type === 'workForm' ||
        relationship.to._type === 'year'
      ) {
        CONTEXT.lineWidth = 2
        CONTEXT.setLineDash([2, 4])
      } else {
        CONTEXT.lineWidth = 3
        CONTEXT.setLineDash([])
      }
      CONTEXT.stroke()
      CONTEXT.closePath()
    }
  })
}
</script>

<template>
  <div class="projects-constellation" ref="projectsConstellation">
    <canvas class="projects-constellation__canvas" ref="canvas"></canvas>

    <nav v-if="data?.categories?.length">
      <div
        v-for="(category, index) in data.categories"
        :key="category.slug"
        class="projects-constellation__node-container"
        :class="{
          'node-active':
            activeCategories.includes(category.slug) ||
            $route.params.categorySlug === category.slug,
          'node-selected': $route.query.category === category.slug,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <div
          class="projects-constellation__node-nucleus"
          :data-node="JSON.stringify(category)"
          aria-hidden="true"
        />
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
          'node-selected': $route.query.project === project.slug,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <div
          class="projects-constellation__node-nucleus"
          :data-node="JSON.stringify(project)"
          aria-hidden="true"
        />
        <BaseNode
          :link="{ to: { query: { project: project.slug } } }"
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
          'node-selected': $route.query.work === work.slug,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <div
          class="projects-constellation__node-nucleus"
          :data-node="JSON.stringify(work)"
          aria-hidden="true"
        />
        <BaseNode
          :link="{ to: { query: { work: work.slug } } }"
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
          'node-selected': $route.query.related === work.slug,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <div
          class="projects-constellation__node-nucleus"
          :data-node="JSON.stringify(work)"
          aria-hidden="true"
        />
        <BaseNode
          :link="{ to: { query: { related: work.slug } } }"
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
          'node-selected': $route.query.year === `${year}`,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <div
          class="projects-constellation__node-nucleus"
          :data-node="
            JSON.stringify({
              _type: 'year',
              year: year,
            })
          "
          aria-hidden="true"
        />
        <BaseNode
          :link="{ to: { query: { year: year } } }"
          :node-type="'year'"
          >{{ year }}</BaseNode
        >
      </div>
    </nav>
    <nav v-if="workForms?.length">
      <div
        v-for="(form, index) in workForms"
        :key="form._id"
        class="projects-constellation__node-container"
        :class="{
          'node-active': activeWorkForms.includes(form.slug),
          'node-selected': $route.query.workForm === form.slug,
        }"
        :style="{
          transitionDelay: `${index * 0.01}s`,
        }"
      >
        <div
          class="projects-constellation__node-nucleus"
          :data-node="JSON.stringify(form)"
          aria-hidden="true"
        />
        <BaseNode
          :link="{ to: { query: { workForm: form.slug } } }"
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

.projects-constellation__canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
}

.projects-constellation__node-container {
  position: absolute;
  top: 0;
  left: 0;
  /* transition:
    left 0.25s ease-in-out,
    top 0.25s ease-in-out; */

  .projects-constellation:has(.node-active) &:not(.node-active) {
    visibility: hidden;
  }
}

.projects-constellation__node-nucleus {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.6em;
  height: 0.6em;
  border-radius: 50%;
  z-index: -1;
  background-color: lime;
}
</style>
