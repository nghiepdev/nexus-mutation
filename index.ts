import {
  plugin,
  objectType,
  inputObjectType,
  dynamicOutputMethod,
  arg,
  nonNull,
} from 'nexus';

interface MutationDynamicPluginConfig {
  /**
   * The method name in the objectType definition block
   *
   * @default 'dynamicMutation'
   */

  nexusFieldName?: string;
}

export const mutationPayloadPlugin = (
  connectionPluginConfig?: MutationDynamicPluginConfig,
) => {
  const pluginConfig: MutationDynamicPluginConfig = {
    ...connectionPluginConfig,
  };

  return plugin({
    name: 'Dynamic Mutation Plugin',
    onInstall(b) {
      const {nexusFieldName = 'dynamicMutation'} = pluginConfig;

      b.addType(
        dynamicOutputMethod({
          name: nexusFieldName,
          // TODO: Improve typeDefinition :(
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              config: {
                name: string,
                description?: string,
                nonNullDefaults?: core.NonNullConfig,
                input?: (t: core.InputDefinitionBlock<any>) => void,
                payload: (t: any) => void,
                resolve: core.FieldResolver<TypeName, any>
              }
            ): void`,
          factory({typeDef: t, args: factoryArgs}) {
            const [fieldName, fieldConfig] = factoryArgs;
            const inputName = `${fieldConfig.name}Input`;
            const payloadName = `${fieldConfig.name}Payload`;

            if (fieldConfig.input && !b.hasType(inputName)) {
              b.addType(
                inputObjectType({
                  name: inputName,
                  nonNullDefaults: fieldConfig.nonNullDefaults,
                  definition: fieldConfig.input,
                }),
              );
            }

            if (!b.hasType(payloadName)) {
              b.addType(
                objectType({
                  name: payloadName,
                  nonNullDefaults: fieldConfig.nonNullDefaults,
                  definition: fieldConfig.payload,
                }),
              );
            }

            // Add the field to the type.
            t.field(fieldName, {
              type: payloadName,
              description: fieldConfig.description,
              args: fieldConfig.input
                ? {
                    input: nonNull(
                      arg({
                        type: inputName,
                      }),
                    ),
                  }
                : {},
              resolve: fieldConfig.resolve,
            });
          },
        }),
      );
    },
  });
};
