import { RuntimePlugin } from 'nexus/plugin'

import { dynamicMutationPlugin } from './schema'

export const plugin: RuntimePlugin = () => (project) => {
  return {
    context: {
      create: (_req) => {
        return {
          'nexus-plugin-dynamic-mutation': 'hello world!',
        }
      },
      typeGen: {
        fields: {
          'nexus-plugin-dynamic-mutation': 'string',
        },
      },
    },
    schema: {
      plugins: [dynamicMutationPlugin({})],
    },
  }
}
