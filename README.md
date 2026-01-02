# NixOS + Niri + DankMaterialShell

Declarative NixOS config with Niri compositor and DankMaterialShell.

## Installation

### 1. Boot NixOS ISO & Partition

```bash
# Enter root shell with tools
sudo -i
nix-shell -p git disko

# Clone repo
git clone https://github.com/xfusek08/dotfiles-niri
cd dotfiles-niri
git checkout nixos

# ⚠️ ERASES ALL DATA - Partition disk declaratively
disko --mode disko ./disk-config.nix

# Verify partitions (should show boot, swap, root)
lsblk
```

> **Note**: Edit `disk-config.nix` if your disk is not `/dev/sda`

### 2. Install Minimal NixOS

```bash
# Generate hardware config
nixos-generate-config --root /mnt

# Install base system
nixos-install --root /mnt

# Set user password
nixos-enter --root /mnt -c 'passwd petr'

# Reboot
reboot
```

### 3. Clone & Configure

After reboot, log in as `petr`:

```bash
# Enter shell with git
nix-shell -p git

# Clone repo
git clone https://github.com/xfusek08/dotfiles-nix ~/dotfiles-nix
cd ~/dotfiles-nix

# Add hardware config to repo
sudo nixos-generate-config --show-hardware-config > hardware-configuration.nix
git add hardware-configuration.nix
git commit -m "Add hardware configuration"
```

### 4. Install Full System

```bash
sudo nixos-rebuild switch --flake .#nixos
```

### 5. Cleanup & Reboot

```bash
# Remove old generations and free disk space
sudo nix-collect-garbage -d
sudo nix-store --optimise

reboot
```

Log in and select **Niri** session.

## Updating

```bash
cd ~/dotfiles-nix
sudo nixos-rebuild switch --flake .#nixos
```

## Keybinds

| Key | Action |
|-----|--------|
| `Alt+T` | Terminal |
| `Alt+D` | App Launcher |
| `Alt+Q` | Close Window |
| `Alt+Space` | Overview |
| `Alt+1-9` | Switch Workspace |
| `Alt+Shift+E` | Quit |
