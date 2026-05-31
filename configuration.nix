# =============================================================================
# NixOS System Configuration
# =============================================================================
# Main system configuration file for NixOS
# Location: /etc/nixos/configuration.nix (or in dotfiles repo)
# =============================================================================

{ config, lib, pkgs, inputs, ... }:

let
  dmsPkg = inputs.dms.packages.${pkgs.stdenv.hostPlatform.system}.dms-shell;
in {

  # ===========================================================================
  # IMPORTS
  # ===========================================================================
  # External configuration modules to include
  imports = [
    ./hardware-configuration.nix # Auto-generated hardware-specific settings
    inputs.dms.nixosModules.greeter    # DankGreeter - Material Design login screen module
  ];

  # ===========================================================================
  # NIX SETTINGS
  # ===========================================================================
  # Configuration for the Nix package manager itself

  # Allow installation of proprietary/closed-source packages (e.g., VS Code)
  nixpkgs.config.allowUnfree = true;

  # Enable experimental Nix features:
  # - nix-command: New CLI commands (nix build, nix run, etc.)
  # - flakes: Reproducible package management with flake.nix
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # ===========================================================================
  # BOOT CONFIGURATION
  # ===========================================================================
  # Bootloader and early boot settings

  boot.loader.systemd-boot.enable = true;      # Use systemd-boot as the bootloader
  boot.loader.efi.canTouchEfiVariables = true; # Allow modifying EFI variables

  # ===========================================================================
  # NETWORKING
  # ===========================================================================
  # Network configuration
  
  networking = {
    hostName = "nixos";           # System hostname
    networkmanager.enable = true; # Enable NetworkManager (automatically handles DHCP and WiFi)
  };

  # ===========================================================================
  # LOCALIZATION
  # ===========================================================================
  # Time zone, language, and regional settings

  time.timeZone = "Europe/Prague";    # System timezone
  i18n.defaultLocale = "cs_CZ.UTF-8"; # Default system locale (Czech)

  # ===========================================================================
  # HARDWARE
  # ===========================================================================
  # Hardware-specific configuration

  hardware.bluetooth.enable = true; # Enable Bluetooth support

  # ===========================================================================
  # VIRTUALISATION
  # ===========================================================================
  # Container and VM configuration

  virtualisation.docker.enable = true; # Enable Docker container runtime

  # ===========================================================================
  # USER ACCOUNTS
  # ===========================================================================
  # User configuration and permissions

  # Enable zsh system-wide (required for setting it as default shell)
  programs.zsh.enable = true;

  users.users.petr = {
    isNormalUser = true; # Regular user account (not system user)
    shell = pkgs.zsh;    # Set zsh as default shell
    extraGroups = [
      "wheel"  # Sudo/admin privileges
      "video"  # Access to video devices
      "input"  # Access to input devices
      "render" # GPU rendering access
      "docker" # Docker access without sudo
    ];
    packages = with pkgs; [
      # User-specific packages can be added here
    ];
  };

  # ===========================================================================
  # FONTS
  # ===========================================================================
  # System-wide font packages

  fonts.packages = with pkgs; [
    nerd-fonts.fira-code # FiraCode with Nerd Font icons (great for terminals/editors)
  ];

  # ===========================================================================
  # DESKTOP ENVIRONMENT
  # ===========================================================================
  # Window manager, compositor, and desktop integration

  # Niri - Scrollable tiling Wayland compositor
  # Using nixpkgs niri (25.11+) instead of niri-flake for DMS compatibility
  # niri-flake doesn't support 'include' directives needed for DMS theming
  programs.niri.enable = true;

  # XDG Desktop Portal - Provides standardized desktop APIs for:
  # - Screen sharing/casting
  # - File picker dialogs
  # - Notifications
  # - And more...
  xdg.portal = {
    enable = true;
    extraPortals = [ pkgs.xdg-desktop-portal-gtk ]; # GTK-based portal implementation
    config.common.default = "gtk";                  # Use GTK portal as default
  };

  # DankGreeter - Material Design styled login/display manager
  programs."dank-material-shell".greeter = {
    enable = true;
    compositor.name = "niri";  # Use Niri as the greeter compositor
    configHome = "/home/petr"; # Path to DMS config for theme sync
  };

  # ===========================================================================
  # SECURITY
  # ===========================================================================
  # Authentication and authorization

  security.polkit.enable = true; # Required by udisks2 for non-root mount/unmount

  # ===========================================================================
  # SERVICES
  # ===========================================================================
  # System services and daemons

  services.openssh.enable = true;               # SSH server for remote access
  services.power-profiles-daemon.enable = true; # Power management profiles
  services.upower.enable = true;                # Battery/power device monitoring
  services.udisks2.enable = true;               # USB drive mounting backend
  services.gvfs.enable = true;                  # Trash, volume listing, file manager integration

  # ===========================================================================
  # SYSTEM PACKAGES
  # ===========================================================================
  # Packages installed system-wide for all users

  environment.systemPackages = with pkgs; [
    git               # Version control system
    file              # File type identification utility
    mesa-demos        # OpenGL/Vulkan demos and utilities
    ghostty           # Terminal emulator
    alacritty         # Backup terminal
    wget              # CLI download tool
    wl-clipboard      # Clipboard utilities (wl-copy, wl-paste)
    xwayland-satellite # XWayland for running X11 apps on Wayland
  ];

  # ===========================================================================
  # SYSTEM STATE VERSION
  # ===========================================================================
  # DO NOT CHANGE - Tracks the NixOS version for state compatibility
  # Only update when doing a full system upgrade with proper migration
  system.stateVersion = "26.05";
}
