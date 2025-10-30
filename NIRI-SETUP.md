# Changes Made: Direct Niri Installation

## Summary

Removed dependency on `sodiboo/niri-flake` and configured niri to be installed directly from nixpkgs. This gives you a more standard NixOS setup while still having full access to niri's functionality.

## Changes Made

### 1. `flake.nix`
- **Removed**: `niri.url = "github:sodiboo/niri-flake"` input
- **Removed**: `niri.nixosModules.niri` module import
- **Removed**: Niri cachix binary cache configuration (moved to configuration.nix, then removed as not needed)

### 2. `configuration.nix`
- **Removed**: Niri-specific binary cache configuration (nixpkgs builds are available)
- **Added**: XDG desktop portal configuration with GNOME backend
- **Added**: Polkit security configuration
- **Added**: GNOME Keyring service
- **Added**: Polkit KDE authentication agent systemd service
- **Added**: Wayland/niri essential packages:
  - `alacritty` - Terminal emulator
  - `fuzzel` - Application launcher
  - `waybar` - Status bar
  - `mako` - Notification daemon
  - `swaylock` - Screen locker
  - `grim` - Screenshots
  - `slurp` - Screen area selection
  - `wl-clipboard` - Clipboard utilities
  - `libsForQt5.polkit-kde-agent` - Polkit agent

### 3. `home.nix`
- **Added**: Wayland environment variables in bash session:
  - `NIXOS_OZONE_WL=1` - Enables Wayland in Electron apps (VS Code, etc.)
  - `MOZ_ENABLE_WAYLAND=1` - Enables Wayland in Firefox

### 4. New Files Created

#### `niri-config.kdl`
- Sample niri configuration file with:
  - Input device configuration (keyboard, touchpad, mouse)
  - Layout settings (gaps, borders, focus ring)
  - Startup programs (waybar, mako)
  - Complete keybinding setup
  - Screenshot configuration

#### `doc/Niri-Usage.md`
- Comprehensive usage guide including:
  - Key concepts explanation
  - All essential keybindings
  - Configuration location
  - Useful commands
  - Troubleshooting tips
  - Tips and tricks

### 5. `README.md`
- **Updated**: Installation instructions to include copying niri config
- **Added**: Configuration section explaining the setup
- **Added**: List of installed Wayland components
- **Added**: Customization guide

## How Niri is Installed

Niri is now installed via nixpkgs' built-in `programs.niri.enable = true` option, which:
- Installs the niri package from nixpkgs
- Sets up systemd services
- Configures session files
- Enables the niri compositor

This is simpler and more maintainable than using a separate flake.

## Configuration Approach

Unlike the niri-flake which provided declarative niri configuration through Nix, this setup uses:
- Traditional KDL configuration file at `~/.config/niri/config.kdl`
- You edit the KDL file directly (more standard for niri users)
- Live reload: changes take effect immediately without rebuilding

## Benefits of This Approach

1. **Simpler**: No external flake dependencies
2. **Standard**: Uses official niri configuration format
3. **Stable**: Relies on nixpkgs-tested builds
4. **Flexible**: Easier to follow upstream niri documentation
5. **Familiar**: If you know niri from other distros, config is the same

## After Installation

1. System will have niri available as a session in your display manager
2. Niri will auto-start waybar and mako
3. Configuration can be customized at `~/.config/niri/config.kdl`
4. Changes to KDL config take effect immediately (no rebuild needed)
5. Changes to nix files require `sudo nixos-rebuild switch --flake ~/dotfiles-nixos#nixos`

## Next Steps

After installing:
1. Copy `niri-config.kdl` to `~/.config/niri/config.kdl`
2. Customize keybindings, colors, and behavior to your liking
3. Read `doc/Niri-Usage.md` for usage guide
4. Check https://yalter.github.io/niri/ for full documentation
