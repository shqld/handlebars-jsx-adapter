/// <reference lib="esnext" />

import * as path from 'path'
import { h } from 'preact'
import { render } from 'preact-render-to-string'
import { TemplateDelegate, HelperOptions, RuntimeOptions } from 'handlebars'

interface AdapterConfig {
  componentsDir: string
  partialOptions?: RuntimeOptions
  helperOptions?: HelperOptions
}

export default (
  handlebars: typeof Handlebars,
  options: Partial<AdapterConfig>
) => {
  const config: AdapterConfig = {
    componentsDir: process.cwd(),
    ...options,
  }

  const componentsDir = path.isAbsolute(config.componentsDir)
    ? config.componentsDir
    : path.resolve(config.componentsDir)

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
    const rendered = template(props, config.partialOptions)

    renderedQueue.push(rendered)

    return key
  }

  function renderHelper(helperName: string, ...args): string | null {
    const hash = args.pop() || {}

    const helper = helpers[helperName]
    const resolved: string = helper(...args, { ...config.helperOptions, hash })

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

    const component = require(path.join(componentsDir, compName)).default
    const html = render(h(component, props))

    const rehydrated = rehydrate(html)

    return rehydrated
  }

  return { renderPartial, renderHelper, renderJsx }
}
