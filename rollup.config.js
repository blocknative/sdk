import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import json from "rollup-plugin-json"
import builtins from "rollup-plugin-node-builtins"
import commonjs from "rollup-plugin-commonjs"
import { terser } from "rollup-plugin-terser"

let plugins = [
  babel({
    exclude: "node_modules/**"
  }),
  json(),
  resolve(),
  commonjs(),
  builtins()
]
export default [
  {
    input: "lib/index-iife.js",
    output: {
      sourcemap: true,
      format: "umd",
      name: "blocknative",
      file: "dist/umd/bn-sdk.js",
      esModule: false
    },
    plugins: [...plugins, terser()]
  },
  {
    input: "lib/index.js",
    external: ["ethereumjs-util", "sturdy-websocket", "ws"],
    plugins,
    output: {
      file: "dist/esm/index.js",
      format: "esm"
    }
  }
]
