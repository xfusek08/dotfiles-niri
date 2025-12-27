# =============================================================================
# Zsh Shell Configuration
# =============================================================================
# Zsh with Zinit plugin manager, starship prompt, fzf, and zoxide
# Migrated from Arch Linux dotfiles
# =============================================================================

{ config, pkgs, lib, ... }: {

  # ===========================================================================
  # ZSH
  # ===========================================================================

  programs.zsh = {
    enable = true;
    dotDir = "${config.xdg.configHome}/zsh";  # Keep home directory clean

    # --- History Configuration ---
    history = {
      size = 100000;
      save = 100000;
      path = "${config.home.homeDirectory}/.zsh_history";
      ignoreDups = true;
      ignoreAllDups = true;
      ignoreSpace = true;
      share = true;
      extended = true;
    };

    # --- Shell Options ---
    autosuggestion.enable = true;  # Fish-like autosuggestions
    syntaxHighlighting.enable = true;  # Command syntax highlighting
    enableCompletion = true;

    # --- Aliases ---
    shellAliases = {
      btw = "echo i use nixos, btw";
      ls = "eza -lga --icons=auto --color=auto --group-directories-first";
      lsl = "ls -s modified -la";
      bat = "bat --paging=always --italic-text=always --color=always --decorations=always --wrap=never";
      cd = "z";
      cdi = "zi";
      ff = "fastfetch";
    };

    # --- Init Content ---
    initContent = lib.mkMerge [
      # Performance measurement (runs first)
      (lib.mkBefore ''
        # Performance measurement start
        zmodload zsh/datetime
        zmodload zsh/terminfo
        typeset -F shell_start=$EPOCHREALTIME
      '')
      # Main init (zinit, plugins, etc.)
      (builtins.readFile ./init-extra.zsh)
    ];
  };
}
