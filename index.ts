import {
  arg,
  dynamicOutputMethod,
  inputObjectType,
  nonNull,
  objectType,
  plugin,
} from 'nexus';
import {
  FieldResolver,
  InputDefinitionBlock,
  NexusNonNullDef,
  NexusOutputFieldConfig,
  NonNullConfig,
  OutputDefinitionBlock,
} from 'nexus/dist/core';

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

  input?: (t: InputDefinitionBlock<TypeName>) => void | NexusNonNullDef<any>;

  payload: (
    t: OutputDefinitionBlock<TypeName>
  ) => void | NexusOutputFieldConfig<TypeName, FieldName>['type'];

  resolve: FieldResolver<TypeName, FieldName>;
} & NexusGenPluginFieldConfig<TypeName, FieldName>;

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
