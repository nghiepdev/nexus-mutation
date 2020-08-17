import { RuntimePlugin } from 'nexus/plugin'

import { dynamicMutationPlugin } from './schema'

export const plugin: RuntimePlugin = () => (project) => {
  return {
    schema: {
      plugins: [dynamicMutationPlugin({})],
    },
  }
}
