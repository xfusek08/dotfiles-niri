# NixOS Installation with niri Window Manager

This repository contains a declarative NixOS configuration with the niri scrollable-tiling Wayland compositor.

## Prerequisites

- A machine booted from NixOS minimal live ISO
- Internet connection
- Basic familiarity with the terminal

## Installation Steps

### Step 1: Boot NixOS Live ISO and Become Root

```bash
sudo -i
```

### Step 2: Install Git and Clone This Repository

```bash
# Load a temporary Nix shell with git
nix-shell -p git

# Clone this repository
cd /tmp
git clone https://github.com/xfusek08/dotfiles-niri.git
cd dotfiles-niri
```

### Step 3: Identify Your Disk Device

```bash
lsblk
```

Note your disk device name (e.g., `/dev/sda`, `/dev/nvme0n1`, `/dev/vda`).

### Step 4: Configure Disk Layout

Edit `disk-config.nix` and update the device path to match your system:

```bash
nano disk-config.nix
```

Change this line to your actual disk:
```nix
device = "/dev/sda"; # Change this to your actual disk device
```

### Step 5: Partition and Format the Disk Declaratively

This step will **erase all data** on the target disk. Make sure you've selected the correct device!

```bash
nix --experimental-features "nix-command flakes" run github:nix-community/disko -- --mode disko /tmp/dotfiles-niri/disk-config.nix
```

This command will:
- Create a GPT partition table
- Create a 512MB EFI boot partition
- Create a root partition with the remaining space
- Format the partitions
- Mount them at `/mnt`

### Step 6: Generate Hardware Configuration

```bash
nixos-generate-config --no-filesystems --root /mnt
```

Copy the generated hardware configuration to this repository:

```bash
cp /mnt/etc/nixos/hardware-configuration.nix /tmp/dotfiles-niri/
```

**Note:** We use `--no-filesystems` because disko already manages the filesystem configuration.

### Step 7: Customize Configuration (Optional)

Before installing, you may want to customize:

**`configuration.nix`:**
- Change `networking.hostName` to your preferred hostname
- Change `time.timeZone` to your timezone
- Adjust the username (currently `petr`)
- Add additional system packages

**`disk-config.nix`:**
- Adjust partition sizes if needed
- Add swap partition (see Customization section below)

### Step 8: Install NixOS

```bash
cd /tmp/dotfiles-niri
nixos-install --flake .#nixos
```

You'll be prompted to set the root password during installation.

### Step 9: Copy Dotfiles to New System (Optional)

```bash
mkdir -p /mnt/home/petr
cp -r /tmp/dotfiles-niri /mnt/home/petr/.dotfiles
chown -R 1000:100 /mnt/home/petr/.dotfiles
```

### Step 10: Reboot

```bash
reboot
```

Remove the USB drive when prompted.

## Post-Installation

### First Login

1. Log in with the user you configured (default: `petr`)
2. Initial password is `changeme` (as set in configuration.nix)

### Change Passwords

```bash
# Change your user password
passwd

# Change root password
sudo passwd root
```

### Start niri

```bash
# Start niri session
niri-session
```

Or log out and select niri from your display manager.

### Rebuild System After Changes

```bash
# Navigate to your dotfiles (if you copied them)
cd ~/.dotfiles

# Make your changes to configuration.nix or other files
# Then rebuild:
sudo nixos-rebuild switch --flake .#nixos
```

## What's Installed

This configuration includes:

- **niri** - Scrollable-tiling Wayland compositor
- **NetworkManager** - Network connection management
- **Basic tools** - vim, git, wget, curl
- **Polkit** - For privilege escalation (with KDE agent)
- **GNOME Keyring** - For password management
- **XDG Desktop Portal** - For screencasting support

## Recommended Additional Software

For a complete desktop experience, consider adding these to `configuration.nix`:

```nix
environment.systemPackages = with pkgs; [
  # Launcher
  fuzzel
  
  # Bar
  waybar
  
  # Notifications
  mako
  
  # Terminal
  alacritty
  
  # File manager
  nautilus
  
  # Browser
  firefox
];
```

## Customization

### Adding a Swap Partition

Edit `disk-config.nix` and add a swap partition:

```nix
partitions = {
  ESP = {
    size = "512M";
    type = "EF00";
    content = {
      type = "filesystem";
      format = "vfat";
      mountpoint = "/boot";
    };
  };
  swap = {
    size = "8G";  # Adjust to your needs
    content = {
      type = "swap";
      resumeDevice = true; # for hibernation
    };
  };
  root = {
    size = "100%";
    content = {
      type = "filesystem";
      format = "ext4";
      mountpoint = "/";
    };
  };
};
```

### Configuring niri

You can configure niri using `programs.niri.settings` in your configuration. See the [niri-flake documentation](https://github.com/sodiboo/niri-flake/blob/main/docs.md) for all available options.

Example:

```nix
programs.niri.settings = {
  outputs."eDP-1".scale = 2.0;
  
  input.keyboard.xkb = {
    layout = "us";
  };
  
  environment = {
    NIXOS_OZONE_WL = "1"; # Enable Wayland for Electron apps
  };
};
```

### Multiple Machines

To support multiple machines with different configurations:

1. Create separate configuration files (e.g., `laptop.nix`, `desktop.nix`)
2. Update `flake.nix` to add more `nixosConfigurations`
3. Use `nixos-install --flake .#laptop` or `.#desktop`

## Troubleshooting

### niri Won't Start

- Ensure you're using `niri-session` command, not just `niri`
- Check logs: `journalctl --user -u niri`

### No Internet After Installation

```bash
# Check NetworkManager status
systemctl status NetworkManager

# Connect to WiFi
nmcli device wifi list
nmcli device wifi connect "SSID" password "password"
```

### Binary Cache Not Working

The niri binary cache should be automatically enabled. If builds are taking too long:

```bash
# Manually add the cache
cachix use niri
```

## Resources

- [niri Window Manager](https://github.com/YaLTeR/niri)
- [niri-flake Documentation](https://github.com/sodiboo/niri-flake/blob/main/docs.md)
- [Disko Documentation](https://github.com/nix-community/disko)
- [NixOS Manual](https://nixos.org/manual/nixos/stable/)

## License

This configuration is provided as-is for personal use.
