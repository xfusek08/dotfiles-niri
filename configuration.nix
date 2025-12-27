{ config, lib, pkgs, ... }: {
  imports = [
      ./hardware-configuration.nix
  ];

  # Allow unfree packages (needed for VS Code, etc.)
  nixpkgs.config.allowUnfree = true;

  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "nixos";
  networking.networkmanager.enable = true;

  hardware.bluetooth.enable = true;
  services.power-profiles-daemon.enable = true;
  services.upower.enable = true;

  time.timeZone = "Europe/Prague";
  i18n.defaultLocale = "cs_CZ.UTF-8";

  fonts.packages = with pkgs; [
      nerd-fonts.fira-code
  ];

  users.users.petr = {
    isNormalUser = true;
    extraGroups = [ "wheel" "video" "input" "render" ];
    packages = with pkgs; [
    ];
  };

  programs.niri.enable = true;

  services.openssh.enable = true;

  # XDG Desktop Portal for screen casting, file pickers, etc.
  xdg.portal = {
    enable = true;
    extraPortals = [ pkgs.xdg-desktop-portal-gtk ];
    config.common.default = "gtk";
  };

  # Auto-login with greetd and start niri locked
  services.greetd = {
    enable = true;
    settings = {
      initial_session = {
        command = "${pkgs.niri}/bin/niri-session";
        user = "petr";
      };
      default_session = {
        command = "${pkgs.niri}/bin/niri-session";
        user = "petr";
      };
    };
  };

  environment.systemPackages = with pkgs; [
    vscode             # Text editor

    accountsservice    # For Dank Material Shell user menu
    alacritty          # Terminal emulator
    brightnessctl      # Screen brightness control
    cava               # Audio visualizer
    cliphist           # Clipboard manager
    git                # Version control system
    grim               # Screenshot tool
    mako               # Notification daemon
    mate.mate-polkit   # PolicyKit authentication agent (mate-polkit)
    matugen            # Wallpaper setter
    qt6.qtmultimedia   # For media controls in Dank Material Shell
    slurp              # Region selector for screenshots
    swaylock           # Screen locker
    swaybg             # Wallpaper setter for Sway
    wget               # For downloading files
    wl-clipboard       # Wayland clipboard utilities
    xwayland-satellite # For X11 app compatibility

    # --- Essential packages for niri ---

    # git                # Version control system
    # glibc              # GNU C Library
    # hwdata             # Hardware data files
    # libdisplay-info    # Library for querying display information
    # libdrm             # Direct Rendering Manager library
    # libinput           # Input device handling library
    # libliftoff         # Library for managing display power state
    # libxkbcommon       # Keyboard handling library
    # meson              # Build system
    # ninja              # Build system
    # niri               # A scrollable wayland window compositor
    # pcre2              # Perl Compatible Regular Expressions library
    # pixman             # Pixel manipulation library
    # seatd              # Seat management daemon
    # wayland            # Core Wayland libraries and utilities
    # wayland-protocols  # Additional Wayland protocols
    # xwayland-satellite # For X11 app compatibility

    # --- Shell nice-to-haves ---

    # alacritty  # Terminal emulator
    # fuzzel     # Application launcher
    # matugen    # Wallpaper setter
    # swaybg     # Wallpaper setter for Sway

    # --- Packages creating useful DE ---

    firefox                 # Web browser
  ]; # End of environment.systemPackages

  # Allow nix flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  system.stateVersion = "25.05";
}
