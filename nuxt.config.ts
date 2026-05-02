// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  runtimeConfig: {
    tmdbToken: ''
  },
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/*']
    }
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
      title: 'Movie Night',
      meta: [
        { name: 'theme-color', content: '#19171f' }
      ],
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.dataset.theme=t}catch(e){}})()`,
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap' }
      ]
    }
  }
})
