/// <reference lib="esnext" />

import * as path from 'path'
import * as fs from 'fs'
import { TemplateDelegate, HelperOptions, RuntimeOptions } from 'handlebars'

interface AdapterConfig {
  handlebars: typeof Handlebars
  createElement: Function
  render: Function
  componentsDir?: string | Array<string>
  partialOptions?: RuntimeOptions
}

const normalizeArray = <T>(some: T | Array<T>): Array<T> =>
  Array.isArray(some) ? some : [some]

export default ({
  handlebars,
  componentsDir = process.cwd(),
  createElement,
  render,
  partialOptions = {},
}: AdapterConfig) => {
  const componentsDirs = normalizeArray(componentsDir).map(dirPath =>
    path.isAbsolute(dirPath) ? dirPath : path.resolve(dirPath)
  )

  const key = 'hbs' + Date.now() + 'jsx'
  const rKey = new RegExp(key, 'g')

  const templates = {}
  const renderedQueue: Array<string> = []
  let currentData = null

  const { helpers, partials } = handlebars

  const getTemplate = (partialName: string): TemplateDelegate => {
    if (templates[partialName]) return templates[partialName]

    const template = handlebars.compile(partials[partialName])
    templates[partialName] = template
    return template
  }

  function renderPartial(partialName: string, props: object): string {
    const template = getTemplate(partialName)
    const rendered = template(props, { ...partialOptions, data: currentData })

    renderedQueue.push(rendered)

    return key
  }

  function renderHelper(helperName: string, ...args): string | null {
    const hash = args.pop() || {}

    const helper = helpers[helperName]
    const resolved: string = helper(...args, { hash, data: currentData })

    if (!resolved) {
      return null
    }

    renderedQueue.push(resolved)

    return key
  }

  const rehydrate = (html: string): string =>
    html.replace(rKey, () => renderedQueue.shift()!)

  function renderJsx(...args) {
    const options: HelperOptions = args.pop()
    const [compName, rawProps = {}] = args

    const props = Object.assign({}, rawProps, options)

    let module, requireErr
    for (const dirPath of componentsDirs) {
      try {
        module = require(path.join(dirPath, compName))
        break
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') requireErr = err
      }
    }

    if (requireErr) {
      throw requireErr
    }

    if (!module) {
      const err: Error & { code?: string } = new Error(
        [
          `Cannot find module '${compName}'`,
          ...componentsDirs.map(
            dirPath => `  - ${path.join(dirPath, compName)}`
          ),
        ].join('\n')
      )
      err.code = 'MODULE_NOT_FOUND'

      throw err
    }

    const component = module.default || module
    currentData = options.data
    const html = render(createElement(component, props))

    const rehydrated = rehydrate(html)

    return rehydrated
  }

  return { renderJsx, renderPartial, renderHelper }
}
