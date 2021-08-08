import {
  arg,
  dynamicOutputMethod,
  inputObjectType,
  nonNull,
  objectType,
  plugin,
  unionType,
} from 'nexus';
import {NexusNonNullDef} from 'nexus/dist/core';

import {MutationDynamicFieldConfig, MutationDynamicPluginConfig} from './types';
import {capitalizeFirstLetter, getFirstValueOfObject} from './utils';

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
                payload: core.NexusOutputFieldConfig<TypeName, FieldName>['type'] | ((t: core.ObjectDefinitionBlock<TypeName>) => void) | Record<string, core.NexusOutputFieldConfig<TypeName, FieldName>["type"] | ((t: core.ObjectDefinitionBlock<TypeName>) => void)>,
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

            /**
             * Add Input Object
             *
             */
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

            /**
             * Add Single Payload Object
             *
             */
            if (typeof fieldConfig.payload === 'string') {
              if (!b.hasType(fieldConfig.payload)) {
                throw new Error(
                  `Nexus Dynamic Plugin: ${payloadName} must have a type`
                );
              }
            } else if (typeof fieldConfig.payload === 'function') {
              if (!b.hasType(payloadName)) {
                b.addType(
                  objectType({
                    name: payloadName,
                    nonNullDefaults:
                      fieldConfig.nonNullDefaults ??
                      pluginConfig.nonNullDefaults,
                    definition: fieldConfig.payload,
                  })
                );
              }
            } else if (typeof fieldConfig.payload === 'object') {
              /**
               * And Member Object Types
               *
               */
              const totalPayload = Object.values(fieldConfig.payload).length;
              const allMemberUnion: string[] = [];

              if (totalPayload === 0) {
                throw new Error(
                  `Nexus Dynamic Plugin: ${payloadName} must have at least one type`
                );
              } else if (totalPayload > 1) {
                for (const [payloadUnionKey, payloadUnionDef] of Object.entries(
                  fieldConfig.payload
                )) {
                  const memberName = `${
                    fieldConfig.name
                  }${capitalizeFirstLetter(payloadUnionKey)}`;

                  if (typeof payloadUnionDef === 'function') {
                    allMemberUnion.push(memberName);
                    if (!b.hasType(memberName)) {
                      b.addType(
                        objectType({
                          name: memberName,
                          nonNullDefaults:
                            fieldConfig.nonNullDefaults ??
                            pluginConfig.nonNullDefaults,
                          definition: payloadUnionDef,
                        })
                      );
                    }
                  } else {
                    allMemberUnion.push(payloadUnionDef as string);
                  }
                }
              }

              /**
               * Defined Single Payload Object
               * or PayloadUnion
               */
              if (!b.hasType(payloadName)) {
                switch (allMemberUnion.length) {
                  case 0:
                  case 1:
                    {
                      const payloadFn = getFirstValueOfObject<any>(
                        fieldConfig.payload
                      );
                      if (typeof payloadFn === 'function') {
                        b.addType(
                          objectType({
                            name: payloadName,
                            nonNullDefaults:
                              fieldConfig.nonNullDefaults ??
                              pluginConfig.nonNullDefaults,
                            definition: payloadFn,
                          })
                        );
                      }
                    }
                    break;

                  default:
                    b.addType(
                      unionType({
                        name: payloadName,
                        definition(t) {
                          t.members(...allMemberUnion);
                        },
                        resolveType(root) {
                          return root.__typename;
                        },
                      })
                    );
                }
              }
            } else {
              throw new Error(
                `Nexus Dynamic Plugin: ${payloadName} must be an object, string or function.`
              );
            }

            /**
             * Add the field to the type
             *
             */
            t.field(fieldName, {
              type:
                typeof fieldConfig.payload === 'string' &&
                b.hasType(fieldConfig.payload)
                  ? fieldConfig.payload
                  : b.hasType(payloadName)
                  ? payloadName
                  : getFirstValueOfObject<any>(fieldConfig.payload as any),
              description: fieldConfig.description,
              args:
                fieldConfig.input instanceof NexusNonNullDef
                  ? {input: nonNull(fieldConfig.input.ofNexusType)}
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
