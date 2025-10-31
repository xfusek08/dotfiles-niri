{ config, pkgs, niri, dankMaterialShell, ... }:

{
  imports = [
    # Note: Not importing niri.homeModules.niri to avoid config file conflict
    # We'll manage niri config manually via the config.kdl file
    dankMaterialShell.homeModules.dankMaterialShell.default
    # Note: Not importing the niri-specific DMS module since it requires niri home module
    # We'll configure DMS to work with niri manually
  ];

  home.username = "petr";
  home.homeDirectory = "/home/petr";
  home.stateVersion = "25.05";
  
  # Enable Dank Material Shell
  programs.dankMaterialShell = {
    enable = true;
    enableSystemd = true;  # Enable automatic startup via systemd
  };
  
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
    profileExtra = ''
      # Start niri on TTY1 after login
      if [ -z "$WAYLAND_DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
        exec niri
      fi
    '';
  };
  
  home.packages = with pkgs; [
    bat
    btop
    yazi
    fzf
    ripgrep
    vscode
  ];
  
  # Deploy niri configuration
  home.file.".config/niri/config.kdl".source = ./niri-config.kdl;
}