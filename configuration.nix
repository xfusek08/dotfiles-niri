{ config, pkgs, ... }:

{
  # Enable experimental features for flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];

  # Enable niri window manager from the flake
  programs.niri.enable = true;

  # Basic system configuration
  system.stateVersion = "24.05"; # Set this to your NixOS version
}
