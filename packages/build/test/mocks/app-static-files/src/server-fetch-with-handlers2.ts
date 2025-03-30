import app from './server'

export default {
  fetch: app.fetch,
  scheduled: function () {
    return 'Hello World 2'
  },
}
