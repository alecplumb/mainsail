<template>
    <div>
        <panel
            v-if="showPanel"
            :title="$t('Machine.FirmwarePanel.Title')"
            :icon="mdiMemory"
            card-class="machine-firmware-panel"
            :loading="isRefreshing"
            :collapsible="true">
            <template #buttons>
                <v-tooltip top>
                    <template #activator="{ on, attrs }">
                        <v-btn
                            icon
                            tile
                            color="primary"
                            :ripple="true"
                            :loading="isRefreshing"
                            :disabled="busy"
                            v-bind="attrs"
                            @click="refresh"
                            v-on="on">
                            <v-icon>{{ mdiRefresh }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ $t('Machine.FirmwarePanel.Refresh') }}</span>
                </v-tooltip>
            </template>
            <v-card-text class="px-0 py-0 firmware-list">
                <template v-if="!isSupported">
                    <v-row class="my-0">
                        <v-col class="px-6">
                            <v-alert class="mb-0" text dense type="info" border="left">
                                {{ $t('Machine.FirmwarePanel.NotRunning') }}
                            </v-alert>
                        </v-col>
                    </v-row>
                </template>
                <template v-else>
                    <v-row v-if="alerts.length" class="my-0">
                        <v-col class="px-6 pb-0">
                            <v-alert
                                v-for="alert in alerts"
                                :key="alert.key"
                                text
                                dense
                                border="left"
                                :type="alert.type"
                                :dismissible="alert.dismissible"
                                @input="dismissAlert(alert)">
                                {{ alert.message }}
                                <div v-if="alert.hint" class="mt-1">{{ alert.hint }}</div>
                            </v-alert>
                        </v-col>
                    </v-row>
                    <template v-if="host">
                        <v-row class="py-2">
                            <v-col class="pl-6">
                                <strong>{{ $t('Machine.FirmwarePanel.Host') }}</strong>
                                <br />
                                <span>{{ hostOutput }}</span>
                            </v-col>
                        </v-row>
                    </template>
                    <template v-for="mcu in mcus">
                        <v-divider :key="'divider_' + mcu.name" class="my-0" />
                        <firmware-panel-entry
                            :key="mcu.name"
                            :mcu="mcu"
                            :host="host"
                            :disabled="updateDisabled"
                            @update="clickUpdate([$event])" />
                    </template>
                    <template v-if="updatableMcus.length > 1">
                        <v-divider class="mb-0 mt-2 border-top-2" />
                        <v-row class="pt-3">
                            <v-col class="text-center">
                                <v-btn
                                    text
                                    color="primary"
                                    small
                                    :disabled="updateDisabled"
                                    @click="clickUpdate(updatableMcus)">
                                    <v-icon left>{{ mdiProgressUpload }}</v-icon>
                                    {{ $t('Machine.FirmwarePanel.UpdateAll') }}
                                </v-btn>
                            </v-col>
                        </v-row>
                    </template>
                </template>
            </v-card-text>
            <firmware-panel-update-hint v-model="showUpdateHint" :mcus="pendingMcus" @do-update="doUpdate" />
        </panel>
    </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import Panel from '@/components/ui/Panel.vue'
import FirmwarePanelEntry from '@/components/panels/Machine/FirmwarePanel/FirmwareEntry.vue'
import FirmwarePanelUpdateHint from '@/components/panels/Machine/FirmwarePanel/FirmwareUpdateHint.vue'
import { mdiMemory, mdiProgressUpload, mdiRefresh } from '@mdi/js'
import type { Aldis } from '@/types/aldis'

interface FirmwarePanelAlert {
    key: string
    type: 'error' | 'warning' | 'info'
    message: string
    hint?: string
    dismissible?: boolean
}

@Component({
    components: { Panel, FirmwarePanelEntry, FirmwarePanelUpdateHint },
})
export default class FirmwarePanel extends Mixins(BaseMixin) {
    mdiMemory = mdiMemory
    mdiProgressUpload = mdiProgressUpload
    mdiRefresh = mdiRefresh

    showUpdateHint = false
    pendingMcus: string[] = []

    // shown when the aldis agent is connected, or its service is installed but not running
    get showPanel(): boolean {
        return this.isSupported || this.$store.getters['server/firmware/isRegistered']
    }

    get isSupported(): boolean {
        return this.$store.getters['server/firmware/isSupported']
    }

    get isRefreshing(): boolean {
        return this.$store.getters['server/firmware/isRefreshing']
    }

    get isApiSupported(): boolean {
        return this.$store.getters['server/firmware/isApiSupported']
    }

    get busy(): boolean {
        return this.$store.state.server.firmware?.busy ?? false
    }

    get status(): Aldis.StatusResponse | null {
        return this.$store.state.server.firmware?.status ?? null
    }

    get host(): Aldis.Host | null {
        return this.$store.getters['server/firmware/getHost']
    }

    get hostOutput(): string {
        if (!this.host) return ''
        if (!this.host.software_version) return `${this.host.klippy_state}: ${this.host.klippy_message}`

        return `${this.host.software_version} · ${this.$t('Machine.FirmwarePanel.HostHint')}`
    }

    get blocker(): Aldis.Blocker | null {
        return this.$store.getters['server/firmware/getBlocker']
    }

    get mcus(): Aldis.Mcu[] {
        return this.$store.getters['server/firmware/getMcus']
    }

    get updatableMcus(): string[] {
        return this.$store.getters['server/firmware/getUpdatableMcus']
    }

    get alerts(): FirmwarePanelAlert[] {
        const alerts: FirmwarePanelAlert[] = []

        const statusError = this.$store.getters['server/firmware/getStatusError']
        if (statusError) {
            alerts.push({
                key: 'statusError',
                type: 'error',
                message: this.$t('Machine.FirmwarePanel.StatusError', { message: statusError }).toString(),
            })
        }

        if (this.status && !this.isApiSupported) {
            alerts.push({
                key: 'unsupportedApi',
                type: 'warning',
                message: this.$t('Machine.FirmwarePanel.UnsupportedApi', {
                    version: this.status.api_version,
                }).toString(),
            })
        }

        if (this.blocker) {
            alerts.push({
                key: 'blocker',
                type: 'warning',
                message: this.blocker.message,
                hint:
                    this.blocker.reason === 'restart_pending'
                        ? this.$t('Machine.FirmwarePanel.RestartPendingHint').toString()
                        : undefined,
            })
        }

        const lastResult: Aldis.RunResult | null = this.$store.state.server.firmware?.lastResult ?? null
        const lastMessage: string | null = this.$store.state.server.firmware?.lastMessage ?? null
        if (lastResult?.outcome === 'failed' && lastMessage) {
            alerts.push({ key: 'failedRun', type: 'error', message: lastMessage, dismissible: true })
        }

        return alerts
    }

    get updateDisabled(): boolean {
        return (
            ['printing', 'paused'].includes(this.printer_state) ||
            this.blocker !== null ||
            !this.isApiSupported ||
            this.busy ||
            this.isRefreshing
        )
    }

    get hideUpdateWarning(): boolean {
        return this.$store.state.gui.uiSettings.hideUpdateWarnings ?? false
    }

    refresh() {
        if (this.isSupported) this.$store.dispatch('server/firmware/refresh')
        else this.$store.dispatch('server/refreshAgents')
    }

    clickUpdate(mcus: string[]) {
        if (mcus.length === 0) return

        this.pendingMcus = [...mcus]

        if (this.hideUpdateWarning) {
            this.doUpdate(this.pendingMcus)
            return
        }

        this.showUpdateHint = true
    }

    doUpdate(mcus: string[]) {
        if (this.updateDisabled) return

        this.$store.dispatch('server/firmware/update', { mcus })
    }

    dismissAlert(alert: FirmwarePanelAlert) {
        if (alert.key === 'failedRun') this.$store.dispatch('server/firmware/dismissLastResult')
    }
}
</script>

<style scoped>
::v-deep .firmware-list > div:last-child > div.row {
    padding-bottom: 0 !important;
}
</style>
