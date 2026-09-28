<template>
    <v-dialog v-model="showDialog" persistent max-width="600">
        <panel
            :title="$t('Machine.UpdatePanel.AreYouSure')"
            :icon="mdiProgressQuestion"
            :margin-bottom="false"
            card-class="machine-firmware-update-hint-dialog">
            <template #buttons>
                <v-btn icon tile @click="closeDialog">
                    <v-icon>{{ mdiCloseThick }}</v-icon>
                </v-btn>
            </template>
            <v-card-text>
                <v-row>
                    <v-col>
                        <v-alert text dense type="warning" border="left" class="mb-0">
                            <p class="mb-2">
                                {{ $tc('Machine.FirmwarePanel.UpdateQuestion', mcus.length, { mcus: mcuList }) }}
                            </p>
                            <p class="mb-0">{{ $t('Machine.FirmwarePanel.UpdateQuestionKlipper') }}</p>
                        </v-alert>
                        <div>
                            <v-checkbox
                                v-model="checkboxUpdateQuestion"
                                :label="$t('Machine.UpdatePanel.IUnderstandTheRisks')"
                                hide-details />
                        </div>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="closeDialog">{{ $t('Machine.UpdatePanel.Abort') }}</v-btn>
                <v-btn text color="primary" :disabled="!checkboxUpdateQuestion" @click="doUpdate">
                    {{ $t('Machine.UpdatePanel.StartUpdate') }}
                </v-btn>
            </v-card-actions>
        </panel>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiCloseThick, mdiProgressQuestion } from '@mdi/js'
import Panel from '@/components/ui/Panel.vue'

@Component({
    components: { Panel },
})
export default class FirmwarePanelUpdateHint extends Mixins(BaseMixin) {
    mdiCloseThick = mdiCloseThick
    mdiProgressQuestion = mdiProgressQuestion

    checkboxUpdateQuestion = false

    @VModel({ type: Boolean }) showDialog!: boolean
    @Prop({ type: Array, required: true }) readonly mcus!: string[]

    get mcuList(): string {
        return this.mcus.join(', ')
    }

    doUpdate() {
        this.$emit('do-update', this.mcus)
        this.closeDialog()
    }

    closeDialog() {
        this.showDialog = false
    }

    @Watch('showDialog')
    showDialogChanged(newVal: boolean) {
        if (newVal) this.checkboxUpdateQuestion = false
    }
}
</script>
