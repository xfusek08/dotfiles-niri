# =============================================================================
# DMS - Home Manager Module
# =============================================================================
# User-level DMS (DankMaterialShell) configuration
# Docs: https://danklinux.com/docs/dankmaterialshell/nixos-flake
# =============================================================================

{ config, pkgs, inputs, ... }:

let
  homeDir = config.home.homeDirectory;
in {
  imports = [
    inputs.dms.homeModules.dank-material-shell
  ];

  # --- DMS Shell Configuration ---
  programs.dank-material-shell = {
    enable = true;

    systemd = {
      enable = true;
      restartIfChanged = true;
    };

    enableSystemMonitoring = true;
    enableVPN = true;
    enableDynamicTheming = true;
    enableAudioWavelength = true;
    enableCalendarEvents = true;
    enableClipboardPaste = true;
  };

  # --- Niri Include File Placeholders ---
  # DMS writes theme colors, layout, keybinds etc. to these files at runtime.
  # Created as regular files (not nix-store symlinks) so DMS can overwrite them.
  home.activation.dmsPlaceholders = {
    after = [ "writeBoundary" ];
    before = [];
    data = ''
      mkdir -p "${homeDir}/.config/niri/dms"
      for f in colors layout cursor outputs alttab binds; do
        [ -f "${homeDir}/.config/niri/dms/$f.kdl" ] || touch "${homeDir}/.config/niri/dms/$f.kdl"
      done
    '';
  };
}
