# Vite Plugins for Hono

This is a monorepo managing Vite Plugins for Hono.

## Available Plugins

- [@hono/vite-dev-server](./packages/dev-server/)
- [@hono/vite-cloudflare-pages](./packages/cloudflare-pages/)

## How to contribute

The specific flow is as follows

1. Fork this repository.
2. Write your plugins.
3. Create the pull request.

We use [changesets](https://github.com/changesets/changesets) to manage releases and CHANGELOG.
Run the following command at the top level to describe any changes.

```sh
yarn changeset
```

## Authors

- Yusuke Wada <https://github.com/yusukebe>

## License

MIT
