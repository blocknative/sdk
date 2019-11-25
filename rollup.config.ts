import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'

const pkg = require('./package.json')

const libraryName = 'bnc-sdk'

export default [
  {
    input: `src/${libraryName}.ts`,
    output: {
      file: pkg.main,
      name: camelCase(libraryName),
      format: 'umd',
      sourcemap: true,
      globals: ['SturdyWebSocket']
    },
    plugins: [
      json(),
      typescript({ useTsconfigDeclarationDir: true }),
      resolve(),
      commonjs(),
      sourceMaps()
    ]
  },
  {
    input: `src/${libraryName}.ts`,
    output: { file: pkg.module, format: 'es', sourcemap: true },
    external: ['sturdy-websocket'],
    watch: {
      include: 'src/**'
    },
    plugins: [
      json(),
      typescript({ useTsconfigDeclarationDir: true }),
      resolve(),
      commonjs(),
      sourceMaps()
    ]
  }
]
