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
    inputs.dms.homeModules.dank-material-shell # Dank Material Shell module
    ./zsh/zsh.nix                              # Zsh shell configuration
  ];

  # ===========================================================================
  # USER SETTINGS
  # ===========================================================================
  # Basic user account configuration

  home.username = "petr";            # Username (must match system user)
  home.homeDirectory = "/home/petr"; # User's home directory path

  # DO NOT CHANGE - Tracks Home Manager version for state compatibility
  home.stateVersion = "25.05";

  # Canonical paths — scripts use these instead of assuming structure
  home.sessionVariables = {
    REPO          = "/home/petr/repo";
    NIXOS_CONFIG  = "/home/petr/repo/dotfiles-niri";
  };

  # ===========================================================================
  # DANK MATERIAL SHELL (DMS)
  # ===========================================================================
  # Material Design desktop shell configuration
  # Docs: https://danklinux.com/docs/dankmaterialshell

  programs."dank-material-shell" = {
    enable = true;

    # --- Systemd Integration ---
    # Run DMS as a systemd user service (auto-starts with niri.service)
    systemd = {
      enable = true;           # Enable systemd service for auto-start
      restartIfChanged = true; # Auto-restart dms.service on config changes
    };

    # --- Feature Toggles ---
    enableSystemMonitoring = true; # System resource widgets (CPU, RAM, etc.)
    enableVPN = true;              # VPN connection management widget
    enableDynamicTheming = true;   # Auto-theme based on wallpaper (uses matugen)
    enableAudioWavelength = true;  # Audio visualizer widget (uses cava)
    enableCalendarEvents = true;   # Calendar integration (uses khal)
  };

  # ===========================================================================
  # DEFAULT APPLICATIONS
  # ===========================================================================
  # XDG MIME associations — set Zen Browser as default

  xdg.mimeApps = {
    enable = true;
    defaultApplications = {
      "text/html"                = "zen-browser.desktop";
      "x-scheme-handler/http"    = "zen-browser.desktop";
      "x-scheme-handler/https"   = "zen-browser.desktop";
    };
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
  # STARSHIP PROMPT
  # ===========================================================================

  programs.starship = {
    enable = true;
    enableZshIntegration = true;
  };
  home.file.".config/starship.toml".source = ./starship/starship.toml;

  # ===========================================================================
  # GHOSTTY TERMINAL
  # ===========================================================================

  home.file.".config/ghostty/config".source = ./ghostty/config;
  home.file.".config/ghostty/themes/dankcolors".source = ./ghostty/themes/dankcolors;

  # ===========================================================================
  # FZF FUZZY FINDER
  # ===========================================================================

  programs.fzf = {
    enable = true;
    enableZshIntegration = true;
  };

  # ===========================================================================
  # ZOXIDE (SMART CD)
  # ===========================================================================

  programs.zoxide = {
    enable = true;
    enableZshIntegration = true;
  };

  # ===========================================================================
  # USER PACKAGES
  # ===========================================================================
  # Packages installed for this user only (not system-wide)

  home.packages = with pkgs; [
    # --- CLI Tools ---
    bat       # Cat clone with syntax highlighting
    bfs       # Breadth-first search file finder (for fcd function)
    btop      # Resource monitor (better htop)
    eza       # Modern ls replacement with icons
    fastfetch # System info display (neofetch alternative)
    ripgrep   # Fast grep alternative (rg)
    yazi      # Terminal file manager
    opencode  # AI coding terminal tool.

    # --- ICON THemes ---
    adwaita-icon-theme
    hicolor-icon-theme 

    # --- GUI Applications ---
    vscode # Visual Studio Code editor
    insync # Google Drive sync
    inputs.zen-browser.packages.${pkgs.stdenv.hostPlatform.system}.default # Zen Browser (Firefox-based)
    
    # --- yazi dependencies ---
    jq
    dragon-drop
    fd
    poppler
    imagemagick
  ];

  # ===========================================================================
  # SCRIPTS DIRECTORY
  # ===========================================================================
  # Drop scripts into scripts/ and they land in ~/.local/bin after rebuild
  # Already in PATH via sessionPath below
  home.sessionPath = [ "$HOME/.local/bin" ];

  home.file.".local/bin" = {
    source = ./scripts;
    recursive = true;
  };

  # ===========================================================================
  # SHELL FUNCTIONS DIRECTORY
  # ===========================================================================
  # One file per function, autoloaded by zsh via fpath
  home.file.".config/zsh/functions" = {
    source = ./shell_functions;
    recursive = true;
  };

  # ===========================================================================
  # DOTFILES
  # ===========================================================================
  # Configuration files to symlink into home directory

  # Niri window manager config - symlink from this repo to ~/.config/niri/
  home.file.".config/niri/config.kdl".source = ./niri/niri-config.kdl;

  # Yazi file manager config
  # Plugins/flavors managed by yazi: run `ya pkg i` to install, `ya pkg u` to update
  home.file.".config/yazi/init.lua".source = ./yazi/init.lua;
  home.file.".config/yazi/yazi.toml".source = ./yazi/yazi.toml;
  home.file.".config/yazi/keymap.toml".source = ./yazi/keymap.toml;
  home.file.".config/yazi/theme.toml".source = ./yazi/theme.toml;

  # Copy package.toml (not symlink) so yazi can write to it, then install/upgrade packages
  home.activation.yaziPackageToml = {
    after = [ "writeBoundary" ];
    before = [];
    data = ''
      export PATH="${pkgs.git}/bin:$PATH"
      if [ ! -f "$HOME/.config/yazi/package.toml" ]; then
        mkdir -p "$HOME/.config/yazi"
        cp ${./yazi/package.toml} "$HOME/.config/yazi/package.toml"
        chmod 644 "$HOME/.config/yazi/package.toml"
      fi
      ${pkgs.yazi}/bin/ya pkg install 2>/dev/null || true
      ${pkgs.yazi}/bin/ya pkg upgrade --discard 2>/dev/null || true
    '';
  };

  # DMS include files for niri - these MUST exist before niri starts
  # DMS will populate them with theme colors, layout, and keybinds
  home.file.".config/niri/dms/colors.kdl".text = "// Auto-populated by DMS\n";
  home.file.".config/niri/dms/layout.kdl".text = "// Auto-populated by DMS\n";
  home.file.".config/niri/dms/alttab.kdl".text = "// Auto-populated by DMS\n";
  home.file.".config/niri/dms/binds.kdl".text = "// Auto-populated by DMS\n";
}
