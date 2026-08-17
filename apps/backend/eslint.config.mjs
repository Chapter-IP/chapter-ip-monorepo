import { getConfig } from '@repo/eslint-config/nestjs'


/** @type {import("eslint").Linter.Config} */
export default getConfig({ tsconfigRootDir: import.meta.dirname })
