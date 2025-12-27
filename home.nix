# =============================================================================
# Home Manager Configuration
# =============================================================================
# User-level configuration managed by Home Manager
# This file configures user-specific packages, dotfiles, and programs
# =============================================================================

{ config, pkgs, inputs, ... }: {

  # ===========================================================================
  # IMPORTS
  # ===========================================================================
  # External Home Manager modules to include
  imports = [
    inputs.dms.homeModules.dankMaterialShell.default  # Dank Material Shell module
    # Note: Not using niri module - it requires niri-flake which has limitations with DMS
  ];

  # ===========================================================================
  # USER SETTINGS
  # ===========================================================================
  # Basic user account configuration

  home.username = "petr";               # Username (must match system user)
  home.homeDirectory = "/home/petr";    # User's home directory path

  # DO NOT CHANGE - Tracks Home Manager version for state compatibility
  home.stateVersion = "25.05";

  # ===========================================================================
  # DANK MATERIAL SHELL (DMS)
  # ===========================================================================
  # Material Design desktop shell configuration
  # Docs: https://danklinux.com/docs/dankmaterialshell

  programs.dankMaterialShell = {
    enable = true;

    # --- Systemd Integration ---
    # Run DMS as a systemd user service (auto-starts with niri.service)
    systemd = {
      enable = true;            # Enable systemd service for auto-start
      restartIfChanged = true;  # Auto-restart dms.service on config changes
    };

    # --- Feature Toggles ---
    enableSystemMonitoring = true;   # System resource widgets (CPU, RAM, etc.)
    enableClipboard = true;          # Clipboard history manager
    enableVPN = true;                # VPN connection management widget
    enableBrightnessControl = true;  # Screen brightness slider
    enableColorPicker = true;        # Color picker tool
    enableDynamicTheming = true;     # Auto-theme based on wallpaper (uses matugen)
    enableAudioWavelength = true;    # Audio visualizer widget (uses cava)
    enableCalendarEvents = true;     # Calendar integration (uses khal)
    enableSystemSound = true;        # UI sound effects
  };

  # ===========================================================================
  # GIT
  # ===========================================================================
  # Git version control configuration

  programs.git = {
    enable = true;
    settings.user.name = "Petr Fusek";              # Git commit author name
    settings.user.email = "petr.fusek97@gmail.com"; # Git commit author email
  };

  # ===========================================================================
  # SHELL (BASH)
  # ===========================================================================
  # Bash shell configuration and aliases

  programs.bash = {
    enable = true;
    shellAliases = {
      btw = "echo i use nixos, btw";                              # The classic
      ls = "eza -lga --icons=auto --color=auto --group-directories-first";  # Enhanced ls with eza
      ff = "fastfetch";                                           # Quick system info
    };
  };

  # ===========================================================================
  # USER PACKAGES
  # ===========================================================================
  # Packages installed for this user only (not system-wide)

  home.packages = with pkgs; [
    # --- CLI Tools ---
    bat         # Cat clone with syntax highlighting
    btop        # Resource monitor (better htop)
    eza         # Modern ls replacement with icons
    fastfetch   # System info display (neofetch alternative)
    fzf         # Fuzzy finder for files/commands
    ripgrep     # Fast grep alternative (rg)
    yazi        # Terminal file manager

    # --- GUI Applications ---
    vscode      # Visual Studio Code editor
  ];

  # ===========================================================================
  # DOTFILES
  # ===========================================================================
  # Configuration files to symlink into home directory

  # Niri window manager config - symlink from this repo to ~/.config/niri/
  home.file.".config/niri/config.kdl".source = ./niri-config.kdl;

  # DMS include files for niri - these MUST exist before niri starts
  # DMS will populate them with theme colors, layout, and keybinds
  home.file.".config/niri/dms/colors.kdl".text = "// Auto-populated by DMS\n";
  home.file.".config/niri/dms/layout.kdl".text = "// Auto-populated by DMS\n";
  home.file.".config/niri/dms/alttab.kdl".text = "// Auto-populated by DMS\n";
  home.file.".config/niri/dms/binds.kdl".text = "// Auto-populated by DMS\n";
}
