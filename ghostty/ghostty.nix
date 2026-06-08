# =============================================================================
# Ghostty Terminal Configuration
# =============================================================================

{ config, lib, pkgs, ... }: {
  home.file.".config/ghostty/config".source = ./config;
  home.file.".config/ghostty/themes/dankcolors".source = ./themes/dankcolors;
}
