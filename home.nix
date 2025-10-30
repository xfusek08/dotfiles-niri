{ config, pkgs, ... }:

{
  home.username = "tony";
  home.homeDirectory = "/home/tony";
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
      if [ -z "$WAYLAND_DISPLAY" ] && [ "$XDG_VTNR" = 1 ]; then
        exec uwsm start -S hyprland-uwsm.desktop
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