interface MutationDynamicPluginConfig {
    /**
     * The method name in the objectType definition block
     *
     * @default 'dynamicMutation'
     */
    nexusFieldName?: string;
}
export declare const mutationPayloadPlugin: (connectionPluginConfig?: MutationDynamicPluginConfig | undefined) => import("@nexus/schema/dist/plugin").NexusPlugin;
export {};
