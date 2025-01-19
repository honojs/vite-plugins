type ServeStaticHookOptions = {
  filePaths?: string[]
  root?: string
}

export const serveStaticHook = (appName: string, options: ServeStaticHookOptions) => {
  let code = ''
  for (const path of options.filePaths ?? []) {
    code += `${appName}.use('${path}', serveStatic({ root: '${options.root ?? './'}' }))\n`
  }
  return code
}
