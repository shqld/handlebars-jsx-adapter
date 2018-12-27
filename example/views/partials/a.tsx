import { h } from 'preact'
import { renderPartial, renderHelper } from '../../src/handlebars'

export default ({ message }) => (
  <div>
    <p>jsx: {message}</p>
    {renderPartial('b', { message })}
    {renderHelper('c', 'asdf')}
  </div>
)
