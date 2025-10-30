# Migration from Hyprland to Niri

## Summary of Changes

This repository has been successfully migrated from Hyprland to Niri, a modern scrollable-tiling Wayland compositor.

### What Changed

#### 1. `configuration.nix`
- **Removed**: `programs.hyprland` configuration with UWSM integration
- **Added**: `programs.niri.enable = true` 
- **Added**: XDG Desktop Portal configuration for screencasting and file pickers
- **Added**: Essential Niri utilities:
  - `alacritty` - Default terminal for Niri
  - `fuzzel` - Application launcher
  - `swaylock` - Screen locker
  - `xwayland-satellite` - For running X11 applications

#### 2. `home.nix`
- **Changed**: Auto-start script from `uwsm start -S hyprland-uwsm.desktop` to `niri-session`
- **Added**: Niri-related utilities:
  - `grim` - Screenshot tool
  - `slurp` - Region selector for screenshots
  - `wl-clipboard` - Wayland clipboard utilities
  - `mako` - Notification daemon

#### 3. `README.md`
- Updated title and description to reflect Niri
- Added note about using Niri from nixpkgs

#### 4. `niri-config.kdl`
- Already present in the repository - can be used as-is or customized

## How to Apply the Migration

### Step 1: Review Changes
Check the modified files to ensure everything looks correct:
```bash
git diff
```

### Step 2: Rebuild Your System
```bash
sudo nixos-rebuild switch --flake .#nixos-btw
```

### Step 3: Setup Niri Configuration (Optional)
Niri will use default configuration if none exists, but you can customize it:
```bash
mkdir -p ~/.config/niri
cp niri-config.kdl ~/.config/niri/config.kdl
# Edit the config as desired
```

### Step 4: Reboot
```bash
reboot
```

After reboot, you'll automatically log into Niri instead of Hyprland.

## Key Differences Between Hyprland and Niri

### Workflow Philosophy
- **Hyprland**: Traditional tiling with multiple layouts (dwindle, master, etc.)
- **Niri**: Scrollable tiling - windows arranged in columns on an infinite horizontal strip

### Default Keybindings
Niri uses similar Vim-style navigation but with some differences:

| Action | Niri (with Super/Mod) | Your Hyprland Equivalent |
|--------|----------------------|--------------------------|
| Terminal | `Super+T` (alacritty) | Custom keybind |
| App Launcher | `Super+D` (fuzzel) | Custom keybind |
| Close Window | `Super+Q` | Custom keybind |
| Navigate Left/Right | `Super+H`/`Super+L` or `Super+←`/`Super+→` | Similar |
| Navigate Up/Down | `Super+K`/`Super+J` or `Super+↑`/`Super+↓` | Similar (within column) |
| Move Window | `Super+Ctrl+H/J/K/L` | Similar concept |
| Workspace Up/Down | `Super+I`/`Super+U` or `PageUp`/`PageDown` | Different from Hyprland's numbered workspaces |
| Screenshot | `PrtSc` (area), `Alt+PrtSc` (window), `Ctrl+PrtSc` (screen) | Similar |
| Fullscreen | `Super+Shift+F` | Similar |
| Exit | `Super+Shift+E` | Similar |

### Dynamic Workspaces
Unlike Hyprland's numbered workspaces, Niri uses **dynamic workspaces** like GNOME:
- Workspaces are created automatically as needed
- They're arranged vertically
- Each monitor has independent workspaces
- Always one empty workspace at the bottom

### Floating Windows
Niri added floating window support in v25.01:
- Toggle with `Super+V`
- Still primarily focused on tiling workflow

## Important Software

Niri requires some additional software for a complete desktop experience:

### Already Included
✅ **waybar** - Status bar (auto-starts if configured)  
✅ **mako** - Notification daemon (auto-starts if configured)  
✅ **swaylock** - Screen locker  
✅ **fuzzel** - Application launcher  
✅ **alacritty** - Terminal  
✅ **xdg-desktop-portal-gtk** - Portal backend  

### You May Want to Add
- **swaybg** or **wpaperd** - Wallpaper setter
- **networkmanager-applet** - Network management in system tray
- **blueman** - Bluetooth management
- **pavucontrol** - Audio control

## Troubleshooting

### Black Screen on TTY
If you get a black screen when starting Niri:
1. Check that mesa drivers match: `nix-store -q --references $(which niri) | grep mesa`
2. For Intel graphics, you may need additional configuration (see [NixOS Intel Graphics Wiki](https://wiki.nixos.org/wiki/Intel_Graphics))

### Mesa Version Mismatch
This is a common NixOS issue. Make sure your system mesa version matches niri's mesa version.

### Xwayland Applications
For X11 applications, niri uses `xwayland-satellite` (included in the configuration). It will start automatically when needed.

### Check Niri Status
```bash
# View niri logs
journalctl --user -u niri -f

# Check if niri is running
systemctl --user status niri
```

## Configuration

Niri configuration is located at `~/.config/niri/config.kdl`. 

The configuration uses KDL (KDL Document Language) format, which is more readable than many config formats:
- See `niri-config.kdl` in this repository for a sample
- Full documentation: https://yalter.github.io/niri/Configuration:-Introduction.html

### Live Reloading
Niri supports live config reloading! After editing your config:
```bash
niri msg reload-config
```
No need to restart the compositor.

## Resources

- **Official Documentation**: https://yalter.github.io/niri/
- **GitHub**: https://github.com/YaLTeR/niri
- **Matrix Chat**: https://matrix.to/#/#niri:matrix.org
- **Setup Showcase**: https://github.com/YaLTeR/niri/discussions/325
- **Awesome Niri**: https://github.com/Vortriz/awesome-niri

## Rolling Back

If you need to revert to Hyprland:
```bash
git revert HEAD
sudo nixos-rebuild switch --flake .#nixos-btw
reboot
```

## Questions?

Feel free to ask in the niri Matrix channel or check the FAQ: https://yalter.github.io/niri/FAQ.html
