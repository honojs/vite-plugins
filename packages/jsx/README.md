# @hono/vite-jsx

The Vite plugin for hono/jsx.

- swap only the edited component during development, and keep its state
- set up JSX (the automatic runtime, from `hono/jsx`)
- use `hono/jsx/dom` instead of `hono/jsx` in the browser

## Usage

### Installation

```bash
npm i -D @hono/vite-jsx
```

### Settings

```js
// vite.config.js
import honoJsx from '@hono/vite-jsx'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [honoJsx()],
})
```

Requires hono 4.13.1 or later and Vite 8.

## Options

### include

The files to swap in place. The default value is `/\.[tj]sx?$/`.

### exclude

The files to leave out. The default value is `/\/node_modules\//`. Keep `node_modules` in the list when you set it.

```js
honoJsx({ exclude: [/\/legacy\//, /\/node_modules\//] })
```

## What happens when you edit

| What you edit | What happens |
|---|---|
| A component | Only that component is swapped. Its state is kept |
| The body of an effect, `useMemo` or `useCallback` | It runs again with the edited code |
| Adding or removing a hook, also inside a custom hook | The page reloads |
| A file that also exports something other than components | The components that import it are updated |
| A component wrapped in `memo()` | It is swapped, but its state goes back to the initial value |

State is matched to hooks by the order they are called in. A different order cannot be swapped correctly, so the page reloads.

A component is a top-level function with a capitalized name that calls JSX or a hook.

## Authors

- ashunar0 <https://github.com/ashunar0>

## License

MIT
