# NixOS Dotfiles with Niri, Disko, and Home Manager

A declarative, reproducible NixOS configuration featuring:
- **Niri**: Modern scrollable-tiling Wayland compositor
- **Disko**: Declarative disk partitioning
- **Home Manager**: User environment management
- **Flakes**: For reproducible builds and easy updates

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
git clone https://github.com/xfusek08/dotfiles-niri /tmp/dotfiles-nixos
cd /tmp/dotfiles-nixos
git checkout nixos

# 3. Partition disk with Disko (⚠️ ERASES ALL DATA!)
disko --mode disko /tmp/dotfiles-nixos/disk-config.nix

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
nixos-enter --root /mnt

# 8. Reboot into new system
reboot
```

### Phase 2: Apply Full Configuration

After rebooting into your basic NixOS system:

```bash
# 1. Copy your dotfiles to home directory
nix-shell -p git
git clone https://github.com/xfusek08/dotfiles-niri ~/dotfiles-nixos
cd ~/dotfiles-nixos
git checkout nixos

# 2. Generate hardware configuration and include it in repo
nixos-generate-config --root /mnt --no-filesystems
cp /mnt/etc/nixos/hardware-configuration.nix ./hardware-configuration.nix
git add hardware-configuration.nix
git commit -m "Add hardware configuration"

# 3. Apply your full flake configuration
sudo nixos-rebuild switch --flake .#nixos

# 4. Set password for your user
sudo passwd petr

# 5. Reboot to start Niri session
reboot
```

### Alternative: One-Step Installation (Advanced)

If you're confident and want to install everything at once:

```bash
# After step 6 in Phase 1, instead of basic install:
# Edit configuration to add niri cache (avoids building from source)
# Then run:
nixos-install --flake /tmp/dotfiles-nixos#nixos --no-root-password

# Set user password
nixos-enter --root /mnt -c 'passwd petr'

# Reboot
reboot
```
