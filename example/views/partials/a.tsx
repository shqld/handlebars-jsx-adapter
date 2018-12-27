import { renderPartial, renderHelper } from '../../src/handlebars'

if (process.env.NODE_ENV === 'preact') {
  var { h } = require('preact')
} else {
  var React = require('react')
}

export default ({ message }) => (
  <div>
    <p>jsx: {message}</p>
    {renderPartial('b', { message })}
    {renderHelper('c', 'asdf')}
  </div>
)
