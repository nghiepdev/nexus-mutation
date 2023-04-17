import {
  AllNexusArgsDefs,
  ArgsRecord,
  FieldResolver,
  InputDefinitionBlock,
  NexusOutputFieldConfig,
  NonNullConfig,
  ObjectDefinitionBlock,
} from 'nexus/dist/core';

export interface QueryPluginConfig {
  /**
   * The method name in the objectType definition block
   *
   * @default 'dynamicQuery'
   */
  nexusFieldName?: string;

  /**
   * Configures the default "nonNullDefaults" settings
   *
   */
  nonNullDefaults?: NonNullConfig;

  /**
   * The sort type name
   * @default SortType
   */
  sortTypeName?: string;

  /**
   * Configures the SortType
   * @default ["asc", "desc"]
   */
  sortTypeValues?: [string | number | boolean, string | number | boolean];
}

export type QueryPluginFieldConfig<
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

  args?: ArgsRecord;

  filter?: AllNexusArgsDefs | ((t: InputDefinitionBlock<TypeName>) => void);

  sortFields?: string[];

  result:
    | NexusOutputFieldConfig<TypeName, FieldName>['type']
    | ((t: ObjectDefinitionBlock<TypeName>) => void)
    | Record<
        string,
        | NexusOutputFieldConfig<TypeName, FieldName>['type']
        | ((t: ObjectDefinitionBlock<TypeName>) => void)
      >;

  resolve: FieldResolver<TypeName, FieldName>;
} & NexusGenPluginFieldConfig<TypeName, FieldName>;

export interface MutationPluginConfig {
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

export type MutationPluginFieldConfig<
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

  input?: AllNexusArgsDefs | ((t: InputDefinitionBlock<TypeName>) => void);

  payload:
    | NexusOutputFieldConfig<TypeName, FieldName>['type']
    | ((t: ObjectDefinitionBlock<TypeName>) => void)
    | Record<
        string,
        | NexusOutputFieldConfig<TypeName, FieldName>['type']
        | ((t: ObjectDefinitionBlock<TypeName>) => void)
      >;

  resolve: FieldResolver<TypeName, FieldName>;
} & NexusGenPluginFieldConfig<TypeName, FieldName>;
