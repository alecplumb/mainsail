<template>
    <v-dialog :value="show" persistent max-width="800" class="mx-0">
        <v-card :loading="!complete">
            <template slot="progress">
                <v-progress-linear color="primary" indeterminate></v-progress-linear>
            </template>
            <v-toolbar flat dense>
                <v-toolbar-title>
                    <span class="subheading">
                        <v-icon left>{{ mdiUpdate }}</v-icon>
                        {{ title }}
                    </span>
                </v-toolbar-title>
            </v-toolbar>
            <v-card-text class="px-3">
                <v-row>
                    <v-col class="py-6 px-0">
                        <overlay-scrollbars ref="updaterLogScroll" class="updaterLogScroll">
                            <v-data-table
                                ref="updaterLog"
                                :headers="headers"
                                :items="rows"
                                item-key="index"
                                hide-default-footer
                                hide-default-header
                                disable-pagination
                                class="updaterLog"
                                :custom-sort="customSort"
                                sort-by="index"
                                :sort-desc="true"
                                color="primary">
                                <template #no-data>
                                    <div class="py-2">{{ $t('App.UpdateDialog.Empty') }}</div>
                                </template>

                                <template #item="{ item }">
                                    <tr>
                                        <td v-if="item.date" class="log-cell title-cell py-2">
                                            {{ formatTime(item.date) }}
                                        </td>
                                        <td
                                            class="log-cell content-cell py-2"
                                            :class="{ 'pl-0': item.date }"
                                            colspan="2"
                                            style="width: 100%">
                                            <template v-if="item.message">
                                                <span v-if="htmlMessages" class="message" v-html="item.message"></span>
                                                <span v-else class="message">{{ item.message }}</span>
                                            </template>
                                        </td>
                                    </tr>
                                </template>
                            </v-data-table>
                        </overlay-scrollbars>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col class="text-center pt-5">
                        <v-btn text :disabled="!complete" color="primary" @click="$emit('close')">
                            {{ $t('Buttons.Close') }}
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import { mdiUpdate } from '@mdi/js'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue'
import { UpdateDialogMessage } from '@/store/server/updateManager/types'

interface UpdateDialogRow {
    index: number
    date: Date | null
    message: string
}

/**
 * Progress dialog for long-running updates. The parent owns the state: it decides when the
 * dialog shows, feeds the log lines and handles `close` once the update is complete.
 */
@Component
export default class TheUpdateDialog extends Mixins(BaseMixin) {
    @Prop({ type: Boolean, required: true }) readonly show!: boolean
    @Prop({ type: Boolean, default: true }) readonly complete!: boolean
    @Prop({ type: String, required: true }) readonly title!: string
    @Prop({ type: Array, default: () => [] }) readonly messages!: UpdateDialogMessage[]
    // render messages as HTML (Moonraker update manager output), otherwise as plain text
    @Prop({ type: Boolean, default: false }) readonly htmlMessages!: boolean

    @Ref() readonly updaterLogScroll!: OverlayScrollbarsComponent
    @Ref() readonly updaterLog!: HTMLDivElement

    mdiUpdate = mdiUpdate

    headers = [
        {
            text: 'Date',
            value: 'index',
            width: '1%',
        },
        {
            text: 'Message',
            sortable: false,
            value: 'message',
            width: '99%',
        },
    ]

    get rows(): UpdateDialogRow[] {
        return this.messages.map((message, index) => ({
            index,
            date: message.date ?? null,
            message: message.message,
        }))
    }

    // log lines always read oldest first, in the order they arrived
    customSort(items: UpdateDialogRow[]) {
        return items.sort((a, b) => a.index - b.index)
    }

    formatTime(date: Date) {
        const hours = date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours()
        const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes()
        const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds().toString() : date.getSeconds()

        return hours + ':' + minutes + ':' + seconds
    }

    @Watch('messages')
    messagesChanged() {
        // the log only exists once the dialog has been shown (v-dialog renders lazily)
        if (!this.show) return

        setTimeout(() => {
            this.updaterLogScroll.osInstance()?.scroll({ y: '100%' })
        }, 50)
    }
}
</script>

<style scoped>
.updaterLogScroll {
    height: 350px;
    max-height: 350px;
    overflow-x: hidden;
}

.updaterLog .title-cell {
    white-space: nowrap;
    vertical-align: top;
}

.updaterLog.v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
    height: auto;
}
</style>
