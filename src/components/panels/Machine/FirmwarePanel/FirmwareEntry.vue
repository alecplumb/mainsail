<template>
    <v-row class="py-2">
        <v-col class="pl-6">
            <strong>{{ mcu.name }}</strong>
            <br />
            <span>{{ versionOutput }}</span>
        </v-col>
        <v-col class="col-auto pr-6 text-right" align-self="center">
            <v-chip
                v-if="updatable"
                small
                label
                outlined
                color="primary"
                :disabled="disabled"
                class="minwidth-0 px-2 text-uppercase"
                @click="$emit('update', mcu.name)">
                <v-icon small class="mr-1">{{ mdiProgressUpload }}</v-icon>
                {{ $t('Machine.FirmwarePanel.Update') }}
            </v-chip>
            <v-chip
                v-else-if="mcu.state === 'current'"
                small
                label
                outlined
                color="green"
                disabled
                class="minwidth-0 px-2 text-uppercase">
                <v-icon small class="mr-1">{{ mdiCheck }}</v-icon>
                {{ $t('Machine.FirmwarePanel.State.current') }}
            </v-chip>
            <v-tooltip v-else top max-width="300">
                <template #activator="{ on, attrs }">
                    <v-chip
                        small
                        label
                        outlined
                        color="grey"
                        class="minwidth-0 px-2 text-uppercase"
                        v-bind="attrs"
                        v-on="on">
                        <v-icon small class="mr-1">{{ mdiInformationOutline }}</v-icon>
                        {{ stateLabel }}
                    </v-chip>
                </template>
                <span>{{ mcu.message }}</span>
            </v-tooltip>
        </v-col>
    </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiCheck, mdiInformationOutline, mdiProgressUpload } from '@mdi/js'
import type { Aldis } from '@/types/aldis'

@Component
export default class FirmwarePanelEntry extends Mixins(BaseMixin) {
    mdiCheck = mdiCheck
    mdiInformationOutline = mdiInformationOutline
    mdiProgressUpload = mdiProgressUpload

    @Prop({ type: Object, required: true }) readonly mcu!: Aldis.Mcu
    @Prop({ type: Object, default: null }) readonly host!: Aldis.Host | null
    @Prop({ type: Boolean, default: false }) readonly disabled!: boolean

    // the UI never re-implements eligibility: an Update button needs the agent's `update` action
    get updatable(): boolean {
        return this.mcu.state === 'update_available' && this.mcu.actions.includes('update')
    }

    get stateLabel(): string {
        const key = `Machine.FirmwarePanel.State.${this.mcu.state}`

        return this.$te(key) ? this.$t(key).toString() : this.mcu.state
    }

    get transportLabel(): string | null {
        const transport = this.mcu.transport
        if (!transport) return null

        return transport.type === 'can' ? `${transport.interface} · ${transport.uuid}` : transport.device
    }

    get versionOutput(): string {
        let version = this.mcu.running_version ?? this.$t('Machine.FirmwarePanel.UnknownVersion').toString()
        if (this.mcu.state === 'update_available' && this.host?.software_version) {
            version += ` > ${this.host.software_version}`
        }

        return this.transportLabel ? `${this.transportLabel} · ${version}` : version
    }
}
</script>
