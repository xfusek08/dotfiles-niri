# Keyring & greetd Login Fix Report
**Date:** 2026-05-18
**System:** CachyOS (Arch-based), greetd + niri + gnome-keyring

---

## Root Cause Summary

Two actions in **CachyOS Hello** triggered a chain of failures:

1. **"Reset Keyrings"** — Changed the `login.keyring` password to an unknown value, breaking PAM auto-unlock
2. **"Remove Orphaned Packages"** — Removed build-time tools (no runtime impact, but confirmed not the cause)

---

## What Was Wrong

### Problem 1: greetd login hung indefinitely

**Flow of failure:**
1. User enters password in the dms-greeter on `tty1`
2. greetd authenticates via PAM (`/etc/pam.d/greetd`)
3. `session optional pam_gnome_keyring.so auto_start` tries to unlock `~/.local/share/keyrings/login.keyring`
4. The keyring password no longer matched the login password (reset by CachyOS Hello)
5. `gnome-keyring-daemon` tried to prompt the user for the correct password via `gcr-prompter`
6. `gcr-prompter` needs a Wayland display to show its UI — but `WAYLAND_DISPLAY` was **never propagated to the systemd user environment**, so it crashed with `cannot open display:`
7. gnome-keyring-daemon looped trying to spawn the prompter, **hanging the PAM session stack** indefinitely
8. User was forced to switch to `tty2`, log in via TTY, and start niri manually

**Evidence from logs:**
```
greetd[1052]: gkr-pam: couldn't unlock the login keyring.
gcr-prompter[8428]: cannot open display:
systemd[976]: dbus-:1.2-org.gnome.keyring.SystemPrompter@0.service: Failed with result 'exit-code'.
```

### Problem 2: Discord blank black screen

Discord uses the system keyring (via libsecret/gnome-keyring) to store OAuth tokens and credentials. With `login.keyring` locked and the prompter broken, gnome-keyring-daemon couldn't unlock secrets — Discord launched but had no credentials, rendering a blank screen.

### Problem 3: WAYLAND_DISPLAY never reached systemd user services

niri's `spawn-at-startup` apps correctly had `WAYLAND_DISPLAY` in their environment, but niri was **not propagating it to the systemd user session**. Any D-Bus-activated user service (like `gcr-prompter`, `xdg-desktop-portal`, etc.) started without Wayland context. This was a pre-existing misconfiguration exposed by the keyring issue.

---

## Fixes Applied

### Fix 1: Removed the broken login keyring

```bash
mv ~/.local/share/keyrings/login.keyring  ~/.local/share/keyrings/login.keyring.old
mv ~/.local/share/keyrings/login.keyring.bak ~/.local/share/keyrings/login.keyring.bak.old
```

On next greetd login, `pam_gnome_keyring.so` will create a fresh `login.keyring` using the login password — restoring seamless auto-unlock.

### Fix 2: Removed `pam_gnome_keyring.so` from `/etc/pam.d/greetd`

**Before:**
```pam
session    include      system-local-login
session    optional     pam_gnome_keyring.so auto_start
```
**After:**
```pam
session    include      system-local-login
```

The `auto_start` PAM hook was the hang point. gnome-keyring-daemon is now managed entirely by systemd user services, which is the modern recommended approach anyway.

### Fix 3: Added `WAYLAND_DISPLAY` propagation to niri startup

**File:** `configuration/niri/.config/niri/config.kdl.template`

Added before the other `spawn-at-startup` entries:
```kdl
spawn-sh-at-startup "systemctl --user import-environment WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE; dbus-update-activation-environment --systemd WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE"
```

Regenerated and stowed via `reload`. Also applied immediately to the running session:
```bash
systemctl --user import-environment WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE
dbus-update-activation-environment --systemd WAYLAND_DISPLAY DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE
```

---

## Expected Behaviour After Reboot

| Scenario | Before | After |
|---|---|---|
| greetd login | Hangs indefinitely | Logs in normally |
| `login.keyring` auto-unlock | Fails (wrong password) | Auto-unlocked by PAM on login |
| `gcr-prompter` (keyring UI) | `cannot open display` | Has `WAYLAND_DISPLAY`, works correctly |
| Discord | Blank black screen | Prompts to re-login once, then works |
| Systemd user services (portals, etc.) | No Wayland context | `WAYLAND_DISPLAY` available from session start |

---

## Action Required

**Restart Discord** — it will prompt for re-authentication once since the old keyring secrets are gone. After logging in, tokens will be stored in the new keyring.
