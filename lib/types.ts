import {
  FieldResolver,
  InputDefinitionBlock,
  NexusNonNullDef,
  NexusOutputFieldConfig,
  NonNullConfig,
  OutputDefinitionBlock,
} from 'nexus/dist/core';

export interface MutationDynamicPluginConfig {
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

export type MutationDynamicFieldConfig<
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
