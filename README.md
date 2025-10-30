# NixOS Dotfiles with Niri, Disko, and Home Manager

A declarative, reproducible NixOS configuration featuring:
- **Niri**: Modern scrollable-tiling Wayland compositor with unique horizontal workflow
- **Disko**: Declarative disk partitioning
- **Home Manager**: User environment management
- **Flakes**: For reproducible builds and easy updates

> **Note**: This configuration uses Niri from nixpkgs (programs.niri.enable = true)

## 🚀 Installation

This is a two-phase installation process:
1. **Phase 1**: Install minimal NixOS system
2. **Phase 2**: Apply your custom configuration with Niri, Home Manager, etc.

**See [INSTALL.md](./INSTALL.md)** for the complete step-by-step guide.

### Phase 1: Basic NixOS Installation

Boot NixOS live ISO, or use [[SSH Access from Host to VM]] for easier command execution:

```bash
# 0. Switch to root
sudo -i

# 1. Open shell with git and disko
nix-shell -p git disko

# 2. Clone this repository
git clone https://github.com/xfusek08/dotfiles-niri ~/dotfiles-nixos
cd ~/dotfiles-nixos
git checkout nixos

# 3. Partition disk with Disko (⚠️ ERASES ALL DATA!)
disko --mode disko ~/dotfiles-nixos/disk-config.nix

# 4. Verify partitions
lsblk
# Expected output:
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
# vda    253:0    0   25G  0 disk
# ├─vda1 253:1    0    1G  0 part /mnt/boot
# ├─vda2 253:2    0    4G  0 part [SWAP]
# └─vda3 253:3    0   20G  0 part /mnt

# 5. Generate hardware config
nixos-generate-config --root /mnt

# 6. Install MINIMAL NixOS
# Will prompt for root password at the end
nixos-install --root /mnt

# 7. (Optional) Use nixos-enter to run commands in new system
nixos-enter --root /mnt -c 'psswd petr'  # Set root password if not set during install

# 8. Reboot into new system
reboot
```

### Phase 2: Apply Full Configuration

After rebooting into your basic NixOS system:

```bash
# 1. Copy your dotfiles to home directory
nix-shell -p git disko
git clone https://github.com/xfusek08/dotfiles-niri ~/dotfiles-niri
cd ~/dotfiles-niri
git checkout nixos

# 2. Generate hardware configuration and include it in repo
nixos-generate-config --root /mnt --no-filesystems
cp /mnt/etc/nixos/hardware-configuration.nix ./hardware-configuration.nix
git add hardware-configuration.nix
git commit -m "Add hardware configuration"

# 3. Apply your full flake configuration
sudo nixos-rebuild switch --flake .#nixos

# 4. Copy niri config to your home directory (optional - niri will use defaults if not present)
mkdir -p ~/.config/niri
cp niri-config.kdl ~/.config/niri/config.kdl

# 5. Set password for your user
sudo passwd petr

# 6. Reboot to start Niri session
reboot
```

### Alternative: One-Step Installation (Advanced)

If you're confident and want to install everything at once:

```bash
# After step 6 in Phase 1, instead of basic install:
nixos-install --flake /tmp/dotfiles-nixos#nixos --no-root-password

# Set user password
nixos-enter --root /mnt -c 'passwd petr'

# Reboot
reboot
```

## 📝 Configuration

After installation, you can customize niri by editing `~/.config/niri/config.kdl`. A sample configuration is provided in this repository at `niri-config.kdl`.

Key features of the setup:
- **Default Terminal**: Alacritty (`Super+T`)
- **Application Launcher**: Fuzzel (`Super+D`)
- **Status Bar**: Waybar (auto-starts)
- **Notifications**: Mako (auto-starts)
- **Screen Locker**: Swaylock (`Super+Alt+L`)
- **Screenshots**: grim + slurp (`Print` key)

For full niri documentation, see: https://yalter.github.io/niri/

## 🔧 Installed Wayland Components

- **niri**: Scrollable-tiling Wayland compositor (from nixpkgs)
- **xdg-desktop-portal-gtk**: Portal backend for file pickers, screencasting, and settings
- **pipewire**: Audio and video routing (for screencasting)
- **polkit-kde-agent**: Authentication agent
- **gnome-keyring**: Credential storage (enabled by NixOS when using portals)

## 🎨 Customization

The configuration uses:
- System packages defined in `configuration.nix`
- User packages and settings in `home.nix`
- Niri-specific config in `~/.config/niri/config.kdl`

To rebuild after making changes:
```bash
rebuild  # Alias defined in home.nix
# or
sudo nixos-rebuild switch --flake ~/dotfiles-nixos#nixos
```

```shell
cp /home/petr/dotfiles-niri/configuration.nix /etc/nixos/configuration.nix
cp /home/petr/dotfiles-niri/home.nix /etc/nixos/home.nix
cp /home/petr/dotfiles-niri/flake.nix /etc/nixos/flake.nix
cp /home/petr/dotfiles-niri/niri-config.kdl /etc/nixos/niri-config.kdl


cp ~/dotfiles-nixos/configuration.nix /mnt/etc/nixos/configuration.nix
cp ~/dotfiles-nixos/home.nix /mnt/etc/nixos/home.nix
cp ~/dotfiles-nixos/flake.nix /mnt/etc/nixos/flake.nix
cp ~/dotfiles-nixos/niri-config.kdl /mnt/etc/nixos/niri-config.kdl

cat /mnt/etc/nixos/configuration.nix /mnt/etc/nixos/home.nix

cp ~/dotfiles-niri/configuration.nix /etc/nixos/configuration.nix
cp ~/dotfiles-niri/home.nix /etc/nixos/home.nix
cp ~/dotfiles-niri/flake.nix /etc/nixos/flake.nix
cp ~/dotfiles-niri/niri-config.kdl /etc/nixos/niri-config.kdl

nixos-rebuild switch --flake /etc/nixos#nixos-btw

```
