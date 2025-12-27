{
  description = "Hyprland on Nixos";

  inputs = {
    # nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05"; # Stable PKGs
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable"; # Unstable PKGs

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    niri = {
      url = "github:sodiboo/niri-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    
    dms = {
      url = "github:AvengeMedia/DankMaterialShell/stable";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # dgop = {
    #   url = "github:AvengeMedia/dgop";
    #   inputs.nixpkgs.follows = "nixpkgs";
    # };

    # dms-cli = {
    #   url = "github:AvengeMedia/danklinux";
    #   inputs.nixpkgs.follows = "nixpkgs";
    # };

    # dankMaterialShell = {
    #   url = "github:AvengeMedia/DankMaterialShell";
    #   inputs.nixpkgs.follows = "nixpkgs";
    #   inputs.dgop.follows = "dgop";
    #   inputs.dms-cli.follows = "dms-cli";
    # };
  };

  outputs = inputs@{ self, nixpkgs, home-manager, ...}: { # inputs@{ ... } is needed to pass all inputs to modules
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";                    # Define the system architecture
      specialArgs = { inherit inputs; };          # Pass inputs to modules
      modules = [                                 # Include configuration modules
        ./configuration.nix                       # Main system configuration
        home-manager.nixosModules.home-manager    # Home Manager integration
        inputs.dms.nixosModules.dankMaterialShell # Dank Material Shell NixOS module
        {
          # Home Manager configuration for user 'petr'
          home-manager = {
            useGlobalPkgs = true;           # Use global packages
            useUserPackages = true;         # Use user-specific packages
            users.petr = import ./home.nix; # Import user configuration
            backupFileExtension = "backup"; # Backup file extension
          };
        }
      ];
    };
  };
}
