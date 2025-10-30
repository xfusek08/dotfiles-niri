{ config, pkgs, ... }:

{
  # Home Manager needs a bit of information about you and the paths it should manage
  home.username = "petr";
  home.homeDirectory = "/home/petr";

  # This value determines the Home Manager release that your configuration is
  # compatible with. This helps avoid breakage when a new Home Manager release
  # introduces backwards incompatible changes.
  home.stateVersion = "24.05";

  # Let Home Manager install and manage itself
  programs.home-manager.enable = true;

  # Enable git with basic configuration
  programs.git = {
    enable = true;
    userName = "Petr Fusek";
    userEmail = "petr.fusek97@gmail.com";
  };

  # Enable bash with some useful aliases
  programs.bash = {
    enable = true;
    shellAliases = {
      ll = "ls -l";
      la = "ls -la";
      rebuild = "sudo nixos-rebuild switch --flake ~/dotfiles-nixos#nixos";
      update = "cd ~/dotfiles-nixos && nix flake update && rebuild";
    };
  };

  # Basic packages for your user
  home.packages = with pkgs; [
    bat
    btop
    fd
    fzf
    ripgrep
    tree
    vscode
  ];

  # Example: Configure user-specific programs here
  # programs.neovim = {
  #   enable = true;
  #   viAlias = true;
  #   vimAlias = true;
  # };
}
