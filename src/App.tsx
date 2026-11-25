import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, School, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AdminPanelModal } from './components/AdminPanelModal';
import { GameHUD } from './components/GameHUD';
import { HubModal } from './components/HubModal';
import { LessonModal } from './components/LessonModal';
import { MuseumModal, MuseumTabId } from './components/MuseumModal';
import { ProfileModal } from './components/ProfileModal';
import { SchoolViewport3D, TeleportTarget } from './components/SchoolViewport3D';
import { ShopServiceMode, ShopServicesModal } from './components/ShopServicesModal';
import { SocialChatDrawer } from './components/SocialChatDrawer';
import { TownVenueModal } from './components/TownVenueModal';
import { WebcamScannerModal } from './components/WebcamScannerModal';
import {
  CLASS_8A3_ROSTER,
  createInitialPlayerState,
  findMatching8A3RosterName,
  formatVND,
  getXpForNextLevel,
  OUTFITS,
  PART_TIME_JOBS,
  STARTUPS,
  SUPER_ADMIN_EMAIL,
  SUPPLIES,
  VEHICLES,
} from './data/gameData';
import {
  auth,
  createAssignment,
  createMuseumMemory,
  deleteAssignment,
  deleteMuseumArtwork,
  issueTrafficPenalty,
  loadStudentProfile,
  markPenaltyPaid,
  moderateDeleteChatMessage,
  publishPresence,
  RemoteStudentDoc,
  removeSubAdmin,
  saveStudentProfile,
  sendChatMessage,
  setModerationState,
  setPresenceOffline,
  signInWithGoogle,
  signOutUser,
  softDeleteMuseumMemory,
  subscribeAllModerations,
  subscribeAllSubAdmins,
  subscribeAssignments,
  subscribeChatMessages,
  subscribeMuseumArtworks,
  subscribeMuseumMemories,
  subscribeMyModeration,
  subscribeMyPenalties,
  subscribeMySubAdminRole,
  subscribeOnlinePresence,
  subscribeWeeklyLeaderboard,
  updateAssignmentStatus,
  upsertMuseumArtwork,
  upsertSubAdmin,
} from './firebase';
import { useVoiceChat } from './hooks/useVoiceChat';
import {
  ActiveGrabMission,
  AdminAssignment,
  CharacterLook,
  ChatMessage,
  FoodItemDef,
  GrabDestination,
  HubTab,
  InteractiveZone,
  LeaderboardEntry,
  ModerationState,
  MuseumArtwork,
  MuseumMemory,
  MuseumSectionId,
  OutfitId,
  PlayerPresence,
  PlayerState,
  PlushiePrizeDef,
  RoleType,
  StartupId,
  SubAdminJobType,
  SubAdminRole,
  SubjectRoomId,
  SupplyId,
  UniformId,
  VehicleId,
  VendingDrinkDef,
  VenueModalType,
} from './types/game';
import { getRealSchoolClock, SchoolClockInfo } from './utils/schoolTime';
import { soundEngine } from './utils/sound';
import { getTrafficLightState, TrafficLightStatus } from './utils/trafficLight';

const FACE_STORAGE_PREFIX = 'hvt_8a3_face_';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Lỗi không xác định.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-700/70 rounded-2xl p-6 space-y-4 text-center">
            <h2 className="font-display text-xl font-bold text-rose-400">
              Đã xảy ra sự cố kết nối dữ liệu
            </h2>
            <p className="text-xs text-slate-300 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-sm"
            >
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function applyXpGain(prev: PlayerState, xpAdd: number): { xp: number; level: number; leveledUp: boolean } {
  let xp = prev.xp + xpAdd;
  let level = prev.level;
  let leveledUp = false;
  while (xp >= getXpForNextLevel(level)) {
    xp -= getXpForNextLevel(level);
    level += 1;
    leveledUp = true;
  }
  return { xp, level, leveledUp };
}

function hydrateFromRemoteDoc(
  docData: RemoteStudentDoc,
  faceDataUrl: string | null,
  clock: SchoolClockInfo
): { state: PlayerState; rolloverBonus: number } {
  const isNewDay = docData.lastActiveDateStr !== clock.dateStr;
  const isNewWeek = docData.weekKey !== clock.weekKey;
  const isClassMember = Boolean(findMatching8A3RosterName(docData.studentName) && docData.isClassMember);

  let rolloverBonus = 0;
  if (isNewDay && isClassMember) {
    rolloverBonus = (docData.ownedStartups || []).reduce((sum, stId) => {
      const def = STARTUPS.find((s) => s.id === stId);
      return sum + (def ? def.dailyIncome : 0);
    }, 0);
  }

  return {
    state: {
      look: {
        name: docData.studentName,
        gender: docData.gender || 'male',
        faceDataUrl,
        hairStyle: docData.hairStyle || 'short_boy',
        hasGlasses: Boolean(docData.hasGlasses),
        skinTone: docData.skinTone || '#f4c7a5',
      },
      isClassMember,
      isDelinquent: Boolean(docData.isDelinquent),
      wearingHelmet: docData.wearingHelmet ?? true,
      equippedUniform: docData.equippedUniform || 'white_246',
      ownedUniforms: docData.ownedUniforms?.length ? docData.ownedUniforms : ['white_246', 'green_35'],
      equippedOutfit: docData.equippedOutfit || 'school_uniform',
      ownedOutfits: docData.ownedOutfits?.length ? docData.ownedOutfits : ['school_uniform'],
      equippedVehicle: docData.equippedVehicle || 'walk',
      ownedVehicles: docData.ownedVehicles?.length ? docData.ownedVehicles : ['walk'],
      equippedSupply: docData.equippedSupply || 'basic_books',
      ownedSupplies: docData.ownedSupplies?.length ? docData.ownedSupplies : ['basic_books'],
      ownedStartups: docData.ownedStartups || [],
      money: (docData.money ?? 0) + rolloverBonus,
      energy: isNewDay ? 100 : (docData.energy ?? 100),
      studyBuffLessons: docData.studyBuffLessons ?? 0,
      xp: docData.xp ?? 0,
      level: docData.level ?? 1,
      goodPoints: docData.goodPoints ?? 0,
      lessonsCompleted: docData.lessonsCompleted ?? 0,
      goodDeedsCompleted: docData.goodDeedsCompleted ?? 0,
      grabMissionsCompleted: docData.grabMissionsCompleted ?? 0,
      streakDays: isNewWeek ? 1 : (docData.streakDays ?? 1),
      lastClaimedDateStr: docData.lastClaimedDateStr || '',
      lastActiveDateStr: clock.dateStr,
      vipClaimedThisWeek: isNewWeek ? false : Boolean(docData.vipClaimedThisWeek),
      weeklyScore: isNewWeek ? 0 : (docData.weeklyScore ?? 0),
      weekKey: clock.weekKey,
      completedDeedIdsToday: isNewDay ? [] : (docData.completedDeedIdsToday || []),
      jobsWorkedToday: isNewDay ? 0 : (docData.jobsWorkedToday ?? 0),
    },
    rolloverBonus,
  };
}

function getLocalFace(uid: string): string | null {
  try {
    return localStorage.getItem(`${FACE_STORAGE_PREFIX}${uid}`);
  } catch {
    return null;
  }
}

function setLocalFace(uid: string, dataUrl: string | null) {
  try {
    if (dataUrl) {
      localStorage.setItem(`${FACE_STORAGE_PREFIX}${uid}`, dataUrl);
    } else {
      localStorage.removeItem(`${FACE_STORAGE_PREFIX}${uid}`);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function MainApp() {
  const [schoolClock, setSchoolClock] = useState<SchoolClockInfo>(() => getRealSchoolClock());
  const [trafficLight, setTrafficLight] = useState<TrafficLightStatus>(() => getTrafficLightState());
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  const [playerState, setPlayerState] = useState<PlayerState>(() =>
    createInitialPlayerState('Khách Tham Quan')
  );
  const [showScanner, setShowScanner] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [activeSubjectRoom, setActiveSubjectRoom] = useState<SubjectRoomId | null>(null);
  const [hubTab, setHubTab] = useState<HubTab | null>(null);
  const [activeVenue, setActiveVenue] = useState<VenueModalType | null>(null);
  const [activeGrabMission, setActiveGrabMission] = useState<ActiveGrabMission | null>(null);
  const [nearestZone, setNearestZone] = useState<InteractiveZone | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // Multiplayer, Voice Chat, Social Chat & Admin RBAC State
  const [mySubAdminRole, setMySubAdminRole] = useState<SubAdminRole | null>(null);
  const [myModeration, setMyModeration] = useState<ModerationState | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerPresence[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [subAdmins, setSubAdmins] = useState<SubAdminRole[]>([]);
  const [moderations, setModerations] = useState<Map<string, ModerationState>>(new Map());
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [museumArtworks, setMuseumArtworks] = useState<Map<string, MuseumArtwork>>(new Map());
  const [museumMemories, setMuseumMemories] = useState<MuseumMemory[]>([]);
  const [museumModal, setMuseumModal] = useState<{ open: boolean; tab: MuseumTabId }>({
    open: false,
    tab: 'floor1',
  });
  const [showProfile, setShowProfile] = useState(false);
  const [shopServiceMode, setShopServiceMode] = useState<ShopServiceMode>(null);
  const [isVehicleStowed, setIsVehicleStowed] = useState(false);
  const [effectiveVehicle, setEffectiveVehicle] = useState<VehicleId>('walk');
  const [isWheelie, setIsWheelie] = useState(false);
  const [isReckless, setIsReckless] = useState(false);
  const [nearCrosswalk, setNearCrosswalk] = useState(false);

  const moveInputRef = useRef({ x: 0, y: 0 });
  const wheelieInputRef = useRef(false);
  const recklessInputRef = useRef(false);
  const teleportTargetRef = useRef<TeleportTarget | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const isProfileCreatedRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');
  const posRef = useRef({ x: 0, z: 31, rotY: Math.PI });
  const effectiveVehicleStateRef = useRef<VehicleId>('walk');
  const redLightViolationAtRef = useRef(0);
  const helmetViolationAtRef = useRef(0);
  const processedPenaltyIdsRef = useRef<Set<string>>(new Set());
  const lastSeenChatIdRef = useRef<string | null>(null);

  const isSuperAdmin = Boolean(
    user?.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL && user.emailVerified
  );
  const hasFullAccess = playerState.isClassMember || isSuperAdmin || Boolean(mySubAdminRole);
  const hasFullAccessRef = useRef(hasFullAccess);
  hasFullAccessRef.current = hasFullAccess;

  const roleType: RoleType = isSuperAdmin
    ? 'super_admin'
    : mySubAdminRole
      ? 'sub_admin'
      : playerState.isClassMember
        ? 'student'
        : 'visitor';

  const roleLabel = isSuperAdmin
    ? 'Admin Chính'
    : mySubAdminRole
      ? mySubAdminRole.jobTitle
      : playerState.isClassMember
        ? '8A3'
        : 'Khách';

  const isMicMutedByAdmin = Boolean(myModeration?.micMuted);
  const isChatMutedByAdmin = Boolean(myModeration?.chatMuted);
  const remotePlayers = onlinePlayers.filter((p) => p.uid !== user?.uid);

  const { micEnabled, isSpeaking, micError, toggleMic, stopLocalMic } = useVoiceChat({
    myUid: user?.uid || null,
    remotePlayers,
    isMicMutedByAdmin,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  }, []);

  // Real-time local school clock & synchronized traffic light (every second)
  useEffect(() => {
    const id = window.setInterval(() => {
      setSchoolClock(getRealSchoolClock());
      setTrafficLight(getTrafficLightState());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Firebase Auth listener & profile hydration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthChecked(true);
      if (!nextUser) {
        setProfileReady(false);
        isProfileCreatedRef.current = false;
        lastSavedSnapshotRef.current = '';
        setLeaderboardEntries([]);
        setMySubAdminRole(null);
        setMyModeration(null);
        setOnlinePlayers([]);
        setChatMessages([]);
        setSubAdmins([]);
        setModerations(new Map());
        setAssignments([]);
        setMuseumArtworks(new Map());
        setMuseumMemories([]);
        setMuseumModal({ open: false, tab: 'floor1' });
        return;
      }

      setProfileLoading(true);
      try {
        const remote = await loadStudentProfile(nextUser.uid);
        const face = getLocalFace(nextUser.uid);
        const clock = getRealSchoolClock();
        if (!remote) {
          isProfileCreatedRef.current = false;
          const initial = createInitialPlayerState(nextUser.displayName || 'Khách Tham Quan');
          initial.look.faceDataUrl = face;
          setPlayerState(initial);
          setIsInitialSetup(true);
          setShowScanner(true);
          setProfileReady(false);
        } else {
          isProfileCreatedRef.current = true;
          const { state, rolloverBonus } = hydrateFromRemoteDoc(remote, face, clock);
          setPlayerState(state);
          lastSavedSnapshotRef.current = '';
          setProfileReady(true);
          setIsInitialSetup(false);
          setShowScanner(false);
          if (rolloverBonus > 0) {
            soundEngine.playCoin();
            showToast(`Chào ngày mới! Doanh thu Startup mang về +${formatVND(rolloverBonus)}!`);
          }
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Lỗi tải hồ sơ học sinh.');
      } finally {
        setProfileLoading(false);
      }
    });
    return () => unsub();
  }, [showToast]);

  // Real-time Firestore Weekly Leaderboard subscription
  useEffect(() => {
    if (!user) return;
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    const unsub = subscribeWeeklyLeaderboard(
      user.uid,
      schoolClock.weekKey,
      (entries) => {
        setLeaderboardEntries(entries);
        setLeaderboardLoading(false);
      },
      (err) => {
        setLeaderboardError(err.message);
        setLeaderboardLoading(false);
      }
    );
    return () => unsub();
  }, [user, schoolClock.weekKey]);

  // Real-time RBAC, Moderation, Presence, Social Chat, Penalties & Assignments subscriptions
  useEffect(() => {
    if (!user) return;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribeMySubAdminRole(
        user.uid,
        (role) => setMySubAdminRole(role),
        (err) => console.error('SubAdmin role error:', err)
      )
    );

    unsubs.push(
      subscribeMyModeration(
        user.uid,
        (mod) => setMyModeration(mod),
        (err) => console.error('Moderation error:', err)
      )
    );

    unsubs.push(
      subscribeOnlinePresence(
        user.uid,
        (players) => setOnlinePlayers(players),
        (err) => console.error('Presence error:', err)
      )
    );

    unsubs.push(
      subscribeChatMessages(
        (msgs) => {
          setChatMessages(msgs);
          const newest = msgs[msgs.length - 1];
          if (newest && newest.id !== lastSeenChatIdRef.current) {
            if (lastSeenChatIdRef.current !== null && newest.senderUid !== user.uid) {
              setUnreadChatCount((c) => c + 1);
            }
            lastSeenChatIdRef.current = newest.id;
          }
        },
        (err) => console.error('Chat error:', err)
      )
    );

    unsubs.push(
      subscribeMyPenalties(
        user.uid,
        (penalties) => {
          penalties.forEach((pen) => {
            if (pen.status === 'unpaid' && !processedPenaltyIdsRef.current.has(pen.id)) {
              processedPenaltyIdsRef.current.add(pen.id);
              setPlayerState((prev) => ({
                ...prev,
                money: Math.max(0, prev.money - pen.amount),
              }));
              markPenaltyPaid(pen.id).catch(() => {});
              soundEngine.playError();
              showToast(
                `Biên bản phạt (${pen.issuedByName}): ${pen.reason} (-${formatVND(pen.amount)})`
              );
            }
          });
        },
        (err) => console.error('Penalty error:', err)
      )
    );

    unsubs.push(
      subscribeAssignments(
        user.uid,
        isSuperAdmin,
        (list) => setAssignments(list),
        (err) => console.error('Assignments error:', err)
      )
    );

    if (isSuperAdmin) {
      unsubs.push(
        subscribeAllSubAdmins(
          (list) => setSubAdmins(list),
          (err) => console.error('All subAdmins error:', err)
        )
      );
      unsubs.push(
        subscribeAllModerations(
          (map) => setModerations(map),
          (err) => console.error('All moderations error:', err)
        )
      );
    }

    unsubs.push(
      subscribeMuseumArtworks(
        (map) => setMuseumArtworks(map),
        (err) => console.error('Museum artworks error:', err)
      )
    );

    unsubs.push(
      subscribeMuseumMemories(
        (list) => setMuseumMemories(list),
        (err) => console.error('Museum memories error:', err)
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [user, isSuperAdmin, showToast]);

  // Reset unread chat count when drawer is opened
  useEffect(() => {
    if (chatOpen) setUnreadChatCount(0);
  }, [chatOpen, chatMessages.length]);

  // Helper to publish live multiplayer presence
  const syncMyPresence = useCallback(
    (online = true) => {
      if (!user || !profileReady) return;
      const publishedVehicle =
        effectiveVehicleStateRef.current || playerState.equippedVehicle;
      publishPresence(user.uid, {
        studentName: playerState.look.name,
        isClassMember: playerState.isClassMember,
        roleType,
        roleLabel,
        gender: playerState.look.gender || 'male',
        hairStyle: playerState.look.hairStyle,
        hasGlasses: playerState.look.hasGlasses,
        skinTone: playerState.look.skinTone,
        equippedUniform: playerState.equippedUniform,
        equippedOutfit: playerState.equippedOutfit,
        equippedVehicle: publishedVehicle,
        vipClaimed: playerState.vipClaimedThisWeek,
        isDelinquent: playerState.isDelinquent,
        wearingHelmet: playerState.wearingHelmet,
        isWheelie,
        isReckless,
        x: posRef.current.x,
        z: posRef.current.z,
        rotY: posRef.current.rotY,
        micActive: micEnabled && !isMicMutedByAdmin,
        micMuted: isMicMutedByAdmin,
        redLightViolationAt: redLightViolationAtRef.current,
        helmetViolationAt: helmetViolationAtRef.current,
        online,
      }).catch(() => {});
    },
    [
      user,
      profileReady,
      playerState.look.name,
      playerState.look.gender,
      playerState.look.hairStyle,
      playerState.look.hasGlasses,
      playerState.look.skinTone,
      playerState.isClassMember,
      playerState.equippedUniform,
      playerState.equippedOutfit,
      playerState.equippedVehicle,
      playerState.vipClaimedThisWeek,
      playerState.isDelinquent,
      playerState.wearingHelmet,
      isWheelie,
      isReckless,
      roleType,
      roleLabel,
      micEnabled,
      isMicMutedByAdmin,
    ]
  );

  // Sync presence when profile/appearance/mic/role changes + 10s heartbeat + unload cleanup
  useEffect(() => {
    if (!user || !profileReady) return;
    syncMyPresence(true);
    const hb = window.setInterval(() => syncMyPresence(true), 10000);
    const onUnload = () => {
      setPresenceOffline(user.uid);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.clearInterval(hb);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [user, profileReady, syncMyPresence]);

  const handlePositionUpdate = useCallback(
    (x: number, z: number, rotY: number, effVehicle: VehicleId) => {
      posRef.current = { x, z, rotY };
      effectiveVehicleStateRef.current = effVehicle;
      setNearCrosswalk(z >= 29 && z <= 46 && Math.abs(x) <= 24);
      syncMyPresence(true);
    },
    [syncMyPresence]
  );

  const handleRedLightViolation = useCallback(() => {
    redLightViolationAtRef.current = Date.now();
    syncMyPresence(true);
    soundEngine.playError();
    showToast('Cảnh báo: Bạn vừa vượt ĐÈN ĐỎ trước cổng trường!');
  }, [syncMyPresence, showToast]);

  const handleHelmetViolation = useCallback(() => {
    helmetViolationAtRef.current = Date.now();
    syncMyPresence(true);
    soundEngine.playError();
    showToast('Cảnh báo: Đi xe máy / xe điện ngoài đường cần ĐỘI MŨ BẢO HIỂM (bật trong Cài đặt hoặc Hồ sơ)!');
  }, [syncMyPresence, showToast]);

  const handleStowStateChange = useCallback(
    (stowed: boolean, effVehicle: VehicleId) => {
      setIsVehicleStowed(stowed);
      setEffectiveVehicle(effVehicle);
      effectiveVehicleStateRef.current = effVehicle;
      if (stowed) {
        showToast('Hệ thống đã tự động cất phương tiện khi vào khu vực Trường học / Bảo tàng.');
      }
    },
    [showToast]
  );

  const handleStuntStateChange = useCallback((wheelie: boolean, reckless: boolean) => {
    setIsWheelie(wheelie);
    setIsReckless(reckless);
  }, []);

  // Persist playerState changes to Firestore once profile is ready
  useEffect(() => {
    if (!user || !profileReady) return;
    const { faceDataUrl: _ignored, ...syncableLook } = playerState.look;
    const snapshot = JSON.stringify({
      ...playerState,
      look: syncableLook,
      weekKey: schoolClock.weekKey,
    });
    if (snapshot === lastSavedSnapshotRef.current) return;

    const timer = window.setTimeout(async () => {
      try {
        const isCreate = !isProfileCreatedRef.current;
        await saveStudentProfile(user.uid, playerState, schoolClock.weekKey, isCreate);
        isProfileCreatedRef.current = true;
        lastSavedSnapshotRef.current = snapshot;
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [user, profileReady, playerState, schoolClock.weekKey]);

  const requireActivityAccess = useCallback((): boolean => {
    if (hasFullAccess) return true;
    showToast(
      'Chế độ Khách Tham Quan: Chỉ thành viên lớp 8A3 hoặc Quản lý được chỉ định mới được làm nhiệm vụ!'
    );
    return false;
  }, [hasFullAccess, showToast]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (user) {
      await setPresenceOffline(user.uid);
    }
    stopLocalMic();
    setHubTab(null);
    setActiveVenue(null);
    setActiveSubjectRoom(null);
    setShowScanner(false);
    setActiveGrabMission(null);
    setChatOpen(false);
    setAdminOpen(false);
    setShowProfile(false);
    setShopServiceMode(null);
    setMuseumModal({ open: false, tab: 'floor1' });
    await signOutUser();
  };

  const handleSaveLook = (look: CharacterLook, isDelinquent: boolean) => {
    if (!user) return;
    setLocalFace(user.uid, look.faceDataUrl);

    const matchedName = findMatching8A3RosterName(look.name);
    const isMember = Boolean(matchedName);
    const clock = getRealSchoolClock();

    setPlayerState((prev) => {
      const hasStaffAccess = isMember || isSuperAdmin || Boolean(mySubAdminRole);
      const upgradedMoney =
        hasStaffAccess && prev.money === 0 && prev.lessonsCompleted === 0
          ? 15000
          : prev.money;
      return {
        ...prev,
        look: {
          ...look,
          name: matchedName || look.name,
        },
        isClassMember: isMember,
        isDelinquent,
        money: hasStaffAccess ? upgradedMoney : 0,
        lastActiveDateStr: clock.dateStr,
        weekKey: clock.weekKey,
      };
    });

    if (!isMember && !isSuperAdmin && !mySubAdminRole) {
      setActiveGrabMission(null);
    }

    setShowScanner(false);
    setIsInitialSetup(false);
    setProfileReady(true);

    if (isSuperAdmin) {
      showToast(`Chào Admin Chính ${look.name} đã vào trường Hoàng Văn Thụ!`);
    } else if (mySubAdminRole) {
      showToast(`Chào ${mySubAdminRole.jobTitle} ${look.name} đã vào ca trực!`);
    } else if (isMember) {
      showToast(
        `Chào mừng ${isDelinquent ? 'Học sinh Hư Đầu Gấu ' : 'thành viên 8A3 '}${matchedName}!`
      );
    } else {
      showToast(
        `${look.name} đang ở Chế độ Khách Tham Quan (chỉ đi dạo tham quan trường).`
      );
    }
  };

  const handleInteractZone = useCallback(
    (zone: InteractiveZone) => {
      if (zone.id === 'stage') {
        setHubTab('leaderboard');
        return;
      }

      if (zone.id === 'museum_floor1') {
        setMuseumModal({ open: true, tab: 'floor1' });
        return;
      }

      if (zone.id === 'museum_floor2_play') {
        setMuseumModal({ open: true, tab: 'floor2_play' });
        return;
      }

      if (zone.id === 'museum_floor2_wall') {
        setMuseumModal({ open: true, tab: 'floor2_wall' });
        return;
      }

      if (zone.id === 'clothing_shop') {
        setShopServiceMode('clothing_shop');
        return;
      }

      if (zone.id === 'vending_machine') {
        setShopServiceMode('vending_machine');
        return;
      }

      if (zone.id === 'museum_stairs') {
        const goingDown = zone.label.includes('Xuống Tầng 1');
        teleportTargetRef.current = goingDown
          ? { x: 64.0, z: 3.0, y: 0 }
          : { x: 64.0, z: -13.5, y: 5.2 };
        showToast(
          goingDown
            ? 'Đã xuống Tầng 1 · Khu Di Tích & Tranh Lạng Sơn!'
            : 'Đã lên Tầng 2 · Khu Vui Chơi & Bức Tường Kỷ Niệm!'
        );
        return;
      }

      if (!requireActivityAccess()) return;

      if (zone.id === 'grab_pickup' && activeGrabMission && activeGrabMission.stage === 'pickup') {
        setActiveGrabMission({ ...activeGrabMission, stage: 'dropoff' });
        soundEngine.playCoin();
        showToast(
          `Đã lấy ${
            activeGrabMission.missionKind === 'food' ? 'đồ ăn' : 'hàng / đón khách'
          } tại ${activeGrabMission.pickupLabel}! Hãy di chuyển tới cột sáng xanh lá tại ${
            activeGrabMission.targetLabel
          }.`
        );
        return;
      }

      if (zone.id === 'grab_dropoff' && activeGrabMission && activeGrabMission.stage === 'dropoff') {
        const mission = activeGrabMission;
        setActiveGrabMission(null);
        setPlayerState((prev) => {
          if (!hasFullAccessRef.current) return prev;
          const prog = applyXpGain(prev, mission.rewardXp);
          if (prog.leveledUp) soundEngine.playLevelUp();
          else soundEngine.playGoodDeed();
          showToast(
            `Hoàn thành ${mission.title}! +${formatVND(mission.rewardMoney)} & +${mission.rewardXp} XP`
          );
          return {
            ...prev,
            money: prev.money + mission.rewardMoney,
            energy: Math.max(0, prev.energy - 10),
            xp: prog.xp,
            level: prog.level,
            grabMissionsCompleted: prev.grabMissionsCompleted + 1,
            weeklyScore: prev.weeklyScore + mission.rewardXp + 20,
          };
        });
        return;
      }

      if (zone.id === 'math_room') {
        setActiveSubjectRoom('math');
      } else if (zone.id === 'literature_room') {
        setActiveSubjectRoom('literature');
      } else if (zone.id === 'art_room') {
        setActiveSubjectRoom('art');
      } else if (zone.id === 'music_room') {
        setActiveSubjectRoom('music');
      } else if (zone.id === 'english_room') {
        setActiveSubjectRoom('english');
      } else if (zone.id === 'gate') {
        setHubTab('uniform');
      } else if (zone.id === 'startup_booth') {
        setHubTab('career');
      } else if (zone.id === 'bookstore' || zone.id === 'vehicle_shop') {
        setHubTab('shop');
      } else if (zone.id === 'jollibee') {
        setActiveVenue('jollibee');
      } else if (zone.id === 'net_cafe') {
        setActiveVenue('net_cafe');
      } else if (zone.id === 'park') {
        setActiveVenue('park');
      } else if (zone.id === 'grab_hub') {
        setActiveVenue('grab');
      } else if (zone.id === 'good_deed' && zone.deedSpot) {
        const spot = zone.deedSpot;
        setPlayerState((prev) => {
          if (!hasFullAccessRef.current || prev.completedDeedIdsToday.includes(spot.id)) return prev;
          const prog = applyXpGain(prev, spot.xpReward);
          if (prog.leveledUp) soundEngine.playLevelUp();
          else soundEngine.playGoodDeed();

          showToast(
            `${spot.title}: +${formatVND(spot.moneyReward)}, +${spot.goodPoints} Điểm Người Tốt!`
          );
          return {
            ...prev,
            money: prev.money + spot.moneyReward,
            goodPoints: prev.goodPoints + spot.goodPoints,
            goodDeedsCompleted: prev.goodDeedsCompleted + 1,
            weeklyScore: prev.weeklyScore + spot.goodPoints + spot.xpReward,
            xp: prog.xp,
            level: prog.level,
            completedDeedIdsToday: [...prev.completedDeedIdsToday, spot.id],
          };
        });
      }
    },
    [activeGrabMission, requireActivityAccess, showToast]
  );

  const handleCompleteLesson = (
    _roomId: SubjectRoomId,
    moneyEarned: number,
    xpEarned: number,
    weeklyScoreGain: number,
    performanceNote: string
  ) => {
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      const prog = applyXpGain(prev, xpEarned);
      if (prog.leveledUp) {
        soundEngine.playLevelUp();
        showToast(`Chúc mừng lên Level ${prog.level}!`);
      } else {
        showToast(`${performanceNote} (+${formatVND(moneyEarned)})`);
      }
      return {
        ...prev,
        money: prev.money + moneyEarned,
        energy: Math.max(0, prev.energy - 8),
        studyBuffLessons: Math.max(0, prev.studyBuffLessons - 1),
        xp: prog.xp,
        level: prog.level,
        lessonsCompleted: prev.lessonsCompleted + 1,
        weeklyScore: prev.weeklyScore + weeklyScoreGain,
      };
    });
  };

  const handleSelectUniform = (id: UniformId) => {
    if (!requireActivityAccess()) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current || !prev.ownedUniforms.includes(id)) return prev;
      return { ...prev, equippedUniform: id, equippedOutfit: 'school_uniform' };
    });
    showToast('Đã thay đồng phục học sinh 8A3!');
  };

  const handleBuyOrEquipOutfit = (id: OutfitId) => {
    if (!requireActivityAccess()) return;
    const def = OUTFITS.find((o) => o.id === id);
    if (!def) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      if (prev.ownedOutfits.includes(id)) {
        showToast(`Đã mặc: ${def.name}`);
        return { ...prev, equippedOutfit: id };
      }
      if (prev.money < def.price) return prev;
      soundEngine.playGoodDeed();
      showToast(`Mua thành công ${def.name}!`);
      return {
        ...prev,
        money: prev.money - def.price,
        ownedOutfits: [...prev.ownedOutfits, id],
        equippedOutfit: id,
      };
    });
  };

  const handleBuyVendingDrink = (drink: VendingDrinkDef) => {
    if (!requireActivityAccess()) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current || prev.money < drink.price) return prev;
      const prog = applyXpGain(prev, drink.xpReward);
      soundEngine.playGoodDeed();
      showToast(`Uống ${drink.name}: +${drink.energyRestore}% Năng lượng & +${drink.xpReward} XP!`);
      return {
        ...prev,
        money: prev.money - drink.price,
        energy: Math.min(100, prev.energy + drink.energyRestore),
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + drink.xpReward,
      };
    });
  };

  const handleToggleHelmet = () => {
    setPlayerState((prev) => {
      const next = !prev.wearingHelmet;
      if (next) {
        helmetViolationAtRef.current = 0;
      }
      showToast(next ? 'Đã đội Mũ bảo hiểm an toàn!' : 'Đã tháo Mũ bảo hiểm.');
      return { ...prev, wearingHelmet: next };
    });
  };

  const handleBuyOrEquipVehicle = (id: VehicleId) => {
    if (!requireActivityAccess()) return;
    const def = VEHICLES.find((v) => v.id === id);
    if (!def) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      if (prev.ownedVehicles.includes(id)) {
        showToast(`Đang sử dụng: ${def.name}`);
        return { ...prev, equippedVehicle: id };
      }
      if (prev.level < def.unlockLevel || prev.money < def.price) return prev;
      soundEngine.playGoodDeed();
      showToast(`Mua thành công ${def.name}! Hãy ra sân trường trải nghiệm.`);
      return {
        ...prev,
        money: prev.money - def.price,
        ownedVehicles: [...prev.ownedVehicles, id],
        equippedVehicle: id,
      };
    });
  };

  const handleBuyOrEquipSupply = (id: SupplyId) => {
    if (!requireActivityAccess()) return;
    const def = SUPPLIES.find((s) => s.id === id);
    if (!def) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      if (prev.ownedSupplies.includes(id)) {
        showToast(`Đã trang bị: ${def.name}`);
        return { ...prev, equippedSupply: id };
      }
      if (prev.money < def.price) return prev;
      soundEngine.playCoin();
      showToast(`Nâng cấp ${def.name} (×${def.bonusMultiplier} thưởng tiết học)!`);
      return {
        ...prev,
        money: prev.money - def.price,
        ownedSupplies: [...prev.ownedSupplies, id],
        equippedSupply: id,
      };
    });
  };

  const handleDoPartTimeJob = (jobId: string) => {
    if (!requireActivityAccess()) return;
    const job = PART_TIME_JOBS.find((j) => j.id === jobId);
    if (!job) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current || prev.jobsWorkedToday >= 3 || prev.level < job.minLevel) return prev;
      const prog = applyXpGain(prev, job.xp);
      if (prog.leveledUp) soundEngine.playLevelUp();
      else soundEngine.playCoin();
      showToast(`Hoàn thành "${job.title}": +${formatVND(job.pay)} & +${job.xp} XP`);
      return {
        ...prev,
        money: prev.money + job.pay,
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + job.xp,
        jobsWorkedToday: prev.jobsWorkedToday + 1,
      };
    });
  };

  const handleBuyStartup = (id: StartupId) => {
    if (!requireActivityAccess()) return;
    const st = STARTUPS.find((s) => s.id === id);
    if (!st) return;
    setPlayerState((prev) => {
      if (
        !hasFullAccessRef.current ||
        prev.ownedStartups.includes(id) ||
        prev.money < st.cost ||
        prev.level < st.unlockLevel
      ) {
        return prev;
      }
      soundEngine.playLevelUp();
      showToast(`Khởi nghiệp thành công: ${st.name}! (+${formatVND(st.dailyIncome)}/ngày)`);
      return {
        ...prev,
        money: prev.money - st.cost,
        ownedStartups: [...prev.ownedStartups, id],
        weeklyScore: prev.weeklyScore + 120,
      };
    });
  };

  const handleClaimDailyStreak = () => {
    if (!requireActivityAccess()) return;
    const todayStr = schoolClock.dateStr;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      if (prev.streakDays >= 7 && !prev.vipClaimedThisWeek) {
        const prog = applyXpGain(prev, 500);
        soundEngine.playLevelUp();
        showToast('Mở Rương Quà VIP Tuần: +200.000đ, +500 XP & Áo Khoác Hoàng Gia 8A3!');
        const nextUniforms: UniformId[] = prev.ownedUniforms.includes('vip_8a3')
          ? prev.ownedUniforms
          : [...prev.ownedUniforms, 'vip_8a3'];
        return {
          ...prev,
          money: prev.money + 200000,
          xp: prog.xp,
          level: prog.level,
          weeklyScore: prev.weeklyScore + 350,
          vipClaimedThisWeek: true,
          lastClaimedDateStr: todayStr,
          ownedUniforms: nextUniforms,
          equippedUniform: 'vip_8a3',
        };
      }

      if (prev.lastClaimedDateStr === todayStr) return prev;
      const bonus = prev.streakDays * 5000;
      const prog = applyXpGain(prev, 40);
      soundEngine.playGoodDeed();
      showToast(`Điểm danh Ngày ${prev.streakDays}/7 thành công: +${formatVND(bonus)}!`);
      return {
        ...prev,
        money: prev.money + bonus,
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + 45,
        lastClaimedDateStr: todayStr,
        streakDays: Math.min(7, prev.streakDays + 1),
      };
    });
  };

  const handleBuyFood = (item: FoodItemDef) => {
    if (!requireActivityAccess()) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current || prev.money < item.price) return prev;
      const prog = applyXpGain(prev, item.xpReward);
      soundEngine.playGoodDeed();
      showToast(`Thưởng thức ${item.name}! Năng lượng hồi +${item.energyRestore}%`);
      return {
        ...prev,
        money: prev.money - item.price,
        energy: Math.min(100, prev.energy + item.energyRestore),
        studyBuffLessons: prev.studyBuffLessons + item.buffLessons,
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + item.xpReward,
      };
    });
  };

  const handleWorkJollibee = () => {
    if (!requireActivityAccess()) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current || prev.energy < 20) return prev;
      const prog = applyXpGain(prev, 25);
      soundEngine.playCoin();
      showToast('Hoàn thành ca phục vụ Jollibee: +16.000đ & +25 XP!');
      return {
        ...prev,
        money: prev.money + 16000,
        energy: Math.max(0, prev.energy - 15),
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + 25,
      };
    });
  };

  const handleWinNetGame = useCallback((prizeMoney: number, xpGain: number, fee: number) => {
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      const prog = applyXpGain(prev, xpGain);
      if (prog.leveledUp) soundEngine.playLevelUp();
      return {
        ...prev,
        money: Math.max(0, prev.money - fee + prizeMoney),
        energy: Math.max(0, prev.energy - 15),
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + xpGain,
      };
    });
  }, []);

  const handleParkPlay = (energyGain: number, xpGain: number, label: string) => {
    if (!requireActivityAccess()) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current) return prev;
      const prog = applyXpGain(prev, xpGain);
      soundEngine.playGoodDeed();
      showToast(`${label}: +${energyGain}% Năng lượng & +${xpGain} XP!`);
      return {
        ...prev,
        energy: Math.min(100, prev.energy + energyGain),
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + xpGain,
      };
    });
  };

  const handleTakeGrabRide = (dest: GrabDestination) => {
    if (!requireActivityAccess()) return;
    setPlayerState((prev) => {
      if (!hasFullAccessRef.current || prev.money < dest.rideFee) return prev;
      soundEngine.playCoin();
      return {
        ...prev,
        money: prev.money - dest.rideFee,
      };
    });
    teleportTargetRef.current = { x: dest.x, z: dest.z };
    setActiveVenue(null);
    showToast(`Grab đã đưa bạn tới ${dest.label}!`);
  };

  const handleAcceptGrabMission = (mission: ActiveGrabMission) => {
    if (!requireActivityAccess()) return;
    setActiveGrabMission(mission);
    setActiveVenue(null);
    soundEngine.playCoin();
    showToast(
      `Đã nhận ${mission.title}! Bước 1: Đi theo cột sáng VÀNG tới ${mission.pickupLabel}.`
    );
  };

  const handleToggleSound = () => {
    soundEngine.enabled = !soundEnabled;
    setSoundEnabled((v) => !v);
  };

  const handleQuickTravel = (x: number, z: number, y?: number) => {
    teleportTargetRef.current = { x, z, y };
  };

  const handleSaveMuseumArtwork = async (input: {
    slotId: string;
    section: MuseumSectionId;
    title: string;
    caption: string;
    imageDataUrl: string;
  }) => {
    if (!user || !isSuperAdmin) return;
    await upsertMuseumArtwork(user.uid, input);
    soundEngine.playGoodDeed();
    showToast(`Đã treo tranh "${input.title}" lên Tầng 1 Bảo Tàng!`);
  };

  const handleDeleteMuseumArtwork = async (slotId: string) => {
    if (!isSuperAdmin) return;
    await deleteMuseumArtwork(slotId);
    showToast('Đã gỡ tranh khỏi khung trưng bày.');
  };

  const handleCreateMuseumMemory = async (input: {
    message: string;
    photoDataUrl: string;
    signatureDataUrl: string;
    cardColor: string;
  }) => {
    if (!user) return;
    await createMuseumMemory(user.uid, playerState.look.name, roleLabel, input);
    soundEngine.playGoodDeed();
    showToast('Đã treo ảnh & chữ ký của bạn lên Bức Tường Kỷ Niệm Tầng 2!');
  };

  const handleDeleteMuseumMemory = async (memoryId: string) => {
    await softDeleteMuseumMemory(memoryId);
    showToast('Đã gỡ bảng kỷ niệm khỏi tường.');
  };

  const handleMuseumQuizReward = (money: number, xp: number, note: string) => {
    if (!hasFullAccessRef.current) {
      showToast(note);
      return;
    }
    setPlayerState((prev) => {
      const prog = applyXpGain(prev, xp);
      if (prog.leveledUp) soundEngine.playLevelUp();
      else soundEngine.playGoodDeed();
      return {
        ...prev,
        money: prev.money + money,
        xp: prog.xp,
        level: prog.level,
        weeklyScore: prev.weeklyScore + xp,
      };
    });
    showToast(`${note} (+${formatVND(money)} & +${xp} XP)`);
  };

  const handleClawMachineReward = (prize: PlushiePrizeDef | null, cost: number) => {
    if (!hasFullAccessRef.current) {
      showToast(
        prize
          ? `Gắp trúng ${prize.name}! (Khách tham quan chơi giải trí miễn phí)`
          : 'Hụt mất rồi! Khách tham quan có thể thử lại miễn phí.'
      );
      return;
    }
    setPlayerState((prev) => {
      if (prev.money < cost) return prev;
      if (prize) {
        const prog = applyXpGain(prev, prize.rewardXp);
        if (prog.leveledUp) soundEngine.playLevelUp();
        else soundEngine.playGoodDeed();
        showToast(
          `Gắp trúng ${prize.name}! +${formatVND(prize.rewardMoney)} & +${prize.rewardXp} XP`
        );
        return {
          ...prev,
          money: prev.money - cost + prize.rewardMoney,
          xp: prog.xp,
          level: prog.level,
          weeklyScore: prev.weeklyScore + prize.rewardXp,
        };
      } else {
        const prog = applyXpGain(prev, 5);
        return {
          ...prev,
          money: prev.money - cost,
          xp: prog.xp,
          level: prog.level,
        };
      }
    });
  };

  const handleTeleportMuseumFloor = (floor: 1 | 2) => {
    if (floor === 1) {
      handleQuickTravel(53.5, 4.0, 0);
      showToast('Đã dịch chuyển tới Bảo Tàng Tầng 1 (Khu Di Tích & Tranh).');
    } else {
      handleQuickTravel(53.5, -13.5, 5.2);
      showToast('Đã dịch chuyển lên Bảo Tàng Tầng 2 (Khu Vui Chơi & Kỷ Niệm).');
    }
  };

  const handleCopyUid = (uid: string) => {
    navigator.clipboard?.writeText(uid).catch(() => {});
    showToast(`Đã sao chép UID: ${uid}`);
  };

  const handleSendChat = async (text: string) => {
    if (!user) return;
    await sendChatMessage(user.uid, playerState.look.name, roleLabel, text);
  };

  const handleDeleteChat = async (msgId: string) => {
    await moderateDeleteChatMessage(msgId);
    showToast('Đã xóa tin nhắn khỏi Chat Xã Hội.');
  };

  const handleSetModeration = async (
    targetUid: string,
    micMuted: boolean,
    chatMuted: boolean,
    reason: string
  ) => {
    if (!user) return;
    await setModerationState(targetUid, {
      micMuted,
      chatMuted,
      reason,
      mutedByUid: user.uid,
      mutedByName: playerState.look.name,
    });
    showToast(
      micMuted || chatMuted
        ? `Đã cập nhật hạn chế cho UID ${targetUid.slice(0, 8)}...`
        : `Đã mở lại quyền Mic & Chat cho UID ${targetUid.slice(0, 8)}...`
    );
  };

  const handleMuteFromChat = async (
    targetUid: string,
    targetName: string,
    mode: 'mic' | 'chat'
  ) => {
    const existing = moderations.get(targetUid);
    const nextMic = mode === 'mic' ? !(existing?.micMuted ?? false) : Boolean(existing?.micMuted);
    const nextChat = mode === 'chat' ? !(existing?.chatMuted ?? false) : Boolean(existing?.chatMuted);
    await handleSetModeration(
      targetUid,
      nextMic,
      nextChat,
      `Quản lý nhắc nhở trật tự (${targetName})`
    );
  };

  const handleUpsertSubAdmin = async (
    input: {
      uid: string;
      email: string;
      displayName: string;
      jobType: SubAdminJobType;
      jobTitle: string;
      canMuteMic: boolean;
      canModerateChat: boolean;
      canIssueFine: boolean;
    },
    isCreate: boolean
  ) => {
    if (!user) return;
    await upsertSubAdmin(user.uid, input, isCreate);
    showToast(`Đã lưu Quản lý phụ ${input.displayName} (${input.jobTitle}).`);
  };

  const handleRemoveSubAdmin = async (targetUid: string) => {
    await removeSubAdmin(targetUid);
    showToast('Đã thu hồi quyền Quản lý phụ.');
  };

  const handleIssuePenalty = async (
    targetUid: string,
    targetName: string,
    reason: string,
    amount: number
  ) => {
    if (!user) return;
    await issueTrafficPenalty(user.uid, playerState.look.name, targetUid, targetName, reason, amount);
    showToast(`Đã lập biên bản phạt ${targetName} (-${formatVND(amount)})!`);
  };

  const handleCreateAssignment = async (input: {
    assigneeUid: string;
    assigneeName: string;
    title: string;
    description: string;
    jobCategory: AdminAssignment['jobCategory'];
    rewardMoney: number;
  }) => {
    if (!user) return;
    await createAssignment(user.uid, input);
    showToast(`Đã giao nhiệm vụ "${input.title}" cho ${input.assigneeName}.`);
  };

  const handleUpdateAssignmentStatus = async (
    assignmentId: string,
    status: AdminAssignment['status'],
    rewardMoney: number
  ) => {
    await updateAssignmentStatus(assignmentId, status);
    if (status === 'completed' && rewardMoney > 0) {
      setPlayerState((prev) => {
        const prog = applyXpGain(prev, 35);
        return {
          ...prev,
          money: prev.money + rewardMoney,
          xp: prog.xp,
          level: prog.level,
          weeklyScore: prev.weeklyScore + 35,
        };
      });
      soundEngine.playGoodDeed();
      showToast(`Hoàn thành nhiệm vụ được giao! Nhận +${formatVND(rewardMoney)} & +35 XP.`);
    } else {
      showToast('Đã cập nhật trạng thái công việc!');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    await deleteAssignment(assignmentId);
    showToast('Đã xóa công việc.');
  };

  const canModerateChat = isSuperAdmin || Boolean(mySubAdminRole?.canModerateChat);
  const canMuteMic = isSuperAdmin || Boolean(mySubAdminRole?.canMuteMic);
  const canOpenAdminPanel =
    isSuperAdmin || Boolean(mySubAdminRole) || assignments.length > 0;
  const pendingTasksCount = assignments.filter(
    (a) => a.assigneeUid === user?.uid && a.status !== 'completed'
  ).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <SchoolViewport3D
        playerState={playerState}
        dayOfWeek={schoolClock.dayOfWeek}
        periodOfDay={schoolClock.periodOfDay}
        activeGrabMission={activeGrabMission}
        remotePlayers={remotePlayers}
        museumArtworks={museumArtworks}
        museumMemories={museumMemories}
        moveInputRef={moveInputRef}
        wheelieInputRef={wheelieInputRef}
        recklessInputRef={recklessInputRef}
        teleportTargetRef={teleportTargetRef}
        onNearestZoneChange={setNearestZone}
        onInteractZone={handleInteractZone}
        onPositionUpdate={handlePositionUpdate}
        onRedLightViolation={handleRedLightViolation}
        onHelmetViolation={handleHelmetViolation}
        onStowStateChange={handleStowStateChange}
        onStuntStateChange={handleStuntStateChange}
      />

      {/* Google Sign-In Gate Overlay */}
      {!authChecked || profileLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl px-8 py-6 text-center space-y-2 shadow-2xl">
            <School className="w-9 h-9 text-lime-400 mx-auto" />
            <p className="font-display font-bold text-white text-base">
              Đang kết nối cổng trường THCS Hoàng Văn Thụ 8A3...
            </p>
          </div>
        </div>
      ) : !user ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-lime-500/20 border border-lime-400/50 flex items-center justify-center text-lime-400 shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-lime-400">
                  Trường THCS Hoàng Văn Thụ · Lạng Sơn
                </p>
                <h1 className="font-display text-xl font-bold text-white">
                  Lớp 8A3 Không Gian 3D
                </h1>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Đăng nhập bằng tài khoản <strong>Google</strong> để lưu nhân vật 3D, tiền thưởng, phương tiện và đồng bộ <strong>Bảng Xếp Hạng Tuần lớp 8A3</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Chỉ tài khoản đặt đúng <strong>Họ & Tên trong danh sách {CLASS_8A3_ROSTER.length} học sinh lớp 8A3</strong> mới được học, làm nhiệm vụ và lên BXH. Tên khác sẽ vào chế độ <strong>Khách Tham Quan</strong>.
                </span>
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-300 bg-rose-950/50 border border-rose-700/70 rounded-lg px-3 py-2">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full py-3 px-5 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-60 text-slate-950 font-display font-bold text-base inline-flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>{authLoading ? 'Đang mở Google...' : 'Đăng nhập bằng Google để vào Trường'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <GameHUD
            playerState={playerState}
            schoolClock={schoolClock}
            userEmail={user.email}
            roleType={roleType}
            canOpenAdminPanel={canOpenAdminPanel}
            pendingTasksCount={pendingTasksCount}
            micEnabled={micEnabled}
            isSpeaking={isSpeaking}
            isMicMutedByAdmin={isMicMutedByAdmin}
            micError={micError}
            unreadChatCount={unreadChatCount}
            trafficLight={trafficLight}
            nearCrosswalk={nearCrosswalk}
            nearestZone={nearestZone}
            activeGrabMission={activeGrabMission}
            soundEnabled={soundEnabled}
            toastMessage={toastMessage}
            isVehicleStowed={isVehicleStowed}
            effectiveVehicle={effectiveVehicle}
            isWheelie={isWheelie}
            isReckless={isReckless}
            moveInputRef={moveInputRef}
            wheelieInputRef={wheelieInputRef}
            recklessInputRef={recklessInputRef}
            onToggleMic={toggleMic}
            onToggleChat={() => setChatOpen((v) => !v)}
            onOpenAdminPanel={() => setAdminOpen(true)}
            onOpenProfile={() => setShowProfile(true)}
            onToggleHelmet={handleToggleHelmet}
            onToggleSound={handleToggleSound}
            onSignOut={handleSignOut}
            onOpenScanner={() => setShowScanner(true)}
            onOpenSubjectRoom={(roomId) => {
              if (requireActivityAccess()) setActiveSubjectRoom(roomId);
            }}
            onOpenHub={(tab) => setHubTab(tab)}
            onOpenVenue={(v) => {
              if (requireActivityAccess()) setActiveVenue(v);
            }}
            onOpenMuseum={(tab) => setMuseumModal({ open: true, tab })}
            onInteractZone={handleInteractZone}
            onQuickTravel={handleQuickTravel}
          />

          <SocialChatDrawer
            isOpen={chatOpen}
            onToggle={() => setChatOpen((v) => !v)}
            messages={chatMessages}
            myUid={user.uid}
            isChatMuted={isChatMutedByAdmin}
            muteReason={myModeration?.reason || ''}
            canModerateChat={canModerateChat}
            canMuteMic={canMuteMic}
            onSendMessage={handleSendChat}
            onDeleteMessage={handleDeleteChat}
            onMuteUser={handleMuteFromChat}
          />

          <AdminPanelModal
            isOpen={adminOpen}
            onClose={() => setAdminOpen(false)}
            myUid={user.uid}
            myDisplayName={playerState.look.name}
            isSuperAdmin={isSuperAdmin}
            mySubAdminRole={mySubAdminRole}
            onlinePlayers={onlinePlayers}
            subAdmins={subAdmins}
            moderations={moderations}
            assignments={assignments}
            trafficLight={trafficLight}
            onUpsertSubAdmin={handleUpsertSubAdmin}
            onRemoveSubAdmin={handleRemoveSubAdmin}
            onSetModeration={handleSetModeration}
            onIssuePenalty={handleIssuePenalty}
            onCreateAssignment={handleCreateAssignment}
            onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
            onDeleteAssignment={handleDeleteAssignment}
            onTeleportToCrosswalk={() => handleQuickTravel(0, 31)}
            onCopyUid={handleCopyUid}
          />

          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            playerState={playerState}
            myUid={user.uid}
            userEmail={user.email}
            roleType={roleType}
            roleLabel={roleLabel}
            onlineCount={onlinePlayers.length}
            isVehicleStowed={isVehicleStowed}
            onCopyUid={handleCopyUid}
            onToggleHelmet={handleToggleHelmet}
            onOpenScanner={() => setShowScanner(true)}
            onOpenUniform={() => setHubTab('uniform')}
            onOpenLeaderboard={() => setHubTab('leaderboard')}
          />

          <ShopServicesModal
            mode={shopServiceMode}
            playerState={playerState}
            hasFullAccess={hasFullAccess}
            onBuyOrEquipOutfit={handleBuyOrEquipOutfit}
            onBuyVendingDrink={handleBuyVendingDrink}
            onClose={() => setShopServiceMode(null)}
          />

          {showScanner && (
            <WebcamScannerModal
              initialLook={playerState.look}
              initialIsDelinquent={playerState.isDelinquent}
              isInitialSetup={isInitialSetup}
              onSave={handleSaveLook}
              onClose={() => setShowScanner(false)}
            />
          )}

          {activeSubjectRoom && hasFullAccess && (
            <LessonModal
              roomId={activeSubjectRoom}
              dayOfWeek={schoolClock.dayOfWeek}
              countdownFormatted={schoolClock.countdownFormatted}
              isOfficialClassTime={schoolClock.isOfficialClassTime}
              equippedUniform={playerState.equippedUniform}
              equippedSupply={playerState.equippedSupply}
              studyBuffLessons={playerState.studyBuffLessons}
              onCompleteLesson={handleCompleteLesson}
              onClose={() => setActiveSubjectRoom(null)}
            />
          )}

          {activeVenue && hasFullAccess && (
            <TownVenueModal
              venue={activeVenue}
              playerState={playerState}
              activeGrabMission={activeGrabMission}
              onBuyFood={handleBuyFood}
              onWorkJollibee={handleWorkJollibee}
              onWinNetGame={handleWinNetGame}
              onParkPlay={handleParkPlay}
              onTakeGrabRide={handleTakeGrabRide}
              onAcceptGrabMission={handleAcceptGrabMission}
              onCancelGrabMission={() => setActiveGrabMission(null)}
              onClose={() => setActiveVenue(null)}
            />
          )}

          {hubTab && (
            <HubModal
              activeTab={hubTab}
              playerState={playerState}
              schoolClock={schoolClock}
              leaderboardEntries={leaderboardEntries}
              leaderboardLoading={leaderboardLoading}
              leaderboardError={leaderboardError}
              onChangeTab={setHubTab}
              onSelectUniform={handleSelectUniform}
              onBuyOrEquipVehicle={handleBuyOrEquipVehicle}
              onBuyOrEquipSupply={handleBuyOrEquipSupply}
              onDoPartTimeJob={handleDoPartTimeJob}
              onBuyStartup={handleBuyStartup}
              onClaimDailyStreak={handleClaimDailyStreak}
              onClose={() => setHubTab(null)}
            />
          )}

          <MuseumModal
            isOpen={museumModal.open}
            initialTab={museumModal.tab}
            onClose={() => setMuseumModal((prev) => ({ ...prev, open: false }))}
            isSuperAdmin={isSuperAdmin}
            myUid={user.uid}
            myName={playerState.look.name}
            myRoleLabel={roleLabel}
            hasFullAccess={hasFullAccess}
            playerMoney={playerState.money}
            artworks={museumArtworks}
            memories={museumMemories}
            onSaveArtwork={handleSaveMuseumArtwork}
            onDeleteArtwork={handleDeleteMuseumArtwork}
            onCreateMemory={handleCreateMuseumMemory}
            onDeleteMemory={handleDeleteMuseumMemory}
            onPlayMuseumQuizReward={handleMuseumQuizReward}
            onClawMachineReward={handleClawMachineReward}
            onTeleportFloor={handleTeleportMuseumFloor}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MainApp />
    </AppErrorBoundary>
  );
}
