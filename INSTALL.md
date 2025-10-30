# NixOS Installation Guide with Disko + Home Manager

This guide shows how to install NixOS with automatic disk partitioning via Disko and Home Manager configuration from a git repository.

## Prerequisites

1. Boot into NixOS minimal ISO
2. Connect to the internet (ethernet or wifi)
3. Switch to root: `sudo -i`

## Installation Steps

### 1. Set up networking (if needed)

For WiFi:
```bash
systemctl start wpa_supplicant
wpa_cli
> add_network
> set_network 0 ssid "YourSSID"
> set_network 0 psk "YourPassword"
> enable_network 0
> quit
```

### 2. Clone your configuration

```bash
# Install git (available in live ISO)
nix-shell -p git

# Clone your dotfiles
cd /tmp
git clone https://github.com/xfusek08/dotfiles-niri dotfiles-nixos
cd dotfiles-nixos
```

### 3. Check and modify disk configuration

Edit `disk-config.nix` if you need to change:
- Device name (currently `/dev/vda`, change to `/dev/sda` or `/dev/nvme0n1` as needed)
- Partition sizes

```bash
# Check your disk names
lsblk

# Edit if needed
vim disk-config.nix
```

### 4. Partition and format disks with Disko

**⚠️ WARNING: This will ERASE ALL DATA on the target disk!**

```bash
# Run Disko to partition and format
sudo nix --experimental-features "nix-command flakes" run github:nix-community/disko -- --mode disko /tmp/dotfiles-nixos/disk-config.nix
```

This command will:
- Partition the disk according to `disk-config.nix`
- Format partitions
- Mount everything to `/mnt`

### 5. Generate hardware configuration

```bash
# Generate hardware-configuration.nix
nixos-generate-config --root /mnt --no-filesystems

# Copy it to your config directory
cp /mnt/etc/nixos/hardware-configuration.nix /tmp/dotfiles-nixos/
```

Note: We use `--no-filesystems` because Disko already handles filesystem configuration.

### 6. Uncomment hardware-configuration import

Edit `configuration.nix` and uncomment the hardware-configuration import:

```bash
vim /tmp/dotfiles-nixos/configuration.nix
# Uncomment: # ./hardware-configuration.nix
```

### 7. Customize your configuration

Before installing, review and customize:

```bash
# Edit user details in home.nix (git name, email)
vim /tmp/dotfiles-nixos/home.nix

# Edit hostname, timezone, etc. in configuration.nix
vim /tmp/dotfiles-nixos/configuration.nix

# Edit disk device if needed
vim /tmp/dotfiles-nixos/disk-config.nix
```

### 8. Install NixOS

```bash
# Copy config to /mnt for installation
cp -r /tmp/dotfiles-nixos /mnt/tmp/

# Install using the flake
nixos-install --flake /mnt/tmp/dotfiles-nixos#nixos
```

### 9. Set user password

```bash
# Set password for your user
nixos-enter --root /mnt -c 'passwd petr'
```

### 10. Reboot

```bash
reboot
```

## Post-Installation

After rebooting and logging in:

### 1. Move your dotfiles to your home directory

```bash
# Copy the configuration to your home directory
mkdir ~/dotfiles-nixos
sudo cp -r /tmp/dotfiles-nixos/* ~/dotfiles-nixos/
sudo chown -R petr:users ~/dotfiles-nixos

# Initialize git repository (if not already)
cd ~/dotfiles-nixos
git init
git add .
git commit -m "Initial NixOS configuration"

# Add your remote
git remote add origin https://github.com/xfusek08/dotfiles-niri
git push -u origin nixos
```

### 2. Future rebuilds

```bash
# Rebuild your system from your local config
sudo nixos-rebuild switch --flake ~/dotfiles-nixos#nixos

# Or use the alias from home.nix
rebuild

# Update flake inputs and rebuild
update
```

### 3. Adding configuration modules

You can organize your configuration by creating modules:

```bash
mkdir -p ~/dotfiles-nixos/modules
```

Example structure:
```
dotfiles-nixos/
├── flake.nix
├── configuration.nix
├── hardware-configuration.nix
├── disk-config.nix
├── home.nix
└── modules/
    ├── neovim.nix
    ├── shell.nix
    └── desktop.nix
```

Then import them in `home.nix`:
```nix
{
  imports = [
    ./modules/neovim.nix
    ./modules/shell.nix
  ];
}
```

## Key Benefits of This Setup

1. **Declarative Disk Partitioning**: Disko handles all partitioning automatically
2. **Git-Tracked Configuration**: Your entire system is version controlled
3. **Home Manager Integration**: User configuration managed alongside system config
4. **Reproducible**: Can recreate the exact same system on any machine
5. **Single Command Installation**: No manual partitioning steps needed

## Troubleshooting

### Disko fails to partition

- Check disk device name with `lsblk`
- Make sure no partitions are mounted
- Try: `umount -R /mnt` before running Disko

### Build fails during installation

- Check internet connection
- Review error messages for syntax errors in .nix files
- Ensure all imports are correct

### Can't log in after installation

- Did you set the user password with `passwd petr`?
- Check the username matches in `configuration.nix` and `home.nix`

## References

- [Disko Documentation](https://github.com/nix-community/disko)
- [Home Manager Manual](https://nix-community.github.io/home-manager/)
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
