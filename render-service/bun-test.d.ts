// Minimal ambient types for Bun's test runner (bun-types not vendored).
declare module 'bun:test' {
  export const test: any;
  export const describe: any;
  export const expect: any;
  export const mock: any;
  export const beforeAll: any;
  export const afterAll: any;
  export const beforeEach: any;
  export const afterEach: any;
}
