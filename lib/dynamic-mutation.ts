import {
  arg,
  dynamicOutputMethod,
  inputObjectType,
  nonNull,
  objectType,
  plugin,
} from 'nexus';
import {NexusNonNullDef} from 'nexus/dist/core';

import {MutationDynamicPluginConfig, MutationDynamicFieldConfig} from './types';

export const mutationPayloadPlugin = (
  connectionPluginConfig?: MutationDynamicPluginConfig
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
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              config: {
                name: string,
                description?: string,
                nonNullDefaults?: core.NonNullConfig,
                input?: core.NexusNonNullDef<any> | ((t: core.InputDefinitionBlock<TypeName>) => void),
                payload: core.NexusOutputFieldConfig<TypeName, FieldName>["type"] | ((t: core.OutputDefinitionBlock<TypeName>) => void),
                resolve: core.FieldResolver<TypeName, FieldName>
              }
            ): void`,
          factory({typeDef: t, args: factoryArgs}) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              MutationDynamicFieldConfig
            ];

            const inputName = `${fieldConfig.name}Input`;
            const payloadName = `${fieldConfig.name}Payload`;

            if (
              typeof fieldConfig.input === 'function' &&
              !b.hasType(inputName)
            ) {
              b.addType(
                inputObjectType({
                  name: inputName,
                  nonNullDefaults:
                    fieldConfig.nonNullDefaults ?? pluginConfig.nonNullDefaults,
                  definition: fieldConfig.input,
                })
              );
            }

            if (
              typeof fieldConfig.payload === 'function' &&
              !b.hasType(payloadName)
            ) {
              b.addType(
                objectType({
                  name: payloadName,
                  nonNullDefaults:
                    fieldConfig.nonNullDefaults ?? pluginConfig.nonNullDefaults,
                  definition: fieldConfig.payload,
                })
              );
            }

            // Add the field to the type.
            t.field(fieldName, {
              type:
                typeof fieldConfig.payload === 'function'
                  ? payloadName
                  : fieldConfig.payload,
              description: fieldConfig.description,
              args:
                fieldConfig.input instanceof NexusNonNullDef
                  ? {input: fieldConfig.input.ofNexusType}
                  : typeof fieldConfig.input === 'function'
                  ? {
                      input: nonNull(
                        arg({
                          type: inputName,
                        })
                      ),
                    }
                  : {},
              resolve: fieldConfig.resolve,
            });
          },
        })
      );
    },
  });
};
