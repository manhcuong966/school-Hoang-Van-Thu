import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  MicOff,
  Send,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { ChatMessage } from '../types/game';

interface SocialChatDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  myUid: string;
  isChatMuted: boolean;
  muteReason: string;
  canModerateChat: boolean;
  canMuteMic: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  onMuteUser: (targetUid: string, targetName: string, mode: 'mic' | 'chat') => Promise<void>;
}

function formatMsgTime(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const SocialChatDrawer: React.FC<SocialChatDrawerProps> = ({
  isOpen,
  onToggle,
  messages,
  myUid,
  isChatMuted,
  muteReason,
  canModerateChat,
  canMuteMic,
  onSendMessage,
  onDeleteMessage,
  onMuteUser,
}) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isOpen, messages.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean || isChatMuted || sending) return;
    setSending(true);
    try {
      await onSendMessage(clean);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pointer-events-auto fixed bottom-24 left-4 z-30 w-[340px] max-w-[92vw] bg-slate-900/95 border border-slate-700/85 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <span className="font-display font-bold text-sm text-white">Chat Xã Hội Toàn Trường</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          aria-label="Đóng chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="p-3 space-y-2.5 h-60 overflow-y-auto text-xs"
      >
        {messages.length === 0 ? (
          <p className="text-slate-400 text-center py-10">
            Chưa có tin nhắn nào. Hãy gửi lời chào tới mọi người!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderUid === myUid;
            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl border ${
                  isMine
                    ? 'bg-sky-950/40 border-sky-700/50'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-white truncate">{msg.senderName}</span>
                    {msg.senderRoleLabel && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          msg.senderRoleLabel.includes('Admin')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : msg.senderRoleLabel.includes('Giáo viên') ||
                                msg.senderRoleLabel.includes('Cảnh sát')
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {msg.senderRoleLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono-nums">
                      {formatMsgTime(msg.createdAtMs)}
                    </span>
                    {canModerateChat && (
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Xóa tin nhắn này"
                        className="p-1 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {!isMine && canMuteMic && (
                      <button
                        type="button"
                        onClick={() => onMuteUser(msg.senderUid, msg.senderName, 'mic')}
                        title="Tắt mic người này"
                        className="p-1 rounded hover:bg-amber-900/60 text-slate-400 hover:text-amber-300"
                      >
                        <MicOff className="w-3 h-3" />
                      </button>
                    )}
                    {!isMine && canModerateChat && (
                      <button
                        type="button"
                        onClick={() => onMuteUser(msg.senderUid, msg.senderName, 'chat')}
                        title="Khóa chat người này"
                        className="p-1 rounded hover:bg-rose-900/60 text-slate-400 hover:text-rose-300"
                      >
                        <ShieldAlert className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-200 mt-1 break-words leading-relaxed">{msg.text}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/70">
        {isChatMuted ? (
          <div className="px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-700/60 text-[11px] text-rose-200">
            Bạn đã bị khóa Chat{muteReason ? `: ${muteReason}` : '.'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={240}
              placeholder="Nhắn tin với mọi người..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 transition-colors"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
