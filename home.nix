{ pkgs, lib, config, ... }:

{
  # Import DankMaterialShell home modules (core and Niri integration)
  imports = [
    # Core DankMaterialShell Home Manager module
    pkgs.fetchFromGitHub {
      owner = "AvengeMedia"; repo = "DankMaterialShell"; rev = "master"; # or tag
      sha256 = "..."; # fill in or override nixpkgs fetcher (optional)
    } + "/homeModules/dankMaterialShell/default.nix"
    
    # DMS Niri support module
    pkgs.fetchFromGitHub {
      owner = "AvengeMedia"; repo = "DankMaterialShell"; rev = "master";
      sha256 = "...";
    } + "/homeModules/dankMaterialShell/niri.nix"
  ];

  # Enable DankMaterialShell
  programs.dankMaterialShell.enable = true;

  # (Optional) If quickshell is not in stable pkgs, override to unstable
  programs.dankMaterialShell.quickshell.package = pkgs.quickshell;

  # You can customize DMS or add plugins here, per its documentation.
  # For example:
  # programs.dankMaterialShell.enableWidgets = [ "spotlight" "systemMonitor" ];
}
