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

  # XDG Desktop Portal for screencasting, file pickers, etc.
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
    git
    vim
    wget
    waybar
    # Niri-related utilities
    alacritty
    fuzzel
    swaylock
    xwayland-satellite
    grim       # Screenshot tool
    slurp      # Region selector for screenshots
    wl-clipboard  # Wayland clipboard utilities
    mako       # Notification daemon
    # Additional tools for niri
    libnotify  # For notification support
  ];

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  system.stateVersion = "25.05";

}