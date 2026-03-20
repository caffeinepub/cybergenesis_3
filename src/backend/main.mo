import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Nat8 "mo:core/Nat8";
import Debug "mo:core/Debug";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Random "mo:core/Random";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";

actor CyberGenesisLandMint {

  // Helper function for visual zone determination
  func getVisualZone(lat : Float, lon : Float) : Text {
    let absLat = if (lat < 0.0) { 0.0 - lat } else { lat };
    if (absLat > 55.0) { "ZONE_A_POLAR" }
    else if (absLat < 20.0) { "ZONE_B_EQUATORIAL" }
    else { "ZONE_C_TEMPERATE" };
  };

  let accessControlState = AccessControl.initState();

  let authorizedAdminPrincipal : Principal = Principal.fromText("whd5e-pbxhk-pp65k-hxqqx-edtrx-5b7xd-itunf-pz5f5-bzjut-dxkhy-4ae");

  public type Coordinates = { lat : Float; lon : Float };

  public type LandData = {
    principal : Principal;
    coordinates : Coordinates;
    biome : Text;
    upgradeLevel : Nat;
    lastClaimTime : Time.Time;
    plotName : Text;
    decorationURL : ?Text;
    baseTokenMultiplier : Float;
    cycleCharge : Int;
    chargeCap : Nat;
    lastChargeUpdate : Time.Time;
    landId : Nat;
    attachedModifications : [ModifierInstance];
  };

  public type ClaimResult = {
    #success : { tokensClaimed : Nat; newBalance : Nat; nextClaimTime : Time.Time };
    #cooldown : { remainingTime : Int; currentBalance : Nat };
    #insufficientCharge : { required : Nat; current : Int };
    #mintFailed : Text;
  };

  public type UpgradeResult = {
    #success : { newLevel : Nat; remainingTokens : Nat };
    #insufficientTokens : { required : Nat; current : Nat };
    #maxLevelReached;
  };

  public type UserProfile = { name : Text };

  public type TopLandEntry = {
    principal : Principal;
    plotName : Text;
    biome : Text;
    upgradeLevel : Nat;
    tokenBalance : Nat;
    landId : Nat;
  };

  public type Modification = {
    mod_id : Nat;
    rarity_tier : Nat;
    multiplier_value : Float;
    model_url : Text;
  };

  public type LootCache = {
    cache_id : Nat;
    tier : Nat;
    owner : Principal;
    discovered_at : Time.Time;
    is_opened : Bool;
  };

  public type DiscoverCacheResult = {
    #success : LootCache;
    #insufficientCharge : { required : Nat; current : Int };
    #insufficientTokens : { required : Nat; current : Nat };
    #paymentFailed : Text;
  };

  public type Modifier = {
    mod_id : Nat;
    rarity_tier : Nat;
    name : Text;
    multiplier_value : Float;
    asset_url : Text;
  };

  public type ModifierInstance = {
    modifierInstanceId : Nat;
    modifierType : Text;
    rarity_tier : Nat;
    multiplier_value : Float;
    model_url : Text;
  };

  public type EnergyBooster = { amount : Nat };

  public type ConsumableBuff = { buff_type : Text; duration : Nat };

  public type LandToken = { token_id : Nat; rarity : Text };

  let landRegistry = Map.empty<Principal, [LandData]>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let lootCaches = Map.empty<Principal, [LootCache]>();
  let modifications = Map.empty<Principal, [Modification]>();
  let energyBoosters = Map.empty<Principal, [EnergyBooster]>();
  let consumableBuffs = Map.empty<Principal, [ConsumableBuff]>();
  let landTokens = Map.empty<Principal, [LandToken]>();
  let playerInventory = Map.empty<Principal, [ModifierInstance]>();

  var nextCacheId : Nat = 0;
  var nextModId : Nat = 0;
  var nextLandId : Nat = 0;
  var nextModifierInstanceId : Nat = 0;

  var marketplaceCanister : ?Principal = null;
  var governanceCanister : ?Principal = null;
  var tokenCanister : ?Principal = null;

  let DISCOVERY_CHARGE_COST : Nat = 20;
  let DISCOVERY_CBR_COST : Nat = 500;
  let DISCOVERY_ICP_COST : Nat = 100000000;
  let CACHE_PROCESS_CHARGE_COST : Nat = 10;

  var modifiers : [Modifier] = [];

  // ── Access Control ──

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // ── User Profiles ──

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Land Helpers ──

  func hashPrincipal(p : Principal) : Nat {
    let bytes = p.toBlob();
    var hash = 0;
    for (byte in bytes.values()) {
      hash := (hash * 31 + byte.toNat()) % 1000000;
    };
    hash;
  };

  func getBiome(hash : Nat) : Text {
    switch (hash % 7) {
      case 0 { "FOREST_VALLEY" };
      case 1 { "ISLAND_ARCHIPELAGO" };
      case 2 { "SNOW_PEAK" };
      case 3 { "DESERT_DUNE" };
      case 4 { "VOLCANIC_CRAG" };
      case 5 { "MYTHIC_VOID" };
      case 6 { "MYTHIC_AETHER" };
      case _ { Runtime.trap("Unexpected biome value") };
    };
  };

  func generateCoordinates(hash : Nat) : Coordinates {
    let lat = ((hash % 1800).toFloat() / 10.0) - 90.0;
    let lon = ((hash % 3600).toFloat() / 10.0) - 180.0;
    { lat; lon };
  };

  // Returns charge rate per minute based on upgrade level
  // Placeholder values — will be updated with final numbers
  func getChargeRatePerMinute(level : Nat) : Int {
    switch (level) {
      case 0 { 100 };
      case 1 { 200 };
      case 2 { 300 };
      case 3 { 400 };
      case _ { 500 };
    };
  };

  // Returns charge cap based on upgrade level
  func getChargeCap(level : Nat) : Nat {
    switch (level) {
      case 0 { 1000 };
      case 1 { 2000 };
      case 2 { 3000 };
      case 3 { 4000 };
      case _ { 5000 };
    };
  };

  func updateCharge(data : LandData) : LandData {
    let currentTime = Time.now();
    let elapsedTime = currentTime - data.lastChargeUpdate;
    let minutesElapsed = elapsedTime / 60_000_000_000;
    let chargePerMinute = getChargeRatePerMinute(data.upgradeLevel);
    let cap : Int = data.chargeCap;
    let newCharge = if (data.cycleCharge + minutesElapsed * chargePerMinute > cap) { cap }
                   else { data.cycleCharge + minutesElapsed * chargePerMinute };
    { data with cycleCharge = newCharge; lastChargeUpdate = currentTime };
  };

  // ── Land Management ──

  public shared ({ caller }) func getLandData() : async [LandData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access land data");
    };
    switch (landRegistry.get(caller)) {
      case (?existingLands) { existingLands };
      case null {
        let hash = hashPrincipal(caller);
        let coordinates = generateCoordinates(hash);
        let biome = getBiome(hash);
        let rng = Random.crypto();
        let randVal = await* rng.natRange(0, 200);
        let isMythicVoid = randVal == 0;
        let finalBiome = if (isMythicVoid) { "MYTHIC_VOID" } else { biome };
        let baseTokenMultiplier = if (isMythicVoid) { 1.25 } else { 1.0 };
        let newLand : LandData = {
          principal = caller;
          coordinates;
          biome = finalBiome;
          upgradeLevel = 0;
          lastClaimTime = 0;
          plotName = "My Plot";
          decorationURL = null;
          baseTokenMultiplier;
          cycleCharge = 0;
          chargeCap = 1000;
          lastChargeUpdate = Time.now();
          landId = nextLandId;
          attachedModifications = [];
        };
        nextLandId += 1;
        landRegistry.add(caller, [newLand]);
        [newLand];
      };
    };
  };

  public shared ({ caller }) func mintLand() : async LandData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mint new land");
    };
    let userTokens = switch (landTokens.get(caller)) {
      case (?tokens) { tokens };
      case null { [] };
    };
    if (userTokens.size() == 0) { Runtime.trap("No LandTokens available") };
    let remainingTokens = Array.tabulate(userTokens.size() - 1, func(i : Nat) : LandToken {
      if (i < userTokens.size() - 1) { userTokens[i] } else { userTokens[i + 1] };
    });
    landTokens.add(caller, remainingTokens);
    let hash = hashPrincipal(caller) + nextLandId;
    let coordinates = generateCoordinates(hash);
    let biome = getBiome(hash);
    let rng = Random.crypto();
    let randVal = await* rng.natRange(0, 200);
    let isMythicVoid = randVal == 0;
    let finalBiome = if (isMythicVoid) { "MYTHIC_VOID" } else { biome };
    let baseTokenMultiplier = if (isMythicVoid) { 1.25 } else { 1.0 };
    let newLand : LandData = {
      principal = caller;
      coordinates;
      biome = finalBiome;
      upgradeLevel = 0;
      lastClaimTime = 0;
      plotName = "My Plot";
      decorationURL = null;
      baseTokenMultiplier;
      cycleCharge = 0;
      chargeCap = 1000;
      lastChargeUpdate = Time.now();
      landId = nextLandId;
      attachedModifications = [];
    };
    nextLandId += 1;
    let userLands = switch (landRegistry.get(caller)) {
      case (?lands) { lands };
      case null { [] };
    };
    landRegistry.add(caller, ([userLands, [newLand]]).flatten());
    newLand;
  };

  public shared ({ caller }) func claimRewards(landId : Nat) : async ClaimResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim rewards");
    };
    let cyberTokenCanister = switch (tokenCanister) {
      case null { Runtime.trap("Configuration error: Token canister not set. Admin must call setTokenCanister first.") };
      case (?canisterId) {
        actor (canisterId.toText()) : actor { mint : (Principal, Nat) -> async () };
      };
    };
    let currentTime = Time.now();
    let dayInNanos = 86_400_000_000_000;
    switch (landRegistry.get(caller)) {
      case null { Runtime.trap("Land not found for principal") };
      case (?lands) {
        var landIndex : ?Nat = null;
        var i = 0;
        for (land in lands.vals()) {
          if (land.landId == landId) { landIndex := ?i };
          i += 1;
        };
        switch (landIndex) {
          case null { Runtime.trap("Land with ID " # landId.toText() # " not found") };
          case (?index) {
            let land = lands[index];
            let updatedLand = updateCharge(land);
            if (updatedLand.cycleCharge < 10) {
              return #insufficientCharge { required = 10; current = updatedLand.cycleCharge };
            };
            let timeSinceLastClaim = currentTime - updatedLand.lastClaimTime;
            if (timeSinceLastClaim < dayInNanos) {
              let remainingTime = dayInNanos - timeSinceLastClaim;
              return #cooldown { remainingTime; currentBalance = 0 };
            };
            let baseReward = 100 * (updatedLand.upgradeLevel + 1);
            let rewardF = baseReward.toFloat() * updatedLand.baseTokenMultiplier;
            let reward = Int.abs(rewardF.toInt());
            Debug.print("Claiming rewards for landId: " # landId.toText() # " Amount: " # reward.toText());
            try {
              await cyberTokenCanister.mint(caller, reward);
              Debug.print("Mint successful, tokens credited: " # reward.toText());
            } catch (error) {
              Debug.print("Mint failed for claim");
              return #mintFailed("Failed to mint tokens");
            };
            let finalLand = { updatedLand with lastClaimTime = currentTime; cycleCharge = updatedLand.cycleCharge - 10 };
            let updatedLands = Array.tabulate(lands.size(), func(i : Nat) : LandData {
              if (i == index) { finalLand } else { lands[i] };
            });
            landRegistry.add(caller, updatedLands);
            #success { tokensClaimed = reward; newBalance = 0; nextClaimTime = currentTime + dayInNanos };
          };
        };
      };
    };
  };

  public shared ({ caller }) func upgradePlot(landId : Nat, cost : Nat) : async UpgradeResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upgrade plots");
    };
    switch (landRegistry.get(caller)) {
      case null { Runtime.trap("Land not found for principal") };
      case (?lands) {
        var landIndex : ?Nat = null;
        var i = 0;
        for (land in lands.vals()) {
          if (land.landId == landId) { landIndex := ?i };
          i += 1;
        };
        switch (landIndex) {
          case null { Runtime.trap("Land with ID " # landId.toText() # " not found") };
          case (?index) {
            let land = lands[index];
            let updatedLand = updateCharge(land);
            // Max display level is 5/5 (upgradeLevel = 4)
            if (updatedLand.upgradeLevel >= 4) { return #maxLevelReached };
            let newLevel = updatedLand.upgradeLevel + 1;
            let newCap = getChargeCap(newLevel);
            let finalLand = { updatedLand with upgradeLevel = newLevel; chargeCap = newCap };
            let updatedLands = Array.tabulate(lands.size(), func(i : Nat) : LandData {
              if (i == index) { finalLand } else { lands[i] };
            });
            landRegistry.add(caller, updatedLands);
            #success { newLevel; remainingTokens = 0 };
          };
        };
      };
    };
  };

  public shared ({ caller }) func updatePlotName(landId : Nat, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update plot name");
    };
    if (name.size() > 20) { Runtime.trap("Plot name must be 20 characters or less") };
    switch (landRegistry.get(caller)) {
      case null { Runtime.trap("Land not found for principal") };
      case (?lands) {
        var landIndex : ?Nat = null;
        var i = 0;
        for (land in lands.vals()) {
          if (land.landId == landId) { landIndex := ?i };
          i += 1;
        };
        switch (landIndex) {
          case null { Runtime.trap("Land with ID " # landId.toText() # " not found") };
          case (?index) {
            let updatedLand = { lands[index] with plotName = name };
            let updatedLands = Array.tabulate(lands.size(), func(i : Nat) : LandData {
              if (i == index) { updatedLand } else { lands[i] };
            });
            landRegistry.add(caller, updatedLands);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateDecoration(landId : Nat, url : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update decoration");
    };
    if (url.size() > 200) { Runtime.trap("Decoration URL must be 200 characters or less") };
    switch (landRegistry.get(caller)) {
      case null { Runtime.trap("Land not found for principal") };
      case (?lands) {
        var landIndex : ?Nat = null;
        var i = 0;
        for (land in lands.vals()) {
          if (land.landId == landId) { landIndex := ?i };
          i += 1;
        };
        switch (landIndex) {
          case null { Runtime.trap("Land with ID " # landId.toText() # " not found") };
          case (?index) {
            let updatedLand = { lands[index] with decorationURL = ?url };
            let updatedLands = Array.tabulate(lands.size(), func(i : Nat) : LandData {
              if (i == index) { updatedLand } else { lands[i] };
            });
            landRegistry.add(caller, updatedLands);
          };
        };
      };
    };
  };

  public query ({ caller }) func getLandDataQuery() : async ?[LandData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query land data");
    };
    landRegistry.get(caller);
  };


  public type PublicLandInfo = {
    landId : Nat;
    biome : Text;
    principal : Principal;
  };

  public query func getAllLandsPublic() : async [PublicLandInfo] {
    var result : [PublicLandInfo] = [];
    for ((_p, userLands) in landRegistry.entries()) {
      for (land in userLands.vals()) {
        result := ([result, [{ landId = land.landId; biome = land.biome; principal = land.principal }]]).flatten();
      };
    };
    result;
  };

  // Public query: get any land by its landId (no auth required — used by marketplace for live data)
  public query func getLandDataById(landId : Nat) : async ?LandData {
    var found : ?LandData = null;
    label search for ((_p, userLands) in landRegistry.entries()) {
      for (land in userLands.vals()) {
        if (land.landId == landId) {
          found := ?land;
          break search;
        };
      };
    };
    found
  };

  // ── Marketplace / Governance / Token Canister Config ──

  public shared ({ caller }) func setMarketplaceCanister(marketplace : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set marketplace canister");
    };
    marketplaceCanister := ?marketplace;
  };

  public shared ({ caller }) func setGovernanceCanister(governance : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set governance canister");
    };
    governanceCanister := ?governance;
  };

  public shared ({ caller }) func setTokenCanister(token : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set token canister");
    };
    tokenCanister := ?token;
  };

  // ── NFT Transfer ──

  public shared ({ caller }) func getLandOwner(landId : Nat) : async ?Principal {
    let marketplace = switch (marketplaceCanister) {
      case null {
        Debug.print("Unauthorized getLandOwner attempt - Marketplace not configured.");
        Runtime.trap("Unauthorized: Marketplace canister must be configured by admin before land transfers are enabled");
      };
      case (?m) { m };
    };
    if (caller != marketplace) {
      Runtime.trap("Unauthorized: Only the authorized marketplace canister can query land ownership");
    };
    Debug.print("Querying ownership for landId: " # landId.toText());
    for ((principal, lands) in landRegistry.entries()) {
      for (land in lands.vals()) {
        if (land.landId == landId) { return ?principal };
      };
    };
    null;
  };

  public shared ({ caller }) func transferLand(to : Principal, landId : Nat) : async Bool {
    let marketplace = switch (marketplaceCanister) {
      case null {
        Runtime.trap("Unauthorized: Marketplace canister must be configured by admin before land transfers are enabled");
      };
      case (?m) { m };
    };
    if (caller != marketplace) {
      Runtime.trap("Unauthorized: Only the authorized marketplace canister can transfer land");
    };
    Debug.print("Transfer request for landId: " # landId.toText() # " to: " # to.toText());
    for ((principal, lands) in landRegistry.entries()) {
      var landIndex : ?Nat = null;
      var i = 0;
      for (land in lands.vals()) {
        if (land.landId == landId) { landIndex := ?i };
        i += 1;
      };
      switch (landIndex) {
        case null {};
        case (?index) {
          let updatedLands = Array.tabulate(lands.size() - 1, func(i : Nat) : LandData {
            if (i < index) { lands[i] } else { lands[i + 1] };
          });
          landRegistry.add(principal, updatedLands);
          let newLand = { lands[index] with principal = to };
          let toLands = switch (landRegistry.get(to)) {
            case (?l) { l };
            case null { [] };
          };
          landRegistry.add(to, ([toLands, [newLand]]).flatten());
          Debug.print("Land transfer successful - LandId: " # landId.toText());
          // Auto-mint new land if seller now has 0 lands
          let sellerRemaining = switch (landRegistry.get(principal)) {
            case (?l) { l };
            case null { [] };
          };
          if (sellerRemaining.size() == 0) {
            let hash = hashPrincipal(principal) + nextLandId;
            let coords = generateCoordinates(hash);
            let biomeVal = getBiome(hash);
            let rng = Random.crypto();
            let rv = await* rng.natRange(0, 200);
            let isMV = rv == 0;
            let finalBiomeAuto = if (isMV) { "MYTHIC_VOID" } else { biomeVal };
            let btmAuto = if (isMV) { 1.25 } else { 1.0 };
            let autoLand : LandData = {
              principal = principal;
              coordinates = coords;
              biome = finalBiomeAuto;
              upgradeLevel = 0;
              lastClaimTime = 0;
              plotName = "My Plot";
              decorationURL = null;
              baseTokenMultiplier = btmAuto;
              cycleCharge = 0;
              chargeCap = 1000;
              lastChargeUpdate = Time.now();
              landId = nextLandId;
              attachedModifications = [];
            };
            nextLandId += 1;
            landRegistry.add(principal, [autoLand]);
            Debug.print("Auto-minted land for seller " # principal.toText() # " LandId: " # autoLand.landId.toText());
          };
          return true;
        };
      };
    };
    Debug.print("Land transfer failed - LandId not found: " # landId.toText());
    false;
  };

  // Transfer a modifier from one user to another (callable only by marketplace canister)
  public shared ({ caller }) func transferModifier(from : Principal, to : Principal, modifierInstanceId : Nat) : async Bool {
    let marketplace = switch (marketplaceCanister) {
      case null { Runtime.trap("Unauthorized: Marketplace canister must be configured") };
      case (?m) { m };
    };
    if (caller != marketplace) {
      Runtime.trap("Unauthorized: Only the authorized marketplace canister can transfer modifiers");
    };
    let fromInventory = switch (playerInventory.get(from)) {
      case (?inv) { inv };
      case null { return false };
    };
    var modIdx : ?Nat = null;
    var mi = 0;
    for (mod in fromInventory.vals()) {
      if (mod.modifierInstanceId == modifierInstanceId) { modIdx := ?mi };
      mi += 1;
    };
    switch (modIdx) {
      case null { return false };
      case (?index) {
        let modifier = fromInventory[index];
        let updatedFrom = Array.tabulate(fromInventory.size() - 1, func(i : Nat) : ModifierInstance {
          if (i < index) { fromInventory[i] } else { fromInventory[i + 1] };
        });
        playerInventory.add(from, updatedFrom);
        let toInventory = switch (playerInventory.get(to)) {
          case (?inv) { inv };
          case null { [] };
        };
        playerInventory.add(to, ([toInventory, [modifier]]).flatten());
        Debug.print("Modifier transfer ok - instanceId: " # modifierInstanceId.toText() # " from: " # from.toText() # " to: " # to.toText());
        return true;
      };
    };
  };

  public query ({ caller }) func adminGetLandData(user : Principal) : async ?[LandData] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view other users' land data");
    };
    landRegistry.get(user);
  };

  public query ({ caller }) func getTopLands(limit : Nat) : async [TopLandEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view leaderboard");
    };
    var entries : [TopLandEntry] = [];
    for ((principal, lands) in landRegistry.entries()) {
      for (land in lands.vals()) {
        entries := ([entries, [{ principal; plotName = land.plotName; biome = land.biome; upgradeLevel = land.attachedModifications.size(); tokenBalance = 0; landId = land.landId }]]).flatten();
      };
    };
    let sortedEntries = entries.sort(func(a : TopLandEntry, b : TopLandEntry) : { #less; #equal; #greater } {
      if (a.upgradeLevel > b.upgradeLevel) { #less }
      else if (a.upgradeLevel < b.upgradeLevel) { #greater }
      else if (a.tokenBalance > b.tokenBalance) { #less }
      else if (a.tokenBalance < b.tokenBalance) { #greater }
      else { #equal };
    });
    let resultSize = if (limit < sortedEntries.size()) { limit } else { sortedEntries.size() };
    Array.tabulate(resultSize, func(i : Nat) : TopLandEntry { sortedEntries[i] });
  };

  // ── Loot Cache ──

  public shared ({ caller }) func discoverLootCache(tier : Nat) : async DiscoverCacheResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can discover loot caches");
    };
    let lands = switch (landRegistry.get(caller)) {
      case null { Runtime.trap("Land not found for principal") };
      case (?l) { l };
    };
    let updatedLand = updateCharge(lands[0]);
    let requiredCharge = switch (tier) {
      case 1 { 200 };
      case 2 { 500 };
      case 3 { 1000 };
      case _ { Runtime.trap("Invalid tier: must be 1, 2, or 3") };
    };
    if (updatedLand.cycleCharge < requiredCharge) {
      return #insufficientCharge { required = requiredCharge; current = updatedLand.cycleCharge };
    };
    let finalLand = { updatedLand with cycleCharge = updatedLand.cycleCharge - requiredCharge };
    let updatedLands = Array.tabulate(lands.size(), func(i : Nat) : LandData {
      if (i == 0) { finalLand } else { lands[i] };
    });
    landRegistry.add(caller, updatedLands);
    let cacheId = nextCacheId;
    nextCacheId += 1;
    let newCache : LootCache = {
      cache_id = cacheId;
      tier;
      owner = caller;
      discovered_at = Time.now();
      is_opened = false;
    };
    let userCaches = switch (lootCaches.get(caller)) {
      case (?caches) { caches };
      case null { [] };
    };
    lootCaches.add(caller, ([userCaches, [newCache]]).flatten());
    #success(newCache);
  };

  public shared ({ caller }) func processCache(cache_id : Nat) : async ModifierInstance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can process caches");
    };
    let userCaches = switch (lootCaches.get(caller)) {
      case (?caches) { caches };
      case null { Runtime.trap("No caches found for user") };
    };
    var cacheIndex : ?Nat = null;
    var i = 0;
    for (cache in userCaches.vals()) {
      if (cache.cache_id == cache_id) { cacheIndex := ?i };
      i += 1;
    };
    switch (cacheIndex) {
      case null { Runtime.trap("Cache not found") };
      case (?index) {
        let cache = userCaches[index];
        if (cache.owner != caller) { Runtime.trap("Unauthorized: You don't own this cache") };
        if (cache.is_opened) { Runtime.trap("Cache already opened") };
        let fourHoursInNanos = 14_400_000_000_000;
        let timeSinceDiscovery = Time.now() - cache.discovered_at;
        let canOpenWithTime = timeSinceDiscovery >= fourHoursInNanos;
        if (not canOpenWithTime) {
          let lands = switch (landRegistry.get(caller)) {
            case null { Runtime.trap("Land not found for principal") };
            case (?l) { l };
          };
          let updatedLand = updateCharge(lands[0]);
          if (updatedLand.cycleCharge < CACHE_PROCESS_CHARGE_COST) {
            Runtime.trap("Cache cannot be opened yet: wait for cooldown or have sufficient charge");
          };
          let finalLand = { updatedLand with cycleCharge = updatedLand.cycleCharge - CACHE_PROCESS_CHARGE_COST };
          let updatedLands = Array.tabulate(lands.size(), func(i : Nat) : LandData {
            if (i == 0) { finalLand } else { lands[i] };
          });
          landRegistry.add(caller, updatedLands);
        };
        let rng = Random.crypto();
        let randVal = await* rng.natRange(0, 100);
        let tier = if (randVal < 70) { 1 } else if (randVal < 95) { 2 } else { 3 };
        let multiplier = switch (tier) {
          case 1 { 1.1 }; case 2 { 1.25 }; case 3 { 1.5 }; case _ { 1.0 };
        };
        let modelUrl = switch (tier) {
          case 1 { "https://assets.cybergenesis.io/models/tier1.glb" };
          case 2 { "https://assets.cybergenesis.io/models/tier2.glb" };
          case 3 { "https://assets.cybergenesis.io/models/tier3.glb" };
          case _ { "https://assets.cybergenesis.io/models/tier1.glb" };
        };
        let modifierInstanceId = nextModifierInstanceId;
        nextModifierInstanceId += 1;
        let newModifierInstance : ModifierInstance = {
          modifierInstanceId;
          modifierType = "GeneratedModifier";
          rarity_tier = tier;
          multiplier_value = multiplier;
          model_url = modelUrl;
        };
        let userInventory = switch (playerInventory.get(caller)) {
          case (?inventory) { inventory };
          case null { [] };
        };
        playerInventory.add(caller, ([userInventory, [newModifierInstance]]).flatten());
        let updatedCache = { cache with is_opened = true };
        let updatedCaches = Array.tabulate(userCaches.size(), func(i : Nat) : LootCache {
          if (i == index) { updatedCache } else { userCaches[i] };
        });
        lootCaches.add(caller, updatedCaches);
        newModifierInstance;
      };
    };
  };

  // ── Modifiers ──

  public shared ({ caller }) func applyModifier(modifierInstanceId : Nat, landId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply modifiers");
    };
    let userLands = switch (landRegistry.get(caller)) {
      case (?lands) { lands };
      case null { Runtime.trap("No lands found for user") };
    };
    var landIndex : ?Nat = null;
    var i = 0;
    for (land in userLands.vals()) {
      if (land.landId == landId) { landIndex := ?i };
      i += 1;
    };
    switch (landIndex) {
      case null { Runtime.trap("Land with ID " # landId.toText() # " not found") };
      case (?index) {
        let userInventory = switch (playerInventory.get(caller)) {
          case (?inventory) { inventory };
          case null { Runtime.trap("No modifier inventory found for user") };
        };
        var modifierIndex : ?Nat = null;
        var j = 0;
        for (modifier in userInventory.vals()) {
          if (modifier.modifierInstanceId == modifierInstanceId) { modifierIndex := ?j };
          j += 1;
        };
        switch (modifierIndex) {
          case null { Runtime.trap("Modifier with ID " # modifierInstanceId.toText() # " not found in inventory") };
          case (?modIndex) {
            let updatedInventory = Array.tabulate(userInventory.size() - 1, func(i : Nat) : ModifierInstance {
              if (i < modIndex) { userInventory[i] } else { userInventory[i + 1] };
            });
            playerInventory.add(caller, updatedInventory);
            let land = userLands[index];
            let updatedLand = { land with
              attachedModifications = ([land.attachedModifications, [userInventory[modIndex]]]).flatten();
            };
            let updatedLands = Array.tabulate(userLands.size(), func(i : Nat) : LandData {
              if (i == index) { updatedLand } else { userLands[i] };
            });
            landRegistry.add(caller, updatedLands);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeModifier(landId : Nat, modifierInstanceId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove modifiers");
    };
    let userLands = switch (landRegistry.get(caller)) {
      case (?lands) { lands };
      case null { Runtime.trap("No lands found for user") };
    };
    var landIndex : ?Nat = null;
    var i = 0;
    for (land in userLands.vals()) {
      if (land.landId == landId) { landIndex := ?i };
      i += 1;
    };
    switch (landIndex) {
      case null { Runtime.trap("Land with ID " # landId.toText() # " not found") };
      case (?index) {
        let land = userLands[index];
        var modifierIndex : ?Nat = null;
        var j = 0;
        for (mod in land.attachedModifications.vals()) {
          if (mod.modifierInstanceId == modifierInstanceId) { modifierIndex := ?j };
          j += 1;
        };
        switch (modifierIndex) {
          case null { Runtime.trap("Modifier with ID " # modifierInstanceId.toText() # " not found on land") };
          case (?modIndex) {
            let removedModifier = land.attachedModifications[modIndex];
            let updatedAttached = Array.tabulate(land.attachedModifications.size() - 1, func(i : Nat) : ModifierInstance {
              if (i < modIndex) { land.attachedModifications[i] } else { land.attachedModifications[i + 1] };
            });
            let updatedLand = { land with attachedModifications = updatedAttached };
            let updatedLands = Array.tabulate(userLands.size(), func(i : Nat) : LandData {
              if (i == index) { updatedLand } else { userLands[i] };
            });
            landRegistry.add(caller, updatedLands);
            let userInventory = switch (playerInventory.get(caller)) {
              case (?inventory) { inventory };
              case null { [] };
            };
            playerInventory.add(caller, ([userInventory, [removedModifier]]).flatten());
          };
        };
      };
    };
  };

  public shared ({ caller }) func useConsumableBuff(item_id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use consumable buffs");
    };
    let userBuffs = switch (consumableBuffs.get(caller)) {
      case (?buffs) { buffs };
      case null { Runtime.trap("No consumable buffs found for user") };
    };
    var buffIndex : ?Nat = null;
    var i = 0;
    for (_ in userBuffs.vals()) {
      if (i == item_id) { buffIndex := ?i };
      i += 1;
    };
    switch (buffIndex) {
      case null { Runtime.trap("Buff not found") };
      case (?index) {
        let updatedBuffs = Array.tabulate(userBuffs.size() - 1, func(i : Nat) : ConsumableBuff {
          if (i < index) { userBuffs[i] } else { userBuffs[i + 1] };
        });
        consumableBuffs.add(caller, updatedBuffs);
      };
    };
  };

  public query ({ caller }) func getMyLootCaches() : async [LootCache] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their loot caches");
    };
    switch (lootCaches.get(caller)) {
      case (?caches) { caches };
      case null { [] };
    };
  };

  public query ({ caller }) func getMyModifications() : async [Modification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their modifications");
    };
    switch (modifications.get(caller)) {
      case (?mods) { mods };
      case null { [] };
    };
  };

  public query ({ caller }) func getHighestRarityModification() : async ?Modification {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their modifications");
    };
    switch (modifications.get(caller)) {
      case null { null };
      case (?mods) {
        if (mods.size() == 0) { return null };
        var highest : ?Modification = null;
        for (mod in mods.vals()) {
          switch (highest) {
            case null { highest := ?mod };
            case (?current) {
              if (mod.rarity_tier > current.rarity_tier) { highest := ?mod };
            };
          };
        };
        highest;
      };
    };
  };

  public query ({ caller }) func getMyModifierInventory() : async [ModifierInstance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their modifier inventory");
    };
    switch (playerInventory.get(caller)) {
      case (?inventory) { inventory };
      case null { [] };
    };
  };

  // ── DAO Admin Functions ──

  public shared ({ caller }) func adminSetAllModifiers(modifier_list : [Modifier]) : async () {
    switch (governanceCanister) {
      case null { Runtime.trap("Unauthorized: GovernanceCanister not configured.") };
      case (?governance) {
        if (caller != governance) { Runtime.trap("Unauthorized: Only the GovernanceCanister can set all modifiers") };
      };
    };
    if (modifier_list.size() == 0) { Runtime.trap("Invalid modifier list: Must contain at least one modifier") };
    modifiers := modifier_list;
  };

  public query ({ caller }) func getAllModifiers() : async [Modifier] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view modifier catalog");
    };
    modifiers;
  };

  public query ({ caller }) func getModifierById(mod_id : Nat) : async ?Modifier {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query modifiers");
    };
    for (modifier in modifiers.vals()) {
      if (modifier.mod_id == mod_id) { return ?modifier };
    };
    null;
  };

  public query ({ caller }) func getModifiersByTier(tier : Nat) : async [Modifier] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query modifiers by tier");
    };
    modifiers.filter(func(m : Modifier) : Bool { m.rarity_tier == tier });
  };

  public query ({ caller }) func getCurrentCbrBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check their CBR balance");
    };
    Debug.print("getCurrentCbrBalance - Frontend should call CyberTokenCanister directly");
    0;
  };

  // ── Network / Admin ──

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getAssetCanisterCycleBalance() : async Text {
    if (caller != authorizedAdminPrincipal) {
      Runtime.trap("Unauthorized: Only the authorized admin principal can view cycle balances");
    };
    Debug.print("Admin requesting Asset Canister cycle balance");
    let url = "https://icp-api.io/api/v3/canisters/bd3sg-teaaa-aaaaa-qaaba-cai";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func getLandCanisterCycleBalance() : async Text {
    if (caller != authorizedAdminPrincipal) {
      Runtime.trap("Unauthorized: Only the authorized admin principal can view cycle balances");
    };
    Debug.print("Admin requesting Land Canister cycle balance");
    let url = "https://icp-api.io/api/v3/canisters/br5f7-7uaaa-aaaaa-qaaca-cai";
    await OutCall.httpGetRequest(url, [], transform);
  };
};
