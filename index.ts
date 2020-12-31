import {
  plugin,
  objectType,
  inputObjectType,
  dynamicOutputMethod,
  arg,
  nonNull,
} from 'nexus';
import {NonNullConfig} from 'nexus/dist/core';

interface MutationDynamicPluginConfig {
  /**
   * The method name in the objectType definition block
   *
   * @default 'dynamicMutation'
   */
  nexusFieldName?: string;

  /**
   * Configures the default "nonNullDefaults" settings
   *
   */
  nonNullDefaults?: NonNullConfig;
}

type MutationDynamicFieldConfig<
  TypeName extends string = any,
  FieldName extends string = any
> = {
  name: string;

  description?: string;

  /**
   * Configures the default "nonNullDefaults" settings
   *
   */
  nonNullDefaults?: NonNullConfig;

  input: never;

  payload: never;

  resolve: never;
} & NexusGenPluginFieldConfig<TypeName, FieldName>;

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
          // TODO: Improve Type definitions
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              config: {
                name: string,
                description?: string,
                nonNullDefaults?: core.NonNullConfig,
                input?: (t: core.InputDefinitionBlock<TypeName>) => void,
                payload: (t: core.OutputDefinitionBlock<TypeName>) => void,
                resolve: core.FieldResolver<TypeName, any>
              }
            ): void`,
          factory({typeDef: t, args: factoryArgs}) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              MutationDynamicFieldConfig,
            ];

            const inputName = `${fieldConfig.name}Input`;
            const payloadName = `${fieldConfig.name}Payload`;

            if (fieldConfig.input && !b.hasType(inputName)) {
              b.addType(
                inputObjectType({
                  name: inputName,
                  nonNullDefaults:
                    fieldConfig.nonNullDefaults ?? pluginConfig.nonNullDefaults,
                  definition: fieldConfig.input,
                }),
              );
            }

            if (!b.hasType(payloadName)) {
              b.addType(
                objectType({
                  name: payloadName,
                  nonNullDefaults:
                    fieldConfig.nonNullDefaults ?? pluginConfig.nonNullDefaults,
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
