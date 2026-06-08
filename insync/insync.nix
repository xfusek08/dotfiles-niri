# =============================================================================
# Insync Google Drive Sync Configuration
# =============================================================================
# Launched via niri spawn-at-startup calling scripts/insync-start
# =============================================================================

{ config, lib, pkgs, ... }:

let
  homeDir = config.home.homeDirectory;
in {
  home.packages = with pkgs; [
    insync # Google Drive sync
  ];

  # Remove insync autostart desktop file — insync is launched exclusively
  # from niri config via scripts/insync-start, not via systemd autostart.
  home.activation.removeInsyncAutostart = {
    after = [ "writeBoundary" ];
    before = [];
    data = ''
      rm -f "${homeDir}/.config/autostart/insync.desktop"
    '';
  };
}
