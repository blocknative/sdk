import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'

export default [
  {
    input: `src/index.ts`,
    output: {
      dir: 'dist/iife/',
      format: 'iife',
      name: 'bncSdk',
      globals: ['SturdyWebSocket', 'crypto-es']
    },
    plugins: [
      json(),
      resolve(),
      commonjs(),
      typescript({ useTsconfigDeclarationDir: true, clean: true })
    ]
  },
  {
    input: `src/index.ts`,
    output: [
      {
        format: 'esm',
        dir: 'dist/esm/'
      }
    ],
    external: ['sturdy-websocket', 'crypto-es'],
    plugins: [
      json(),
      resolve(),
      typescript({ useTsconfigDeclarationDir: true, clean: true })
    ]
  },
  {
    input: `src/index.ts`,
    output: [
      {
        format: 'cjs',
        dir: 'dist/cjs/'
      }
    ],
    plugins: [
      json(),
      resolve(),
      commonjs({ include: /node_modules/ }),
      typescript({ useTsconfigDeclarationDir: true, clean: true })
    ]
  }
]
