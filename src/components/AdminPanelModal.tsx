import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  Gavel,
  MessageSquareOff,
  Mic,
  MicOff,
  Navigation,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { formatVND } from '../data/gameData';
import {
  AdminAssignment,
  ModerationState,
  PlayerPresence,
  SubAdminJobType,
  SubAdminRole,
} from '../types/game';
import { TrafficLightStatus } from '../utils/trafficLight';

type AdminTabId = 'mic_chat' | 'police' | 'subadmins' | 'tasks';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUid: string;
  myDisplayName: string;
  isSuperAdmin: boolean;
  mySubAdminRole: SubAdminRole | null;
  onlinePlayers: PlayerPresence[];
  subAdmins: SubAdminRole[];
  moderations: Map<string, ModerationState>;
  assignments: AdminAssignment[];
  trafficLight: TrafficLightStatus;
  onUpsertSubAdmin: (
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
  ) => Promise<void>;
  onRemoveSubAdmin: (targetUid: string) => Promise<void>;
  onSetModeration: (
    targetUid: string,
    micMuted: boolean,
    chatMuted: boolean,
    reason: string
  ) => Promise<void>;
  onIssuePenalty: (
    targetUid: string,
    targetName: string,
    reason: string,
    amount: number
  ) => Promise<void>;
  onCreateAssignment: (input: {
    assigneeUid: string;
    assigneeName: string;
    title: string;
    description: string;
    jobCategory: AdminAssignment['jobCategory'];
    rewardMoney: number;
  }) => Promise<void>;
  onUpdateAssignmentStatus: (
    assignmentId: string,
    status: AdminAssignment['status'],
    rewardMoney: number
  ) => Promise<void>;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
  onTeleportToCrosswalk: () => void;
  onCopyUid: (uid: string) => void;
}

const JOB_TYPE_DEFAULTS: Record<
  SubAdminJobType,
  { label: string; title: string; mic: boolean; chat: boolean; fine: boolean }
> = {
  teacher: {
    label: 'Giáo viên',
    title: 'Giáo viên Lớp 8A3',
    mic: true,
    chat: true,
    fine: false,
  },
  police: {
    label: 'Cảnh sát Giao thông',
    title: 'Cảnh sát Trường Học',
    mic: false,
    chat: false,
    fine: true,
  },
  disciplinarian: {
    label: 'Giám thị / Sao Đỏ',
    title: 'Giám thị Kỷ luật',
    mic: true,
    chat: true,
    fine: true,
  },
  event_manager: {
    label: 'Quản lý Sự kiện',
    title: 'Quản lý Hoạt động',
    mic: true,
    chat: true,
    fine: false,
  },
  custom: {
    label: 'Công việc Tùy chỉnh',
    title: 'Quản lý phụ 8A3',
    mic: false,
    chat: false,
    fine: false,
  },
};

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  myUid,
  isSuperAdmin,
  mySubAdminRole,
  onlinePlayers,
  subAdmins,
  moderations,
  assignments,
  trafficLight,
  onUpsertSubAdmin,
  onRemoveSubAdmin,
  onSetModeration,
  onIssuePenalty,
  onCreateAssignment,
  onUpdateAssignmentStatus,
  onDeleteAssignment,
  onTeleportToCrosswalk,
  onCopyUid,
}) => {
  const canMicOrChat =
    isSuperAdmin || Boolean(mySubAdminRole?.canMuteMic) || Boolean(mySubAdminRole?.canModerateChat);
  const canMic = isSuperAdmin || Boolean(mySubAdminRole?.canMuteMic);
  const canChatMod = isSuperAdmin || Boolean(mySubAdminRole?.canModerateChat);
  const canFine = isSuperAdmin || Boolean(mySubAdminRole?.canIssueFine);

  const availableTabs = useMemo(() => {
    const list: Array<{ id: AdminTabId; label: string }> = [];
    if (canMicOrChat) list.push({ id: 'mic_chat', label: 'Mic & Chat' });
    if (canFine) list.push({ id: 'police', label: 'Cảnh Sát Đèn Đỏ' });
    if (isSuperAdmin) list.push({ id: 'subadmins', label: 'Quản Lý Phụ' });
    list.push({ id: 'tasks', label: isSuperAdmin ? 'Phân Công Việc' : 'Nhiệm Vụ Được Giao' });
    return list;
  }, [canMicOrChat, canFine, isSuperAdmin]);

  const [activeTab, setActiveTab] = useState<AdminTabId>(() => availableTabs[0]?.id || 'tasks');
  const effectiveTab = availableTabs.some((t) => t.id === activeTab)
    ? activeTab
    : availableTabs[0]?.id || 'tasks';

  // Manual UID Mute State
  const [manualUid, setManualUid] = useState('');
  const [muteReason, setMuteReason] = useState('Giữ trật tự trong lớp & sân trường');

  // Custom Police Penalty Form State
  const [fineTargetUid, setFineTargetUid] = useState('');
  const [fineTargetName, setFineTargetName] = useState('');
  const [fineReason, setFineReason] = useState('Vượt đèn đỏ tại cổng trường');
  const [fineAmount, setFineAmount] = useState(15000);

  // Add/Edit SubAdmin Form State
  const [saUid, setSaUid] = useState('');
  const [saEmail, setSaEmail] = useState('');
  const [saName, setSaName] = useState('');
  const [saJobType, setSaJobType] = useState<SubAdminJobType>('teacher');
  const [saJobTitle, setSaJobTitle] = useState('Giáo viên Lớp 8A3');
  const [saMic, setSaMic] = useState(true);
  const [saChat, setSaChat] = useState(true);
  const [saFine, setSaFine] = useState(false);

  // Create Assignment Form State
  const [taskAssigneeUid, setTaskAssigneeUid] = useState('');
  const [taskAssigneeName, setTaskAssigneeName] = useState('');
  const [taskCategory, setTaskCategory] = useState<AdminAssignment['jobCategory']>('teacher');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskReward, setTaskReward] = useState(20000);

  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subAdminUidSet = new Set(subAdmins.map((s) => s.uid));
  const now = Date.now();

  const handleJobTypeChange = (jt: SubAdminJobType) => {
    setSaJobType(jt);
    const d = JOB_TYPE_DEFAULTS[jt];
    setSaJobTitle(d.title);
    setSaMic(d.mic);
    setSaChat(d.chat);
    setSaFine(d.fine);
  };

  const handlePickOnlineForSubAdmin = (uid: string) => {
    const found = onlinePlayers.find((p) => p.uid === uid);
    if (!found) return;
    setSaUid(found.uid);
    setSaName(found.studentName);
  };

  const handleSaveSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanUid = saUid.trim();
    if (!cleanUid || !saEmail.trim() || !saName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Email Google, Mã UID và Tên hiển thị.');
      return;
    }
    const alreadyExists = subAdminUidSet.has(cleanUid);
    setBusyMsg('Đang lưu Quản lý phụ...');
    try {
      await onUpsertSubAdmin(
        {
          uid: cleanUid,
          email: saEmail.trim(),
          displayName: saName.trim(),
          jobType: saJobType,
          jobTitle: saJobTitle.trim() || JOB_TYPE_DEFAULTS[saJobType].title,
          canMuteMic: saMic,
          canModerateChat: saChat,
          canIssueFine: saFine,
        },
        !alreadyExists
      );
      setSaUid('');
      setSaEmail('');
      setSaName('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu Quản lý phụ.');
    } finally {
      setBusyMsg(null);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!taskAssigneeUid.trim() || !taskTitle.trim() || !taskDesc.trim()) {
      setFormError('Vui lòng chọn người nhận việc và nhập tiêu đề, mô tả công việc.');
      return;
    }
    setBusyMsg('Đang giao việc...');
    try {
      await onCreateAssignment({
        assigneeUid: taskAssigneeUid.trim(),
        assigneeName: taskAssigneeName.trim() || 'Quản lý phụ',
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        jobCategory: taskCategory,
        rewardMoney: taskReward,
      });
      setTaskTitle('');
      setTaskDesc('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tạo công việc.');
    } finally {
      setBusyMsg(null);
    }
  };

  const sortedForPolice = [...onlinePlayers].sort((a, b) => {
    const aViol =
      (a.redLightViolationAt > 0 && now - a.redLightViolationAt < 90000 ? 4 : 0) +
      (a.helmetViolationAt > 0 && now - a.helmetViolationAt < 90000 ? 3 : 0) +
      (a.isReckless || a.isWheelie ? 2 : 0) +
      (a.isDelinquent ? 1 : 0);
    const bViol =
      (b.redLightViolationAt > 0 && now - b.redLightViolationAt < 90000 ? 4 : 0) +
      (b.helmetViolationAt > 0 && now - b.helmetViolationAt < 90000 ? 3 : 0) +
      (b.isReckless || b.isWheelie ? 2 : 0) +
      (b.isDelinquent ? 1 : 0);
    return bViol - aViol;
  });

  // Candidate list for assigning tasks (subAdmins + onlinePlayers deduplicated)
  const taskCandidates = new Map<string, { uid: string; label: string; name: string }>();
  subAdmins.forEach((sa) => {
    taskCandidates.set(sa.uid, {
      uid: sa.uid,
      name: sa.displayName,
      label: `${sa.displayName} (${sa.jobTitle})`,
    });
  });
  onlinePlayers.forEach((p) => {
    if (p.uid !== myUid && !taskCandidates.has(p.uid)) {
      taskCandidates.set(p.uid, {
        uid: p.uid,
        name: p.studentName,
        label: `${p.studentName} (${p.roleLabel || 'Online'})`,
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                {isSuperAdmin
                  ? 'Trung Tâm Admin Chính (Quản Lý Toàn Trường)'
                  : mySubAdminRole
                    ? `Bảng Điều Hành: ${mySubAdminRole.jobTitle}`
                    : 'Nhiệm Vụ Phân Công'}
              </h2>
              <p className="text-xs text-slate-400">
                Đang online: <span className="text-emerald-400 font-bold">{onlinePlayers.length}</span> người chơi
                {busyMsg ? ` · ${busyMsg}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800 flex flex-wrap gap-2 bg-slate-950/50">
          {availableTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setFormError(null);
                setActiveTab(t.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                effectiveTab === t.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/60 text-xs text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: MIC & CHAT MODERATION */}
          {effectiveTab === 'mic_chat' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-slate-300">
                  Lý do áp dụng & Khóa nhanh bằng Mã UID (kể cả khi người chơi vừa thoát):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={muteReason}
                    onChange={(e) => setMuteReason(e.target.value)}
                    placeholder="Lý do tắt mic / khóa chat..."
                    className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={manualUid}
                    onChange={(e) => setManualUid(e.target.value)}
                    placeholder="Nhập UID tài khoản..."
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-nums text-white"
                  />
                </div>
                {manualUid.trim() && (
                  <div className="flex flex-wrap gap-2">
                    {canMic && (
                      <>
                        <button
                          type="button"
                          onClick={() => onSetModeration(manualUid.trim(), true, false, muteReason)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold"
                        >
                          Tắt Mic UID này
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetModeration(manualUid.trim(), false, false, '')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                        >
                          Mở Mic & Chat UID này
                        </button>
                      </>
                    )}
                    {canChatMod && (
                      <button
                        type="button"
                        onClick={() => onSetModeration(manualUid.trim(), true, true, muteReason)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                      >
                        Khóa cả Mic + Chat
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Danh sách người chơi đang Online ({onlinePlayers.length})</span>
                </h3>
                {onlinePlayers.map((p) => {
                  const mod = moderations.get(p.uid);
                  const micIsMuted = Boolean(mod?.micMuted ?? p.micMuted);
                  const chatIsMuted = Boolean(mod?.chatMuted);
                  const isSelf = p.uid === myUid;
                  const isTargetProtected =
                    !isSuperAdmin && (p.roleType === 'super_admin' || p.roleType === 'sub_admin');

                  return (
                    <div
                      key={p.uid}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{p.studentName}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-sky-300 font-semibold">
                            {p.roleLabel}
                          </span>
                          {p.micActive && !micIsMuted && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <Mic className="w-3 h-3" /> Đang bật mic
                            </span>
                          )}
                          {micIsMuted && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                              <MicOff className="w-3 h-3" /> Bị tắt mic
                            </span>
                          )}
                          {chatIsMuted && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                              <MessageSquareOff className="w-3 h-3" /> Khóa chat
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onCopyUid(p.uid)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono-nums text-slate-400 hover:text-white"
                          title="Bấm để sao chép UID"
                        >
                          <span>UID: {p.uid}</span>
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>

                      {!isSelf && !isTargetProtected ? (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {canMic && (
                            <button
                              type="button"
                              onClick={() =>
                                onSetModeration(
                                  p.uid,
                                  !micIsMuted,
                                  chatIsMuted,
                                  !micIsMuted ? muteReason : ''
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                                micIsMuted
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                  : 'bg-rose-500 hover:bg-rose-400 text-white'
                              }`}
                            >
                              {micIsMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                              <span>{micIsMuted ? 'Mở Mic' : 'Tắt Mic'}</span>
                            </button>
                          )}
                          {canChatMod && (
                            <button
                              type="button"
                              onClick={() =>
                                onSetModeration(
                                  p.uid,
                                  micIsMuted,
                                  !chatIsMuted,
                                  !chatIsMuted ? muteReason : ''
                                )
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                                chatIsMuted
                                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              }`}
                            >
                              <MessageSquareOff className="w-3.5 h-3.5" />
                              <span>{chatIsMuted ? 'Mở Chat' : 'Khóa Chat'}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          {isSelf ? 'Tài khoản của bạn' : 'Quản lý cấp ngang/cao hơn'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: POLICE TRAFFIC ENFORCEMENT */}
          {effectiveTab === 'police' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-4 h-4 rounded-full shrink-0 ${
                      trafficLight.phase === 'red'
                        ? 'bg-rose-500'
                        : trafficLight.phase === 'yellow'
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <p className="font-display font-bold text-sm text-white">
                      Trạng thái Đèn Giao Thông Cổng Trường: {trafficLight.label}
                    </p>
                    <p className="text-xs text-slate-400 font-mono-nums">
                      Chuyển pha sau {trafficLight.secondsRemaining}s · Trục đường Z = 34..42
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onTeleportToCrosswalk();
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Ra Ngã Tư Tuần Tra</span>
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300">
                  Giám sát học sinh đi qua đường, đội mũ bảo hiểm & đi xe điên / bốc đầu:
                </h3>
                {sortedForPolice.map((p) => {
                  const isRedViol = p.redLightViolationAt > 0 && now - p.redLightViolationAt < 90000;
                  const isNoHelmet =
                    ((p.equippedVehicle === 'scooter' || p.equippedVehicle === 'motorbike') &&
                      !p.wearingHelmet) ||
                    (p.helmetViolationAt > 0 && now - p.helmetViolationAt < 90000);
                  const isStuntViol = Boolean(p.isReckless || p.isWheelie);
                  const anyViol = isRedViol || isNoHelmet || isStuntViol;
                  const isSelf = p.uid === myUid;
                  return (
                    <div
                      key={p.uid}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        anyViol
                          ? 'bg-rose-950/35 border-rose-500/70'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{p.studentName}</span>
                          {p.isDelinquent && (
                            <span className="px-2 py-0.5 rounded bg-fuchsia-600 text-white text-[11px] font-bold">
                              ĐẦU GẤU
                            </span>
                          )}
                          {isRedViol && (
                            <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[11px] font-bold">
                              VƯỢT ĐÈN ĐỎ!
                            </span>
                          )}
                          {isNoHelmet && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[11px] font-bold">
                              KO MŨ BH!
                            </span>
                          )}
                          {p.isReckless && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold">
                              ĐI XE ĐIÊN!
                            </span>
                          )}
                          {p.isWheelie && (
                            <span className="px-2 py-0.5 rounded bg-orange-500 text-slate-950 text-[11px] font-bold">
                              BỐC ĐẦU!
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono-nums">
                            Vị trí ({Math.round(p.x)}, {Math.round(p.z)})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.roleLabel} · UID: <span className="font-mono-nums">{p.uid}</span>
                        </p>
                      </div>
                      {!isSelf && (
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onIssuePenalty(
                                p.uid,
                                p.studentName,
                                isRedViol
                                  ? 'Vượt đèn đỏ trước cổng trường THCS Hoàng Văn Thụ'
                                  : 'Vi phạm trật tự an toàn giao thông cổng trường',
                                15000
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>Đèn đỏ (-15k)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onIssuePenalty(
                                p.uid,
                                p.studentName,
                                'Không đội mũ bảo hiểm khi điều khiển xe điện / xe máy',
                                20000
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap"
                          >
                            <span>Ko Mũ BH (-20k)</span>
                          </button>

                          {(p.isDelinquent || isStuntViol) && (
                            <button
                              type="button"
                              onClick={() =>
                                onIssuePenalty(
                                  p.uid,
                                  p.studentName,
                                  'Lạng lách đi xe điên / bốc đầu gây nguy hiểm',
                                  25000
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold whitespace-nowrap"
                            >
                              <span>Xe điên (-25k)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Manual Fine Form */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white">Lập biên bản phạt tùy chỉnh</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={fineTargetUid}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setFineTargetUid(uid);
                      const p = onlinePlayers.find((item) => item.uid === uid);
                      if (p) setFineTargetName(p.studentName);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="">-- Chọn người chơi online --</option>
                    {onlinePlayers
                      .filter((p) => p.uid !== myUid)
                      .map((p) => (
                        <option key={p.uid} value={p.uid}>
                          {p.studentName} ({p.roleLabel})
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    value={fineTargetUid}
                    onChange={(e) => setFineTargetUid(e.target.value)}
                    placeholder="Hoặc dán UID người vi phạm"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-nums text-white"
                  />
                  <input
                    type="text"
                    value={fineReason}
                    onChange={(e) => setFineReason(e.target.value)}
                    placeholder="Lỗi vi phạm (VD: Vượt đèn đỏ, chạy quá tốc độ...)"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="number"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={fineAmount}
                    onChange={(e) => setFineAmount(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-nums text-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={!fineTargetUid.trim()}
                  onClick={() =>
                    onIssuePenalty(
                      fineTargetUid.trim(),
                      fineTargetName.trim() || 'Học sinh',
                      fineReason.trim() || 'Vi phạm giao thông',
                      fineAmount
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold"
                >
                  Xuất Biên Bản Phạt ({formatVND(fineAmount)})
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SUPER ADMIN MANAGES SUB-ADMINS */}
          {effectiveTab === 'subadmins' && isSuperAdmin && (
            <div className="space-y-5">
              <form
                onSubmit={handleSaveSubAdmin}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-lime-400" />
                    <span>Thêm / Cập nhật Quản Lý Phụ (bằng Google Email & Mã UID)</span>
                  </h3>
                  {onlinePlayers.filter((p) => p.uid !== myUid).length > 0 && (
                    <select
                      value=""
                      onChange={(e) => handlePickOnlineForSubAdmin(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-sky-300"
                    >
                      <option value="">Điền nhanh từ người đang Online...</option>
                      {onlinePlayers
                        .filter((p) => p.uid !== myUid)
                        .map((p) => (
                          <option key={p.uid} value={p.uid}>
                            {p.studentName} ({p.uid.slice(0, 8)}...)
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="email"
                    value={saEmail}
                    onChange={(e) => setSaEmail(e.target.value)}
                    placeholder="Email Google (VD: abc@gmail.com)"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={saUid}
                    onChange={(e) => setSaUid(e.target.value)}
                    placeholder="Mã UID Firebase của tài khoản"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-nums text-white"
                  />
                  <input
                    type="text"
                    value={saName}
                    onChange={(e) => setSaName(e.target.value)}
                    placeholder="Tên hiển thị (VD: Thầy Nam)"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={saJobType}
                    onChange={(e) => handleJobTypeChange(e.target.value as SubAdminJobType)}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {(Object.keys(JOB_TYPE_DEFAULTS) as SubAdminJobType[]).map((jt) => (
                      <option key={jt} value={jt}>
                        Vai trò: {JOB_TYPE_DEFAULTS[jt].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={saJobTitle}
                    onChange={(e) => setSaJobTitle(e.target.value)}
                    placeholder="Chức danh hiển thị trên đầu nhân vật"
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saMic}
                      onChange={(e) => setSaMic(e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    <span>Quyền tắt/mở Mic học sinh</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saChat}
                      onChange={(e) => setSaChat(e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    <span>Quyền xóa/khóa Chat Xã Hội</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saFine}
                      onChange={(e) => setSaFine(e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    <span>Quyền Cảnh sát phạt Đèn đỏ</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{subAdminUidSet.has(saUid.trim()) ? 'Cập nhật Quản Lý Phụ' : 'Bổ nhiệm Quản Lý Phụ'}</span>
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  Danh sách Quản lý phụ hiện tại ({subAdmins.length})
                </h4>
                {subAdmins.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    Chưa bổ nhiệm Quản lý phụ nào. Các tài khoản có thể bấm nút "Copy UID" ở góc trái để gửi mã UID cho bạn.
                  </p>
                ) : (
                  subAdmins.map((sa) => (
                    <div
                      key={sa.uid}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{sa.displayName}</span>
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-semibold">
                            {sa.jobTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {sa.email} · UID: <span className="font-mono-nums text-slate-300">{sa.uid}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                          {sa.canMuteMic && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">Tắt Mic</span>
                          )}
                          {sa.canModerateChat && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300">Quản lý Chat</span>
                          )}
                          {sa.canIssueFine && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300">Phạt Đèn Đỏ</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSaUid(sa.uid);
                            setSaEmail(sa.email);
                            setSaName(sa.displayName);
                            setSaJobType(sa.jobType);
                            setSaJobTitle(sa.jobTitle);
                            setSaMic(sa.canMuteMic);
                            setSaChat(sa.canModerateChat);
                            setSaFine(sa.canIssueFine);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                        >
                          Sửa quyền
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSubAdmin(sa.uid)}
                          className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-800 text-rose-300"
                          title="Thu hồi quyền Quản lý phụ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ASSIGNMENTS / DELEGATED JOBS */}
          {effectiveTab === 'tasks' && (
            <div className="space-y-5">
              {isSuperAdmin && (
                <form
                  onSubmit={handleSubmitAssignment}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span>Giao công việc mới cho Quản lý phụ / Thành viên</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      value={taskAssigneeUid}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setTaskAssigneeUid(uid);
                        const cand = taskCandidates.get(uid);
                        if (cand) setTaskAssigneeName(cand.name);
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="">-- Chọn người nhận việc --</option>
                      {Array.from(taskCandidates.values()).map((c) => (
                        <option key={c.uid} value={c.uid}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={taskAssigneeUid}
                      onChange={(e) => setTaskAssigneeUid(e.target.value)}
                      placeholder="Hoặc dán UID người nhận"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-nums text-white"
                    />
                    <select
                      value={taskCategory}
                      onChange={(e) =>
                        setTaskCategory(e.target.value as AdminAssignment['jobCategory'])
                      }
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="teacher">Công tác Giáo viên / Lớp học</option>
                      <option value="police">Tuần tra Giao thông / Đèn đỏ</option>
                      <option value="discipline">Giữ trật tự Mic & Chat</option>
                      <option value="event">Tổ chức Sự kiện Sân khấu</option>
                      <option value="other">Công việc Khác</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Tiêu đề công việc (VD: Trực đèn đỏ giờ tan học)"
                      className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      step={5000}
                      value={taskReward}
                      onChange={(e) => setTaskReward(Number(e.target.value))}
                      placeholder="Thưởng (VND)"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-nums text-white"
                    />
                  </div>

                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={2}
                    placeholder="Mô tả chi tiết yêu cầu công việc..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Giao Việc Ngay (+{formatVND(taskReward)})</span>
                  </button>
                </form>
              )}

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300">
                  Danh sách Công việc ({assignments.length})
                </h4>
                {assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    Hiện chưa có nhiệm vụ nào được phân công.
                  </p>
                ) : (
                  assignments.map((task) => {
                    const isMine = task.assigneeUid === myUid;
                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">{task.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : task.status === 'in_progress'
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {task.status === 'completed'
                                ? 'Đã hoàn thành'
                                : task.status === 'in_progress'
                                  ? 'Đang thực hiện'
                                  : 'Chờ nhận'}
                            </span>
                            <span className="text-xs font-mono-nums text-amber-400 font-semibold">
                              Thưởng: {formatVND(task.rewardMoney)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{task.description}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Người phụ trách: <span className="text-slate-300">{task.assigneeName}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isMine && task.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAssignmentStatus(task.id, 'in_progress', task.rewardMoney)
                              }
                              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold"
                            >
                              Nhận việc
                            </button>
                          )}
                          {isMine && task.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAssignmentStatus(task.id, 'completed', task.rewardMoney)
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Hoàn thành</span>
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => onDeleteAssignment(task.id)}
                              className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-800 text-rose-300"
                              title="Xóa công việc"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
