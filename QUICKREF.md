# Quick Reference

## Installation Commands

### Automated Installation with Disko
```bash
# 1. Boot live ISO and become root
sudo -i

# 2. Clone repository
nix-shell -p git
git clone https://github.com/xfusek08/dotfiles-niri /tmp/dotfiles-nixos
cd /tmp/dotfiles-nixos

# 3. Run Disko (⚠️ DESTRUCTIVE!)
nix --experimental-features "nix-command flakes" run github:nix-community/disko -- \
  --mode disko /tmp/dotfiles-nixos/disk-config.nix

# 4. Generate and copy hardware config
nixos-generate-config --root /mnt --no-filesystems
cp /mnt/etc/nixos/hardware-configuration.nix /tmp/dotfiles-nixos/

# 5. Uncomment hardware-configuration.nix import in configuration.nix
vim /tmp/dotfiles-nixos/configuration.nix

# 6. Install
cp -r /tmp/dotfiles-nixos /mnt/tmp/
nixos-install --flake /mnt/tmp/dotfiles-nixos#nixos

# 7. Set password and reboot
nixos-enter --root /mnt -c 'passwd petr'
reboot
```

## Post-Install Commands

### Move Config to Home
```bash
mkdir ~/dotfiles-nixos
sudo cp -r /tmp/dotfiles-nixos/* ~/dotfiles-nixos/
sudo chown -R $USER:users ~/dotfiles-nixos
cd ~/dotfiles-nixos
```

### Rebuild System
```bash
sudo nixos-rebuild switch --flake ~/dotfiles-nixos#nixos
# Or use alias: rebuild
```

### Update Flake
```bash
cd ~/dotfiles-nixos
nix flake update
sudo nixos-rebuild switch --flake .#nixos
# Or use alias: update
```

### Check Flake
```bash
cd ~/dotfiles-nixos
nix flake check
nix flake show
```

### See What Would Change (Dry Run)
```bash
nixos-rebuild dry-build --flake ~/dotfiles-nixos#nixos
```

### Rollback to Previous Generation
```bash
sudo nixos-rebuild switch --rollback
```

### List Generations
```bash
nix-env --list-generations --profile /nix/var/nix/profiles/system
```

## File Structure

```
dotfiles-nixos/
├── flake.nix              # Main flake config
├── flake.lock             # Locked dependency versions
├── configuration.nix      # System configuration
├── hardware-configuration.nix  # Hardware-specific config
├── disk-config.nix        # Disko disk layout
├── home.nix              # Home Manager user config
└── modules/              # Optional modular configs
    ├── neovim.nix
    ├── shell.nix
    └── desktop.nix
```

## Common Customizations

### Change Hostname
Edit `configuration.nix`:
```nix
networking.hostName = "my-hostname";
```
Then rebuild.

### Change Username
1. Edit `configuration.nix` (users.users section)
2. Edit `home.nix` (home.username and homeDirectory)
3. Edit `flake.nix` (users.yourname)
4. Rebuild

### Add System Package
Edit `configuration.nix`:
```nix
environment.systemPackages = with pkgs; [
  package-name
];
```

### Add User Package
Edit `home.nix`:
```nix
home.packages = with pkgs; [
  package-name
];
```

### Configure Git
Edit `home.nix`:
```nix
programs.git = {
  enable = true;
  userName = "Your Name";
  userEmail = "your@email.com";
  extraConfig = {
    init.defaultBranch = "main";
    pull.rebase = false;
  };
};
```

## Troubleshooting

### Disk Device Name Wrong
Check with `lsblk`, then edit `disk-config.nix`:
```nix
device = "/dev/sda";  # or /dev/nvme0n1
```

### Can't Build Flake
```bash
# Update flake inputs
nix flake update

# Check for errors
nix flake check
```

### Installation Fails
```bash
# Check syntax
nix-instantiate --parse flake.nix

# Verbose output
nixos-install --flake /mnt/tmp/dotfiles-nixos#nixos --show-trace
```

### Password Not Working
```bash
# Reset from live ISO
nixos-enter --root /mnt -c 'passwd username'
```

## Useful Nix Commands

```bash
# Search for packages
nix search nixpkgs package-name

# Enter dev shell with packages
nix-shell -p package1 package2

# Run one-off command
nix run nixpkgs#package

# Garbage collect old generations
sudo nix-collect-garbage -d

# Optimize store
nix-store --optimize
```

## Aliases (from home.nix)

```bash
ll          # ls -l
la          # ls -la
rebuild     # Rebuild NixOS
update      # Update flake and rebuild
```

## Documentation Links

- [NixOS Options Search](https://search.nixos.org/options)
- [Home Manager Options](https://nix-community.github.io/home-manager/options.html)
- [Nix Package Search](https://search.nixos.org/packages)
