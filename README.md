# NixOS Dotfiles with Niri, Disko, and Home Manager

A declarative, reproducible NixOS configuration featuring:
- **Niri**: Modern scrollable-tiling Wayland compositor
- **Disko**: Declarative disk partitioning
- **Home Manager**: User environment management
- **Flakes**: For reproducible builds and easy updates

## 🚀 Quick Installation

For a complete NixOS installation from scratch with automated disk partitioning:

**See [INSTALL.md](./INSTALL.md)** for the complete step-by-step guide.

### TL;DR

Boot NixOS live ISO, or use [[SSH Access from Host to VM]] for easier command execution:

```bash
# 0. If not already root, switch to root.
sudo -i

# 1. Open shell with git and disko.
nix-shell -p git disko

# 2. Clone this repository and switch to nixos branch.
git clone https://github.com/xfusek08/dotfiles-niri /tmp/dotfiles-nixos
cd /tmp/dotfiles-nixos
git checkout nixos

# 3. Partition disk with Disko (⚠️ ERASES ALL DATA!)
disko --mode disko /tmp/dotfiles-nixos/disk-config.nix

# 4. Verify partitions with lsblk:
lsblk
# Result for VM:
# -----------------------------------------------
# $ lsblk
# NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
# loop0    7:0    0  1.2G  1 loop /nix/.ro-store
# sr0     11:0    1  1.3G  0 rom  /iso
# vda    253:0    0   25G  0 disk
# ├─vda1 253:1    0    1G  0 part /mnt/boot
# ├─vda2 253:2    0    4G  0 part [SWAP]
# └─vda3 253:3    0   20G  0 part /mnt

# 5. Generate hardware config:
nixos-generate-config --root /mnt --no-filesystems
# writing /mnt/etc/nixos/hardware-configuration.nix...
# writing /mnt/etc/nixos/configuration.nix...
# For more hardware-specific settings, see https://github.com/NixOS/nixos-hardware.

# 6. ONE-STEP INSTALL with your complete flake
nixos-install --flake /tmp/dotfiles-nixos#nixos

# 7. Set user password
nixos-enter --root /mnt -c 'passwd petr'

# 8. Reboot
reboot
```

## 📁 Repository Structure

```
.
├── flake.nix                 # Flake configuration (inputs, outputs)
├── configuration.nix         # System configuration
├── hardware-configuration.nix # Auto-generated hardware config
├── disk-config.nix           # Disko disk partitioning config
├── home.nix                  # Home Manager user configuration
├── INSTALL.md                # Complete installation guide
├── Setup.md                  # Legacy manual installation guide
└── doc/                      # Additional documentation
    ├── Disko.md
    ├── GPT.md
    └── SSH Access from Host to VM.md
```

## 🔧 Post-Installation

After installation, your configuration lives in `/tmp/dotfiles-nixos`. Move it to your home:

```bash
mkdir ~/dotfiles-nixos
sudo cp -r /tmp/dotfiles-nixos/* ~/dotfiles-nixos/
sudo chown -R petr:users ~/dotfiles-nixos
cd ~/dotfiles-nixos
```

### Rebuilding Your System

```bash
# Rebuild system configuration
sudo nixos-rebuild switch --flake ~/dotfiles-nixos#nixos

# Or use the handy alias from home.nix
rebuild
```

### Updating

```bash
# Update flake inputs
cd ~/dotfiles-nixos
nix flake update

# Rebuild with new inputs
sudo nixos-rebuild switch --flake .#nixos

# Or use the combined alias
update
```

## 📝 Customization

### Adding System Packages

Edit `configuration.nix`:
```nix
environment.systemPackages = with pkgs; [
  git
  wget
  your-package-here
];
```

### Adding User Packages

Edit `home.nix`:
```nix
home.packages = with pkgs; [
  neovim
  firefox
  your-package-here
];
```

### Modular Configuration

Create modules for better organization:

```bash
mkdir -p modules
```

Example `modules/neovim.nix`:
```nix
{ pkgs, ... }:
{
  programs.neovim = {
    enable = true;
    viAlias = true;
    vimAlias = true;
  };
  
  home.packages = with pkgs; [
    ripgrep
    fd
  ];
}
```

Then import in `home.nix`:
```nix
{
  imports = [ ./modules/neovim.nix ];
}
```

## 🎯 Key Features

### Declarative Disk Management
Disko handles all partitioning automatically - no manual `fdisk` or `cfdisk` needed!

### Home Manager Integration
User configuration is version controlled alongside system config. No more scattered dotfiles!

### Flake-Based
Locked dependencies ensure reproducible builds across machines and time.

### Git-Tracked
Your entire system configuration is in version control. Easy rollbacks and sharing.

## 📚 Documentation

- [INSTALL.md](./INSTALL.md) - Complete installation guide with Disko
- [Setup.md](doc/Setup.md) - Legacy manual installation method
- [doc/Disko.md](./doc/Disko.md) - Disko documentation
- [doc/GPT.md](./doc/GPT.md) - GPT partitioning info
- [doc/SSH Access from Host to VM.md](./doc/SSH%20Access%20from%20Host%20to%20VM.md) - VM setup

## 🔗 External Resources

- [NixOS Manual](https://nixos.org/manual/nixos/stable/)
- [Home Manager Manual](https://nix-community.github.io/home-manager/)
- [Disko](https://github.com/nix-community/disko)
- [Niri](https://github.com/YaLTeR/niri)
- [Tutorial Reference](https://www.tonybtw.com/tutorial/nixos-from-scratch/)

## 🤝 Contributing

Feel free to fork and customize for your own needs!

## 📄 License

This configuration is provided as-is for personal use.
