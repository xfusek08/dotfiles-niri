{ config, lib, pkgs, ... }:

{
  imports =
    [
      ./hardware-configuration.nix
    ];
    
  # Allow unfree packages (needed for VS Code, etc.)
  nixpkgs.config.allowUnfree = true;


  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Auto-login to TTY1 (niri will start automatically from bash profile)
  services.getty.autologinUser = "petr";

  # Enable SSH daemon
  services.openssh = {
    enable = true;
    settings.PermitRootLogin = "yes";
  };

  networking.hostName = "nixos";
  networking.networkmanager.enable = true;

  time.timeZone = "Europe/Prague";

  programs.niri.enable = true;

  # XDG Desktop Portal for screen casting, file pickers, etc.
  xdg.portal = {
    enable = true;
    extraPortals = [ pkgs.xdg-desktop-portal-gtk ];
    config.common.default = "gtk";
  };

  users.users.petr = {
    isNormalUser = true;
    extraGroups = [ "wheel" "video" "input" "render" ];
    packages = with pkgs; [
    ];
  };

  programs.firefox.enable = true;
  environment.systemPackages = with pkgs; [
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
    wget               # For downloading files
    wl-clipboard       # Wayland clipboard utilities
    xwayland-satellite # For X11 app compatibility
  ];

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  system.stateVersion = "25.05";

}