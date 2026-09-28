# Firmware Updates

The **Firmware Updates** panel on the Machine page shows the firmware version of every Klipper
MCU and flashes the ones that are behind the Klipper host. It is a frontend for the
[aldis](https://github.com/mjonuschat/aldis) Moonraker agent (agent API v1): Mainsail only
displays what the agent reports and asks it to update. It never builds or flashes firmware
itself.

## Requirements

- aldis installed on the printer host, with its agent service registered with Moonraker:

  ```sh
  sudo ~/aldis/aldis setup --agent
  sudo systemctl restart moonraker
  ```

  `setup --agent` installs the `aldis` systemd service and adds it to `moonraker.asvc`, so
  Moonraker lists it under Services and lets Mainsail start or stop it.

- A Moonraker version with agent support (`server.extensions.list`).

Without the agent the panel stays hidden, so a stock install looks exactly as before. If the
`aldis` service is installed but not running, the panel shows a hint to start it from the
Services menu.

## The panel

The first row shows the Klipper host version. MCU firmware is compared against it. Below it
there is one row per MCU with its transport (CAN interface and UUID, or serial device) and the
running firmware version. The chip on the right shows the MCU's state:

| Chip             | Meaning                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| UP-TO-DATE       | The firmware matches the Klipper host.                                                                              |
| UPDATE           | The firmware is behind and the agent can update it. Click it to flash that MCU.                                     |
| UPDATE AVAILABLE | The firmware is behind, but the agent can't update it right now (see the warning at the top of the panel).          |
| EXTERNAL         | The MCU runs non-Klipper firmware managed elsewhere (e.g. Beacon, Cartographer).                                    |
| LEGACY           | The firmware predates the embedded build config aldis needs. Flash it once by hand; after that aldis can update it. |
| UNSUPPORTED      | aldis has no bootloader support for this MCU family.                                                                |
| INDETERMINATE    | The versions can't be compared.                                                                                     |
| NOT IDENTIFIED   | The MCU could not be identified.                                                                                    |
| NOT RESPONDING   | The MCU did not answer. Run `aldis reboot` or power-cycle the board.                                                |

Hover a grey chip to see the agent's message for that MCU. **Update all MCUs** appears when
more than one MCU can be updated.

Update buttons are disabled while the printer is printing or paused, while the agent reports a
blocker (for example Klipper not ready, a restart pending after a Klipper update, or a print in
progress), while an update is already running, and when the agent speaks an API version this
Mainsail does not support. The blocker's message is shown at the top of the panel.

Every update asks for confirmation first, unless update warnings are turned off in the
settings. Klipper is stopped during the update and restarted afterwards.

## Progress and notifications

- **Progress:** an update opens the same progress dialog as the Update Manager, with one line
  per step (stop Klipper, build, flash, verify, restart Klipper). If you reload the page or the
  connection drops during an update, the dialog comes back with the log so far.
- **Failed runs:** if a run fails, the panel shows the agent's final message in a dismissible
  error. The full log is in `logs/aldis` on the printer.
- **Notifications:** each MCU whose firmware is behind the Klipper host gets an entry in the
  notification bell. A dismissal (until the next reboot, or for a set time) ends early when the
  Klipper host version changes, because the entry then counts as a new one.
