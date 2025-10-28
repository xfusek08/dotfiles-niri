{ config, pkgs, ... }:

{
  # Enable experimental features for flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # Bootloader
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Networking
  networking.hostName = "nixos"; # Change this to your preferred hostname
  networking.networkmanager.enable = true;

  # Time zone and locale
  time.timeZone = "Europe/Prague"; # Adjust to your timezone
  i18n.defaultLocale = "en_US.UTF-8";

  # Enable niri window manager from the flake
  programs.niri.enable = true;

  # Add a user account
  users.users.petr = {
    isNormalUser = true;
    extraGroups = [ "wheel" "networkmanager" ];
    initialPassword = "changeme"; # Change this after first login!
  };

  # Enable sudo for wheel group
  security.sudo.wheelNeedsPassword = true;

  # Basic system packages
  environment.systemPackages = with pkgs; [
    git
    wget
    curl
  ];

  # Basic system configuration
  system.stateVersion = "24.05";
}