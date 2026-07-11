// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV === 'development'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://use.typekit.net/ycs4coo.css' },
      ],
    },
  },
  css: ['~/assets/css/index.css'],
  devtools: { enabled: true },
  modules: ['@nuxtjs/sanity'],
  sanity: {
    projectId: 'frpm2ucf',
    dataset: 'production',
    useCdn: !isDev,
    typegen: {
      enabled: true,
      schemaTypesPath: '../studio-gmc-prototype/schemaTypes',
      queryPaths: ['./app/assets/groq/*.ts'],
    },
  },
})
