import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import { h } from 'preact'
import { render } from 'preact-render-to-string'
import adapter from '../../lib'

const handlebars = Handlebars.create()

fs.readdirSync(path.resolve('example/views/partials')).forEach(filename => {
  const { name, ext } = path.parse(filename)
  if (ext === '.html') {
    const file = fs.readFileSync(
      path.resolve('example/views/partials', filename),
      'utf8'
    )
    handlebars.registerPartial(name, file)
  }
})

fs.readdirSync(path.resolve('example/views/helpers')).forEach(filename => {
  const { name, ext } = path.parse(filename)
  if (ext === '.ts') {
    const func = require(path.resolve('example/views/helpers', filename))
      .default
    handlebars.registerHelper(name, func)
  }
})

const { renderPartial, renderHelper, renderJsx } = adapter({
  handlebars,
  componentsDir: 'example/views/partials',
  createElement: h,
  render,
})

handlebars.registerHelper('jsx', renderJsx)

export { renderPartial, renderHelper }
export default handlebars
