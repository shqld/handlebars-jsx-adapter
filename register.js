const babel = require('@babel/register')

babel({
  extensions: ['.ts', '.tsx'],
  sourceMaps: 'both',
})
