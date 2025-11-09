{ config, pkgs, ... }:

{
  home.username = "petr";
  home.homeDirectory = "/home/petr";
  home.stateVersion = "25.05";
  
  programs.git = {
    enable = true;
    userName = "Petr Fusek";
    userEmail = "petr.fusek97@gmail.com";
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
  
  home.file.".config/niri/config.kdl".source = ./niri-config.kdl;
}