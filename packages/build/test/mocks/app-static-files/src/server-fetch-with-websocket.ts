import app from './server'

export default {
  fetch: app.fetch,
  websocket: {
    open: () => {},
  },
}
