import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import json from "rollup-plugin-json"
import builtins from "rollup-plugin-node-builtins"
import commonjs from "rollup-plugin-commonjs"
import { terser } from "rollup-plugin-terser"

export default [
  {
    input: "src/index.js",
    output: {
      format: "iife",
      name: "blocknative",
      file: "dist/iife/bn-sdk.js",
      esModule: false
    },
    plugins: [
      builtins(),
      resolve({
        preferBuiltins: true
      }),
      babel({
        exclude: "node_modules/**"
      }),
      json(),
      commonjs(),
      terser()
    ]
  },
  {
    input: "src/index.js",
    external: ["ethereumjs-util", "sturdy-websocket", "ow"],
    plugins: [json(), commonjs(), babel({ exclude: "node_modules/**" })],
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
