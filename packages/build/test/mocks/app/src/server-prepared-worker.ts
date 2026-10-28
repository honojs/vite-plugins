import app from './server-prepared'

export default {
  fetch: app.fetch,
  scheduled: () => 'scheduled',
}
