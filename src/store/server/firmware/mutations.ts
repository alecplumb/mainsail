import { getDefaultState } from './index'
import { MutationTree } from 'vuex'
import type { Aldis } from '@/types/aldis'
import { FirmwareRunState, FirmwareState } from '@/store/server/firmware/types'

export const mutations: MutationTree<FirmwareState> = {
    reset(state) {
        Object.assign(state, getDefaultState())
    },

    setInitialised(state, payload: boolean) {
        state.initialised = payload
    },

    setStatus(state, payload: Aldis.StatusResponse) {
        state.status = payload
    },

    setStatusError(state, payload: string | null) {
        state.statusError = payload
    },

    setRunState(state, payload: FirmwareRunState) {
        state.busy = payload.busy
        state.runId = payload.runId
        state.responses = payload.responses
        state.lastResult = payload.lastResult
        state.lastMessage = payload.lastMessage
        state.resultRunId = payload.resultRunId
        state.dismissedRunId = payload.dismissedRunId
    },

    setBusy(state, payload: boolean) {
        state.busy = payload
    },

    setRunId(state, payload: string) {
        if (state.runId === null) {
            state.runId = payload
        }
    },

    setRetried(state, payload: boolean) {
        state.retried = payload
    },

    addPendingRefresh(state) {
        state.pendingRefreshes++
    },

    removePendingRefresh(state) {
        state.pendingRefreshes = Math.max(0, state.pendingRefreshes - 1)
    },

    setUpdateStarted(state) {
        state.busy = true
        state.runId = null
        state.responses = []
        state.lastResult = null
        state.lastMessage = null
        state.resultRunId = null
        state.dismissedRunId = null
        state.retried = false
    },

    clearResponses(state) {
        state.responses = []
    },

    clearLastResult(state) {
        state.dismissedRunId = state.resultRunId
        state.lastResult = null
        state.lastMessage = null
        state.resultRunId = null
    },
}
