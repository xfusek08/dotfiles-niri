{ config, pkgs, ... }:

{
  home.username = "petr";
  home.homeDirectory = "/home/petr";
  home.stateVersion = "25.05";
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
      # Start niri on any TTY if not already in a graphical session
      if [ -z "$WAYLAND_DISPLAY" ] && [ -z "$DISPLAY" ]; then
        exec niri-session
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
}