{ config, pkgs, niri, dankMaterialShell, ... }:

{
  imports = [
    niri.homeModules.niri
    dankMaterialShell.homeModules.dankMaterialShell.default
    dankMaterialShell.homeModules.dankMaterialShell.niri
  ];

  home.username = "petr";
  home.homeDirectory = "/home/petr";
  home.stateVersion = "25.05";
  
  programs.dankMaterialShell.enable = true;
  
  programs.git = {
    enable = true;
    settings.user.name = "Petr Fusek";
    settings.user.email = "petr.fusek97@gmail.com";
  };
  
  programs.bash = {
    enable = true;
    shellAliases = {
      btw = "echo i use nixos, btw";
    };
  };
  
  home.packages = with pkgs; [
    bat
    btop
    yazi
    fzf
    ripgrep
    vscode
  ];
  
  home.file.".config/niri/config.kdl".source = ./niri-config.kdl;
}