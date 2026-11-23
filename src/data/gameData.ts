import {
  ActiveGrabMission,
  DayOfWeek,
  FoodItemDef,
  GoodDeedSpot,
  GrabDestination,
  MuseumSlotDef,
  OutfitDef,
  PartTimeJobDef,
  PlayerState,
  PlushiePrizeDef,
  StartupDef,
  SupplyDef,
  UniformId,
  VehicleDef,
  VendingDrinkDef,
} from '../types/game';
import { getRealSchoolClock } from '../utils/schoolTime';

export const SUPER_ADMIN_EMAIL = 'ngmanhcuong61@gmail.com';

// Exact 48-student roster of Class 8A3 from uploaded image
export const CLASS_8A3_ROSTER: string[] = [
  'Hoàng Thiện An',
  'Nguyễn Bảo An',
  'Lý Bảo Anh',
  'Mai Thùy Anh',
  'Hoàng Xuân Bắc',
  'Bùi Chí Bảo',
  'Hứa Gia Bảo',
  'Nguyễn Gia Bảo',
  'Lương Ngọc Bích',
  'Hoàng Quỳnh Chi',
  'Nguyễn Mạnh Cường',
  'Nguyễn Bá Đạt',
  'Nông Ngọc Diệp',
  'Bế Hoàng Hải',
  'Đỗ Cao Trường Hải',
  'Lê Hoàng Gia Hân',
  'Lý Bảo Hân',
  'Vũ Thanh Hằng',
  'Nguyễn Duy Hưng',
  'Nguyễn Gia Hưng',
  'Phạm Gia Hưng',
  'Nguyễn Lan Hương',
  'Hoàng Khánh Huy',
  'Phạm Thanh Huyền',
  'Hứa Vĩnh Khánh',
  'Nguyễn Đăng Khoa',
  'Hoàng Tuấn Kiệt',
  'Hứa Anh Kiệt',
  'Nguyễn Tuấn Kiệt',
  'Dương Nhật Linh',
  'Vũ Uyên Linh',
  'Lưu Hạnh Ly',
  'Lý Quang Minh',
  'Nguyễn Đức Nhân',
  'Hoàng Chấn Phong',
  'Hoàng Kiến Phong',
  'Đào Hồng Phúc',
  'Phạm Xuân Phúc',
  'Hoàng Minh Quân',
  'Triệu Chính Tâm',
  'Trần Văn Thịnh',
  'Lý Anh Thư',
  'Nguyễn Đức Trung',
  'Hứa Minh Tuyền',
  'Lâm Nhã Uyên',
  'Phạm Đức Việt',
  'Ngô Gia Vinh',
  'Nguyễn Nhật Vy',
];

export function normalizeVietnameseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');
}

export function findMatching8A3RosterName(inputName: string): string | null {
  const norm = normalizeVietnameseName(inputName);
  const found = CLASS_8A3_ROSTER.find(
    (student) => normalizeVietnameseName(student) === norm
  );
  return found || null;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ Nhật',
};

export function getRequiredUniformForDay(day: DayOfWeek): {
  required: UniformId | 'any';
  label: string;
} {
  if (day === 2 || day === 4 || day === 6) {
    return {
      required: 'white_246',
      label: 'Đồng phục Trắng viền xanh & Khăn quàng đỏ',
    };
  }
  if (day === 3 || day === 5) {
    return {
      required: 'green_35',
      label: 'Áo Polo Xanh cốm cổ xanh than',
    };
  }
  return {
    required: 'any',
    label: 'Cuối tuần ngoại khóa (Tự do chọn trang phục)',
  };
}

export const UNIFORMS: Record<
  UniformId,
  {
    id: UniformId;
    name: string;
    scheduleNote: string;
    description: string;
    price: number;
  }
> = {
  white_246: {
    id: 'white_246',
    name: 'Đồng phục Trắng (Thứ 2-4-6)',
    scheduleNote: 'Bắt buộc Thứ 2 · Thứ 4 · Thứ 6',
    description:
      'Áo polo trắng cổ xanh cốm, sọc vai xanh lá, khăn quàng đỏ Đội viên và quần tối màu.',
    price: 0,
  },
  green_35: {
    id: 'green_35',
    name: 'Đồng phục Xanh cốm (Thứ 3-5)',
    scheduleNote: 'Bắt buộc Thứ 3 · Thứ 5',
    description:
      'Áo Lacoste xanh cốm cổ bẻ & bo tay xanh than, 2 cúc trắng, logo Hoàng Văn Thụ 1962.',
    price: 0,
  },
  vip_8a3: {
    id: 'vip_8a3',
    name: 'Áo Khoác Hoàng Gia 8A3 VIP',
    scheduleNote: 'Quà VIP Tuần · Hợp lệ mọi ngày',
    description:
      'Đồng phục danh dự lớp 8A3 kèm vương miện học sinh ưu tú, miễn trừ kiểm tra đồng phục.',
    price: 9999999,
  },
};

export const VEHICLES: VehicleDef[] = [
  {
    id: 'walk',
    name: 'Đi bộ đến trường',
    description: 'Khởi đầu giản dị, rèn luyện sức khỏe mỗi sáng qua cổng trường.',
    price: 0,
    speed: 6.5,
    canFly: false,
    unlockLevel: 1,
  },
  {
    id: 'bike',
    name: 'Xe đạp thể thao 8A3',
    description: 'Gọn nhẹ, lướt nhanh từ khu phố vào sân trường Hoàng Văn Thụ.',
    price: 40000,
    speed: 11.0,
    canFly: false,
    unlockLevel: 1,
  },
  {
    id: 'scooter',
    name: 'Xe máy điện học sinh',
    description: 'Êm ái, đèn LED hiện đại. Cần đội mũ bảo hiểm khi lưu thông ngoài đường!',
    price: 120000,
    speed: 15.0,
    canFly: false,
    unlockLevel: 2,
  },
  {
    id: 'motorbike',
    name: 'Xe máy thể thao Exciter 155',
    description: 'Động cơ bốc, có thể bốc đầu nếu là Học sinh Hư Đầu Gấu. Nhớ đội mũ bảo hiểm!',
    price: 280000,
    speed: 18.5,
    canFly: false,
    unlockLevel: 3,
  },
  {
    id: 'car',
    name: 'Siêu xe Coupe Thể thao',
    description: 'Đẳng cấp doanh nhân trẻ lớp 8A3, cửa kính thể thao và cánh lướt gió.',
    price: 450000,
    speed: 21.0,
    canFly: false,
    unlockLevel: 4,
  },
  {
    id: 'plane',
    name: 'Phi cơ Phản lực Cá nhân',
    description: 'Bay vút trên bầu trời Lạng Sơn và hạ cánh từ sân trường ra khu phố!',
    price: 1500000,
    speed: 28.0,
    canFly: true,
    unlockLevel: 6,
  },
];

export const OUTFITS: OutfitDef[] = [
  {
    id: 'school_uniform',
    name: 'Đồng Phục Trường Hoàng Văn Thụ',
    description: 'Hiển thị theo bộ đồng phục bạn chọn trong Tủ đồ (Trắng 2-4-6 / Xanh 3-5 / VIP).',
    price: 0,
    previewPrimary: '#84cc16',
    previewSecondary: '#f8fafc',
  },
  {
    id: 'street_hoodie',
    name: 'Hoodie Streetwear Lớp 8A3',
    description: 'Áo hoodie đen phối cam trẻ trung, phong cách dạo phố ngoài giờ học.',
    price: 35000,
    previewPrimary: '#1e293b',
    previewSecondary: '#f97316',
  },
  {
    id: 'sport_track',
    name: 'Bộ Thể Thao Bóng Rổ 8A3',
    description: 'Áo jersey xanh dương sọc trắng năng động cho sân bóng và khu vui chơi.',
    price: 50000,
    previewPrimary: '#0284c7',
    previewSecondary: '#bae6fd',
  },
  {
    id: 'bomber_ls',
    name: 'Áo Khoác Bomber Xứ Lạng',
    description: 'Bomber đỏ đô thêu huy hiệu Mẫu Sơn cực ngầu dành cho dân chơi phố.',
    price: 65000,
    previewPrimary: '#991b1b',
    previewSecondary: '#fde047',
  },
  {
    id: 'ao_dai_vn',
    name: 'Áo Dài Truyền Thống & Lễ Hội',
    description: 'Trang phục truyền thống thanh lịch khi tham quan Bảo Tàng Tỉnh Lạng Sơn.',
    price: 90000,
    previewPrimary: '#be185d',
    previewSecondary: '#fbcfe8',
  },
  {
    id: 'formal_suit',
    name: 'Vest Doanh Nhân Startup 8A3',
    description: 'Bộ vest than chì sang trọng dành cho các nhà sáng lập trẻ thành đạt.',
    price: 120000,
    previewPrimary: '#0f172a',
    previewSecondary: '#cbd5e1',
  },
];

export const VENDING_DRINKS: VendingDrinkDef[] = [
  {
    id: 'peach_tea',
    name: 'Trà Đào Cam Sả Mát Lạnh',
    description: 'Giải khát tức thì sau khi tham quan các gian trưng bày bảo tàng.',
    price: 8000,
    energyRestore: 22,
    xpReward: 10,
    colorHex: '#fb923c',
  },
  {
    id: 'salted_lemon',
    name: 'Nước Chanh Muối Lạng Sơn',
    description: 'Vị chua mặn thanh mát đặc trưng vùng núi Đông Bắc.',
    price: 10000,
    energyRestore: 30,
    xpReward: 14,
    colorHex: '#facc15',
  },
  {
    id: 'soy_milk',
    name: 'Sữa Đậu Nành Ấm',
    description: 'Bổ sung năng lượng nhẹ nhàng cho buổi chiều học tập.',
    price: 12000,
    energyRestore: 36,
    xpReward: 18,
    colorHex: '#fde68a',
  },
  {
    id: 'energy_8a3',
    name: 'Nước Tăng Lực 8A3 Ultra',
    description: 'Hồi nhanh +60% năng lượng để tiếp tục khám phá toàn thành phố!',
    price: 18000,
    energyRestore: 60,
    xpReward: 24,
    colorHex: '#38bdf8',
  },
];

export const PLUSHIE_PRIZES: PlushiePrizeDef[] = [
  {
    id: 'plush_bear',
    name: 'Gấu Bông Hoàng Văn Thụ',
    rarity: 'Thường',
    rewardMoney: 10000,
    rewardXp: 18,
    colorHex: '#d97706',
  },
  {
    id: 'plush_rabbit',
    name: 'Thỏ Hồng Hoa Đào Mẫu Sơn',
    rarity: 'Thường',
    rewardMoney: 12000,
    rewardXp: 22,
    colorHex: '#f472b6',
  },
  {
    id: 'plush_sheep',
    name: 'Cừu Trắng Xứ Lạng',
    rarity: 'Hiếm',
    rewardMoney: 18000,
    rewardXp: 30,
    colorHex: '#38bdf8',
  },
  {
    id: 'plush_dragon',
    name: 'Rồng Vàng Lớp 8A3',
    rarity: 'Cực Hiếm',
    rewardMoney: 30000,
    rewardXp: 50,
    colorHex: '#facc15',
  },
];

export const SUPPLIES: SupplyDef[] = [
  {
    id: 'basic_books',
    name: 'Vở ô ly & Bút bi Basic',
    description: 'Bộ sách vở cơ bản cho ngày đầu nhập học lớp 8A3 (Thưởng 10k/tiết).',
    price: 0,
    bonusMultiplier: 1.0,
  },
  {
    id: 'casio_kit',
    name: 'Casio fx-580VNX & Bộ Thước',
    description: 'Giải toán siêu tốc trong tiết học (+20% tiền thưởng & XP).',
    price: 30000,
    bonusMultiplier: 1.2,
  },
  {
    id: 'ergonomic_bag',
    name: 'Ba lô Chống gù & Bút máy Cao cấp',
    description: 'Ngăn nắp chuẩn học sinh giỏi (+40% tiền thưởng & XP).',
    price: 80000,
    bonusMultiplier: 1.4,
  },
  {
    id: 'ipad_pro',
    name: 'iPad Pro & Bút Cảm Ứng',
    description: 'Ghi chép bài giảng số hóa cực nhanh (+80% tiền thưởng & XP).',
    price: 250000,
    bonusMultiplier: 1.8,
  },
  {
    id: 'ar_workstation',
    name: 'Workstation & Kính Học Tập AR VIP',
    description: 'Trang bị tối thượng cho thủ khoa 8A3 (+150% tiền thưởng & XP).',
    price: 600000,
    bonusMultiplier: 2.5,
  },
];

export const STARTUPS: StartupDef[] = [
  {
    id: 'sticker_shop',
    name: 'Tiệm Sổ Tay & Sticker 8A3',
    description: 'Thiết kế sticker lớp 8A3 bán cho bạn bè khối 6-9.',
    cost: 50000,
    dailyIncome: 18000,
    unlockLevel: 1,
  },
  {
    id: 'snack_stand',
    name: 'Quầy Trà Chanh Sân Sau',
    description: 'Đồ uống mát lạnh giờ ra chơi được cả trường yêu thích.',
    cost: 150000,
    dailyIncome: 55000,
    unlockLevel: 2,
  },
  {
    id: 'web_studio',
    name: 'CLB Thiết Kế Web & Game 3D',
    description: 'Nhận dự án công nghệ từ các cuộc thi sáng tạo thanh thiếu niên.',
    cost: 400000,
    dailyIncome: 150000,
    unlockLevel: 3,
  },
  {
    id: 'edtech_corp',
    name: 'Hệ Sinh Thái Học Đường HVT Corp',
    description: 'Nền tảng học tập số toàn tỉnh Lạng Sơn do học sinh 8A3 sáng lập.',
    cost: 1100000,
    dailyIncome: 420000,
    unlockLevel: 5,
  },
];

export const PART_TIME_JOBS: PartTimeJobDef[] = [
  {
    id: 'tutor',
    title: 'Gia sư Toán cho em khối 6',
    description: 'Hướng dẫn bài tập về nhà 30 phút sau giờ tan học.',
    pay: 15000,
    xp: 25,
    minLevel: 1,
  },
  {
    id: 'photo',
    title: 'Chụp ảnh Sự kiện Sân khấu',
    description: 'Lưu lại khoảnh khắc trao giải và lễ chào cờ toàn trường.',
    pay: 28000,
    xp: 40,
    minLevel: 2,
  },
  {
    id: 'poster',
    title: 'Thiết kế Banner Đội Thiếu niên',
    description: 'Dựng poster tuyên truyền phong trào Đoàn Kết - Kỷ Cương.',
    pay: 45000,
    xp: 65,
    minLevel: 3,
  },
];

export const FOOD_MENU: FoodItemDef[] = [
  {
    id: 'jollibee_chicken',
    brand: 'Jollibee',
    name: 'Gà Giòn Vui Vẻ + Nước Ngọt',
    description: 'Suất gà giòn nóng hổi tại Jollibee trước cổng trường.',
    price: 25000,
    energyRestore: 35,
    xpReward: 15,
    buffLessons: 1,
  },
  {
    id: 'jollibee_spaghetti',
    brand: 'Jollibee',
    name: 'Mì Ý Sốt Bò Bằm Jollibee',
    description: 'Món khoái khẩu giúp học bài tập trung cực độ (+30% thưởng 2 tiết).',
    price: 35000,
    energyRestore: 50,
    xpReward: 25,
    buffLessons: 2,
  },
  {
    id: 'fried_combo_8a3',
    brand: 'Tiệm Gà Rán',
    name: 'Combo Gà Rán Phô Mai Lớp 8A3',
    description: 'Full năng lượng 100% và tăng tốc độ tiếp thu suốt 3 tiết học!',
    price: 55000,
    energyRestore: 100,
    xpReward: 40,
    buffLessons: 3,
  },
];

export const GRAB_DESTINATIONS: GrabDestination[] = [
  { id: 'school_gate', label: 'Cổng Trường Hoàng Văn Thụ', x: 0, z: 28, rideFee: 3000 },
  { id: 'math_room', label: 'Phòng Toán 8', x: -14, z: -14.2, rideFee: 4000 },
  { id: 'literature_room', label: 'Phòng Ngữ Văn 8', x: -5, z: -14.2, rideFee: 4000 },
  { id: 'art_room', label: 'Phòng Mĩ Thuật', x: 4, z: -14.2, rideFee: 4000 },
  { id: 'music_room', label: 'Phòng Âm Nhạc', x: 13, z: -14.2, rideFee: 4000 },
  { id: 'clothing_shop', label: 'Cửa Hàng Quần Áo 8A3', x: -55, z: 47, rideFee: 5000 },
  { id: 'jollibee', label: 'Jollibee & Tiệm Gà Rán', x: -34, z: 47, rideFee: 4000 },
  { id: 'net_cafe', label: 'Quán Net Cyber 8A3', x: -12, z: 47, rideFee: 3000 },
  { id: 'park', label: 'Công Viên & Khu Vui Chơi', x: 13, z: 48, rideFee: 4000 },
  { id: 'bookstore', label: 'Nhà Sách & Showroom Xe', x: 35, z: 47, rideFee: 5000 },
  { id: 'museum_ls', label: 'Bảo Tàng Tỉnh Lạng Sơn', x: 43.5, z: 6, rideFee: 4000 },
];

export const GRAB_MISSIONS: Array<Omit<ActiveGrabMission, 'id' | 'stage'>> = [
  {
    missionKind: 'food',
    title: 'GrabFood: Giao Gà Rán Jollibee',
    customer: 'Bạn lớp 8A3',
    pickupLabel: 'Quán Jollibee & Tiệm Gà Rán',
    pickupX: -34,
    pickupZ: 47,
    targetLabel: 'Phòng Mĩ Thuật',
    targetX: 4,
    targetZ: -14.2,
    rewardMoney: 26000,
    rewardXp: 40,
  },
  {
    missionKind: 'grab',
    title: 'GrabBike: Đón bạn từ Công Viên',
    customer: 'Học sinh khối 6',
    pickupLabel: 'Cổng Công Viên & Khu Vui Chơi',
    pickupX: 13,
    pickupZ: 48,
    targetLabel: 'Cổng Trường Hoàng Văn Thụ',
    targetX: 0,
    targetZ: 28,
    rewardMoney: 20000,
    rewardXp: 32,
  },
  {
    missionKind: 'grab',
    title: 'GrabExpress: Giao Bộ Sách Mới',
    customer: 'Thầy Chủ Nhiệm 8A3',
    pickupLabel: 'Nhà Sách & Showroom Xe',
    pickupX: 35,
    pickupZ: 47,
    targetLabel: 'Sân Khấu Trao Giải',
    targetX: -15.5,
    targetZ: 2,
    rewardMoney: 28000,
    rewardXp: 45,
  },
  {
    missionKind: 'food',
    title: 'GrabFood: Ship Trà Chanh Startup',
    customer: 'Hội Game Thủ Net 8A3',
    pickupLabel: 'CLB Khởi Nghiệp 8A3 (Dãy Đông)',
    pickupX: 17.5,
    pickupZ: 2,
    targetLabel: 'Quán Net Cyber 8A3',
    targetX: -12,
    targetZ: 47,
    rewardMoney: 25000,
    rewardXp: 38,
  },
];

export const FOOD_DELIVERY_MISSIONS: Array<Omit<ActiveGrabMission, 'id' | 'stage'>> = [
  {
    missionKind: 'food',
    title: 'Ship Gà Giòn Vui Vẻ Jollibee',
    customer: 'Thầy cô Phòng Tiếng Anh',
    pickupLabel: 'Quầy Bếp Jollibee & Gà Rán',
    pickupX: -34,
    pickupZ: 47,
    targetLabel: 'Phòng Tiếng Anh 8',
    targetX: 17.5,
    targetZ: -7,
    rewardMoney: 24000,
    rewardXp: 38,
  },
  {
    missionKind: 'food',
    title: 'Ship Combo Mì Ý & Gà Rán Phô Mai',
    customer: 'Nhóm bạn Phòng Toán 8',
    pickupLabel: 'Quầy Bếp Jollibee & Gà Rán',
    pickupX: -34,
    pickupZ: 47,
    targetLabel: 'Phòng Toán 8',
    targetX: -14,
    targetZ: -14.2,
    rewardMoney: 26000,
    rewardXp: 42,
  },
];

export interface LiteraturePuzzle {
  prompt: string;
  options: string[];
  correctIndex: number;
  note: string;
}

export const LITERATURE_PUZZLES: LiteraturePuzzle[] = [
  {
    prompt: 'Hoàn thiện câu ca dao: "Công cha như núi Thái Sơn / Nghĩa mẹ như nước..."',
    options: ['trong nguồn chảy ra', 'biển Đông dạt dào', 'sông sâu êm đềm', 'mưa rơi đầu nguồn'],
    correctIndex: 0,
    note: 'Câu ca dao quen thuộc ca ngợi công ơn sinh thành của cha mẹ.',
  },
  {
    prompt: 'Tác phẩm "Hịch tướng sĩ" (Ngữ văn 8) là kiệt tác của vị danh tướng nào?',
    options: ['Nguyễn Trãi', 'Trần Quốc Tuấn', 'Lý Thường Kiệt', 'Quang Trung'],
    correctIndex: 1,
    note: 'Hưng Đạo Đại Vương Trần Quốc Tuấn viết Hịch tướng sĩ khích lệ quân sĩ.',
  },
  {
    prompt: 'Tác giả của truyện ngắn "Lão Hạc" là nhà văn hiện thực phê phán nào?',
    options: ['Ngô Tất Tố', 'Nguyên Hồng', 'Nam Cao', 'Vũ Trọng Phụng'],
    correctIndex: 2,
    note: 'Nam Cao sáng tác "Lão Hạc" năm 1943.',
  },
  {
    prompt: 'Trong câu "Mặt trời của bắp thì nằm trên đồi / Mặt trời của mẹ em nằm trên lưng", tác giả sử dụng biện pháp tu từ gì?',
    options: ['Nói quá', 'Ẩn dụ', 'Đảo ngữ', 'Chơi chữ'],
    correctIndex: 1,
    note: 'Hình ảnh "Mặt trời của mẹ" ẩn dụ cho em bé trên lưng mẹ.',
  },
  {
    prompt: 'Ai là tác giả bài thơ "Ông đồ" nổi tiếng trong phong trào Thơ mới?',
    options: ['Vũ Đình Liên', 'Xuân Diệu', 'Huy Cận', 'Tế Hanh'],
    correctIndex: 0,
    note: 'Bài thơ "Ông đồ" của Vũ Đình Liên khắc họa nét đẹp văn hóa xưa.',
  },
];

export interface EnglishScramblePuzzle {
  scrambled: string;
  answer: string;
  meaning: string;
  hint: string;
}

export const ENGLISH_PUZZLES: EnglishScramblePuzzle[] = [
  { scrambled: 'MOUNFRI', answer: 'UNIFORM', meaning: 'Đồng phục trường học', hint: 'Bắt đầu bằng chữ U' },
  { scrambled: 'SSALOCMOR', answer: 'CLASSROOM', meaning: 'Phòng học', hint: 'Nơi lớp 8A3 học bài' },
  { scrambled: 'ELCHSEDU', answer: 'SCHEDULE', meaning: 'Thời khóa biểu', hint: 'Lịch học Thứ 2 đến Thứ 7' },
  { scrambled: 'ERATIULTRE', answer: 'LITERATURE', meaning: 'Môn Ngữ Văn', hint: 'Bắt đầu bằng L' },
  { scrambled: 'TRAPSUT', answer: 'STARTUP', meaning: 'Khởi nghiệp', hint: 'Bắt đầu bằng S' },
  { scrambled: 'RECNOT', answer: 'CONCERT', meaning: 'Buổi hòa nhạc', hint: 'Liên quan đến Âm nhạc' },
];

export interface ArtChallenge {
  title: string;
  description: string;
  targetColorCss: string;
  options: Array<{ label: string; css: string }>;
  correctIndex: number;
}

export const ART_CHALLENGES: ArtChallenge[] = [
  {
    title: 'Pha màu Xanh Cốm Đồng Phục 8A3',
    description: 'Trong hội họa, để pha ra sắc Xanh lá / Xanh cốm, họa sĩ trộn 2 màu cơ bản nào?',
    targetColorCss: '#84cc16',
    options: [
      { label: 'Đỏ + Xanh dương', css: '#7e22ce' },
      { label: 'Vàng + Xanh dương', css: '#84cc16' },
      { label: 'Đỏ + Vàng', css: '#f97316' },
      { label: 'Đen + Trắng', css: '#94a3b8' },
    ],
    correctIndex: 1,
  },
  {
    title: 'Sắc Cam Ấm Mái Ngói Trường Học',
    description: 'Hai màu cơ bản nào khi kết hợp tạo ra gam màu Cam rực rỡ?',
    targetColorCss: '#ea580c',
    options: [
      { label: 'Đỏ + Vàng', css: '#ea580c' },
      { label: 'Xanh dương + Vàng', css: '#16a34a' },
      { label: 'Đỏ + Xanh dương', css: '#6b21a8' },
      { label: 'Xanh lá + Trắng', css: '#86efac' },
    ],
    correctIndex: 0,
  },
  {
    title: 'Cặp Màu Bổ Túc Tương Phản Mạnh',
    description: 'Màu nào đối diện trực tiếp với màu Đỏ của Khăn quàng đỏ trên vòng tròn màu?',
    targetColorCss: '#16a34a',
    options: [
      { label: 'Màu Cam', css: '#f97316' },
      { label: 'Màu Tím', css: '#9333ea' },
      { label: 'Màu Xanh lá', css: '#16a34a' },
      { label: 'Màu Vàng', css: '#eab308' },
    ],
    correctIndex: 2,
  },
];

export const GOOD_DEED_SPOTS: GoodDeedSpot[] = [
  {
    id: 'deed_trash_1',
    title: 'Nhặt rác sân trường',
    description: 'Thu gom chai nhựa & giấy vụn gần khu vực sân khấu bỏ vào thùng phân loại.',
    x: -14,
    z: 8,
    moneyReward: 6000,
    goodPoints: 25,
    xpReward: 35,
    type: 'trash',
  },
  {
    id: 'deed_stools_1',
    title: 'Xếp ngay ngắn ghế nhựa đỏ',
    description: 'Sắp xếp lại hàng ghế đỏ dưới sân trường sau giờ sinh hoạt dưới cờ.',
    x: 2,
    z: 6,
    moneyReward: 7000,
    goodPoints: 30,
    xpReward: 40,
    type: 'stools',
  },
  {
    id: 'deed_books_1',
    title: 'Giúp bạn nhặt sách vở bị rơi',
    description: 'Một bạn lớp 6 làm rơi chồng sách trước dãy nhà lớp học vàng.',
    x: 16,
    z: -4,
    moneyReward: 8000,
    goodPoints: 35,
    xpReward: 45,
    type: 'books',
  },
  {
    id: 'deed_plant_1',
    title: 'Tưới bồn cây xanh sân trường',
    description: 'Chăm sóc hàng cây bóng mát giữa sân trường Hoàng Văn Thụ.',
    x: -11,
    z: -10,
    moneyReward: 6000,
    goodPoints: 20,
    xpReward: 30,
    type: 'plant',
  },
  {
    id: 'deed_guide_1',
    title: 'Hướng dẫn phụ huynh ở Cổng trường',
    description: 'Chỉ đường nhiệt tình tới phòng Hội đồng cho khách đến thăm trường.',
    x: 3,
    z: 30,
    moneyReward: 8000,
    goodPoints: 30,
    xpReward: 40,
    type: 'guide',
  },
  {
    id: 'deed_park_1',
    title: 'Chăm sóc vườn hoa Công Viên',
    description: 'Tưới hoa và dọn sạch khu vui chơi công viên đối diện trường.',
    x: 17,
    z: 60,
    moneyReward: 9000,
    goodPoints: 35,
    xpReward: 45,
    type: 'plant',
  },
];

export function getXpForNextLevel(level: number): number {
  return level * 150 + 50;
}

export function getLevelTitle(level: number): string {
  if (level >= 8) return 'Huyền thoại 8A3';
  if (level >= 6) return 'Chủ tịch Khởi nghiệp';
  if (level >= 4) return 'Sao Đỏ Ưu tú';
  if (level >= 2) return 'Học sinh Gương mẫu';
  return 'Thành viên mới 8A3';
}

export function formatVND(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function createInitialPlayerState(defaultName = 'Khách Tham Quan'): PlayerState {
  const clock = getRealSchoolClock();
  const matchedName = findMatching8A3RosterName(defaultName);
  return {
    look: {
      name: matchedName || defaultName,
      faceDataUrl: null,
      hairStyle: 'short_boy',
      hasGlasses: true,
      skinTone: '#f4c7a5',
    },
    isClassMember: Boolean(matchedName),
    isDelinquent: false,
    wearingHelmet: true,
    equippedUniform: clock.dayOfWeek === 3 || clock.dayOfWeek === 5 ? 'green_35' : 'white_246',
    ownedUniforms: ['white_246', 'green_35'],
    equippedOutfit: 'school_uniform',
    ownedOutfits: ['school_uniform'],
    equippedVehicle: 'walk',
    ownedVehicles: ['walk'],
    equippedSupply: 'basic_books',
    ownedSupplies: ['basic_books'],
    ownedStartups: [],
    money: matchedName ? 15000 : 0,
    energy: 100,
    studyBuffLessons: 0,
    xp: 0,
    level: 1,
    goodPoints: 0,
    lessonsCompleted: 0,
    goodDeedsCompleted: 0,
    grabMissionsCompleted: 0,
    streakDays: 1,
    lastClaimedDateStr: '',
    lastActiveDateStr: clock.dateStr,
    vipClaimedThisWeek: false,
    weeklyScore: 0,
    weekKey: clock.weekKey,
    completedDeedIdsToday: [],
    jobsWorkedToday: 0,
  };
}

export const MUSEUM_SLOTS: MuseumSlotDef[] = [
  {
    slotId: 'frame_chi_lang_1',
    section: 'chi_lang',
    sectionLabel: 'Phần 1: Khu Di Tích Ải Chi Lăng',
    frameLabel: 'Khung Tranh 1A',
    defaultTitle: 'Quỷ Môn Quan & Ải Chi Lăng Lịch Sử',
    defaultCaption: 'Phòng tuyến hiểm yếu nơi quân dân Đại Việt lập nhiều chiến công oanh liệt.',
  },
  {
    slotId: 'frame_chi_lang_2',
    section: 'chi_lang',
    sectionLabel: 'Phần 1: Khu Di Tích Ải Chi Lăng',
    frameLabel: 'Khung Tranh 1B',
    defaultTitle: 'Chiến Thắng Chi Lăng 1427',
    defaultCaption: 'Dấu ấn hào khí Lam Sơn giữa núi non trùng điệp xứ Lạng.',
  },
  {
    slotId: 'frame_tam_thanh_1',
    section: 'tam_thanh',
    sectionLabel: 'Phần 2: Danh Thắng Tam Thanh - Nhị Thanh',
    frameLabel: 'Khung Tranh 2A',
    defaultTitle: 'Động Chùa Tam Thanh Huyền Ảo',
    defaultCaption: 'Đệ nhất bát cảnh xứ Lạng với tượng Phật khắc trên vách đá tự nhiên.',
  },
  {
    slotId: 'frame_tam_thanh_2',
    section: 'tam_thanh',
    sectionLabel: 'Phần 2: Danh Thắng Tam Thanh - Nhị Thanh',
    frameLabel: 'Khung Tranh 2B',
    defaultTitle: 'Nàng Tô Thị Ôm Con Hóa Đá',
    defaultCaption: 'Biểu tượng thủy chung son sắt sừng sững trên đỉnh núi Tam Thanh.',
  },
  {
    slotId: 'frame_mac_1',
    section: 'mac_dynasty',
    sectionLabel: 'Phần 3: Thành Nhà Mạc & Văn Hóa Xứ Lạng',
    frameLabel: 'Khung Tranh 3A',
    defaultTitle: 'Thành Cổ Nhà Mạc Lạng Sơn',
    defaultCaption: 'Kiến trúc tường đá cổ kính bên sườn núi giữa lòng TP. Lạng Sơn.',
  },
  {
    slotId: 'frame_mac_2',
    section: 'mac_dynasty',
    sectionLabel: 'Phần 3: Thành Nhà Mạc & Văn Hóa Xứ Lạng',
    frameLabel: 'Khung Tranh 3B',
    defaultTitle: 'Hội Hát Sli - Lượn & Chợ Kỳ Lừa',
    defaultCaption: 'Nét đẹp văn hóa dân tộc Tày - Nùng vùng biên cương Đông Bắc.',
  },
  {
    slotId: 'frame_hvt_1',
    section: 'hoang_van_thu',
    sectionLabel: 'Phần 4: Khu Di Tích Hoàng Văn Thụ',
    frameLabel: 'Khung Tranh 4A',
    defaultTitle: 'Tượng Đài Đồng Chí Hoàng Văn Thụ',
    defaultCaption: 'Người chiến sĩ cách mạng kiên trung, niềm tự hào của ngôi trường THCS Hoàng Văn Thụ.',
  },
  {
    slotId: 'frame_hvt_2',
    section: 'hoang_van_thu',
    sectionLabel: 'Phần 4: Khu Di Tích Hoàng Văn Thụ',
    frameLabel: 'Khung Tranh 4B',
    defaultTitle: 'Đỉnh Núi Mẫu Sơn Mây Trắng',
    defaultCaption: 'Vùng núi cao hùng vĩ và hoa đào phai rực rỡ mùa xuân Lạng Sơn.',
  },
];

export interface MuseumQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  fact: string;
}

export const MUSEUM_QUIZ_QUESTIONS: MuseumQuizQuestion[] = [
  {
    prompt: 'Danh thắng nào ở Lạng Sơn gắn liền với truyền thuyết người vợ ôm con chờ chồng hóa đá?',
    options: ['Núi Nàng Tô Thị', 'Núi Bà Đen', 'Đỉnh Fansipan', 'Núi Ngũ Hành Sơn'],
    correctIndex: 0,
    fact: 'Núi Tô Thị nằm ngay trong quần thể danh thắng Nhị - Tam Thanh, TP. Lạng Sơn.',
  },
  {
    prompt: 'Ngôi trường lớp 8A3 chúng ta mang tên vị anh hùng cách mạng nào của quê hương Lạng Sơn?',
    options: ['Lương Văn Can', 'Hoàng Văn Thụ', 'Phạm Hồng Thái', 'Nguyễn Thái Học'],
    correctIndex: 1,
    fact: 'Đồng chí Hoàng Văn Thụ sinh ra tại xã Nhân Lý (nay là xã Hoàng Văn Thụ, Văn Lãng, Lạng Sơn).',
  },
  {
    prompt: 'Di tích lịch sử nào ở Lạng Sơn nổi tiếng với địa thế hiểm trở và chiến thắng năm 1427?',
    options: ['Thành Cổ Loa', 'Ải Chi Lăng', 'Bến Bạch Đằng', 'Đèo Ngang'],
    correctIndex: 1,
    fact: 'Ải Chi Lăng dài gần 20km với nhiều chiến công hiển hách bảo vệ bờ cõi phía Bắc.',
  },
  {
    prompt: 'Đỉnh núi du lịch nổi tiếng của Lạng Sơn có khí hậu mát mẻ và mùa đông đôi khi có băng tuyết là gì?',
    options: ['Ba Vì', 'Tam Đảo', 'Mẫu Sơn', 'Bà Nà'],
    correctIndex: 2,
    fact: 'Đỉnh Mẫu Sơn cao hơn 1.500m so với mực nước biển, nổi tiếng với hoa đào và rượu Mẫu Sơn.',
  },
  {
    prompt: 'Khu di tích tường đá cổ trên sườn núi ngay tại phường Tam Thanh, TP. Lạng Sơn có tên là gì?',
    options: ['Thành Nhà Mạc', 'Thành Nhà Hồ', 'Hoàng Thành Thăng Long', 'Cố Đô Hoa Lư'],
    correctIndex: 0,
    fact: 'Thành Nhà Mạc được xây dựng từ thế kỷ XVI bằng đá khối vững chãi giữa hai vách núi.',
  },
];

export function buildLangSonPresetPainting(
  section: MuseumSlotDef['section'],
  title: string
): string {
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = 380;
  c.height = 250;
  const ctx = c.getContext('2d');
  if (!ctx) return '';

  const themes: Record<
    MuseumSlotDef['section'],
    { sky1: string; sky2: string; mtn1: string; mtn2: string; accent: string; badge: string }
  > = {
    chi_lang: {
      sky1: '#f59e0b',
      sky2: '#fef3c7',
      mtn1: '#14532d',
      mtn2: '#166534',
      accent: '#dc2626',
      badge: 'DI TÍCH ẢI CHI LĂNG',
    },
    tam_thanh: {
      sky1: '#0284c7',
      sky2: '#bae6fd',
      mtn1: '#1e3a8a',
      mtn2: '#15803d',
      accent: '#facc15',
      badge: 'DANH THẮNG TAM THANH',
    },
    mac_dynasty: {
      sky1: '#7c2d12',
      sky2: '#fed7aa',
      mtn1: '#44403c',
      mtn2: '#57534e',
      accent: '#eab308',
      badge: 'THÀNH NHÀ MẠC CỔ',
    },
    hoang_van_thu: {
      sky1: '#be123c',
      sky2: '#fecdd3',
      mtn1: '#166534',
      mtn2: '#3f6212',
      accent: '#fde047',
      badge: 'XỨ LẠNG ANH HÙNG',
    },
  };
  const th = themes[section];
  const grad = ctx.createLinearGradient(0, 0, 0, 250);
  grad.addColorStop(0, th.sky1);
  grad.addColorStop(1, th.sky2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 380, 250);

  // Sun/Moon
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath();
  ctx.arc(305, 58, 28, 0, Math.PI * 2);
  ctx.fill();

  // Layered Limestone Mountains of Lang Son
  ctx.fillStyle = th.mtn1;
  ctx.beginPath();
  ctx.moveTo(0, 210);
  ctx.lineTo(75, 95);
  ctx.lineTo(160, 175);
  ctx.lineTo(245, 82);
  ctx.lineTo(340, 165);
  ctx.lineTo(380, 115);
  ctx.lineTo(380, 250);
  ctx.lineTo(0, 250);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = th.mtn2;
  ctx.beginPath();
  ctx.moveTo(0, 225);
  ctx.lineTo(55, 145);
  ctx.lineTo(135, 200);
  ctx.lineTo(220, 130);
  ctx.lineTo(300, 198);
  ctx.lineTo(380, 155);
  ctx.lineTo(380, 250);
  ctx.lineTo(0, 250);
  ctx.closePath();
  ctx.fill();

  // Heritage citadel / gate silhouette
  ctx.fillStyle = '#292524';
  ctx.fillRect(138, 172, 104, 42);
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(142 + i * 22, 162, 12, 12);
  }
  ctx.fillStyle = th.accent;
  ctx.fillRect(184, 135, 4, 28);
  ctx.fillRect(188, 135, 22, 13);

  // Bottom museum plaque overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 208, 380, 42);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(th.badge, 14, 224);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(title.slice(0, 38), 14, 241);

  return c.toDataURL('image/jpeg', 0.78);
}
