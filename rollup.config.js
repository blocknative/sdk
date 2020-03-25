import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'

const pkg = require('./package.json')

export default [
  {
    input: `src/index.ts`,
    output: {
      file: pkg.main,
      name: 'bncSdk',
      format: 'umd',
      globals: ['SturdyWebSocket']
    },
    plugins: [
      json(),
      resolve(),
      commonjs(),
      typescript({ useTsconfigDeclarationDir: true })
    ]
  },
  {
    input: `src/index.ts`,
    output: { file: pkg.module, format: 'esm' },
    external: ['sturdy-websocket', 'crypto-es'],
    plugins: [
      json(),
      resolve(),
      typescript({ useTsconfigDeclarationDir: true })
    ]
  }
]
