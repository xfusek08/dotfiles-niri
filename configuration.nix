# =============================================================================
# NixOS System Configuration
# =============================================================================
# Main system configuration file for NixOS
# Location: /etc/nixos/configuration.nix (or in dotfiles repo)
# =============================================================================

{ config, lib, pkgs, inputs, ... }: {

  # ===========================================================================
  # IMPORTS
  # ===========================================================================
  # External configuration modules to include
  imports = [
    ./hardware-configuration.nix    # Auto-generated hardware-specific settings
    inputs.dms.nixosModules.greeter # DankGreeter - Material Design login screen module
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

  boot.loader.systemd-boot.enable = true;       # Use systemd-boot as the bootloader
  boot.loader.efi.canTouchEfiVariables = true;  # Allow modifying EFI variables

  # ===========================================================================
  # NETWORKING
  # ===========================================================================
  # Network configuration

  networking.hostName = "nixos";            # System hostname
  networking.networkmanager.enable = true;  # Enable NetworkManager for network management

  # ===========================================================================
  # LOCALIZATION
  # ===========================================================================
  # Time zone, language, and regional settings

  time.timeZone = "Europe/Prague";      # System timezone
  i18n.defaultLocale = "cs_CZ.UTF-8";   # Default system locale (Czech)

  # ===========================================================================
  # HARDWARE
  # ===========================================================================
  # Hardware-specific configuration

  hardware.bluetooth.enable = true;  # Enable Bluetooth support

  # ===========================================================================
  # VIRTUALISATION
  # ===========================================================================
  # Container and VM configuration

  virtualisation.docker.enable = true;  # Enable Docker container runtime

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
  programs.dankMaterialShell.greeter = {
    enable = true;
    compositor.name = "niri";       # Use Niri as the greeter compositor
    configHome = "/home/petr";      # Path to DMS config for theme sync
  };

  # ===========================================================================
  # SERVICES
  # ===========================================================================
  # System services and daemons

  services.openssh.enable = true;               # SSH server for remote access
  services.power-profiles-daemon.enable = true; # Power management profiles
  services.upower.enable = true;                # Battery/power device monitoring

  # ===========================================================================
  # SYSTEM PACKAGES
  # ===========================================================================
  # Packages installed system-wide for all users

  environment.systemPackages = with pkgs; [

    # --- Development Tools ---
    git    # Version control system
    vscode # Visual Studio Code editor (unfree)
    file   # File type identification utility

    # --- Terminal & Shell ---
    ghostty   # GPU-accelerated terminal emulator
    wget      # CLI tool for downloading files

    # --- Wayland Utilities ---
    grim               # Screenshot capture tool
    slurp              # Screen region selector (works with grim)
    swappy             # Screenshot annotation/editor
    swaybg             # Wallpaper setter for Wayland
    swaylock           # Screen locker for Wayland
    wl-clipboard       # Clipboard utilities (wl-copy, wl-paste)
    xwayland-satellite # XWayland for running X11 apps on Wayland

    # --- Desktop Integration ---
    accountsservice  # User account info (for DMS user menu)
    brightnessctl    # Screen brightness control
    cliphist         # Clipboard history manager
    mako             # Lightweight notification daemon
    mate.mate-polkit # PolicyKit authentication dialog
    playerctl        # MPRIS media player control (for media keys)
    libnotify        # Notification library (for various apps)

    # --- Theming & Appearance ---
    matugen # Material You color palette generator

    # --- DMS (Dank Material Shell) Dependencies ---
    cava             # Audio visualizer
    qt6.qtmultimedia # Media controls and system sounds

    # --- Web Browser ---
    inputs.zen-browser.packages.${pkgs.stdenv.hostPlatform.system}.default  # Zen Browser (Firefox-based)
  ];

  # ===========================================================================
  # SYSTEM STATE VERSION
  # ===========================================================================
  # DO NOT CHANGE - Tracks the NixOS version for state compatibility
  # Only update when doing a full system upgrade with proper migration
  system.stateVersion = "25.05";
}
