# handlebars-jsx-adapter

Gives handlebars interoperability with JSX.

## Example

In a `.hbs` file, you can call jsx component like this

```hbs
{{{jsx 'my-component' props}}}
```

NOTE: never forget to use the "triple-stash" `{{{` for avoiding HTML escape

In a `.jsx` file, you can call handlebars partials and helpers

```jsx
const MyComponent = ({ message }) => (
  <div>
    <p>{message}</p>
    {renderPartial('my-partial', { message })}
    {renderHelper('my-helper', message)}
  </div>
)
```

See `/example` for detail.

## Install

```
yarn add handlebars-jsx-adapter
```

## Usage

```js
const handlebars = Handlebars.create()

// register partials and helpers here

const { renderPartial, renderHelper, renderJsx } = adapter(handlebars, {
  componentsDir: 'example/views/partials',
})

handlebars.registerHelper('jsx', renderJsx)
```
