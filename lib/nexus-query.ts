import {
  arg,
  dynamicOutputMethod,
  enumType,
  inputObjectType,
  list,
  nonNull,
  nullable,
  objectType,
  plugin,
  unionType,
} from 'nexus';
import {
  NexusListDef,
  NexusNonNullDef,
  NexusNullDef,
  UnionMembers,
} from 'nexus/dist/core';
import {singular} from 'pluralize';

import type {QueryPluginConfig, QueryPluginFieldConfig} from './types';
import {omit, capitalizeFirstLetter, getFirstValueOfObject} from './utils';

export const dynamicQuery = (pluginConfig?: QueryPluginConfig) => {
  return plugin({
    name: 'Nexus Query Plugin',
    onInstall(b) {
      const nexusFieldName = pluginConfig?.nexusFieldName ?? 'dynamicQuery';
      const sortTypeName = pluginConfig?.sortTypeName ?? 'SortType';
      const sortTypeValues = pluginConfig?.sortTypeValues ?? ['asc', 'desc'];

      b.addType(
        dynamicOutputMethod({
          name: nexusFieldName,
          typeDefinition: `<FieldName extends string>(
              fieldName: FieldName,
              config: Omit<core.FieldOutConfig<TypeName, FieldName>, 'type'> & {
                name: string,
                nonNullDefaults?: core.NonNullConfig,
                filter?: core.AllNexusArgsDefs | ((t: core.InputDefinitionBlock<TypeName>) => void),
                sortFields?: string[],
                result: core.NexusOutputFieldConfig<TypeName, FieldName>['type'] | ((t: core.ObjectDefinitionBlock<TypeName>) => void) | Record<string, core.NexusOutputFieldConfig<TypeName, FieldName>["type"] | ((t: core.ObjectDefinitionBlock<TypeName>) => void)>,
                resultMeta?: {
                  list?: true | "list",
                  pagination?: core.NexusOutputFieldConfig<TypeName, FieldName>['type'] | Record<string, core.NexusOutputFieldConfig<TypeName, FieldName>["type"]>
                }
              }
            ): void`,
          factory({typeDef: t, args: factoryArgs}) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              QueryPluginFieldConfig
            ];

            const nonNullDefaults =
              fieldConfig.nonNullDefaults ?? pluginConfig?.nonNullDefaults;

            const isResultMetaValid =
              !!fieldConfig.resultMeta &&
              (!!fieldConfig.resultMeta.list ||
                (typeof fieldConfig.resultMeta.pagination === 'string' &&
                  b.hasType(fieldConfig.resultMeta.pagination)));

            const filterInputName = `${fieldConfig.name}FilterInput`;
            const sortInputName = `${fieldConfig.name}SortInput`;
            const resultName = `${fieldConfig.name}Result`;
            const dataName = isResultMetaValid
              ? (name => {
                  const typeName = singular(name);
                  if (b.hasType(typeName)) {
                    return `${typeName}Item`;
                  }
                  return typeName;
                })(fieldConfig.name)
              : resultName;

            /**
             * Add Sort Object
             *
             */
            if (fieldConfig.sortFields && !b.hasType(sortTypeName)) {
              b.addType(
                enumType({
                  name: sortTypeName,
                  members: {
                    ASC: sortTypeValues[0],
                    DESC: sortTypeValues[1],
                  },
                })
              );
            }

            /**
             * Add Filter Input Object
             *
             */
            if (
              typeof fieldConfig.filter === 'function' &&
              !b.hasType(filterInputName)
            ) {
              b.addType(
                inputObjectType({
                  name: filterInputName,
                  nonNullDefaults: nonNullDefaults,
                  definition: fieldConfig.filter,
                })
              );
            }

            /**
             * Add Sort Input Object
             *
             */
            if (
              Array.isArray(fieldConfig.sortFields) &&
              fieldConfig.sortFields.length > 0 &&
              !b.hasType(sortInputName)
            ) {
              b.addType(
                inputObjectType({
                  name: sortInputName,
                  nonNullDefaults,
                  definition(t) {
                    fieldConfig.sortFields?.forEach(field => {
                      t.field({
                        name: field,
                        type: sortTypeName as 'SortType',
                      });
                    });
                  },
                })
              );
            }

            /**
             * Add Data Object
             *
             */
            if (typeof fieldConfig.result === 'string') {
              if (!b.hasType(fieldConfig.result)) {
                throw new Error(
                  `Nexus Query Plugin: The ${fieldConfig.result} must have a type.`
                );
              }
            } else if (typeof fieldConfig.result === 'function') {
              if (!b.hasType(dataName)) {
                b.addType(
                  objectType({
                    name: dataName,
                    nonNullDefaults,
                    definition: fieldConfig.result,
                  })
                );
              }
            } else if (
              fieldConfig.result instanceof NexusNullDef ||
              fieldConfig.result instanceof NexusNonNullDef ||
              fieldConfig.result instanceof NexusListDef
            ) {
              // Nothing
            } else if (typeof fieldConfig.result === 'object') {
              /**
               * And Member Object Types
               *
               */
              const totalResult = Object.values(fieldConfig.result).length;
              const allMemberUnion: string[] = [];

              if (totalResult === 0) {
                throw new Error(
                  `Nexus Query Plugin: The ${fieldName}.result field must have at least one type.`
                );
              }

              if (totalResult > 1) {
                for (const [resultUnionKey, resultUnionDef] of Object.entries(
                  fieldConfig.result
                )) {
                  const memberName = `${
                    fieldConfig.name
                  }${capitalizeFirstLetter(resultUnionKey)}`;

                  if (typeof resultUnionDef === 'function') {
                    allMemberUnion.push(memberName);
                    if (!b.hasType(memberName)) {
                      b.addType(
                        objectType({
                          name: memberName,
                          nonNullDefaults,
                          definition: resultUnionDef,
                        })
                      );
                    }
                  } else {
                    allMemberUnion.push(resultUnionDef);
                  }
                }
              }

              /**
               * Add Data Object
               *
               */
              if (!b.hasType(dataName)) {
                switch (allMemberUnion.length) {
                  case 0:
                  case 1:
                    {
                      const payloadFn = getFirstValueOfObject<any>(
                        fieldConfig.result
                      );
                      if (typeof payloadFn === 'function') {
                        b.addType(
                          objectType({
                            name: dataName,
                            nonNullDefaults,
                            definition: payloadFn,
                          })
                        );
                      }
                    }
                    break;

                  default:
                    b.addType(
                      unionType({
                        name: dataName,
                        definition(t) {
                          t.members(...(allMemberUnion as UnionMembers));
                        },
                        resolveType(root) {
                          return root.__typename ?? allMemberUnion[0];
                        },
                      })
                    );
                }
              }
            } else {
              throw new Error(
                `Nexus Query Plugin: The ${fieldName}.result field is invalid.`
              );
            }

            /**
             * Add Result Object
             *
             */
            if (!b.hasType(resultName)) {
              b.addType(
                objectType({
                  name: resultName,
                  nonNullDefaults,
                  definition(t) {
                    const itemTypeName =
                      typeof fieldConfig.result === 'string' &&
                      b.hasType(fieldConfig.result)
                        ? fieldConfig.result
                        : fieldConfig.result instanceof NexusNullDef
                        ? nullable(fieldConfig.result.ofNexusType)
                        : fieldConfig.result instanceof NexusNonNullDef
                        ? nonNull(fieldConfig.result.ofNexusType)
                        : fieldConfig.result instanceof NexusListDef
                        ? list(fieldConfig.result.ofNexusType)
                        : b.hasType(dataName) &&
                          Object.keys(fieldConfig.result).length > 1
                        ? dataName
                        : getFirstValueOfObject<string>(
                            fieldConfig.result as any
                          );

                    if (fieldConfig?.resultMeta?.list === 'list') {
                      t.nonNull.list.nonNull.field('items', {
                        type: itemTypeName,
                      });
                    } else if (fieldConfig?.resultMeta?.list === true) {
                      t.nonNull.list.field('items', {
                        type: itemTypeName,
                      });
                    } else {
                      t.field('data', {
                        type: itemTypeName,
                      });
                    }

                    if (
                      typeof fieldConfig?.resultMeta?.pagination === 'string' &&
                      b.hasType(fieldConfig?.resultMeta?.pagination)
                    ) {
                      t.nonNull.field('pagination', {
                        type: fieldConfig.resultMeta.pagination,
                      });
                    }
                  },
                })
              );
            }

            /**
             * Add the field to the type
             *
             */
            t.field(fieldName, {
              ...omit(fieldConfig, ['name']),
              type:
                isResultMetaValid && b.hasType(resultName)
                  ? resultName
                  : dataName,
              args: {
                ...fieldConfig.args,
                ...(filter => {
                  if (typeof filter === 'string') {
                    return {filter};
                  }

                  if (typeof filter === 'function') {
                    return {
                      filter: arg({type: filterInputName}),
                    };
                  }

                  if (filter instanceof NexusNullDef) {
                    return {
                      filter: nullable(filter.ofNexusType),
                    };
                  }

                  if (filter instanceof NexusNonNullDef) {
                    return {
                      filter: nonNull(filter.ofNexusType),
                    };
                  }

                  if (filter instanceof NexusListDef) {
                    return {
                      filter: list(filter.ofNexusType),
                    };
                  }
                })(fieldConfig.filter),
                ...((sortFields = []) => {
                  if (sortFields.length > 0) {
                    return {
                      sort: arg({type: sortInputName}),
                    };
                  }
                })(fieldConfig.sortFields),
              },
            });
          },
        })
      );
    },
  });
};
