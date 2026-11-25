import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  AdminAssignment,
  ChatMessage,
  GenderType,
  LeaderboardEntry,
  ModerationState,
  MuseumArtwork,
  MuseumMemory,
  MuseumSectionId,
  PlayerPresence,
  PlayerState,
  SubAdminJobType,
  SubAdminRole,
  TrafficPenalty,
} from './types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function isSafeFirestoreId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

export interface RemoteStudentDoc {
  uid: string;
  studentName: string;
  isClassMember: boolean;
  isDelinquent?: boolean;
  wearingHelmet?: boolean;
  gender?: GenderType;
  hairStyle: PlayerState['look']['hairStyle'];
  hasGlasses: boolean;
  skinTone: string;
  equippedUniform: PlayerState['equippedUniform'];
  equippedOutfit?: PlayerState['equippedOutfit'];
  equippedVehicle: PlayerState['equippedVehicle'];
  equippedSupply: PlayerState['equippedSupply'];
  ownedUniforms: PlayerState['ownedUniforms'];
  ownedOutfits?: PlayerState['ownedOutfits'];
  ownedVehicles: PlayerState['ownedVehicles'];
  ownedSupplies: PlayerState['ownedSupplies'];
  ownedStartups: PlayerState['ownedStartups'];
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

export async function loadStudentProfile(uid: string): Promise<RemoteStudentDoc | null> {
  const path = `students/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'students', uid));
    if (!snap.exists()) return null;
    return snap.data() as RemoteStudentDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveStudentProfile(
  uid: string,
  state: PlayerState,
  weekKey: string,
  isCreate: boolean
): Promise<void> {
  const studentPath = `students/${uid}`;
  const clampedName = (state.look.name.trim() || 'Khách Tham Quan').slice(0, 60);

  const payload = {
    uid,
    studentName: clampedName,
    isClassMember: Boolean(state.isClassMember),
    isDelinquent: Boolean(state.isDelinquent),
    wearingHelmet: Boolean(state.wearingHelmet),
    gender: state.look.gender || 'male',
    hairStyle: state.look.hairStyle,
    hasGlasses: Boolean(state.look.hasGlasses),
    skinTone: state.look.skinTone.slice(0, 20),
    equippedUniform: state.equippedUniform,
    equippedOutfit: state.equippedOutfit || 'school_uniform',
    equippedVehicle: state.equippedVehicle,
    equippedSupply: state.equippedSupply,
    ownedUniforms: state.ownedUniforms.slice(0, 10),
    ownedOutfits: (state.ownedOutfits?.length ? state.ownedOutfits : ['school_uniform']).slice(0, 16),
    ownedVehicles: state.ownedVehicles.slice(0, 10),
    ownedSupplies: state.ownedSupplies.slice(0, 10),
    ownedStartups: state.ownedStartups.slice(0, 10),
    money: Math.max(0, Math.min(1000000000, Math.round(state.money))),
    energy: Math.max(0, Math.min(100, Math.round(state.energy))),
    studyBuffLessons: Math.max(0, Math.min(100, Math.round(state.studyBuffLessons))),
    xp: Math.max(0, Math.min(1000000, Math.round(state.xp))),
    level: Math.max(1, Math.min(200, Math.round(state.level))),
    goodPoints: Math.max(0, Math.min(1000000, Math.round(state.goodPoints))),
    lessonsCompleted: Math.max(0, Math.min(100000, Math.round(state.lessonsCompleted))),
    goodDeedsCompleted: Math.max(0, Math.min(100000, Math.round(state.goodDeedsCompleted))),
    grabMissionsCompleted: Math.max(0, Math.min(100000, Math.round(state.grabMissionsCompleted))),
    streakDays: Math.max(1, Math.min(7, Math.round(state.streakDays))),
    lastClaimedDateStr: (state.lastClaimedDateStr || '').slice(0, 20),
    lastActiveDateStr: (state.lastActiveDateStr || '').slice(0, 20),
    vipClaimedThisWeek: Boolean(state.vipClaimedThisWeek),
    weeklyScore: Math.max(0, Math.min(10000000, Math.round(state.weeklyScore))),
    weekKey: weekKey.slice(0, 20),
    completedDeedIdsToday: state.completedDeedIdsToday.slice(0, 20),
    jobsWorkedToday: Math.max(0, Math.min(10, Math.round(state.jobsWorkedToday))),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isCreate) {
      await setDoc(doc(db, 'students', uid), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'students', uid), payload, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, isCreate ? OperationType.CREATE : OperationType.UPDATE, studentPath);
  }

  // Only verified 8A3 class members appear on the shared Weekly Leaderboard
  if (state.isClassMember) {
    const lbPath = `leaderboard/${uid}`;
    try {
      await setDoc(
        doc(db, 'leaderboard', uid),
        {
          uid,
          studentName: clampedName,
          isClassMember: true,
          level: payload.level,
          weeklyScore: payload.weeklyScore,
          goodPoints: payload.goodPoints,
          vehicleId: payload.equippedVehicle,
          weekKey: payload.weekKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, lbPath);
    }
  }
}

export function subscribeWeeklyLeaderboard(
  currentUid: string | null,
  weekKey: string,
  onData: (entries: LeaderboardEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'leaderboard';
  const q = query(
    collection(db, 'leaderboard'),
    where('isClassMember', '==', true),
    limit(150)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: LeaderboardEntry[] = snap.docs
        .map((d) => ({ id: d.id, data: d.data() }))
        .filter(({ data }) => String(data.weekKey || '') === weekKey)
        .map(({ id, data }) => ({
          id,
          name: String(data.studentName || 'Học sinh 8A3'),
          level: Number(data.level || 1),
          weeklyScore: Number(data.weeklyScore || 0),
          goodPoints: Number(data.goodPoints || 0),
          money: 0,
          vehicleId: data.vehicleId || 'walk',
          isPlayer: Boolean(currentUid && id === currentUid),
        }))
        .sort((a, b) => b.weeklyScore - a.weeklyScore)
        .slice(0, 50);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

// =========================================================================
// SUB-ADMIN RBAC (Managed by Super Admin: ngmanhcuong61@gmail.com)
// =========================================================================

export function subscribeMySubAdminRole(
  uid: string,
  onData: (role: SubAdminRole | null) => void,
  onError: (err: Error) => void
): () => void {
  const path = `subAdmins/${uid}`;
  return onSnapshot(
    doc(db, 'subAdmins', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
      } else {
        onData(snap.data() as SubAdminRole);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeAllSubAdmins(
  onData: (list: SubAdminRole[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'subAdmins';
  return onSnapshot(
    query(collection(db, 'subAdmins'), limit(100)),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as SubAdminRole);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function upsertSubAdmin(
  assignedByUid: string,
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
): Promise<void> {
  const cleanUid = input.uid.trim();
  if (!isSafeFirestoreId(cleanUid)) {
    throw new Error('Mã UID không hợp lệ (chỉ gồm chữ, số, _ hoặc -).');
  }
  const path = `subAdmins/${cleanUid}`;
  try {
    if (isCreate) {
      await setDoc(doc(db, 'subAdmins', cleanUid), {
        uid: cleanUid,
        email: input.email.trim().slice(0, 120),
        displayName: input.displayName.trim().slice(0, 60) || 'Quản lý phụ',
        jobType: input.jobType,
        jobTitle: input.jobTitle.trim().slice(0, 60) || 'Quản lý phụ',
        canMuteMic: Boolean(input.canMuteMic),
        canModerateChat: Boolean(input.canModerateChat),
        canIssueFine: Boolean(input.canIssueFine),
        assignedByUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'subAdmins', cleanUid), {
        email: input.email.trim().slice(0, 120),
        displayName: input.displayName.trim().slice(0, 60) || 'Quản lý phụ',
        jobType: input.jobType,
        jobTitle: input.jobTitle.trim().slice(0, 60) || 'Quản lý phụ',
        canMuteMic: Boolean(input.canMuteMic),
        canModerateChat: Boolean(input.canModerateChat),
        canIssueFine: Boolean(input.canIssueFine),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isCreate ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function removeSubAdmin(targetUid: string): Promise<void> {
  const path = `subAdmins/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'subAdmins', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================================
// MODERATION (Mic & Chat Mute)
// =========================================================================

export function subscribeMyModeration(
  uid: string,
  onData: (mod: ModerationState | null) => void,
  onError: (err: Error) => void
): () => void {
  const path = `moderation/${uid}`;
  return onSnapshot(
    doc(db, 'moderation', uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as ModerationState) : null);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeAllModerations(
  onData: (mods: Map<string, ModerationState>) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'moderation';
  return onSnapshot(
    query(collection(db, 'moderation'), limit(150)),
    (snap) => {
      const map = new Map<string, ModerationState>();
      snap.docs.forEach((d) => {
        const data = d.data() as ModerationState;
        map.set(d.id, data);
      });
      onData(map);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function setModerationState(
  targetUid: string,
  payload: {
    micMuted: boolean;
    chatMuted: boolean;
    reason: string;
    mutedByUid: string;
    mutedByName: string;
  }
): Promise<void> {
  if (!isSafeFirestoreId(targetUid)) {
    throw new Error('UID mục tiêu không hợp lệ.');
  }
  const path = `moderation/${targetUid}`;
  try {
    await setDoc(doc(db, 'moderation', targetUid), {
      uid: targetUid,
      micMuted: Boolean(payload.micMuted),
      chatMuted: Boolean(payload.chatMuted),
      reason: payload.reason.trim().slice(0, 140),
      mutedByUid: payload.mutedByUid,
      mutedByName: payload.mutedByName.trim().slice(0, 60) || 'Quản lý',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// =========================================================================
// MULTIPLAYER PRESENCE
// =========================================================================

export async function publishPresence(
  uid: string,
  data: Omit<PlayerPresence, 'uid' | 'updatedAtMs'>
): Promise<void> {
  const path = `presence/${uid}`;
  try {
    await setDoc(doc(db, 'presence', uid), {
      uid,
      studentName: (data.studentName.trim() || 'Học sinh').slice(0, 60),
      isClassMember: Boolean(data.isClassMember),
      roleType: data.roleType,
      roleLabel: (data.roleLabel || '').slice(0, 40),
      gender: data.gender || 'male',
      hairStyle: data.hairStyle,
      hasGlasses: Boolean(data.hasGlasses),
      skinTone: data.skinTone.slice(0, 20),
      equippedUniform: data.equippedUniform,
      equippedOutfit: data.equippedOutfit || 'school_uniform',
      equippedVehicle: data.equippedVehicle,
      vipClaimed: Boolean(data.vipClaimed),
      isDelinquent: Boolean(data.isDelinquent),
      wearingHelmet: Boolean(data.wearingHelmet),
      isWheelie: Boolean(data.isWheelie),
      isReckless: Boolean(data.isReckless),
      x: Math.max(-99, Math.min(99, Number(data.x.toFixed(2)))),
      z: Math.max(-99, Math.min(119, Number(data.z.toFixed(2)))),
      rotY: Math.max(-9.9, Math.min(9.9, Number(data.rotY.toFixed(2)))),
      micActive: Boolean(data.micActive),
      micMuted: Boolean(data.micMuted),
      redLightViolationAt: Math.max(0, Math.round(data.redLightViolationAt || 0)),
      helmetViolationAt: Math.max(0, Math.round(data.helmetViolationAt || 0)),
      online: Boolean(data.online),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setPresenceOffline(uid: string): Promise<void> {
  const path = `presence/${uid}`;
  try {
    await updateDoc(doc(db, 'presence', uid), {
      online: false,
      micActive: false,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Ignore if presence doc was never created
  }
}

export function subscribeOnlinePresence(
  myUid: string,
  onData: (players: PlayerPresence[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'presence';
  const q = query(collection(db, 'presence'), where('online', '==', true), limit(60));
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const list: PlayerPresence[] = [];
      snap.docs.forEach((d) => {
        const raw = d.data() as PlayerPresence & { updatedAt?: { toMillis?: () => number } };
        const updatedMs = raw.updatedAt?.toMillis ? raw.updatedAt.toMillis() : now;
        // Filter out stale ghosts older than 60s
        if (now - updatedMs > 60000 && raw.uid !== myUid) return;
        list.push({
          ...raw,
          updatedAtMs: updatedMs,
        });
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

// =========================================================================
// SOCIAL TEXT CHAT
// =========================================================================

export function subscribeChatMessages(
  onData: (messages: ChatMessage[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'chatMessages';
  const q = query(collection(db, 'chatMessages'), where('deleted', '==', false), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as ChatMessage)
        .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0))
        .slice(-60);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function sendChatMessage(
  senderUid: string,
  senderName: string,
  senderRoleLabel: string,
  text: string
): Promise<void> {
  const cleanText = text.trim().slice(0, 240);
  if (!cleanText) return;
  const id = makeDocId('msg');
  const path = `chatMessages/${id}`;
  try {
    await setDoc(doc(db, 'chatMessages', id), {
      id,
      senderUid,
      senderName: (senderName.trim() || 'Học sinh').slice(0, 60),
      senderRoleLabel: (senderRoleLabel || '').slice(0, 40),
      text: cleanText,
      deleted: false,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function moderateDeleteChatMessage(msgId: string): Promise<void> {
  const path = `chatMessages/${msgId}`;
  try {
    await updateDoc(doc(db, 'chatMessages', msgId), {
      deleted: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =========================================================================
// WEBRTC VOICE SIGNALING
// =========================================================================

export interface RtcSignalDoc {
  id: string;
  fromUid: string;
  toUid: string;
  type: 'offer' | 'answer' | 'ice';
  payload: string;
}

export async function sendRtcSignal(
  fromUid: string,
  toUid: string,
  type: 'offer' | 'answer' | 'ice',
  payload: string
): Promise<void> {
  if (!isSafeFirestoreId(toUid) || fromUid === toUid) return;
  const id = makeDocId('sig');
  const path = `rtcSignals/${id}`;
  try {
    await setDoc(doc(db, 'rtcSignals', id), {
      id,
      fromUid,
      toUid,
      type,
      payload: payload.slice(0, 8000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeRtcSignals(
  myUid: string,
  onData: (signals: RtcSignalDoc[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'rtcSignals';
  const q = query(collection(db, 'rtcSignals'), where('toUid', '==', myUid), limit(60));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as RtcSignalDoc));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function deleteRtcSignal(signalId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rtcSignals', signalId));
  } catch {
    // Ignore cleanup race
  }
}

// =========================================================================
// TRAFFIC PENALTIES (Police Sub-Admin & Super Admin)
// =========================================================================

export async function issueTrafficPenalty(
  issuedByUid: string,
  issuedByName: string,
  targetUid: string,
  targetName: string,
  reason: string,
  amount: number
): Promise<void> {
  if (!isSafeFirestoreId(targetUid)) {
    throw new Error('UID người vi phạm không hợp lệ.');
  }
  const id = makeDocId('pen');
  const path = `penalties/${id}`;
  try {
    await setDoc(doc(db, 'penalties', id), {
      id,
      targetUid,
      targetName: (targetName.trim() || 'Học sinh').slice(0, 60),
      issuedByUid,
      issuedByName: (issuedByName.trim() || 'Cảnh sát').slice(0, 60),
      reason: (reason.trim() || 'Vượt đèn đỏ trước cổng trường').slice(0, 160),
      amount: Math.max(1000, Math.min(100000, Math.round(amount))),
      status: 'unpaid',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeMyPenalties(
  myUid: string,
  onData: (penalties: TrafficPenalty[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'penalties';
  const q = query(collection(db, 'penalties'), where('targetUid', '==', myUid), limit(30));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as TrafficPenalty));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function markPenaltyPaid(penaltyId: string): Promise<void> {
  const path = `penalties/${penaltyId}`;
  try {
    await updateDoc(doc(db, 'penalties', penaltyId), {
      status: 'paid',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =========================================================================
// ADMIN ASSIGNMENTS (Custom Tasks Delegated by Super Admin)
// =========================================================================

export function subscribeAssignments(
  uid: string,
  isSuperAdminUser: boolean,
  onData: (list: AdminAssignment[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'assignments';
  const q = isSuperAdminUser
    ? query(collection(db, 'assignments'), limit(100))
    : query(collection(db, 'assignments'), where('assigneeUid', '==', uid), limit(50));

  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as AdminAssignment));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function createAssignment(
  assignedByUid: string,
  input: {
    assigneeUid: string;
    assigneeName: string;
    title: string;
    description: string;
    jobCategory: AdminAssignment['jobCategory'];
    rewardMoney: number;
  }
): Promise<void> {
  const cleanUid = input.assigneeUid.trim();
  if (!isSafeFirestoreId(cleanUid)) {
    throw new Error('UID người nhận việc không hợp lệ.');
  }
  const id = makeDocId('task');
  const path = `assignments/${id}`;
  try {
    await setDoc(doc(db, 'assignments', id), {
      id,
      assigneeUid: cleanUid,
      assigneeName: (input.assigneeName.trim() || 'Thành viên').slice(0, 60),
      assignedByUid,
      title: input.title.trim().slice(0, 100),
      description: input.description.trim().slice(0, 300),
      jobCategory: input.jobCategory,
      rewardMoney: Math.max(0, Math.min(100000, Math.round(input.rewardMoney))),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AdminAssignment['status']
): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================================
// LANG SON PROVINCE MUSEUM (Floor 1 Super-Admin Artworks & Floor 2 Memory Wall)
// =========================================================================

export function subscribeMuseumArtworks(
  onData: (artworks: Map<string, MuseumArtwork>) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'museumArtworks';
  const q = query(
    collection(db, 'museumArtworks'),
    where('published', '==', true),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const map = new Map<string, MuseumArtwork>();
      snap.docs.forEach((d) => {
        const art = d.data() as MuseumArtwork;
        map.set(art.slotId, art);
      });
      onData(map);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function upsertMuseumArtwork(
  uploadedByUid: string,
  input: {
    slotId: string;
    section: MuseumSectionId;
    title: string;
    caption: string;
    imageDataUrl: string;
  }
): Promise<void> {
  if (!isSafeFirestoreId(input.slotId)) {
    throw new Error('Mã khung tranh không hợp lệ.');
  }
  const cleanImage = input.imageDataUrl.trim();
  if (!cleanImage || cleanImage.length > 198000) {
    throw new Error('Ảnh tranh quá lớn (>195KB). Vui lòng chọn ảnh khác hoặc nén nhỏ hơn.');
  }
  const path = `museumArtworks/${input.slotId}`;
  try {
    await setDoc(doc(db, 'museumArtworks', input.slotId), {
      slotId: input.slotId,
      section: input.section,
      title: input.title.trim().slice(0, 80) || 'Tác phẩm Lạng Sơn',
      caption: input.caption.trim().slice(0, 220),
      imageDataUrl: cleanImage,
      uploadedByUid,
      published: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMuseumArtwork(slotId: string): Promise<void> {
  const path = `museumArtworks/${slotId}`;
  try {
    await deleteDoc(doc(db, 'museumArtworks', slotId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeMuseumMemories(
  onData: (memories: MuseumMemory[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'museumMemories';
  const q = query(
    collection(db, 'museumMemories'),
    where('deleted', '==', false),
    limit(60)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as MuseumMemory)
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function createMuseumMemory(
  authorUid: string,
  authorName: string,
  authorRoleLabel: string,
  input: {
    message: string;
    photoDataUrl: string;
    signatureDataUrl: string;
    cardColor: string;
  }
): Promise<void> {
  const cleanPhoto = input.photoDataUrl.trim().slice(0, 198000);
  const cleanSig = input.signatureDataUrl.trim().slice(0, 118000);
  const cleanMsg = input.message.trim().slice(0, 180);
  if (!cleanPhoto && !cleanSig && !cleanMsg) {
    throw new Error('Vui lòng chụp/tải ảnh, ký tên hoặc viết lời kỷ niệm!');
  }
  const id = makeDocId('mem');
  const path = `museumMemories/${id}`;
  try {
    await setDoc(doc(db, 'museumMemories', id), {
      id,
      authorUid,
      authorName: (authorName.trim() || 'Thành viên 8A3').slice(0, 60),
      authorRoleLabel: (authorRoleLabel || '').slice(0, 40),
      message: cleanMsg,
      photoDataUrl: cleanPhoto,
      signatureDataUrl: cleanSig,
      cardColor: input.cardColor.slice(0, 20) || '#fef3c7',
      deleted: false,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function softDeleteMuseumMemory(memoryId: string): Promise<void> {
  const path = `museumMemories/${memoryId}`;
  try {
    await updateDoc(doc(db, 'museumMemories', memoryId), {
      deleted: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
