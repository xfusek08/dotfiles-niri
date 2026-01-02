# NixOS + Niri + DankMaterialShell

Declarative NixOS config with Niri compositor and DankMaterialShell.

## Installation

### 0. Create an NIX OS Bootable USB

```bash
sudo dd bs=4M if=<path-to-iso> of=/dev/sda status=progress oflag=sync
```

Where `<path-to-iso>` is the path to the downloaded NixOS ISO file and `/dev/sda` is your USB drive. Be very careful to select the correct drive to avoid data loss.

To see available disks, use (example):

```bash
❯ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda           8:0    1 233,1G  0 disk
├─sda1        8:1    1   3,4G  0 part
└─sda2        8:2    1     3M  0 part
zram0       253:0    0  54,6G  0 disk [SWAP]
nvme0n1     259:0    0 953,9G  0 disk
├─nvme0n1p1 259:1    0   300M  0 part /boot/efi
└─nvme0n1p2 259:2    0 953,6G  0 part /
```

### 1. Boot NixOS ISO

Boot from the created NixOS USB drive. Select "GNOME" desktop environment because it has proven to have better out-of-the-box support for WiFi and other hardware. (At least for me.)

Then you need connection to the internet. Before proceeding, ensure you have internet connectivity. You can check this by running:

### 2. Partition the root Disk

```bash
# Enter root shell with tools:
#   git   - for cloning the repo
#   disko - for declarative disk partitioning
#   yazi  - for navigating the file system from the terminal
nix-shell -p git disko yazi

# Clone repo
git clone https://github.com/xfusek08/dotfiles-niri
cd dotfiles-niri
git checkout nixos
```

#### ⚠️ Ensure that you will format the correct disk!

Edit the disk device in `disk-config.nix` if your target disk is not `/dev/sda` which is probably not, because in the live ISO `/dev/sda` is usually the USB drive itself.

So for example when:
```bash
❯ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda           8:0    1 233,1G  0 disk
├─sda1        8:1    1   3,4G  0 part
└─sda2        8:2    1     3M  0 part
zram0       253:0    0  54,6G  0 disk [SWAP]
nvme0n1     259:0    0 953,9G  0 disk
├─nvme0n1p1 259:1    0   300M  0 part /boot/efi
└─nvme0n1p2 259:2    0 953,6G  0 part /
```

the edit will be:

```nix
# disk-config.nix
{
  disko.devices = {
    disk = {
      main = {
        # ...
        device = "/dev/nvme0n1"; # Updated line
        # ...
      };
    };
  };
}

```
#### Now Format the Disk

```bash
# ⚠️ ERASES ALL DATA - Partition disk declaratively
sudo disko --mode disko disk-config.nix

# and make sure the partitions are created.
lsblk
```

### 3. HW configuration:
`hardware-configuration.nix` is what is used by the `configuration.nix` and it is ignored in git so it has to be created manually when the repo is cloned.

#### _ether_; A. Installing on Known Hardware (I have already hardware-configuration.nix)
```bash
# For example installing on VirtualBox
cp v-box-hardware-configuration.nix hardware-configuration.nix
```

#### _or_; B. Installing on New Hardware (Generate hardware-configuration.nix)

```bash
# Copy hardware config to the repo for later use. We will later rename it to create a machine-specific hardware config which will be tracked by git when authenticated to your GitHub account via SSH keys.
sudo nixos-generate-config --root /mnt
cp /mnt/etc/nixos/hardware-configuration.nix ./hardware-configuration.nix
```

### 4. Install the system

```bash
# Commit all changes (hardware-configuration.nix, disk-config.nix) so that nix flake can use them.
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git add .
git commit -m "nix-install"

# Installs NixOS directly from the flake.
# We use impure mode to allow using git-ignored files (hardware-configuration.nix) it will later not bee needed when the hw config is tracked.
sudo nixos-install --root /mnt --flake .#nixos
```

# Set user password.
# (In the future the configuration will hold the password hash so this step won't be necessary.)
sudo nixos-enter --root /mnt -c 'passwd petr'

# Reboot
reboot
```

## Updating

```bash
cd ~/dotfiles-nix
sudo nixos-rebuild switch --flake .#nixos
```
