# =============================================================================
# Bitwarden Desktop Configuration
# =============================================================================
# Prerequisites (set up in configuration.nix):
# - bitwarden-desktop in environment.systemPackages (polkit policy discovery)
# - security.pam.services.dms-greeter.enableGnomeKeyring (keyring unlock)
#
# https://github.com/NixOS/nixpkgs/issues/347350#issuecomment-4313149990
# https://github.com/NixOS/nixpkgs/issues/371479#issuecomment-4425603198
#
# =============================================================================

{ config, lib, pkgs, ... }: {

  # Ensure ~/.mozilla exists so Bitwarden installs the Firefox native messaging host
  # (Zen Browser is Firefox-based and reads from the same path)
  home.file.".mozilla/native-messaging-hosts/.keep".text = "";
}
