import { GetterTree } from 'vuex'
import type { Aldis } from '@/types/aldis'
import { FirmwareState } from '@/store/server/firmware/types'
import { RootState } from '@/store/types'
import { AGENT_NAME, SUPPORTED_API_VERSION, updatableMcus } from '@/store/server/firmware/helpers'

export const getters: GetterTree<FirmwareState, RootState> = {
    // the agent is connected to Moonraker
    isSupported: (state, getters, rootState, rootGetters): boolean => {
        return rootGetters['server/agentSupport'](AGENT_NAME)
    },

    // the agent's service is installed (listed in moonraker.asvc), whether it runs or not
    isRegistered: (state, getters, rootState): boolean => {
        return rootState.server?.system_info?.available_services?.includes(AGENT_NAME) ?? false
    },

    isRefreshing: (state): boolean => {
        return state.pendingRefreshes > 0
    },

    isApiSupported: (state): boolean => {
        return state.status === null || state.status.api_version === SUPPORTED_API_VERSION
    },

    getMcus: (state, getters): Aldis.Mcu[] => {
        return getters.isApiSupported ? (state.status?.mcus ?? []) : []
    },

    getBlocker: (state): Aldis.Blocker | null => {
        return state.status?.blocker ?? null
    },

    getHost: (state, getters): Aldis.Host | null => {
        return getters.isApiSupported ? (state.status?.host ?? null) : null
    },

    getUpdatableMcus: (state): string[] => {
        return updatableMcus(state.status)
    },

    // MCUs whose firmware differs from the running Klipper host, regardless of blockers
    getOutdatedMcus: (state, getters): Aldis.Mcu[] => {
        if (!getters.isSupported) return []

        return getters.getMcus.filter((mcu: Aldis.Mcu) => mcu.state === 'update_available')
    },

    getStatusError: (state): string | null => {
        return state.statusError
    },
}
