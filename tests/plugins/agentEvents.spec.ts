import { describe, expect, it } from 'vitest'
import { resolveAgentEvent, type AgentRegistration } from '@/plugins/agentEvents'

const agents: AgentRegistration[] = [
    {
        name: 'aldis',
        dispatch: 'server/firmware/init',
        eventDispatch: 'server/firmware/onAgentEvent',
        disconnectDispatch: 'server/firmware/onAgentDisconnected',
        klippyDispatch: 'server/firmware/onKlippyStateChanged',
    },
]

describe('resolveAgentEvent', () => {
    it('routes connected to the server store with the agent name', () => {
        expect(resolveAgentEvent({ agent: 'aldis', event: 'connected', data: { name: 'aldis' } }, agents)).toEqual({
            action: 'server/onAgentConnected',
            payload: 'aldis',
        })
    })

    it('routes disconnected to the server store with the agent name', () => {
        expect(resolveAgentEvent({ agent: 'aldis', event: 'disconnected' }, agents)).toEqual({
            action: 'server/onAgentDisconnected',
            payload: 'aldis',
        })
    })

    it('routes connected for an unregistered agent too', () => {
        expect(resolveAgentEvent({ agent: 'other', event: 'connected' }, agents)).toEqual({
            action: 'server/onAgentConnected',
            payload: 'other',
        })
    })

    it('routes a registered agent event with the whole envelope', () => {
        const event = { agent: 'aldis', event: 'update_response', data: { run_id: 'r1' } }

        expect(resolveAgentEvent(event, agents)).toEqual({ action: 'server/firmware/onAgentEvent', payload: event })
    })

    it('drops events from unknown agents', () => {
        expect(resolveAgentEvent({ agent: 'other', event: 'anything' }, agents)).toBeNull()
    })
})

describe('moonrakerAgents', () => {
    it('registers aldis without making it an initable server component', async () => {
        const { initableServerComponents, moonrakerAgents } = await import('@/store/variables')

        expect(moonrakerAgents.map((agent) => agent.name)).toContain('aldis')
        expect(initableServerComponents).not.toContain('firmware')
        expect(initableServerComponents).not.toContain('aldis')
    })
})
