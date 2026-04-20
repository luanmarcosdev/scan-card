const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",

  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ["**/*.spec.ts"],

  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/test/integration/"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  }
};