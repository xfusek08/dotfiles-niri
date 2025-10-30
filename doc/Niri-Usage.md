# Niri Usage Guide

## What is Niri?

Niri is a scrollable-tiling Wayland compositor where windows are arranged in columns on an infinite horizontal strip. Opening a new window never causes existing windows to resize.

## Key Concepts

- **Columns**: Windows are organized in vertical columns
- **Workspaces**: Multiple workspaces arranged vertically (like GNOME)
- **Scrollable**: Unlimited horizontal space for columns
- **Per-Monitor**: Each monitor has its own independent window strip

## Essential Keybindings

### Applications
- `Super+T` - Launch terminal (Alacritty)
- `Super+D` - Launch application launcher (Fuzzel)
- `Super+Q` - Close focused window
- `Super+Alt+L` - Lock screen (Swaylock)

### Window Navigation
- `Super+H/←` - Focus column to the left
- `Super+L/→` - Focus column to the right
- `Super+J/↓` - Focus window below in column
- `Super+K/↑` - Focus window above in column

### Moving Windows
- `Super+Ctrl+H/←` - Move column left
- `Super+Ctrl+L/→` - Move column right
- `Super+Ctrl+J/↓` - Move window down in column
- `Super+Ctrl+K/↑` - Move window up in column

### Workspace Management
- `Super+U` or `PageDown` - Switch to workspace below
- `Super+I` or `PageUp` - Switch to workspace above
- `Super+Ctrl+U/PageDown` - Move column to workspace below
- `Super+Ctrl+I/PageUp` - Move column to workspace above

### Window Management
- `Super+R` - Cycle through preset column widths
- `Super+F` - Maximize column
- `Super+C` - Center column in view
- `Super+-` - Decrease column width by 10%
- `Super+=` - Increase column width by 10%
- `Super+Shift+F` - Toggle fullscreen
- `Super+Shift+-` - Decrease window height by 10%
- `Super+Shift+=` - Increase window height by 10%

### Screenshots
- `Print` - Area screenshot (select with mouse)
- `Alt+Print` - Screenshot focused window
- `Ctrl+Print` - Screenshot focused monitor

### Column Operations
- `Super+,` - Consume window to the right into column
- `Super+.` - Expel bottom window from column
- `Super+[` - Consume/expel window to the left
- `Super+]` - Consume/expel window to the right

### System
- `Super+Shift+E` - Exit niri
- `Super+Shift+/` - Show hotkey help overlay

## Configuration

Niri configuration is located at `~/.config/niri/config.kdl`

After editing, niri automatically reloads the configuration (live reload).

## Useful Commands

```bash
# Validate configuration
niri validate

# Show current configuration
niri msg --json config

# List outputs
niri msg --json outputs

# List workspaces
niri msg --json workspaces

# Switch to specific workspace
niri msg action focus-workspace --reference-by-name <name>
```

## Getting Help

- Full documentation: https://yalter.github.io/niri/
- Configuration reference: https://yalter.github.io/niri/Configuration:-Introduction.html
- Matrix chat: https://matrix.to/#/#niri:matrix.org
- GitHub: https://github.com/YaLTeR/niri

## Troubleshooting

### Black screen on TTY
If you see a black screen when starting niri from a TTY, check:
1. Mesa drivers are up to date
2. Kernel modesetting is enabled (especially for NVIDIA)
3. Try setting render device manually in config (see Getting Started guide)

### Electron apps not working
Make sure `NIXOS_OZONE_WL=1` is set (already configured in this dotfiles).

### VS Code keyring issues
Launch with `--password-store="gnome-libsecret"` or configure in `argv.json`.

## Tips

- Press `Super+Shift+/` to see the built-in hotkey reference
- Niri works great with touchpad gestures
- You can run multiple workspaces per monitor
- Use `niri msg` for scripting and automation
- Screenshots are saved to `~/Pictures/Screenshots/`
