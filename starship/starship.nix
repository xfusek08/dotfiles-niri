# =============================================================================
# Starship Prompt Configuration
# =============================================================================

{ config, lib, pkgs, ... }: {
  programs.starship = {
    enable = true;
    enableZshIntegration = true;
  };
  home.file.".config/starship.toml".source = ./starship.toml;
}
