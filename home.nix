{ config, pkgs, inputs, ... }: {
  imports = [
    inputs.dms.homeModules.dankMaterialShell.default # Dank Material Shell Home Manager module
    # Note: Not using niri module - it requires niri-flake which has limitations with DMS
  ];

  home.username = "petr";
  home.homeDirectory = "/home/petr";
  home.stateVersion = "25.05";

  programs.dankMaterialShell = {
    enable = true;
    
    # Use systemd for DMS startup (binds to niri.service automatically)
    systemd = {
      enable = true;             # Enable systemd service for auto-start
      restartIfChanged = true;   # Auto-restart dms.service when dankMaterialShell changes
    };
  
    # Core features
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
      ls = "eza -lga --icons=auto --color=auto --group-directories-first";
    };
  };

  home.packages = with pkgs; [
    bat
    btop
    yazi
    fzf
    ripgrep
    vscode
    eza
    fastfetch
  ];

  home.file.".config/niri/config.kdl".source = ./niri-config.kdl;
}
