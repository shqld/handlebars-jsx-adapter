import fs from 'fs'
import path from 'path'
import handlebars from './handlebars'

const templates = {}

fs.readdirSync(path.resolve('example/views')).forEach(filename => {
  const { name, ext } = path.parse(filename)
  if (ext === '.html') {
    const file = fs.readFileSync(
      path.resolve('example/views', filename),
      'utf8'
    )
    templates[name] = handlebars.compile(file)
  }
})

function render(name, context) {
  const template = templates[name]
  const rendered = template(context)

  console.log(rendered)
}

render('main', { props: { message: 'hello' } })
render('main', { props: { message: 'asdf' } })
