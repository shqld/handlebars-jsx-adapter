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

  const { helpers, partials } = handlebars

  const getTemplate = (partialName: string): TemplateDelegate => {
    if (templates[partialName]) return templates[partialName]

    const template = handlebars.compile(partials[partialName])
    templates[partialName] = template
    return template
  }

  function renderPartial(partialName: string, props: object): string {
    const template = getTemplate(partialName)
    const rendered = template(props, partialOptions)

    renderedQueue.push(rendered)

    return key
  }

  function renderHelper(helperName: string, ...args): string | null {
    const hash = args.pop() || {}

    const helper = helpers[helperName]
    const resolved: string = helper(...args, { hash })

    if (!resolved) {
      return null
    }

    renderedQueue.push(resolved)

    return key
  }

  const rehydrate = (html: string): string =>
    html.replace(rKey, () => renderedQueue.shift()!)

  function renderJsx(...args) {
    const options: HelperOptions = args.length >= 3 ? args.pop() : {}
    const [compName, props = {}] = args

    Object.assign(props, options.hash)

    let module
    for (const dirPath of componentsDirs) {
      try {
        module = require(path.join(dirPath, compName))
        break
      } catch (err) {}
    }

    if (!module) {
      throw new Error(`'${compName}' not found.`)
    }

    const component = module.default || module
    const html = render(createElement(component, props))

    const rehydrated = rehydrate(html)

    return rehydrated
  }

  return { renderPartial, renderHelper, renderJsx }
}
