import Vue from 'vue'
import { ActionTree } from 'vuex'
import i18n from '@/plugins/i18n'
import type { Aldis } from '@/types/aldis'
import type { MoonrakerAgentEvent } from '@/types/moonraker/ServerRPC'
import { FirmwareRunState, FirmwareState } from '@/store/server/firmware/types'
import { RootState } from '@/store/types'
import { AGENT_NAME } from '@/store/server/firmware/getters'
import {
    SUPPORTED_API_VERSION,
    agentErrorMessage,
    apiVersionOf,
    applyEvent,
    isStatusResponse,
    isUpdateResponse,
    needsRetry,
    reconcileRun,
    unsupportedStatus,
} from '@/store/server/firmware/helpers'

const runStateOf = (state: FirmwareState): FirmwareRunState => ({
    busy: state.busy,
    runId: state.runId,
    responses: state.responses,
    lastResult: state.lastResult,
    lastMessage: state.lastMessage,
    resultRunId: state.resultRunId,
    dismissedRunId: state.dismissedRunId,
})

export const actions: ActionTree<FirmwareState, RootState> = {
    reset({ commit }) {
        commit('reset')
    },

    async init({ state, commit, dispatch }) {
        if (state.initialised) return

        commit('setInitialised', true)

        await dispatch('refresh')
    },

    async refresh({ commit, dispatch }) {
        commit('setStatusError', null)
        commit('addPendingRefresh')

        try {
            const payload = await Vue.$socket.emitAndWait('server.extensions.request', {
                agent: AGENT_NAME,
                method: 'status',
                arguments: null,
            })

            await dispatch('onStatus', payload)
        } catch (error: unknown) {
            commit('setStatusError', agentErrorMessage(error))
        } finally {
            commit('removePendingRefresh')
        }
    },

    async onStatus({ state, commit, dispatch }, payload: unknown) {
        const apiVersion = apiVersionOf(payload)

        if (apiVersion !== null && apiVersion !== SUPPORTED_API_VERSION) {
            commit('setStatus', unsupportedStatus(apiVersion))
            commit('setStatusError', null)
            return
        }

        if (!isStatusResponse(payload)) {
            commit('setStatusError', i18n.t('Machine.FirmwarePanel.MalformedStatus').toString())
            return
        }

        commit('setStatus', payload)
        commit('setStatusError', null)
        commit('setRunState', reconcileRun(runStateOf(state), payload.run ?? null))

        if (payload.run?.state === 'finished') {
            commit('setRetried', false)
        } else if (needsRetry(runStateOf(state), payload.run ?? null) && !state.retried) {
            commit('setRetried', true)

            await dispatch('refresh')
        }
    },

    async update({ commit, dispatch }, args: Aldis.UpdateArguments) {
        commit('setUpdateStarted')

        try {
            const result = await Vue.$socket.emitAndWait('server.extensions.request', {
                agent: AGENT_NAME,
                method: 'update',
                arguments: args,
            })

            const runId = (result as Partial<Aldis.UpdateResult> | null)?.run_id
            if (typeof runId === 'string') commit('setRunId', runId)
        } catch (error: unknown) {
            commit('setBusy', false)

            Vue.$toast.error(agentErrorMessage(error))

            await dispatch('refresh')
        }
    },

    async onAgentEvent({ state, commit, dispatch }, payload: MoonrakerAgentEvent) {
        if (payload.event !== 'update_response' || !isUpdateResponse(payload.data)) return

        commit('setRunState', applyEvent(runStateOf(state), payload.data))

        if (payload.data.complete) await dispatch('refresh')
    },

    async onKlippyStateChanged({ state, dispatch }) {
        if (state.initialised) await dispatch('refresh')
    },

    onAgentDisconnected({ state, commit }) {
        commit('setInitialised', false)

        if (state.busy) {
            const message = i18n.t('Machine.FirmwarePanel.LostRun').toString()
            const current = runStateOf(state)

            // forget the run id so a reconnected agent that still runs it can be picked up again
            commit('setRunState', {
                ...current,
                busy: false,
                runId: null,
                responses: [...current.responses, { id: current.responses.length, message, mcu: null, phase: 'done' }],
                lastMessage: message,
            })
        }
    },

    async closeDialog({ commit, dispatch, getters }) {
        commit('clearResponses')

        if (getters.isSupported) await dispatch('refresh')
    },

    dismissLastResult({ commit }) {
        commit('clearLastResult')
    },
}
