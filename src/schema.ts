import {
  plugin,
  objectType,
  inputObjectType,
  dynamicOutputMethod,
  arg,
} from '@nexus/schema'

export const dynamicMutationPlugin = (connectionPluginConfig?: any) => {
  const pluginConfig = { ...connectionPluginConfig }

  return plugin({
    name: 'Dynamic Mutation Plugin',
    onInstall(b) {
      const { nexusFieldName = 'dynamicMutation' } = pluginConfig

      b.addType(
        dynamicOutputMethod({
          name: nexusFieldName,
          factory({ typeDef: t, args: factoryArgs }) {
            const [fieldName, fieldConfig] = factoryArgs
            const payloadName = `${fieldConfig.name}Payload`
            const inputName = `${fieldConfig.name}Input`

            if (!b.hasType(payloadName)) {
              b.addType(
                objectType({
                  name: payloadName,
                  nonNullDefaults: fieldConfig.nonNullDefaults,
                  definition: fieldConfig.payload,
                })
              )
            }

            if (fieldConfig.input && !b.hasType(inputName)) {
              b.addType(
                inputObjectType({
                  name: inputName,
                  nonNullDefaults: fieldConfig.nonNullDefaults,
                  definition: fieldConfig.input,
                })
              )
            }

            // Add the field to the type.
            t.field(fieldName, {
              type: payloadName as any,
              description: fieldConfig.description,
              args: fieldConfig.input
                ? {
                    input: arg({
                      type: inputName as any,
                      required: true,
                    }),
                  }
                : {},
              resolve: fieldConfig.resolve,
            })
          },
        })
      )

      // TODO: Deprecate this syntax
      return { types: [] }
    },
  })
}
