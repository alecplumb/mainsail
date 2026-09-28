import { Module } from 'vuex'
import { FirmwareState } from '@/store/server/firmware/types'
import { RootState } from '@/store/types'
import { actions } from '@/store/server/firmware/actions'
import { mutations } from '@/store/server/firmware/mutations'
import { getters } from '@/store/server/firmware/getters'

export const getDefaultState = (): FirmwareState => {
    return {
        initialised: false,
        status: null,
        statusError: null,
        retried: false,
        pendingRefreshes: 0,
        busy: false,
        runId: null,
        responses: [],
        lastResult: null,
        lastMessage: null,
        resultRunId: null,
        dismissedRunId: null,
    }
}

// initial state
const state = getDefaultState()

// MCU firmware updates via the aldis Moonraker agent. This is an agent, not a Moonraker
// component: it is initialised from server.extensions.list, never via initableServerComponents.
export const firmware: Module<FirmwareState, RootState> = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
}
