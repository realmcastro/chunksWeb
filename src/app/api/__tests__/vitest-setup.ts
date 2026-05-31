/*
! Must set TEST_DB_PATH BEFORE any module that imports sqlite.ts is loaded.
! vitest setupFiles run before test module resolution — this is safe.
*/
process.env.TEST_DB_PATH = ':memory:';
