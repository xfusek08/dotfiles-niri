{ config, pkgs, lib, ... }:

{
  # Use a recent stateVersion to match current Nixpkgs
  system.stateVersion = "25.05";

  # Bootloader (UEFI GRUB example; adjust if using BIOS or another bootloader)
  boot.loader.grub.enable = true;
  boot.loader.grub.efiSupport = true;
  boot.loader.grub.devices = [ "/dev/sda" ];
  boot.kernelPackages = pkgs.linuxPackages_latest;

  # Enable necessary networking and hardware support
  services.networking.networkmanager.enable = true;   # use NetworkManager for Wi-Fi, etc.
  networking.firewall.enable = false;  # disable firewall for simplicity (adjust to taste)
  hardware.pulseaudio.enable = true;   # enable audio

  # Create the user "petr" (replace with your username)
  users.users.petr = {
    isNormalUser = true;
    extraGroups = [ "wheel" "video" "audio" "networkmanager" ];
    # Optionally set a shell or SSH keys here
    # shell = pkgs.zsh;
  };
  # Allow "wheel" group to use sudo
  security.sudo.enable = true;
  security.sudo.wheelNeedsPassword = false;

  # Wayland compositor: enable Niri
  programs.niri.enable = true;  # enable NiriWM:contentReference[oaicite:0]{index=0}
  # (Niri is Wayland-native, so we do not enable the X11 server)

  # Display manager: use greetd for Wayland sessions
  services.greetd.enable = true;
  services.greetd.settings = {
    # Automatically start Niri as user "petr"
    initial_session = {
      user = "petr";
      command = "niri";   # Niri will run as the session
    };
    default_session = initial_session;  # skip login prompt
  };

  # Required packages for a minimal Niri environment:
  environment.systemPackages = with pkgs; [
    (kde5.plasma5-packages.polkit_kde_agent) # Polkit agent for authentication
    accountsservice                          # For Dank Material Shell user menu
    alacritty                                # terminal emulator
    brightnessctl                            # Screen brightness control
    cava                                     # Audio visualizer
    cliphist                                 # Clipboard manager
    fuzzel                                   # application launcher (like dmenu)
    git                                      # Version control system
    gnome-keyring                            # for secrets/portal support
    grim                                     # Screenshot tool
    mako                                     # notification daemon
    mako                                     # Notification daemon
    mate.mate-polkit                         # PolicyKit authentication agent (mate-polkit)
    matugen                                  # Wallpaper setter
    qt6.qtmultimedia                         # For media controls in Dank Material Shell
    slurp                                    # Region selector for screenshots
    swaybg                                   # Wallpaper setter for Sway
    swaylock                                 # Screen locker
    wget                                     # For downloading files
    wl-clipboard                             # Wayland clipboard utilities
    xdg-desktop-portal                       # needed by Wayland apps for file dialogs etc.
    xdg-desktop-portal_gnome                 # Alternative portal backend
    xdg-desktop-portal_gtk                   # Alternative portal backend
    xwayland-satellite                       # For X11 app compatibility
  ];

  # (Optional) Xserver: disabled, as Niri is Wayland-only
  services.xserver.enable = false;

  # (Optional) Display manager SDDM example (uncomment if using X11/Wayland via X):
  # services.xserver.enable = true;
  # services.xserver.displayManager.sddm.enable = true;

  # Nix package manager: enable flakes if not already in nix.conf
  nix = {
    package = pkgs.nixUnstable;             # use nixUnstable for flakes support
    extraOptions = ''
      experimental-features = nix-command flakes
    '';
  };
}
