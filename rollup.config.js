import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import json from "rollup-plugin-json"
import builtins from "rollup-plugin-node-builtins"
import commonjs from "rollup-plugin-commonjs"
import { terser } from "rollup-plugin-terser"

let plugins = [
  resolve({
    preferBuiltins: true,
    browser: true
  }),
  babel({
    exclude: "node_modules/**"
  }),
  json(),
  commonjs(),
  builtins(),
  terser()
]
export default {
  input: "lib/index.js",
  output: {
    sourcemap: true,
    format: "cjs",
    name: "bn-client-sdk",
    file: "dist/bn-client-sdk.js"
  },
  plugins: plugins
}
