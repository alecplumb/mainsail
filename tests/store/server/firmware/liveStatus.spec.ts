import { describe, expect, it } from 'vitest'
import { isStatusResponse, reconcileRun, updatableMcus } from '@/store/server/firmware/helpers'
import type { FirmwareRunState } from '@/store/server/firmware/types'
import type { Aldis } from '@/types/aldis'
import status from '../../../fixtures/aldis-status.json'

// A `status` reply in the shape aldis 0.3.0 returns, for a printer whose MCUs are all current.
describe('aldis status fixture', () => {
    const idle: FirmwareRunState = {
        busy: false,
        runId: null,
        responses: [],
        lastResult: null,
        lastMessage: null,
        resultRunId: null,
        dismissedRunId: null,
    }

    it('is a well-formed api v1 status', () => {
        expect(isStatusResponse(status)).toBe(true)
        expect(status.api_version).toBe(1)
        expect(status.blocker).toBeNull()
    })

    it('offers nothing to update when every MCU is current', () => {
        expect(updatableMcus(status as Aldis.StatusResponse)).toEqual([])
    })

    it('keeps the message of an MCU aldis cannot manage', () => {
        const unmanaged = status.mcus.filter((mcu) => !['current', 'update_available'].includes(mcu.state))

        expect(unmanaged.length).toBeGreaterThan(0)
        unmanaged.forEach((mcu) => {
            expect(mcu.actions).toEqual([])
            expect(mcu.message).not.toBe('')
        })
    })

    it('leaves the run state alone without a run', () => {
        expect(reconcileRun(idle, (status as Aldis.StatusResponse).run)).toBe(idle)
    })
})
