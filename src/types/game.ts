export type DayOfWeek = 2 | 3 | 4 | 5 | 6 | 7 | 8; // 2=Thứ 2 ... 7=Thứ 7, 8=Chủ Nhật

export type UniformId = 'white_246' | 'green_35' | 'vip_8a3';

export type OutfitId =
  | 'school_uniform'
  | 'street_hoodie'
  | 'bomber_ls'
  | 'sport_track'
  | 'formal_suit'
  | 'ao_dai_vn';

export type VehicleId = 'walk' | 'bike' | 'scooter' | 'motorbike' | 'car' | 'plane';

export type SupplyId = 'basic_books' | 'casio_kit' | 'ergonomic_bag' | 'ipad_pro' | 'ar_workstation';

export type StartupId = 'sticker_shop' | 'snack_stand' | 'web_studio' | 'edtech_corp';

export type HairStyleId = 'short_boy' | 'ponytail' | 'bob_cut' | 'spiky';

export type HubTab = 'uniform' | 'shop' | 'career' | 'streak' | 'leaderboard';

export type VenueModalType = 'jollibee' | 'net_cafe' | 'park' | 'grab';

export type SubjectRoomId = 'math' | 'literature' | 'art' | 'music' | 'english';

export type SubAdminJobType = 'teacher' | 'police' | 'disciplinarian' | 'event_manager' | 'custom';

export type RoleType = 'super_admin' | 'sub_admin' | 'student' | 'visitor';

export type TrafficLightPhase = 'green' | 'yellow' | 'red';

export interface CharacterLook {
  name: string;
  faceDataUrl: string | null;
  hairStyle: HairStyleId;
  hasGlasses: boolean;
  skinTone: string;
}

export interface VehicleDef {
  id: VehicleId;
  name: string;
  description: string;
  price: number;
  speed: number;
  canFly: boolean;
  unlockLevel: number;
}

export interface OutfitDef {
  id: OutfitId;
  name: string;
  description: string;
  price: number;
  previewPrimary: string;
  previewSecondary: string;
}

export interface VendingDrinkDef {
  id: string;
  name: string;
  description: string;
  price: number;
  energyRestore: number;
  xpReward: number;
  colorHex: string;
}

export interface PlushiePrizeDef {
  id: string;
  name: string;
  rarity: 'Thường' | 'Hiếm' | 'Cực Hiếm';
  rewardMoney: number;
  rewardXp: number;
  colorHex: string;
}

export interface SupplyDef {
  id: SupplyId;
  name: string;
  description: string;
  price: number;
  bonusMultiplier: number;
}

export interface StartupDef {
  id: StartupId;
  name: string;
  description: string;
  cost: number;
  dailyIncome: number;
  unlockLevel: number;
}

export interface PartTimeJobDef {
  id: string;
  title: string;
  description: string;
  pay: number;
  xp: number;
  minLevel: number;
}

export interface FoodItemDef {
  id: string;
  brand: 'Jollibee' | 'Tiệm Gà Rán';
  name: string;
  description: string;
  price: number;
  energyRestore: number;
  xpReward: number;
  buffLessons: number;
}

export interface GrabDestination {
  id: string;
  label: string;
  x: number;
  z: number;
  rideFee: number;
}

export interface ActiveGrabMission {
  id: string;
  missionKind: 'food' | 'grab';
  stage: 'pickup' | 'dropoff';
  title: string;
  customer: string;
  pickupLabel: string;
  pickupX: number;
  pickupZ: number;
  targetLabel: string;
  targetX: number;
  targetZ: number;
  rewardMoney: number;
  rewardXp: number;
}

export interface GoodDeedSpot {
  id: string;
  title: string;
  description: string;
  x: number;
  z: number;
  moneyReward: number;
  goodPoints: number;
  xpReward: number;
  type: 'trash' | 'stools' | 'books' | 'plant' | 'guide';
}

export interface InteractiveZone {
  id:
    | 'gate'
    | 'math_room'
    | 'literature_room'
    | 'art_room'
    | 'music_room'
    | 'english_room'
    | 'stage'
    | 'startup_booth'
    | 'good_deed'
    | 'jollibee'
    | 'net_cafe'
    | 'park'
    | 'bookstore'
    | 'vehicle_shop'
    | 'clothing_shop'
    | 'vending_machine'
    | 'grab_hub'
    | 'grab_pickup'
    | 'grab_dropoff'
    | 'museum_floor1'
    | 'museum_stairs'
    | 'museum_floor2_play'
    | 'museum_floor2_wall';
  label: string;
  sublabel: string;
  x: number;
  z: number;
  radius: number;
  deedSpot?: GoodDeedSpot;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  weeklyScore: number;
  goodPoints: number;
  money: number;
  vehicleId: VehicleId;
  isPlayer?: boolean;
}

export interface SubAdminRole {
  uid: string;
  email: string;
  displayName: string;
  jobType: SubAdminJobType;
  jobTitle: string;
  canMuteMic: boolean;
  canModerateChat: boolean;
  canIssueFine: boolean;
  assignedByUid: string;
}

export interface ModerationState {
  uid: string;
  micMuted: boolean;
  chatMuted: boolean;
  reason: string;
  mutedByUid: string;
  mutedByName: string;
}

export interface PlayerPresence {
  uid: string;
  studentName: string;
  isClassMember: boolean;
  roleType: RoleType;
  roleLabel: string;
  hairStyle: HairStyleId;
  hasGlasses: boolean;
  skinTone: string;
  equippedUniform: UniformId;
  equippedOutfit: OutfitId;
  equippedVehicle: VehicleId;
  vipClaimed: boolean;
  isDelinquent: boolean;
  wearingHelmet: boolean;
  isWheelie: boolean;
  isReckless: boolean;
  x: number;
  z: number;
  rotY: number;
  micActive: boolean;
  micMuted: boolean;
  redLightViolationAt: number;
  helmetViolationAt: number;
  online: boolean;
  updatedAtMs?: number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderRoleLabel: string;
  text: string;
  deleted: boolean;
  createdAtMs: number;
}

export interface TrafficPenalty {
  id: string;
  targetUid: string;
  targetName: string;
  issuedByUid: string;
  issuedByName: string;
  reason: string;
  amount: number;
  status: 'unpaid' | 'paid';
}

export interface AdminAssignment {
  id: string;
  assigneeUid: string;
  assigneeName: string;
  assignedByUid: string;
  title: string;
  description: string;
  jobCategory: 'teacher' | 'police' | 'discipline' | 'event' | 'other';
  rewardMoney: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export type MuseumSectionId = 'chi_lang' | 'tam_thanh' | 'mac_dynasty' | 'hoang_van_thu';

export interface MuseumSlotDef {
  slotId: string;
  section: MuseumSectionId;
  sectionLabel: string;
  frameLabel: string;
  defaultTitle: string;
  defaultCaption: string;
}

export interface MuseumArtwork {
  slotId: string;
  section: MuseumSectionId;
  title: string;
  caption: string;
  imageDataUrl: string;
  uploadedByUid: string;
  published: boolean;
}

export interface MuseumMemory {
  id: string;
  authorUid: string;
  authorName: string;
  authorRoleLabel: string;
  message: string;
  photoDataUrl: string;
  signatureDataUrl: string;
  cardColor: string;
  deleted: boolean;
  createdAtMs: number;
}

export interface PlayerState {
  look: CharacterLook;
  isClassMember: boolean;
  isDelinquent: boolean;
  wearingHelmet: boolean;
  equippedUniform: UniformId;
  ownedUniforms: UniformId[];
  equippedOutfit: OutfitId;
  ownedOutfits: OutfitId[];
  equippedVehicle: VehicleId;
  ownedVehicles: VehicleId[];
  equippedSupply: SupplyId;
  ownedSupplies: SupplyId[];
  ownedStartups: StartupId[];
  money: number;
  energy: number;
  studyBuffLessons: number;
  xp: number;
  level: number;
  goodPoints: number;
  lessonsCompleted: number;
  goodDeedsCompleted: number;
  grabMissionsCompleted: number;
  streakDays: number;
  lastClaimedDateStr: string;
  lastActiveDateStr: string;
  vipClaimedThisWeek: boolean;
  weeklyScore: number;
  weekKey: string;
  completedDeedIdsToday: string[];
  jobsWorkedToday: number;
}
