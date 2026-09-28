import type { MoonrakerAgentEvent } from '@/types/moonraker/ServerRPC'

export interface AgentRegistration {
    /** The agent name, as reported by `server.extensions.list` */
    name: string
    /** Action dispatched when the agent is (or becomes) connected */
    dispatch: string
    /** Action receiving the agent's own `notify_agent_event` envelopes */
    eventDispatch: string
    /** Action dispatched when the agent disconnects */
    disconnectDispatch?: string
    /** Action dispatched when the Klippy state changes */
    klippyDispatch?: string
}

export interface AgentEventTarget {
    action: string
    payload: unknown
}

export const resolveAgentEvent = (
    event: MoonrakerAgentEvent,
    agents: readonly AgentRegistration[]
): AgentEventTarget | null => {
    if (event.event === 'connected') {
        return { action: 'server/onAgentConnected', payload: event.agent }
    }

    if (event.event === 'disconnected') {
        return { action: 'server/onAgentDisconnected', payload: event.agent }
    }

    const agent = agents.find((agent) => agent.name === event.agent)

    return agent ? { action: agent.eventDispatch, payload: event } : null
}
