import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import json from "rollup-plugin-json"
import builtins from "rollup-plugin-node-builtins"
import commonjs from "rollup-plugin-commonjs"
import { terser } from "rollup-plugin-terser"

let plugins = [
  resolve({
    preferBuiltins: true
  }),
  babel({
    exclude: "node_modules/**"
  }),
  json(),
  commonjs(),
  builtins()
]
export default [
  {
    input: "lib/index.js",
    output: {
      sourcemap: true,
      format: "iife",
      name: "blocknative",
      file: "dist/iife/bn-sdk.js"
    },
    plugins: [...plugins, terser()]
  },
  {
    input: "lib/index.js",
    external: ["ethereumjs-util", "sturdy-websocket"],
    plugins,
    output: [
      {
        dir: "dist/esm",
        format: "esm"
      },
      {
        dir: "dist/cjs",
        format: "cjs"
      }
    ]
  }
]
