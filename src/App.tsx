import React, { useState, useEffect } from "react";
import { useGame, GameProvider, Language, Room, Player } from "./state";
import { 
  ShieldAlert, 
  Crown, 
  Users, 
  ChevronRight, 
  LogOut, 
  Lock, 
  Unlock, 
  Trash2, 
  UserPlus, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Globe2, 
  Gamepad2, 
  UserCircle2, 
  Play, 
  DoorOpen, 
  Info,
  Server,
  Terminal,
  Skull,
  Edit3,
  X,
  LayoutDashboard
} from "lucide-react";

function GameApp() {
  const {
    language,
    translations,
    currentRoom,
    player,
    allRooms,
    isBoss,
    isFirebaseActive,
    changeLanguage,
    updateNickname,
    bossLogin,
    bossLogout,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    toggleRoomLock,
    deleteRoom,
    addSimulatedBotPlayer,
    clearSimulatedPlayers,
    triggerGameplayStart,
    firebaseError,
    clearFirebaseError,
    changeRoomId
  } = useGame();

  // --- UI States ---
  const [showBossModal, setShowBossModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState("");
  const [bossError, setBossError] = useState("");
  
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  
  const [profileNameInput, setProfileNameInput] = useState("");
  const [isBossDashboardOpen, setIsBossDashboardOpen] = useState(false);

  // Boss Edit Room ID Lobby State
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newRoomCode, setNewRoomCode] = useState("");
  const [codeEditError, setCodeEditError] = useState("");

  // Create Room custom states
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [createRoomName, setCreateRoomName] = useState("");
  const [createRoomDuration, setCreateRoomDuration] = useState<number>(45);
  const [createRoomMode, setCreateRoomMode] = useState<"public" | "private">("public");

  const generateRandomRoomName = () => {
    const prefixes = [language === "vi" ? "Mê Cung" : "Dungeon", language === "vi" ? "Hầm Ngục" : "Crypt", language === "vi" ? "Lâu Đài" : "Castle", language === "vi" ? "Pháo Đài" : "Fortress", language === "vi" ? "Vực Sâu" : "Abyss", language === "vi" ? "Sảnh Đường" : "Sanctuary", language === "vi" ? "Tế Đàn" : "Altar"];
    const names = [language === "vi" ? "Tối Thượng" : "Ultimate", language === "vi" ? "Ngôi Nhà Hạnh Phúc" : "Happy House", language === "vi" ? "Hắc Ám" : "Shadows", language === "vi" ? "Vô Tận" : "Infinity", language === "vi" ? "Sương Mù" : "Mist", language === "vi" ? "Hồng Ngọc" : "Ruby", language === "vi" ? "Bão Táp" : "Storm", language === "vi" ? "Ký Ức" : "Memory"];
    const suffix = Math.floor(100 + Math.random() * 900);
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const n = names[Math.floor(Math.random() * names.length)];
    return `${p} ${n} #${suffix}`;
  };

  const openCreateRoomFlow = () => {
    setCreateRoomName(generateRandomRoomName());
    setCreateRoomDuration(45);
    setCreateRoomMode("public");
    setShowCreateRoomModal(true);
  };

  const handleCreateRoomConfirm = async () => {
    try {
      const name = createRoomName.trim() || generateRandomRoomName();
      await createRoom(name, createRoomDuration, createRoomMode);
      setShowCreateRoomModal(false);
    } catch (err: any) {
      console.error("Create Room failed:", err);
    }
  };

  // Sync profile name input with player state
  useEffect(() => {
    if (player) {
      setProfileNameInput(player.nickname);
      if (!nicknameInput) {
        setNicknameInput(player.nickname);
      }
    }
  }, [player]);

  const handleBossSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBossError("");
    const success = await bossLogin(masterKeyInput);
    if (success) {
      setMasterKeyInput("");
      setShowBossModal(false);
      setIsBossDashboardOpen(true);
    } else {
      setBossError(translations.accessDenied);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    
    const cleanNick = nicknameInput.trim();
    if (!cleanNick) {
      setJoinError(translations.nicknameRequired);
      return;
    }
    if (!roomCodeInput.trim()) return;

    setJoinLoading(true);
    try {
      await joinRoom(roomCodeInput, cleanNick);
    } catch (err: any) {
      if (err.message === "roomNotFound") {
        setJoinError(translations.roomNotFound);
      } else if (err.message === "roomLocked") {
        setJoinError(translations.roomLocked);
      } else if (err.message === "roomFull") {
        setJoinError(translations.roomFull);
      } else {
        setJoinError("Failed to join room: " + err.message);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (profileNameInput.trim()) {
      await updateNickname(profileNameInput);
      setShowProfileModal(false);
    }
  };

  // Boss Code modifications
  const handleSaveRoomCode = async () => {
    if (!currentRoom) return;
    setCodeEditError("");
    const trimmed = newRoomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!trimmed) {
      setCodeEditError(translations.invalidRoomCode);
      return;
    }
    try {
      if (currentRoom.status === "locked") {
        setCodeEditError(translations.roomLockedCannotEdit);
        return;
      }
      await changeRoomId(currentRoom.id, trimmed);
      setIsEditingCode(false);
    } catch (err: any) {
      if (err.message === "roomCodeExists") {
        setCodeEditError(translations.roomCodeExists);
      } else if (err.message === "roomLockedCannotEdit") {
        setCodeEditError(translations.roomLockedCannotEdit);
      } else if (err.message === "invalidCode") {
        setCodeEditError(translations.invalidRoomCode);
      } else {
        setCodeEditError("Failed: " + err.message);
      }
    }
  };

  const startEditingCode = () => {
    if (!currentRoom) return;
    if (currentRoom.status === "locked") {
      alert(translations.roomLockedCannotEdit);
      return;
    }
    setNewRoomCode(currentRoom.id);
    setCodeEditError("");
    setIsEditingCode(true);
  };

  const handleStartDungeon = () => {
    if (!currentRoom) return;
    const currentCount = currentRoom.players.length;
    
    if (currentCount < 8 || currentCount > 12) {
      alert(`${translations.systemNotice}: ${translations.playerCountGuide}`);
      return;
    }

    const unreadyPlayers = currentRoom.players.filter(p => !p.isReady);
    if (unreadyPlayers.length > 0) {
      alert(`${translations.systemNotice}: ${language === "vi" 
        ? "Vẫn còn người chơi chưa sẵn sàng tham chiến!" 
        : language === "zh" 
          ? "仍有成员未准备就绪！" 
          : "There are still standby personnel who are not ready!"}`);
      return;
    }

    triggerGameplayStart();
  };

  return (
    <div className="min-h-screen bg-[#06080c] bg-radial-[circle_at_top] from-[#0f1422] to-[#04060a] text-[#d1d5db] font-sans flex flex-col selection:bg-[#45f3ff]/30 selection:text-[#45f3ff]">
      
      {/* --- Fixed Navigation Header --- */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#080d15]/95 border-b border-[#1f2d44]/60 backdrop-blur-md px-4 py-3 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#112240] to-[#08152c] border border-[#2a4570] flex items-center justify-center text-[#45f3ff] shadow-[0_0_15px_rgba(69,243,255,0.15)]">
              <Skull className="w-5 h-5 text-[#45f3ff] animate-pulse" />
            </div>
            {isBoss && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 rounded-full p-0.5 text-black">
                <Crown className="w-3 h-3" />
              </span>
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] text-[#f3f4f6]">E-RANK</h1>
            <p className="text-[10px] text-[#45f3ff] font-medium tracking-[0.1em]">{translations.subtitle}</p>
          </div>
        </div>

        {/* Dynamic Center Panel inside Header showing active Sector */}
        {currentRoom && (
          <div className="hidden sm:flex items-center gap-2 bg-[#0d1624] px-3 py-1.5 rounded-md border border-[#1b3554]">
            <span className="text-[11px] uppercase tracking-wider text-[#9ca3af]">{translations.room}:</span>
            <span className="font-mono text-sm text-[#45f3ff] font-semibold">{currentRoom.id}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b121e] border border-[#16273c]">
            <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 shadow-[0_0_8px_#f59e0b]"}`}></span>
            <span className="hidden md:inline text-[9px] font-mono uppercase text-[#9ca3af]">
              {isFirebaseActive ? translations.connected : translations.disconnected}
            </span>
          </div>

          {/* Unified Lang Selector */}
          <div className="flex items-center bg-[#0d1726] rounded border border-[#1f2d44] p-0.5">
            {(["vi", "en", "zh"] as Language[]).map((ln) => (
              <button
                key={ln}
                onClick={() => changeLanguage(ln)}
                className={`text-[9px] uppercase font-bold px-1.5 py-1 rounded transition-all ${
                  language === ln 
                    ? "bg-[#18365a] text-[#45f3ff] font-black border border-[#23508c]" 
                    : "text-[#9ca3af] hover:text-[#f3f4f6]"
                }`}
              >
                {ln}
              </button>
            ))}
          </div>

          {/* Player Display Profile Edit Icon */}
          {player && (
            <button
              onClick={() => {
                setProfileNameInput(player.nickname);
                setShowProfileModal(true);
              }}
              title={translations.profile}
              className="flex items-center justify-center p-2 rounded bg-[#0d1726]/80 text-[#9ca3af] hover:text-[#45f3ff] border border-[#1c2e4b] hover:border-[#45f3ff]/40 transition-colors"
              id="btn_edit_profile"
            >
              <UserCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Spacing for fixed header */}
      <div className="h-16"></div>

      {/* --- Main Contents Area --- */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 flex flex-col justify-start">
        
        {/* Active Lobby Waiting Room Layout */}
        {currentRoom ? (
          <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            
            {/* Banner Section */}
            <div className="bg-[#0c1322] border border-[#1b3554] rounded-xl p-5 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              {/* Occluding Hexagonal Grid Pattern in BG */}
              <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#45f3ff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.2em] text-[#45f3ff]">
                    <Skull className="w-3.5 h-3.5" />
                    <span>{translations.lobbyTitle}</span>
                  </div>
                  <h2 className="text-xl font-black mt-1 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#f3f4f6] to-[#9ca3af]">
                    {currentRoom.name || "Ngôi Nhà Hạnh Phúc"}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#0b1728] border border-blue-950 text-blue-400 flex items-center gap-0.5 shrink-0">
                      ⏱️ {currentRoom.duration || 45}P
                    </span>
                    <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 shrink-0 ${
                      currentRoom.mode === "private" 
                        ? "bg-purple-950/40 border-purple-900/40 text-purple-400" 
                        : "bg-emerald-950/40 border-emerald-900/40 text-emerald-400"
                    }`}>
                      {currentRoom.mode === "private" ? (language === "vi" ? "Riêng tư" : "Private") : (language === "vi" ? "Công khai" : "Public")}
                    </span>
                  </div>
                </div>
                
                <div className="p-2 px-3 rounded text-right bg-[#070b14] border border-[#1a2f4c] flex flex-col items-end">
                  <p className="text-[9px] text-[#9ca3af] uppercase tracking-wider flex items-center gap-1">
                    {translations.room}
                    <span className={`font-mono text-[9px] uppercase font-bold tracking-tight px-1 py-0.5 border rounded-sm ${
                      currentRoom.status === "locked" 
                        ? "text-[#ff4a5a] bg-red-950/40 border-red-900/40" 
                        : "text-emerald-400 bg-emerald-950/40 border-emerald-900/40"
                    }`}>
                      {currentRoom.status === "locked" ? "LOCKED" : "OPEN"}
                    </span>
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1 z-20 relative">
                    <p className="font-mono text-base font-black text-[#45f3ff]">{currentRoom.id}</p>
                  </div>
                </div>
              </div>

              {/* Player counter and guideline status slider */}
              <div className="mt-4 pt-3 border-t border-[#1b2f4c] relative z-10 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#9ca3af]">{translations.currentPlayers}</span>
                  <span className="text-[#45f3ff] font-mono">{currentRoom.players.length} / 12</span>
                </div>
                {/* Visual grid indicators of slots */}
                <div className="h-1.5 w-full bg-[#080d15] rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-gradient-to-r from-[#205183] to-[#45f3ff] rounded-full transition-all duration-300"
                    style={{ width: `${(currentRoom.players.length / 12) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-[#6b7280] italic flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3 text-[#3b82f6] shrink-0" />
                  {translations.playerCountGuide}
                </p>
              </div>
            </div>

            {/* Players Grid (12 Slots) */}
            <div className="flex-1 flex flex-col gap-2.5">
              <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 pl-1 flex items-center justify-between">
                <span>{language === "vi" ? "Danh Sách Huyết Khế" : language === "zh" ? "神契契约契者" : "Enrolled Adventurers"}</span>
                <span className="font-mono text-[10px] text-slate-500">{currentRoom.players.length} / 12 max</span>
              </h3>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {/* Map players and fill remaining slots up to 12 */}
                {Array.from({ length: 12 }).map((_, index) => {
                  const p = currentRoom.players[index];
                  
                  if (p) {
                    const isSelf = player && p.id === player.id;
                    const isUserBot = p.id.startsWith("BOT_") || p.isBot;
                    return (
                      <div 
                        key={p.id}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                          isSelf 
                            ? "bg-[#101b2f] border-[#2c538c] shadow-[inset_0_0_10px_rgba(69,243,255,0.06)]"
                            : "bg-[#0a0f18] border-[#132236] hover:border-[#1b314d]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-black ${
                              isSelf 
                                ? "bg-[#183556] text-[#45f3ff] border-[#316cb0]" 
                                : isUserBot 
                                  ? "bg-[#1c2230] text-[#718da0] border-[#293547]" 
                                  : "bg-[#111927] text-slate-300 border-slate-700"
                            }`}>
                              {p.nickname.substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#06080c] ${
                              p.isOnline ? "bg-emerald-500 animate-[pulse_2s_infinite]" : "bg-zinc-500"
                            }`} title={p.isOnline ? translations.statusOnline : translations.statusOffline}></span>
                          </div>
                          
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold truncate text-slate-200 flex items-center gap-1.5">
                              {p.nickname}
                              {isSelf && <span className="text-[9px] px-1 bg-[#1c3858] text-[#45f3ff] rounded-sm uppercase tracking-tighter">You</span>}
                              {isUserBot && <span className="text-[9px] px-1 bg-[#202736] text-[#869cb3] rounded-sm uppercase tracking-tighter">Bot</span>}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono">
                              {p.isOnline ? translations.statusOnline : translations.statusOffline}
                            </p>
                          </div>
                        </div>

                        <div>
                          {p.isReady ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#142e28] text-emerald-400 border border-[#1e4e41] shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                              <Check className="w-3 h-3" />
                              <span>READY</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase px-2 py-0.5 border border-dashed border-slate-800 rounded">
                              WAITING
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Empty slot representation
                    return (
                      <div 
                        key={`empty-${index}`}
                        className="p-3 rounded-lg border border-dashed border-[#101b2d] bg-[#05080c]/40 flex items-center gap-3 select-none"
                      >
                        <div className="w-8 h-8 rounded-full border border-dashed border-[#1e3450] flex items-center justify-center text-[#1d3148] font-mono text-[10px]">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#1f3044] uppercase tracking-wider">
                            {language === "vi" 
                              ? "Tìm dũng giả" 
                              : language === "zh" 
                                ? "召唤宿主 ✚" 
                                : "Awaiting Seeker"}
                          </p>
                          <p className="text-[9px] font-mono text-[#1a293c]">Empty slot</p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Await Actions Footer */}
            <div className="mt-auto pt-6 pb-12 flex flex-col gap-3">
              {/* Ready Trigger for active player */}
              <button
                onClick={toggleReady}
                className={`py-3.5 px-4 rounded-xl font-bold uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 border shadow-lg ${
                  currentRoom.players.find(p => p.id === player?.id)?.isReady 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]" 
                    : "bg-[#13233c] hover:bg-[#1a3152] text-[#45f3ff] border-[#294c7b] shadow-[0_0_15px_rgba(69,243,255,0.05)]"
                }`}
                id="btn_player_ready"
              >
                <Check className="w-4 h-4" />
                <span>{currentRoom.players.find(p => p.id === player?.id)?.isReady ? translations.readyActive : translations.ready}</span>
              </button>

              {/* Start Dungeon Trigger visible exclusively to Boss of room */}
              {isBoss && (
                <button
                  onClick={handleStartDungeon}
                  className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-900 to-amber-700 hover:from-red-800 hover:to-amber-600 text-white font-bold uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-amber-600"
                  id="btn_boss_start_dungeon"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{translations.startDungeon}</span>
                </button>
              )}

              {/* Delete Custom Room option visible exclusively to Boss in Lobby */}
              {isBoss && (
                <button
                  onClick={async () => {
                    if (confirm(`${language === "vi" ? "Xác nhận xóa phòng này và rút lui toàn bộ người chơi?" : language === "zh" ? "确认立刻删除该副本星区，遣返所有参与者？" : "Are you sure you want to decommission this room and disconnect all personnel?"}`)) {
                      await deleteRoom(currentRoom.id);
                    }
                  }}
                  className="py-3 px-4 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-900/30 text-red-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                  id="btn_boss_delete_lobby_room"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{translations.deleteRoom}</span>
                </button>
              )}



              {/* Rời phòng button */}
              <button
                onClick={leaveRoom}
                className="py-2.5 px-4 rounded-lg bg-[#141517] hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs border border-zinc-800 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                id="btn_leave_room"
              >
                <DoorOpen className="w-4 h-4" />
                <span>{translations.leaveRoom}</span>
              </button>
            </div>

          </div>
        ) : (isBossDashboardOpen && isBoss) ? (
          
          /* --- BOSS DASHBOARD VIEW --- */
          <div className="flex-1 flex flex-col gap-4 animate-[fadeIn_0.4s_ease-out]">
            
            {/* Boss Banner */}
            <div className="bg-gradient-to-b from-[#1c1212] to-[#0d0909] border border-red-900/40 rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.25em] text-[#ff4a5a]">
                    <Crown className="w-4 h-4 text-[#ff2e63]" />
                    <span>{translations.bossDashboard}</span>
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-wider mt-1 text-slate-100 font-serif">
                    {language === "vi" ? "Chúa Tể Vực Sâu" : language === "zh" ? "契约法外之王" : "E-Rank Overlord"}
                  </h2>
                </div>
                <button
                  onClick={bossLogout}
                  title="Log out Boss mode"
                  className="p-1.5 bg-[#401216] text-[#ff808b] rounded border border-[#6b1c23] hover:bg-red-900 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Room creation panel */}
              <div className="mt-4 pt-4 border-t border-red-900/30 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-slate-400">{language === "vi" ? "Sáng tạo cổng phó bản" : "Instantiate Sector Port"}</p>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">Consecutive Room ID generation Engine</p>
                </div>
                <button
                  onClick={openCreateRoomFlow}
                  className="bg-[#ff1e42] hover:bg-[#ff415d] text-white p-2.5 px-4 font-bold rounded-lg text-xs uppercase tracking-wider transition-all border border-[#ff4e6a] shadow-[0_0_15px_rgba(255,30,66,0.3)] hover:scale-105 active:scale-95"
                  id="btn_boss_create_room"
                >
                  {translations.createRoom}
                </button>
              </div>
            </div>

            {/* Room List Grid */}
            <div className="flex-1 flex flex-col gap-3">
              <h3 className="text-xs uppercase font-bold tracking-widest text-[#ff4a5a] pl-1">
                {translations.roomList} ({allRooms.length})
              </h3>

              {allRooms.length === 0 ? (
                <div className="py-12 border border-slate-900 rounded bg-[#0b0c10] flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Terminal className="w-8 h-8 text-slate-700 animate-pulse" />
                  <p className="text-xs">{translations.noRooms}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {allRooms.map((room) => (
                    <div 
                      key={room.id}
                      className="p-3.5 bg-[#0a0c10] border border-[#191e2b] hover:border-[#222b3f] rounded-lg flex items-center justify-between transition-colors shadow-md"
                    >
                      <div className="flex flex-col gap-2.5 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-center p-1.5 bg-[#0e1624] border border-[#21354c] rounded">
                            <p className="font-mono text-xs font-bold text-[#45f3ff] shrink-0">{room.id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                              {room.name || `Dungeon ${room.id}`}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 mt-1">
                              <span>
                                {translations.currentPlayers}: <span className="text-[#45f3ff] font-mono font-bold">{room.players.length}/12</span>
                              </span>
                              <span className="text-slate-800">•</span>
                              <span className="font-mono text-[#38bdf8]">
                                ⏱️ {room.duration || 45}P
                              </span>
                              <span className="text-slate-800">•</span>
                              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded border ${
                                room.mode === "private" 
                                  ? "bg-purple-950/40 border-purple-900/40 text-purple-400" 
                                  : "bg-emerald-950/40 border-emerald-900/40 text-emerald-400"
                              }`}>
                                {room.mode === "private" ? "PRIVATE" : "PUBLIC"}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-500 flex items-center gap-1 mt-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${room.status === "open" ? "bg-emerald-500" : "bg-red-500"}`}></span>
                              {room.status === "locked" ? translations.roomLocked : (language === "vi" ? "Chờ dũng giả gia nhập..." : "Open lobby awaiting...")}
                            </p>
                          </div>
                        </div>

                        {/* Connected Players in this room */}
                        {room.players.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {room.players.map((p) => (
                              <span 
                                key={p.id} 
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${
                                  p.isReady 
                                    ? "bg-[#142e28] border-[#1e4e41] text-emerald-400" 
                                    : "bg-[#131b26] border-slate-800 text-slate-400"
                                }`}
                              >
                                {p.nickname}
                                {p.isReady && <span className="text-[9px] text-emerald-500 font-bold">✓</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 italic font-mono mt-1">
                            {language === "vi" ? "Chưa có người chơi nào" : "No active players yet"}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* Join Lobby to test as Player / Overseer */}
                        <button
                          onClick={async () => {
                            try {
                              if (player) {
                                await joinRoom(room.id, player.nickname);
                              }
                            } catch (e: any) {
                              alert("Join error: " + e.message);
                            }
                          }}
                          className="bg-[#111e30] border border-[#233c5e] hover:bg-[#1a3151] hover:border-[#2d4d7a] text-[#45f3ff] p-2 text-xs font-bold rounded flex items-center justify-center tooltip"
                          title="Lobby Interface"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Room */}
                        <button
                          onClick={() => {
                            if (confirm(`${language === "vi" ? "Xác nhận phá hủy phòng?" : "Confirm sector purge?"}`)) {
                              deleteRoom(room.id);
                            }
                          }}
                          className="p-2 rounded border bg-[#0f1115] border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-900 transition-colors flex items-center justify-center"
                          title={translations.deleteRoom}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Dashboard back to Lobby Home */}
            <div className="mt-auto pt-6 pb-12">
              <button
                onClick={() => setIsBossDashboardOpen(false)}
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-zinc-800"
              >
                {translations.closeDashboard}
              </button>
            </div>

          </div>
        ) : (
          
          /* --- MAIN DEFAULT HUB SCREEN --- */
          <div className="flex-1 flex flex-col items-center justify-center py-6 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Logo / Mystic Title Decoration */}
            <div className="text-center mb-10 mt-4 relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-10 blur-xl pointer-events-none w-48 h-48 bg-[#45f3ff] rounded-full animate-pulse"></div>
              
              <div className="inline-block p-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 rounded-full mb-3">
                <div className="bg-[#06080c] px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-[0.3em] font-mono text-[#45f3ff]">
                  Rules Survival Base
                </div>
              </div>

              {/* Title Header */}
              <h1 className="text-3xl font-black uppercase text-slate-100 font-serif tracking-wider leading-[1.3] text-transparent bg-clip-text bg-gradient-to-b from-[#f3f4f6] to-[#9ca3af]">
                E-Rank Dungeon
              </h1>
              <p className="text-red-500 font-extrabold uppercase tracking-[0.35em] text-sm mt-1 sm:text-base pr-[-0.35em] drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                {translations.subtitle}
              </p>
              
              {/* Thin Decorative Border line under titles */}
              <div className="w-32 h-0.5 mt-5 bg-gradient-to-r from-transparent via-[#203650] to-transparent mx-auto"></div>
            </div>

            {/* Quick entry user setup */}
            <div className="w-full bg-[#0c1322]/60 border border-[#1b3554]/60 rounded-xl p-5 mb-5 backdrop-blur-sm shadow-md">
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCircle2 className="w-4 h-4 text-[#45f3ff]" />
                  <span>{translations.profile}</span>
                </span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-950/40 border border-red-900/40 text-red-400 font-bold tracking-wider">
                  {language === "vi" ? "Bắt buộc" : language === "zh" ? "必填" : "Required"}
                </span>
              </label>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => {
                      const cleanName = e.target.value.substring(0, 15);
                      setNicknameInput(cleanName);
                      // Live typing fallback
                      updateNickname(cleanName);
                    }}
                    placeholder={translations.nicknamePlaceholder}
                    className={`flex-1 bg-[#060a12] border rounded-lg px-4 py-2.5 text-sm text-[#f3f4f6] focus:outline-none focus:border-[#45f3ff] focus:ring-1 focus:ring-[#45f3ff]/30 transition-all font-semibold ${
                      !nicknameInput.trim() ? "border-red-900/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "border-[#1d3350]"
                    }`}
                  />
                </div>
                {!nicknameInput.trim() && (
                  <p className="text-[10px] text-red-400 font-mono italic mt-0.5 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400 animate-ping"></span>
                    * {translations.nicknameRequired}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons list (Main actions) */}
            <div className="w-full flex flex-col gap-3">
              
              {/* JOIN DUNGEON PANEL */}
              <div className="bg-[#0b121e]/80 border border-[#132238] rounded-xl p-5 shadow-lg">
                <h2 className="text-xs uppercase font-extrabold tracking-widest text-[#45f3ff] mb-4 flex items-center gap-1.5">
                  <Gamepad2 className="w-4.5 h-4.5 text-[#45f3ff]" />
                  <span>{translations.joinButton}</span>
                </h2>

                <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.trim().toUpperCase())}
                      placeholder={translations.roomCodePlaceholder}
                      className="w-full bg-[#060a12] border border-[#1d3350] rounded-lg px-4 py-3 text-center text-base font-mono font-black placeholder:font-sans placeholder:text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#45f3ff] focus:ring-1 focus:ring-[#45f3ff]/30 transition-all"
                    />
                  </div>

                  {joinError && (
                    <div className="flex items-center gap-1.5 text-xs text-[#ff4a5a] bg-[#250d12] border border-[#521320] p-2.5 rounded-lg animate-shake">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{joinError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={joinLoading}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[#21548e] to-[#2ea9bd] hover:from-[#2e69ad] hover:to-[#38c2da] text-white font-extrabold uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 border border-[#44bbcf] shadow-[0_4px_15px_rgba(69,243,255,0.15)] disabled:opacity-50"
                    id="btn_join_room_submit"
                  >
                    {joinLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>{translations.joinRoomSubmit}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* ADMIN ACCESS AND SWITCHES */}
              <div className="flex gap-2 w-full mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMasterKeyInput("");
                    setBossError("");
                    setShowBossModal(true);
                  }}
                  className="w-full py-3 bg-[#110d10] hover:bg-zinc-900 text-slate-300 hover:text-white font-bold rounded-lg border border-red-900/30 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                  id="btn_open_boss_modal"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{translations.bossButton}</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-950 mt-auto text-center text-[10px] text-slate-600 font-mono tracking-wider bg-[#040609]/70 relative z-10 select-none">
        <p>© 2026 E-RANK DUNGEON - NGÔI NHÀ HẠNH PHÚC APPLET</p>
        <p className="mt-1 text-slate-700 uppercase">Phase 1 Infrastructure Ready</p>
      </footer>

      {/* --- Boss Master Key Entry Modal --- */}
      {showBossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-sm bg-[#0e0e0e] border border-red-900/50 rounded-xl p-5 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-[#ff2e63]" />
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                {translations.enterMasterKey}
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-4 tracking-wide leading-relaxed">
              {language === "vi" 
                ? "Sử dụng mã bí mật để đánh thức quyền năng Boss. Quyền lực này giúp bạn điều phối mở, xóa hoặc khóa sổ phó bản phòng." 
                : "Utilize master sequence to assume Dungeon Boss Overlord capabilities."}
              <br/>
              <span className="text-amber-500 font-mono mt-1 block">💡 Test default Key: <span className="underline select-all font-black bg-amber-500/10 px-1 border border-amber-500/30">ERANK_BOSS</span></span>
            </p>

            <form onSubmit={handleBossSubmit} className="flex flex-col gap-3">
              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={masterKeyInput}
                  onChange={(e) => setMasterKeyInput(e.target.value)}
                  placeholder={translations.masterKeyPlaceholder}
                  className="w-full bg-[#070707] border border-[#2d1c20] text-[#f3f4f6] text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#ff2e63] font-mono tracking-wider focus:ring-1 focus:ring-[#ff2e63]/30"
                />
              </div>

              {bossError && (
                <div className="text-xs text-red-500 bg-red-950/40 border border-red-900 p-2.5 rounded-lg flex items-center gap-1.5 animate-shake">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{bossError}</span>
                </div>
              )}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowBossModal(false)}
                  className="flex-1 py-2 rounded text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold uppercase tracking-wider border border-zinc-800/60"
                >
                  {translations.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded text-xs bg-[#ff1e42] hover:bg-[#ff415d] text-white font-bold uppercase tracking-wider border border-[#ff4e6a] shadow-[0_0_15px_rgba(255,30,66,0.2)]"
                  id="btn_boss_auth_submit"
                >
                  {translations.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Profile Nickname Edit Modal --- */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-sm bg-[#0a0f18] border border-sky-950 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-[#45f3ff]">
              <UserCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                {language === "vi" ? "Thiết Lập Bản Thể" : "Configure Combat Profile"}
              </h3>
            </div>

            <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
              {language === "vi" 
                ? "Bí danh của bạn sẽ đại diện cho bạn trên danh sảnh chờ này phó bản thế giới." 
                : "Your combat identifier will represent your status inside active lobbies."}
            </p>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[10px] uppercase text-[#9ca3af] font-semibold mb-1.5">{translations.nickname}</label>
                <input
                  type="text"
                  maxLength={15}
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  className="w-full bg-[#05080d] border border-sky-950 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#45f3ff] font-bold"
                />
              </div>

              <div className="flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold uppercase tracking-wider border border-zinc-800"
                >
                  {translations.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveNickname}
                  className="flex-1 py-2.5 rounded text-xs bg-gradient-to-r from-[#21548e] to-[#2ea9bd] hover:from-[#2e69ad] hover:to-[#38c2da] text-white font-bold uppercase tracking-wider border border-[#44bbcf]"
                  id="btn_save_profile_nickname"
                >
                  {translations.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0b0f19] border border-red-950 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.85)] w-full max-w-md p-6 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 via-[#45f3ff] to-[#ff2e63] animate-[pulse_2s_infinite]"></div>
            
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black uppercase text-[#45f3ff] tracking-wider flex items-center gap-2">
                <Skull className="w-4 h-4 text-[#45f3ff]" />
                {language === "vi" ? "Bảng Khởi Tạo Phòng" : "Room Initialization Chamber"}
              </h3>
              <button 
                onClick={() => setShowCreateRoomModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Room Name field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  <span>{language === "vi" ? "Tên phòng" : "Room Name"}</span>
                  <button 
                    type="button"
                    onClick={() => setCreateRoomName(generateRandomRoomName())}
                    className="text-[10px] text-[#45f3ff] hover:text-[#45f3ff]/80 transition-colors flex items-center gap-1 font-mono uppercase bg-[#162a3f] px-2 py-0.5 border border-[#21435e] rounded"
                    title={language === "vi" ? "Tạo tên ngẫu nhiên" : "Generate random"}
                  >
                    <span>↺</span> Random
                  </button>
                </label>
                <input
                  type="text"
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  placeholder={language === "vi" ? "Nhập tên phòng..." : "Enter custom name..."}
                  maxLength={35}
                  className="w-full bg-[#05070a] border border-slate-800 text-[#f3f4f6] text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#45f3ff]/80 font-bold focus:ring-1 focus:ring-[#45f3ff]/30 text-slate-200"
                />
              </div>

              {/* Duration Select field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === "vi" ? "Thời gian chơi" : "Duration limit"}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[35, 45, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCreateRoomDuration(mins)}
                      className={`py-2 text-xs font-bold font-mono rounded-lg border transition-all ${
                        createRoomDuration === mins
                          ? "bg-[#ff1e42] text-white border-[#ff1e42] shadow-[0_0_10px_rgba(255,30,66,0.25)] scale-[1.02]"
                          : "bg-[#05070a] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {mins} {language === "vi" ? "PHÚT" : "MINS"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Mode Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === "vi" ? "Chế độ phòng" : "Room mode"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateRoomMode("public")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      createRoomMode === "public"
                        ? "bg-[#112d26] border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        : "bg-[#05070a] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-black font-sans uppercase tracking-wider">
                      {language === "vi" ? "CÔNG KHAI" : "PUBLIC"}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {language === "vi" ? "Ai cũng có thể thấy" : "Visible to anyone"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateRoomMode("private")}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      createRoomMode === "private"
                        ? "bg-[#2d112b] border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                        : "bg-[#05070a] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-xs font-black font-sans uppercase tracking-wider">
                      {language === "vi" ? "RIÊNG TƯ" : "PRIVATE"}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {language === "vi" ? "Không hiện ở danh sách" : "Hidden from global lists"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateRoomModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors hover:bg-slate-700"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleCreateRoomConfirm}
                  className="flex-1 bg-[#ff1e42] hover:bg-[#ff415d] text-white py-2.5 font-bold rounded-lg text-xs uppercase tracking-wider transition-all border border-[#ff4e6a] shadow-[0_0_15px_rgba(255,30,66,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {language === "vi" ? "Xác nhận tạo" : "Instantiate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}
