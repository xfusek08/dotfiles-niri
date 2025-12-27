{ config, lib, pkgs, inputs, ... }: {
  imports = [
      ./hardware-configuration.nix
      inputs.dms.nixosModules.greeter  # DankGreeter NixOS module
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
  
  # Disable niri-flake's default polkit agent - DMS has its own built-in polkit agent
  # https://danklinux.com/docs/dankmaterialshell/nixos-flake#polkit-agent
  systemd.user.services.niri-flake-polkit.enable = false;

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

  # DankGreeter - Material Design login screen
  programs.dankMaterialShell.greeter = {
    enable = true;
    compositor.name = "niri";
    configHome = "/home/petr";  # Sync DMS theme with the greeter
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
    matugen            # Material Design color palette generation (dynamic theming)
    playerctl          # Media player control (for media keys)
    qt6.qtmultimedia   # For media controls and system sounds in DMS
    slurp              # Region selector for screenshots
    swappy             # Screenshot editor for DMS
    swaylock           # Screen locker
    swaybg             # Wallpaper setter
    wget               # For downloading files
    wl-clipboard       # Wayland clipboard utilities
    xwayland-satellite # For X11 app compatibility

    # Web browser (Zen)
    inputs.zen-browser.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];

  # Allow nix flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  system.stateVersion = "25.05";
}
