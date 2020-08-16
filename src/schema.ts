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
                  definition: fieldConfig.definitionPayload,
                })
              )
            }

            if (fieldConfig.definitionInput && !b.hasType(inputName)) {
              b.addType(
                inputObjectType({
                  name: inputName,
                  definition: fieldConfig.definitionInput,
                })
              )
            }

            // Add the field to the type.
            t.field(fieldName, {
              args: fieldConfig.definitionInput
                ? {
                    input: arg({
                      type: inputName as any,
                      required: true,
                    }),
                  }
                : {},
              type: payloadName as any,
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
