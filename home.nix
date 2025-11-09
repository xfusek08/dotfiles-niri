{ config, pkgs, inputs, ... }:

{
  imports = [
    inputs.niri.homeModules.niri
    inputs.dankMaterialShell.homeModules.dankMaterialShell.default
    # Don't import the niri module - we're using our own niri config
  ];

  home.username = "petr";
  home.homeDirectory = "/home/petr";
  home.stateVersion = "25.05";
  
  programs.dankMaterialShell = {
    enable = true;
    # Core features
    enableSystemd = true;           # Systemd service for auto-start
    enableSystemMonitoring = true;  # System monitoring widgets (dgop)
    enableClipboard = true;         # Clipboard history manager
    enableVPN = true;               # VPN management widget
    enableBrightnessControl = true; # Backlight/brightness controls
    enableColorPicker = true;       # Color picker tool
    enableDynamicTheming = true;    # Wallpaper-based theming (matugen)
    enableAudioWavelength = true;   # Audio visualizer (cava)
    enableCalendarEvents = true;    # Calendar integration (khal)
    enableSystemSound = true;       # System sound effects
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