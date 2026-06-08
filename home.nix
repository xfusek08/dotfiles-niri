# =============================================================================
# Home Manager Configuration
# =============================================================================
# User-level configuration managed by Home Manager
# This file configures user-specific packages, dotfiles, and programs
# =============================================================================

{ config, pkgs, inputs, ... }:

let
  homeDir = config.home.homeDirectory;
  xdgCfg  = "${homeDir}/.config";
  repoDir = "${homeDir}/repo";
  nixCfg  = "${repoDir}/dotfiles-niri";
in {
  # ===========================================================================
  # IMPORTS
  # ===========================================================================
  # External Home Manager modules to include
  imports = [
    ./dms/home.nix                             # Dank Material Shell module
    ./zsh/zsh.nix                              # Zsh shell configuration
    ./bitwarden/bitwarden.nix                  # Bitwarden Desktop config
    ./ghostty/ghostty.nix                      # Ghostty terminal emulator
    ./insync/insync.nix                        # Insync Google Drive sync
    ./starship/starship.nix                    # Starship prompt
    ./yazi/yazi.nix                            # Yazi file manager config
  ];

  # ===========================================================================
  # USER SETTINGS
  # ===========================================================================
  # Basic user account configuration

  home.username = "petr";            # Username (must match system user)
  home.homeDirectory = "/home/petr"; # User's home directory path

  # DO NOT CHANGE - Tracks Home Manager version for state compatibility
  home.stateVersion = "26.05";

  # Canonical paths — scripts use these instead of assuming structure
  home.sessionVariables = {
    REPO          = repoDir;
    NIXOS_CONFIG  = nixCfg;
    SCRIPTS_FNS   = "${xdgCfg}/zsh/functions";
    SSH_AUTH_SOCK = "$XDG_RUNTIME_DIR/ssh-agent";
    # Fix for Node/Bun native modules (e.g., sharp) that need libstdc++ at runtime
    LD_LIBRARY_PATH = "${pkgs.stdenv.cc.cc.lib}/lib";
  };
  
  services.gnome-keyring = {
    enable = true;
    components = [ "pkcs11" "secrets" ];
  };

  
  # ===========================================================================
  # DEFAULT APPLICATIONS
  # ===========================================================================
  # XDG MIME associations — set Zen Browser as default

  xdg.mimeApps = {
    enable = true;
    defaultApplications = {
      "text/html"                = "zen.desktop";
      "x-scheme-handler/http"    = "zen.desktop";
      "x-scheme-handler/https"   = "zen.desktop";
      "image/png"                = "org.gnome.Loupe.desktop";
      "image/jpeg"               = "org.gnome.Loupe.desktop";
      "image/webp"               = "org.gnome.Loupe.desktop";
      "image/gif"                = "org.gnome.Loupe.desktop";
      "image/bmp"                = "org.gnome.Loupe.desktop";
      "image/svg+xml"            = "org.gnome.Loupe.desktop";
      "image/tiff"               = "org.gnome.Loupe.desktop";
      "image/avif"               = "org.gnome.Loupe.desktop";
      "image/heic"               = "org.gnome.Loupe.desktop";
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
    tealdeer  # TLDR man page summaries (tldr)
    opencode  # AI coding terminal tool
    bun       # JavaScript runtime & toolkit

    # --- DE system ---
    libnotify # Desktop notifications (notify-send)


    # --- ICON THemes ---
    adwaita-icon-theme
    hicolor-icon-theme

    # --- GUI Applications ---
    vscode # Visual Studio Code editor
    inputs.zen-browser.packages.${pkgs.stdenv.hostPlatform.system}.default # Zen Browser (Firefox-based)
    brave # Brave Browser (Chromium-based) for development/testing (Zen is default for regular browsing)
    loupe # Image viewer with EXIF metadata and navigation
    logseq # Note-taking app
    discord # Chat app for communities and gaming
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
  # MANUAL COMPLETIONS DIRECTORY
  # ===========================================================================
  # Zsh completions for custom scripts, autoloaded via fpath
  home.file.".config/zsh/completions/manual" = {
    source = ./completions/manual;
    recursive = true;
  };

  # ===========================================================================
  # DOTFILES
  # ===========================================================================
  # Configuration files to symlink into home directory

  # Niri window manager config - symlink from this repo to ~/.config/niri/
  home.file.".config/niri/config.kdl".source = ./niri/niri-config.kdl;
}
