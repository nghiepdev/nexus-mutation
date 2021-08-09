import {
  FieldResolver,
  InputDefinitionBlock,
  NexusNonNullDef,
  NexusOutputFieldConfig,
  NonNullConfig,
  ObjectDefinitionBlock,
} from 'nexus/dist/core';

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

  input?: (t: InputDefinitionBlock<TypeName>) => void | NexusNonNullDef<any>;

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
