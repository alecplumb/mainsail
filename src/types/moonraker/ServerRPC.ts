/**
 * Server Administration RPC Interface
 *
 * These endpoints provide access to server status, data tracking, and administrative requests.
 *
 * @see https://moonraker.readthedocs.io/en/latest/external_api/server/
 */
export interface ServerRPC {
    /**
     * Identify the client connection to Moonraker.
     * This should be called immediately after the websocket connection is established.
     */
    'server.connection.identify': (params: {
        /** The name of your client (e.g., 'Mainsail', 'Fluidd', 'KlipperScreen') */
        client_name: string
        /** The current version of the connected client */
        version: string
        /** Application type */
        type: 'web' | 'mobile' | 'desktop' | 'display' | 'bot' | 'agent' | 'other'
        /** The URL for your client's homepage */
        url: string
        /** Optional JWT for user authentication */
        access_token?: string
        /** Optional system API key for clients without user authentication */
        api_key?: string
    }) => Promise<{
        /** The connection's unique identifier */
        connection_id: number
    }>

    /**
     * List the agents currently connected to Moonraker.
     */
    'server.extensions.list': () => Promise<{
        agents: MoonrakerAgentInfo[]
    }>

    /**
     * Send a request to a connected agent. Moonraker relays the agent's result (or error) back.
     * Agent errors arrive wrapped: code 424, with the agent's own error object in `data`.
     */
    'server.extensions.request': (params: {
        /** The name of the agent */
        agent: string
        /** The agent method to call */
        method: string
        /** The method arguments, `null` for none */
        arguments: unknown
    }) => Promise<unknown>
}

export interface MoonrakerAgentInfo {
    name: string
    version: string
    type: string
    url: string
}

/**
 * Payload of a `notify_agent_event` notification.
 * Moonraker itself emits the reserved events `connected` and `disconnected`.
 */
export interface MoonrakerAgentEvent {
    agent: string
    event: string
    data?: unknown
}
