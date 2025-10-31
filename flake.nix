{
  description = "NixOS with NiriWM and DankMaterialShell";

  inputs = {
    # Nixpkgs channel (using unstable for latest packages)
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # Home Manager (for user config)
    home-manager.url = "github:nix-community/home-manager";

    # Niri flake (provides Niri packages and modules)
    niri = {
      url = "github:sodiboo/niri-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # DankMaterialShell components (for the shell and CLI tools)
    dgop = {
      url = "github:AvengeMedia/dgop";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    dms-cli = {
      url = "github:AvengeMedia/danklinux";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    dankMaterialShell = {
      url = "github:AvengeMedia/DankMaterialShell";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.dgop.follows = "dgop";
      inputs.dms-cli.follows = "dms-cli";
    };
  };

  outputs = { self, nixpkgs, home-manager, niri, dankMaterialShell, ... }@inputs:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      # NixOS system configuration output
      nixosConfigurations = {
        # Replace "my-host" with your actual hostname
        my-host = nixpkgs.lib.nixosSystem {
          system = system;
          modules = [
            # Import our configuration.nix (defined below)
            ./configuration.nix
          ];
        };
      };

      # Home Manager user configuration output
      homeConfigurations = {
        # Replace "petr" with your actual username
        petr = home-manager.lib.homeManagerConfiguration {
          pkgs = pkgs;
          username = "petr";                # the UNIX username
          homeDirectory = "/home/petr";     # the home path
          configuration = ./home.nix;        # our home-manager config

          # Import the DMS home modules for core and Niri integration
          modules = [
            dankMaterialShell.homeModules.dankMaterialShell.default
            dankMaterialShell.homeModules.dankMaterialShell.niri
            niri.homeModules.niri
          ];

          # Allow using packages from unstable for quickshell (if needed)
          extraSpecialArgs = {
            inherit inputs;
            pkgs = pkgs;
          };
        };
      };
    };
}
