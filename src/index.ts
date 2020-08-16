import { PluginEntrypoint } from 'nexus/plugin'

export const dynamicMutationPlugin: PluginEntrypoint = () => ({
  packageJsonPath: require.resolve('../package.json'),
  runtime: {
    module: require.resolve('./runtime'),
    export: 'plugin',
  },
  worktime: {
    module: require.resolve('./worktime'),
    export: 'plugin',
  },
})
