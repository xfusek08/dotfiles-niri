# =============================================================================
# Nix Flake Configuration
# =============================================================================
# Defines all external inputs (dependencies) and system outputs
# Run: sudo nixos-rebuild switch --flake .#nixos
# =============================================================================

{
  description = "NixOS with Niri + DankMaterialShell";

  inputs = {
    # --- NixOS Packages ---
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

    # --- Home Manager ---
    # User-level package and dotfile management
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # --- DankMaterialShell ---
    # Material Design desktop shell for Wayland compositors
    # Note: NOT using niri-flake - it doesn't support 'include' directives
    # which are required for DMS theming/keybind sync. Using nixpkgs niri instead.
    dms = {
      url = "github:AvengeMedia/DankMaterialShell/stable";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # --- Web Browser ---
    # Zen Browser - privacy-focused Firefox fork
    zen-browser = {
      url = "github:youwen5/zen-browser-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # ===========================================================================
  # OUTPUTS
  # ===========================================================================
  # inputs@{ ... } passes all inputs to modules
  outputs = inputs@{ self, nixpkgs, home-manager, ...}: {
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix
        home-manager.nixosModules.home-manager
        {
          home-manager = {
            useGlobalPkgs = true;
            useUserPackages = true;
            extraSpecialArgs = { inherit inputs; };
            users.petr = import ./home.nix;
            backupFileExtension = "backup";
          };
        }
      ];
    };
  };
}
