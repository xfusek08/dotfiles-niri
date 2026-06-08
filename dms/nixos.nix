# =============================================================================
# DMS - NixOS System Module
# =============================================================================
# System-level DMS (DankMaterialShell) and DankGreeter configuration
# Docs: https://danklinux.com/docs/dankgreeter/nixos
# =============================================================================

{ config, lib, pkgs, inputs, ... }: {
  imports = [
    inputs.dms.nixosModules.greeter  # DankGreeter login screen module
  ];

  # --- DankGreeter - Material Design login/display manager ---
  programs.dank-material-shell.greeter = {
    enable = true;
    compositor.name = "niri";
    configHome = "/home/petr";
  };

  # --- DMS Launcher Search ---
  programs.dsearch.enable = true;

  # --- DMS Dependencies ---
  services.accounts-daemon.enable = true; # AccountsService D-Bus for user info

  # Greeter PAM keyring unlock
  security.pam.services.greetd.enableGnomeKeyring = true;
}
