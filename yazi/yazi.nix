# =============================================================================
# Yazi File Manager Configuration
# =============================================================================
# Plugins/flavors managed by yazi: run `ya pkg i` to install, `ya pkg u` to update
# =============================================================================

{ config, lib, pkgs, ... }: {
  home.packages = with pkgs; [
    yazi      # Terminal file manager
    jq
    dragon-drop
    fd
    poppler
    imagemagick
  ];

  home.file.".config/yazi/init.lua".source = ./init.lua;
  home.file.".config/yazi/yazi.toml".source = ./yazi.toml;
  home.file.".config/yazi/keymap.toml".source = ./keymap.toml;
  home.file.".config/yazi/theme.toml".source = ./theme.toml;
  home.file.".config/yazi/plugins".source = ./plugins;

  # Copy package.toml (not symlink) so yazi can write to it, then install/upgrade packages
  home.activation.yaziPackageToml = {
    after = [ "writeBoundary" ];
    before = [];
    data = ''
      export PATH="${pkgs.git}/bin:$PATH"
      if [ ! -f "$HOME/.config/yazi/package.toml" ]; then
        mkdir -p "$HOME/.config/yazi"
        cp ${./package.toml} "$HOME/.config/yazi/package.toml"
        chmod 644 "$HOME/.config/yazi/package.toml"
      fi
      ${pkgs.yazi}/bin/ya pkg install 2>/dev/null || true
      ${pkgs.yazi}/bin/ya pkg upgrade --discard 2>/dev/null || true
    '';
  };
}
