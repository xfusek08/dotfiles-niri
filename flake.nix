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
  };

  outputs = inputs@{ self, nixpkgs, home-manager, ...}: { # inputs@{ ... } is needed to pass all inputs to modules
    nixosConfigurations.nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";                    # Define the system architecture
      specialArgs = { inherit inputs; };          # Pass inputs to modules
      modules = [                                 # Include configuration modules
        ./configuration.nix                       # Main system configuration
        home-manager.nixosModules.home-manager    # Home Manager integration
        {
          # Home Manager configuration for user 'petr'
          home-manager = {
            useGlobalPkgs = true;           # Use global packages
            useUserPackages = true;         # Use user-specific packages
            extraSpecialArgs = { inherit inputs; }; # Pass inputs to home-manager
            users.petr = import ./home.nix; # Import user configuration
            backupFileExtension = "backup"; # Backup file extension
          };
        }
      ];
    };
  };
}
