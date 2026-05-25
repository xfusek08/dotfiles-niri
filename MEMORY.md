# System Context: Niri + DMS + greetd on ChachyOS (GNOME base)

## Dotfiles (`~/Repo/dotfiles`)
- **Templating**: Uses `vendor/bash-tpl/bash-tpl` for `.template` file generation
- **Stow**: `configuration/` dir is stowed to `$HOME` via `setup` script
- **Setup**: `./setup` runs from repo root; generates env file, runs system-setup, stows configs
- **Reload**: `scripts/reload` regenerates templates, restarts DMS, reloads systemd user units

### Key paths
- `configuration/` - stow packages (niri, DankMaterialShell, zsh, ghostty, etc.)
- `setup-scripts/system-setup` - installs packages via paru + cargo
- `scripts/reload` - regenerates configs, restarts DMS
- `configuration/environment.template` - exported env vars used by templates

## Greetd Login (greetd + dms-greeter)

### Current greeting setup
- **greeter**: `greetd-dms-greeter-git` (AUR, v0.6.2)
- **compositor greeter**: niri with `/etc/greetd/niri/config.kdl`
- **greeter command**: `/usr/bin/dms-greeter --command niri --cache-dir /var/cache/dms-greeter -C /etc/greetd/niri/config.kdl`
- **user session**: selected from `/usr/share/wayland-sessions/*.desktop` (parsed by greeter for `Name=` and `Exec=`)
- **last session remembered**: `/var/cache/dms-greeter/memory.json` -> `/var/cache/dms-greeter/.local/state/memory.json`

### Available sessions (from desktop files)
1. **niri** (`Exec=niri-session`) - scrollable-tiling Wayland compositor
2. **GNOME** (`Exec=/usr/bin/gnome-session`) - standard GNOME
3. **GNOME Classic** (`Exec=gnome-session --session gnome-classic`) - classic GNOME

### greetd config
- `/etc/greetd/config.toml` - main greetd config
- `/etc/greetd/environments` - lists available sessions (niri, gnome commented out)
- `/etc/greetd/niri/config.kdl` - niri config used for the greeter display
- `/etc/greetd/niri/dms.kdl` - input/output settings for greeter niri

## Known Recurring Issue

### Symptom
After `paru -Syu`, greeter shows the login UI but **session dropdown is empty** ("no DE to select from"). Login halts.

### Observed journal pattern
```
(no login at all for 15 min)
check_children: greeter exited without creating a session
-- Boot --
greeter: session opened for user petr  ← works on the first try
```

The greeter runs niri + quickshell fine (UI renders), but the session discovery (`find *.desktop` in `GreeterContent.qml`) returns zero results.

### Root Cause (unconfirmed)
Most likely a **race in session discovery** (matches known bug — greeter uses hardcoded search paths and is fragile). Quickshell shells out to `find ... -name '*.desktop'` at startup. If the filesystem or mount namespace isn't fully ready when the `Process` runs, it finds nothing. On the next boot the timing works out.

The issue appears only after large updates, possibly because:
- A delayed background filesystem operation (updatedb, tmpfiles, etc.) ties up I/O
- The `greeter` PAM session or systemd user instance initializes at a different speed
- The hardcoded `WLR_DRM_DEVICES=/dev/dri/card1` in `dms-greeter` can cause the greeter compositor to fail on certain GPU configurations

### Related upstream reports
- https://github.com/AvengeMedia/DankMaterialShell/issues/2139 — "Dank Greeter ignores session entries" (hardcoded paths, doesn't respect XDG_DATA_DIRS properly)
- https://github.com/AvengeMedia/DankMaterialShell/issues/1393 — Hardcoded `WLR_DRM_DEVICES=/dev/dri/card1` breaks on single-GPU systems
- https://github.com/AvengeMedia/DankMaterialShell/issues/1549 — Various greeter setup failures after updates
- https://bbs.archlinux.org/viewtopic.php?id=313118 — greetd-regreet broken after upgrade (missing accountsservice dep)
- https://askubuntu.com/questions/1515996 — GDM: "no session desktop files installed" after package got auto-removed

### Fix
**Reboot** — if it fails, reboot again. It's timing-dependent.

### If repeatedly failing, diagnose
```bash
journalctl -u greetd -n 50 --no-pager
ls -la /var/cache/dms-greeter/
cat /var/cache/dms-greeter/.local/state/memory.json
```
The issue is not quickshell or greeter package state — those are installed and intact.

## PAM Faillock Sudo Lockout

### Symptom
After 3 bad sudo attempts, user account gets locked entirely — even TTY login fails with "user is locked due to multiple invalid logins." Reboot clears it temporarily.

### Root Cause
- `/etc/pam.d/sudo` includes `system-auth` which contains `pam_faillock.so`
- Once faillock hits the deny threshold (~3), `pam_faillock.so preauth` rejects all auth before password check — even correct passwords fail
- Each failed attempt while locked increments the counter further (death spiral)
- Faillock state lives in `/var/run/faillock` (tmpfs) → cleared on reboot

### Fix
```bash
# Reset faillock counter (needs root)
faillock --user <username> --reset
```

### Prevention Options
1. **Separated sudo PAM** — create `/etc/pam.d/sudo` without faillock:
   ```
   auth       [success=1 default=bad]   pam_unix.so   try_first_pass nullok
   auth       required                  pam_env.so
   account    include                   system-auth
   session    include                   system-auth
   ```
2. **faillock.conf tuning** — set higher `deny` + `unlock_time` in `/etc/security/faillock.conf`

### Why it didn't happen on Ubuntu
Debian/Ubuntu doesn't enable `pam_faillock` in `system-auth` by default. RHEL/Fedora/Arch (ChachyOS) does — it's a distro family difference.

## Keyring & greetd Login Hang (2026-05-18)

### Root Cause
Two actions in CachyOS Hello triggered a chain: **"Reset Keyrings"** changed the `login.keyring` password to an unknown value, and `pam_gnome_keyring.so auto_start` in `/etc/pam.d/greetd` hung forever when the prompter couldn't open a Wayland display (because niri wasn't propagating `WAYLAND_DISPLAY` to the systemd user environment).

### Failure Chain
1. PAM tries `pam_gnome_keyring.so auto_start` → keyring password no longer matches login password
2. `gnome-keyring-daemon` spawns `gcr-prompter` to ask user for old password → crashes (`cannot open display:`) since `WAYLAND_DISPLAY` missing from systemd user env
3. gnome-keyring-daemon loops trying to spawn prompter → **PAM session hangs indefinitely**

### Fixes Applied
1. **Removed broken keyring** — `mv ~/.local/share/keyrings/login.keyring{,.old}`
2. **Removed `pam_gnome_keyring.so` from `/etc/pam.d/greetd`** — the auto_start PAM hook was the hang point; gnome-keyring is now managed by systemd user services
3. **Added `WAYLAND_DISPLAY` propagation to niri** — `spawn-sh-at-startup "systemctl --user import-environment WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE; dbus-update-activation-environment --systemd WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE"` in `configuration/niri/.config/niri/config.kdl.template`

### After Fix
| Scenario | Before | After |
|---|---|---|
| greetd login | Hangs indefinitely | Logs in normally |
| `login.keyring` auto-unlock | Fails (wrong password) | Auto-unlocked by PAM on login |
| `gcr-prompter` | Cannot open display | Has `WAYLAND_DISPLAY` |
| Discord | Blank black screen | Prompts to re-login once |
| Systemd user services | No Wayland context | `WAYLAND_DISPLAY` available from start |
