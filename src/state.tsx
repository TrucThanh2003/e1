import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  firestore,
  isFirebaseConfigured,
  signInAnonymously,
  auth
} from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  collection,
  getDocs,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

// --- Types ---
export type Language = "vi" | "en" | "zh";

export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  isOnline: boolean;
  joinedAt: number;
  isBot?: boolean;
}

export interface Room {
  id: string; // e.g. "E0001"
  status: "open" | "locked";
  createdAt: number;
  players: Player[];
  name?: string;
  duration?: number;
  mode?: "public" | "private";
}

export interface GameContextType {
  language: Language;
  translations: typeof translations[Language];
  currentRoom: Room | null;
  player: Player | null;
  allRooms: Room[]; // For Boss dashboard
  isBoss: boolean;
  isFirebaseActive: boolean;
  isLoading: boolean;
  firebaseError: string | null;
  
  // Actions
  changeLanguage: (lang: Language) => void;
  updateNickname: (name: string) => Promise<void>;
  bossLogin: (key: string) => Promise<boolean>;
  bossLogout: () => void;
  createRoom: (name?: string, duration?: number, mode?: "public" | "private") => Promise<string>;
  joinRoom: (roomCode: string, name: string) => Promise<Room>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  toggleRoomLock: (roomCode: string, currentStatus: "open" | "locked") => Promise<void>;
  deleteRoom: (roomCode: string) => Promise<void>;
  addSimulatedBotPlayer: () => void;
  clearSimulatedPlayers: () => void;
  triggerGameplayStart: () => void;
  clearFirebaseError: () => void;
  changeRoomId: (oldId: string, newId: string) => Promise<void>;
}

// --- Translation Dictionary ---
export const translations = {
  vi: {
    title: "E-Rank Dungeon",
    subtitle: "Ngôi Nhà Hạnh Phúc",
    bossButton: "Tôi là Boss",
    joinButton: "Tham Gia Phó Bản",
    connectionStatus: "Bộ kết nối",
    connected: "Đã liên kết",
    disconnected: "Chế độ nội bộ",
    room: "Mã phòng",
    currentRoom: "Phòng hiện tại",
    noRoom: "Ngoài sảnh",
    language: "Ngôn ngữ",
    profile: "Hồ sơ",
    nickname: "Biệt danh",
    save: "Áp dụng",
    enterMasterKey: "Nhập Boss Master Key",
    masterKeyPlaceholder: "Nhập mã khóa tối cao...",
    submit: "Xác nhận",
    cancel: "Hủy bỏ",
    accessDenied: "Chìa khóa không hợp lệ. Quyền truy cập bị khước từ!",
    bossDashboard: "Liên Cương của Boss",
    createRoom: "Khai Mở Phòng Mới",
    roomList: "Lãnh Địa Phòng Hiện Có",
    playerList: "Người Chơi Trong Phòng",
    noRooms: "Chưa có phòng nào được thiết lập.",
    lockRoom: "Khóa Lại",
    unlockRoom: "Khai Mở",
    deleteRoom: "Xóa Bỏ",
    startDungeon: "Xâm Nhập Phó Bản",
    closeDashboard: "Thoát Quyền Boss",
    enterRoomCode: "Mã Số Phòng Chờ",
    roomCodePlaceholder: "Ví dụ: E0001",
    enterNickname: "Ký Danh Tham Chiến",
    nicknamePlaceholder: "Nhập biệt danh...",
    joinRoomSubmit: "Bước Vào",
    roomNotFound: "Mã phòng không tồn tại hoặc đã bị tiêu hủy!",
    roomLocked: "Phòng phó bản hiện đang bị Boss khóa chặt!",
    roomFull: "Phòng phó bản đã đạt giới hạn 12 người!",
    lobbyTitle: "Phòng Chờ Tâm Linh",
    statusOnline: "Có mặt",
    statusOffline: "Vắng mặt",
    ready: "Sẵn Sàng",
    readyActive: "Đã Sẵn Sàng",
    notReady: "Sẵn Sàng?",
    currentPlayers: "Số lượng tham chiến",
    gameplayUpcoming: "Gameplay chi tiết sẽ sớm được giải giới trong giai đoạn phát triển tiếp theo.",
    playerCountGuide: "Yêu cầu cần tuyển mộ từ 8 đến 12 dũng giả sẵn sàng để khai mở.",
    leaveRoom: "Rời Khỏi",
    backToHome: "Cổng Chính",
    botPanel: "Giả Phân Thân (Mô Phỏng)",
    addBot: "Nhập một phân thân",
    clearBots: "Biến mất tất cả",
    systemNotice: "Thông báo hệ thống",
    editRoomCode: "Sửa mã phòng",
    roomCodeExists: "Mã phòng mới đã tồn tại, vui lòng chọn mã khác!",
    roomLockedCannotEdit: "Phòng đang bị khóa! Hãy mở khóa phòng trước khi sửa mã.",
    invalidRoomCode: "Mã phòng không hợp lệ! Chỉ sử dụng chữ cái viết hoa và chữ số (A-Z, 0-9).",
    nicknameRequired: "Vui lòng nhập biệt danh tại mục Hồ sơ trước khi tham gia!",
  },
  en: {
    title: "E-Rank Dungeon",
    subtitle: "Happy Home",
    bossButton: "I am Boss",
    joinButton: "Join Dungeon",
    connectionStatus: "Connection",
    connected: "Firebase Linked",
    disconnected: "Offline Sandbox",
    room: "Room Code",
    currentRoom: "Current Room",
    noRoom: "In Lobby",
    language: "Language",
    profile: "Profile",
    nickname: "Nickname",
    save: "Apply",
    enterMasterKey: "Enter Boss Master Key",
    masterKeyPlaceholder: "Enter master key...",
    submit: "Verify",
    cancel: "Cancel",
    accessDenied: "Master Key invalid. Access strictly denied!",
    bossDashboard: "Boss Command Panel",
    createRoom: "Deploy New Room",
    roomList: "Active Command Sectors",
    playerList: "Sector Personnel",
    noRooms: "No command sectors deployed yet.",
    lockRoom: "Lock Room",
    unlockRoom: "Unlock Room",
    deleteRoom: "Decommission",
    startDungeon: "Initialize Dungeon Core",
    closeDashboard: "Exit Command Mode",
    enterRoomCode: "Enter Sector Code",
    roomCodePlaceholder: "e.g., E0001",
    enterNickname: "Enter Combat Profile Code",
    nicknamePlaceholder: "Enter alias...",
    joinRoomSubmit: "Interface",
    roomNotFound: "Room code not located or destroyed!",
    roomLocked: "This dungeon entry is currently secured by the Boss!",
    roomFull: "Dungeon entry slots exhausted (max 12 players)!",
    lobbyTitle: "Ritual Lobby",
    statusOnline: "Online",
    statusOffline: "Offline",
    ready: "Standby",
    readyActive: "READY",
    notReady: "STANDBY?",
    currentPlayers: "Committed Personnel",
    gameplayUpcoming: "Core rules and sub-systems will unlock in the next developmental phase.",
    playerCountGuide: "Requires between 8 to 12 active players to initiate structural gateway.",
    leaveRoom: "Disconnect",
    backToHome: "Main Hall",
    botPanel: "Simulate Clones (Sandbox Tool)",
    addBot: "Inject Simulator Bot",
    clearBots: "Purge Simulator Bots",
    systemNotice: "System Alert",
    editRoomCode: "Edit Room Code",
    roomCodeExists: "This room code already exists. Please choose another!",
    roomLockedCannotEdit: "Room is locked! Please unlock the room first to edit its code.",
    invalidRoomCode: "Invalid room code! Only alphanumeric characters (A-Z, 0-9) are allowed.",
    nicknameRequired: "Please enter a nickname under the Profile section to participate!",
  },
  zh: {
    title: "E级地下城",
    subtitle: "幸福之家",
    bossButton: "我是堡主 (Boss)",
    joinButton: "钻入副本",
    connectionStatus: "联络节点",
    connected: "云服务器已联",
    disconnected: "单机沙盒模式",
    room: "副本序列",
    currentRoom: "当前所辖",
    noRoom: "暂存大厅",
    language: "语言",
    profile: "个人名册",
    nickname: "匿称",
    save: "存留",
    enterMasterKey: "输入堡主万能密钥",
    masterKeyPlaceholder: "请输入主密钥...",
    submit: "核对",
    cancel: "舍弃",
    accessDenied: "万能密钥无效！您的访问被系统强制折返。",
    bossDashboard: "堡主中央节制台",
    createRoom: "生成新避难所",
    roomList: "避难所管制星区",
    playerList: "宿主人员",
    noRooms: "当下没有任何星区建立。",
    lockRoom: "锁闭",
    unlockRoom: "解封",
    deleteRoom: "除名",
    startDungeon: "开启最终序列",
    closeDashboard: "退出中央指挥",
    enterRoomCode: "输入避难所编号",
    roomCodePlaceholder: "例如：E0001",
    enterNickname: "登录玩家代号",
    nicknamePlaceholder: "输入名字...",
    joinRoomSubmit: "进入",
    roomNotFound: "房间代码搜寻失败或已被折叠消解！",
    roomLocked: "星区已被堡主进行绝对电磁锁闭！",
    roomFull: "避难所人数负载已达12人上限！",
    lobbyTitle: "副本静守大厅",
    statusOnline: "在位",
    statusOffline: "流离",
    ready: "备绪",
    readyActive: "已就位",
    notReady: "准备？",
    currentPlayers: "登舱总容量",
    gameplayUpcoming: "深度法则玩法和战斗构筑将在下一纪元解包面世。",
    playerCountGuide: "必须招募 8 至 12 位成员并全部准备就绪方能鸣响核心。",
    leaveRoom: "断开链接",
    backToHome: "主庭",
    botPanel: "拟人镜像器 (检测沙盒)",
    addBot: "投放机器人镜像",
    clearBots: "肃清所有镜像",
    systemNotice: "系统告示",
    editRoomCode: "编辑房间代码",
    roomCodeExists: "该房间代码已存在，请换一个输入！",
    roomLockedCannotEdit: "房间已被锁定！请先解锁房间再编辑代码。",
    invalidRoomCode: "房间代码无效！只能包含字母与数字（A-Z, 0-9）。",
    nicknameRequired: "请先在个人名册中输入代号以钻入副本！",
  }
};

const DEFAULT_MASTER_KEY = import.meta.env.VITE_BOSS_MASTER_KEY || "ERANK_BOSS";

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");
  const [isBoss, setIsBoss] = useState<boolean>(() => {
    return localStorage.getItem("erank_is_boss") === "true";
  });
  
  // Local Player Session Setup
  const [player, setPlayer] = useState<Player | null>(null);

  // Synchronized state
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamic Firebase link status and error fallback tracking
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(isFirebaseConfigured);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const clearFirebaseError = () => {
    setFirebaseError(null);
  };

  // Initialize player identity
  useEffect(() => {
    let pid = localStorage.getItem("erank_player_id");
    if (!pid) {
      pid = "P_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem("erank_player_id", pid);
    }
    
    let defaultNick = localStorage.getItem("erank_nickname") || "";
    if (defaultNick.startsWith("Challenger_")) {
      defaultNick = "";
      localStorage.setItem("erank_nickname", "");
    }

    setPlayer({
      id: pid,
      nickname: defaultNick,
      isReady: false,
      isOnline: true,
      joinedAt: Date.now()
    });
    
    // Auto-login anonymously to Firebase if configured
    if (isFirebaseConfigured && auth) {
      signInAnonymously(auth).catch((err) => {
        console.warn("Anonymous Firebase sign-in failed, falling back to client mode:", err);
        setFirebaseError(err.message || String(err));
        setIsFirebaseActive(false);
      });
    }

    setIsLoading(false);
  }, []);

  // --- LOCAL MODE PERSISTENCE & MULTI-TAB SYNC ---
  // If Firebase is active, we use Firestore. Otherwise, we use LocalStorage.
  // We sync LocalStorage rooms across active tabs with 'storage' events.
  const loadLocalRooms = (): { rooms: Room[]; counter: number } => {
    try {
      const storedRooms = localStorage.getItem("erank_rooms");
      const storedCounter = localStorage.getItem("erank_room_counter");
      
      const rooms: Room[] = storedRooms ? JSON.parse(storedRooms) : [];
      const counter: number = storedCounter ? parseInt(storedCounter, 10) : 0;
      return { rooms, counter };
    } catch {
      return { rooms: [], counter: 0 };
    }
  };

  const saveLocalRooms = (rooms: Room[], counter?: number) => {
    localStorage.setItem("erank_rooms", JSON.stringify(rooms));
    if (counter !== undefined) {
      localStorage.setItem("erank_room_counter", counter.toString());
    }
    // Storage logs don't fire on the current window, so we update state manually
    setAllRooms(rooms);
    
    // If the player is currently in a room, update currentRoom state from the loaded list
    if (currentRoom) {
      const matched = rooms.find(r => r.id === currentRoom.id);
      if (matched) {
        setCurrentRoom(matched);
      } else {
        // Room was deleted
        setCurrentRoom(null);
      }
    }
  };

  // --- Realtime Firebase Sync ---
  useEffect(() => {
    if (!isFirebaseActive || !firestore) {
      // Local Sync: Set initial allRooms
      const { rooms } = loadLocalRooms();
      setAllRooms(rooms);

      // Listen to cross-tab updates matching the localStorage key
      const handleStorageUpdate = (e: StorageEvent) => {
        if (e.key === "erank_rooms") {
          const { rooms: updatedRooms } = loadLocalRooms();
          setAllRooms(updatedRooms);
          
          if (currentRoom) {
            let matched = updatedRooms.find(r => r.id === currentRoom.id);
            if (!matched && player) {
              // Self-healing: if room code changed, find room where player is still participating
              matched = updatedRooms.find(r => r.players.some(p => p.id === player.id));
            }
            if (matched) {
              setCurrentRoom(matched);
            } else {
              setCurrentRoom(null);
            }
          }
        }
      };
      window.addEventListener("storage", handleStorageUpdate);
      return () => window.removeEventListener("storage", handleStorageUpdate);
    } else {
      // Firebase Sync: Subscribe to ALL rooms
      const roomsCol = collection(firestore, "rooms");
      const unsubscribe = onSnapshot(roomsCol, (snapshot) => {
        const fetchedRooms: Room[] = [];
        snapshot.forEach((docSnap) => {
          fetchedRooms.push(docSnap.data() as Room);
        });
        
        // Sort by id ascending (E0001, E0002)
        fetchedRooms.sort((a, b) => a.id.localeCompare(b.id));
        setAllRooms(fetchedRooms);

        // Keep current room synchronized
        if (currentRoom) {
          let matched = fetchedRooms.find(r => r.id === currentRoom.id);
          if (!matched && player) {
            // Self-healing: if room code changed, find room where player is still participating
            matched = fetchedRooms.find(r => r.players.some(p => p.id === player.id));
          }
          if (matched) {
            setCurrentRoom(matched);
          } else {
            setCurrentRoom(null);
          }
        }
      }, (error) => {
        console.error("Firebase dynamic snapshot subscription failed, falling back to Local Storage mode:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
      });

      return () => unsubscribe();
    }
  }, [firestore, isFirebaseActive, currentRoom?.id, player?.id]);

  // Handle player online/offline triggers safely
  useEffect(() => {
    if (!player || !currentRoom) return;

    const setOnlineState = async (online: boolean) => {
      const updatedPlayers = currentRoom.players.map(p => 
        p.id === player.id ? { ...p, isOnline: online } : p
      );

      if (isFirebaseActive && firestore) {
        try {
          const roomRef = doc(firestore, "rooms", currentRoom.id);
          await updateDoc(roomRef, { players: updatedPlayers });
        } catch (e: any) {
          console.error("Failed to update firestore online state", e);
        }
      } else {
        const { rooms } = loadLocalRooms();
        const nextRooms = rooms.map(r => 
          r.id === currentRoom.id ? { ...r, players: updatedPlayers } : r
        );
        saveLocalRooms(nextRooms);
      }
    };

    // Set online
    setOnlineState(true);

    const handleBeforeUnload = () => {
      setOnlineState(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentRoom?.id, player?.id, isFirebaseActive]);

  // Language management
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  // Update nickname
  const updateNickname = async (name: string) => {
    if (!player) return;
    const cleanName = name.trim().slice(0, 15) || "Challenger";
    localStorage.setItem("erank_nickname", cleanName);
    
    const updatedPlayer = { ...player, nickname: cleanName };
    setPlayer(updatedPlayer);

    // If currently in a room, edit player nickname inside the database
    if (currentRoom) {
      const updatedPlayers = currentRoom.players.map(p => 
        p.id === player.id ? { ...p, nickname: cleanName } : p
      );

      if (isFirebaseActive && firestore) {
        try {
          const roomRef = doc(firestore, "rooms", currentRoom.id);
          await updateDoc(roomRef, { players: updatedPlayers });
        } catch (error: any) {
          console.error("Firebase update nickname failed, falling back to local mode:", error);
          setFirebaseError(error.message || String(error));
          setIsFirebaseActive(false);
          const { rooms } = loadLocalRooms();
          const nextRooms = rooms.map(r => 
            r.id === currentRoom.id ? { ...r, players: updatedPlayers } : r
          );
          saveLocalRooms(nextRooms);
          setCurrentRoom({ ...currentRoom, players: updatedPlayers });
        }
      } else {
        const { rooms } = loadLocalRooms();
        const nextRooms = rooms.map(r => 
          r.id === currentRoom.id ? { ...r, players: updatedPlayers } : r
        );
        saveLocalRooms(nextRooms);
        setCurrentRoom({ ...currentRoom, players: updatedPlayers });
      }
    }
  };

  // Boss Login authentication with Master Key
  const bossLogin = async (key: string): Promise<boolean> => {
    if (key === DEFAULT_MASTER_KEY) {
      setIsBoss(true);
      localStorage.setItem("erank_is_boss", "true");
      return true;
    }
    return false;
  };

  const bossLogout = () => {
    setIsBoss(false);
    localStorage.setItem("erank_is_boss", "false");
  };

  // --- Creating sequential room: E0001, E0002... ---
  const createRoom = async (name?: string, duration?: number, mode?: "public" | "private"): Promise<string> => {
    const createRoomLocal = () => {
      const { rooms, counter } = loadLocalRooms();
      const nextCounter = counter + 1;
      const roomCode = "E" + String(nextCounter).padStart(4, "0");
      
      const newRoom: Room = {
        id: roomCode,
        status: "open",
        createdAt: Date.now(),
        players: [],
        name: name || `Dungeon ${roomCode}`,
        duration: duration || 45,
        mode: mode || "public"
      };

      const updatedRooms = [...rooms, newRoom];
      saveLocalRooms(updatedRooms, nextCounter);
      return roomCode;
    };

    if (isFirebaseActive && firestore) {
      // Use Firestore transaction to increment counter reliably
      const counterDocRef = doc(firestore, "counters", "rooms");
      
      try {
        const resultId = await runTransaction(firestore, async (transaction) => {
          const counterSnap = await transaction.get(counterDocRef);
          let count = 1;

          if (counterSnap.exists()) {
            count = (counterSnap.data().value || 0) + 1;
            transaction.update(counterDocRef, { value: count });
          } else {
            transaction.set(counterDocRef, { value: count });
          }

          const roomCode = "E" + String(count).padStart(4, "0");
          const roomDocRef = doc(firestore, "rooms", roomCode);
          
          const newRoom: Room = {
            id: roomCode,
            status: "open",
            createdAt: Date.now(),
            players: [],
            name: name || `Dungeon ${roomCode}`,
            duration: duration || 45,
            mode: mode || "public"
          };
          
          transaction.set(roomDocRef, newRoom);
          return roomCode;
        });
        
        return resultId;
      } catch (error: any) {
        console.error("Firestore transaction failed, retrying manual write or local fallback:", error);
        
        // If Firebase/Firestore is disabled/denied, fallback to local immediately
        if (
          error.message?.includes("Cloud Firestore API has not been used") ||
          error.message?.includes("disabled") ||
          error.code?.includes("permission-denied")
        ) {
          setFirebaseError(error.message || String(error));
          setIsFirebaseActive(false);
          return createRoomLocal();
        }

        // Fallback robust sequence
        try {
          const colRef = collection(firestore, "rooms");
          const allSnaps = await getDocs(colRef);
          let maxIndex = 0;
          allSnaps.forEach((docS) => {
            const numeric = parseInt(docS.id.substring(1), 10);
            if (!isNaN(numeric) && numeric > maxIndex) {
              maxIndex = numeric;
            }
          });
          const count = maxIndex + 1;
          const roomCode = "E" + String(count).padStart(4, "0");
          
          const newRoom: Room = {
            id: roomCode,
            status: "open",
            createdAt: Date.now(),
            players: [],
            name: name || `Dungeon ${roomCode}`,
            duration: duration || 45,
            mode: mode || "public"
          };
          await setDoc(doc(firestore, "rooms", roomCode), newRoom);
          await setDoc(counterDocRef, { value: count });
          return roomCode;
        } catch (innerError: any) {
          console.error("Firebase manual write failed, falling back to local storage:", innerError);
          setFirebaseError(innerError.message || String(innerError));
          setIsFirebaseActive(false);
          return createRoomLocal();
        }
      }
    } else {
      return createRoomLocal();
    }
  };

  // --- Join room awaiting layout ---
  const joinRoom = async (roomCode: string, name: string): Promise<Room> => {
    const uppercaseCode = roomCode.trim().toUpperCase();
    
    // Safety check nickname
    const currentName = name.trim().slice(0, 15);
    if (!currentName) {
      throw new Error("nicknameRequired");
    }
    if (player && player.nickname !== currentName) {
      localStorage.setItem("erank_nickname", currentName);
      setPlayer({ ...player, nickname: currentName });
    }

    const joinRoomLocal = (uCode: string, cName: string): Room => {
      const { rooms } = loadLocalRooms();
      const matched = rooms.find(r => r.id === uCode);
      
      if (!matched) {
        throw new Error("roomNotFound");
      }

      if (matched.status === "locked") {
        throw new Error("roomLocked");
      }

      const existingPlayers = matched.players || [];
      const isAlreadyIn = existingPlayers.find(p => p.id === player?.id);

      if (!isAlreadyIn && existingPlayers.length >= 12) {
        throw new Error("roomFull");
      }

      let updatedPlayers = [...existingPlayers];
      if (!isAlreadyIn && player) {
        const newDungeonPlayer: Player = {
          id: player.id,
          nickname: cName,
          isReady: false,
          isOnline: true,
          joinedAt: Date.now()
        };
        updatedPlayers.push(newDungeonPlayer);
      } else if (isAlreadyIn && player) {
        updatedPlayers = updatedPlayers.map(p => 
          p.id === player.id ? { ...p, isOnline: true, nickname: cName } : p
        );
      }

      const nextRoomState = { ...matched, players: updatedPlayers };
      const nextRooms = rooms.map(r => r.id === uCode ? nextRoomState : r);
      
      saveLocalRooms(nextRooms);
      setCurrentRoom(nextRoomState);
      return nextRoomState;
    };

    if (isFirebaseActive && firestore) {
      try {
        const roomRef = doc(firestore, "rooms", uppercaseCode);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
          throw new Error("roomNotFound");
        }

        const roomData = roomSnap.data() as Room;

        if (roomData.status === "locked") {
          throw new Error("roomLocked");
        }

        // Check player limit (8-12 max)
        const existingPlayers = roomData.players || [];
        const isAlreadyIn = existingPlayers.find(p => p.id === player?.id);
        
        if (!isAlreadyIn && existingPlayers.length >= 12) {
          throw new Error("roomFull");
        }

        // Add player details to array
        let updatedPlayers = [...existingPlayers];
        if (!isAlreadyIn && player) {
          const newDungeonPlayer: Player = {
            id: player.id,
            nickname: currentName,
            isReady: false,
            isOnline: true,
            joinedAt: Date.now()
          };
          updatedPlayers.push(newDungeonPlayer);
          await updateDoc(roomRef, { players: updatedPlayers });
          roomData.players = updatedPlayers;
        } else if (isAlreadyIn && player) {
          // Toggle online status to true
          updatedPlayers = updatedPlayers.map(p => 
            p.id === player.id ? { ...p, isOnline: true, nickname: currentName } : p
          );
          await updateDoc(roomRef, { players: updatedPlayers });
          roomData.players = updatedPlayers;
        }

        setCurrentRoom(roomData);
        return roomData;
      } catch (error: any) {
        if (["roomNotFound", "roomLocked", "roomFull"].includes(error.message)) {
          throw error;
        }
        console.error("Firebase joinRoom failed, migrating to local fallback:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        return joinRoomLocal(uppercaseCode, currentName);
      }
    } else {
      return joinRoomLocal(uppercaseCode, currentName);
    }
  };

  // --- Leave current room lobby ---
  const leaveRoom = async () => {
    if (!currentRoom || !player) return;

    if (isFirebaseActive && firestore) {
      try {
        const roomRef = doc(firestore, "rooms", currentRoom.id);
        const updatedPlayers = currentRoom.players.filter(p => p.id !== player.id);
        await updateDoc(roomRef, { players: updatedPlayers });
      } catch (error: any) {
        console.error("Firebase leaveRoom failed, fallback to local:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        leaveRoomLocal();
      }
    } else {
      leaveRoomLocal();
    }
    
    setCurrentRoom(null);
  };

  const leaveRoomLocal = () => {
    if (!currentRoom || !player) return;
    const { rooms } = loadLocalRooms();
    const updatedRooms = rooms.map(r => {
      if (r.id === currentRoom.id) {
        return {
          ...r,
          players: r.players.filter(p => p.id !== player.id)
        };
      }
      return r;
    });
    saveLocalRooms(updatedRooms);
  };

  // --- Toggle active player's Sẵn Sàng status ---
  const toggleReady = async () => {
    if (!currentRoom || !player) return;

    const currentReadyValue = currentRoom.players.find(p => p.id === player.id)?.isReady || false;
    const nextReadyValue = !currentReadyValue;

    const updatedPlayers = currentRoom.players.map(p => 
      p.id === player.id ? { ...p, isReady: nextReadyValue } : p
    );

    if (isFirebaseActive && firestore) {
      try {
        const roomRef = doc(firestore, "rooms", currentRoom.id);
        await updateDoc(roomRef, { players: updatedPlayers });
      } catch (error: any) {
        console.error("Firebase toggleReady failed, falling back to local mode:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        toggleReadyLocal(updatedPlayers);
      }
    } else {
      toggleReadyLocal(updatedPlayers);
    }
  };

  const toggleReadyLocal = (updatedPlayers: Player[]) => {
    if (!currentRoom) return;
    const { rooms } = loadLocalRooms();
    const nextRooms = rooms.map(r => 
      r.id === currentRoom.id ? { ...r, players: updatedPlayers } : r
    );
    saveLocalRooms(nextRooms);
    setCurrentRoom({ ...currentRoom, players: updatedPlayers });
  };

  // --- Lock / Unlock room (by Boss) ---
  const toggleRoomLock = async (roomCode: string, currentStatus: "open" | "locked") => {
    const targetStatus = currentStatus === "open" ? "locked" : "open";

    if (isFirebaseActive && firestore) {
      try {
        const roomRef = doc(firestore, "rooms", roomCode);
        await updateDoc(roomRef, { status: targetStatus });
      } catch (error: any) {
        console.error("Firebase toggleRoomLock failed, falling back to local mode:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        toggleRoomLockLocal(roomCode, targetStatus);
      }
    } else {
      toggleRoomLockLocal(roomCode, targetStatus);
    }
  };

  const toggleRoomLockLocal = (roomCode: string, targetStatus: "open" | "locked") => {
    const { rooms } = loadLocalRooms();
    const nextRooms = rooms.map(r => 
      r.id === roomCode ? { ...r, status: targetStatus } : r
    );
    saveLocalRooms(nextRooms);
    if (currentRoom?.id === roomCode) {
      setCurrentRoom({ ...currentRoom, status: targetStatus });
    }
  };

  // --- Delete room (by Boss) ---
  const deleteRoom = async (roomCode: string) => {
    // Perform local cleanup first for instantaneous UI update & redirection
    deleteRoomLocal(roomCode);

    if (isFirebaseActive && firestore) {
      try {
        const roomRef = doc(firestore, "rooms", roomCode);
        await deleteDoc(roomRef);
      } catch (error: any) {
        console.error("Firebase deleteRoom failed, fallback was already processed locally:", error);
        setFirebaseError(error.message || String(error));
      }
    }
  };

  const deleteRoomLocal = (roomCode: string) => {
    const { rooms } = loadLocalRooms();
    const nextRooms = rooms.filter(r => r.id !== roomCode);
    saveLocalRooms(nextRooms);
    if (currentRoom?.id === roomCode) {
      setCurrentRoom(null);
    }
  };

  // --- Change Room Code / ID (by Boss) ---
  const changeRoomId = async (oldId: string, newId: string) => {
    const cleanNewCode = newId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanNewCode) {
      throw new Error("invalidCode");
    }
    if (oldId === cleanNewCode) {
      return; // No change needed
    }

    const changeRoomIdLocal = (oId: string, nId: string) => {
      const { rooms, counter } = loadLocalRooms();
      const matched = rooms.find(r => r.id === oId);
      if (!matched) {
        throw new Error("roomNotFound");
      }
      if (matched.status === "locked") {
        throw new Error("roomLockedCannotEdit");
      }
      const exists = rooms.some(r => r.id === nId);
      if (exists) {
        throw new Error("roomCodeExists");
      }

      const nextRooms = rooms.map(r => {
        if (r.id === oId) {
          return { ...r, id: nId };
        }
        return r;
      });

      saveLocalRooms(nextRooms, counter);
      if (currentRoom?.id === oId) {
        setCurrentRoom({ ...currentRoom, id: nId });
      }
    };

    if (isFirebaseActive && firestore) {
      try {
        const oldRef = doc(firestore, "rooms", oldId);
        const oldSnap = await getDoc(oldRef);
        if (!oldSnap.exists()) {
          throw new Error("roomNotFound");
        }
        const roomData = oldSnap.data() as Room;
        if (roomData.status === "locked") {
          throw new Error("roomLockedCannotEdit");
        }

        const newRef = doc(firestore, "rooms", cleanNewCode);
        const newSnap = await getDoc(newRef);
        if (newSnap.exists()) {
          throw new Error("roomCodeExists");
        }

        const updatedRoomData = { ...roomData, id: cleanNewCode };
        await setDoc(newRef, updatedRoomData);
        await deleteDoc(oldRef);

        if (currentRoom?.id === oldId) {
          setCurrentRoom(updatedRoomData);
        }
      } catch (error: any) {
        if (["roomNotFound", "roomLockedCannotEdit", "roomCodeExists", "invalidCode"].includes(error.message)) {
          throw error;
        }
        console.error("Firebase changeRoomId failed, falling back to local mode:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        changeRoomIdLocal(oldId, cleanNewCode);
      }
    } else {
      changeRoomIdLocal(oldId, cleanNewCode);
    }
  };

  // --- SANDBOX FEATURE: Simulated Bot Players ---
  const botNames = [
    "Dũng_Sĩ_E_Rank", "Lôi_Thần_Tâm", "Đệ_Kiếm_Khách", "Ẩn_Giả_Nhẫn", "Kẻ_Gác_Cổng",
    "Sói_Đơn_Độc", "Huyết_Thước", "Giáo_Sĩ_Đen", "Nhật_Lệ_Ảo", "Mộng_Vương",
    "Thanh_Long", "Mị_Ảnh", "Thống_Trị_Mực", "Vệ_Binh_Quy_Tắc"
  ];

  const addSimulatedBotPlayer = () => {
    if (!currentRoom) return;
    if (!isBoss) return;

    // Maximum cap of 12 players
    if (currentRoom.players.length >= 12) return;

    // Pick random name
    const randName = botNames[Math.floor(Math.random() * botNames.length)] + "_" + Math.floor(100 + Math.random() * 900);
    const botId = "BOT_" + Math.random().toString(36).substring(2, 9).toUpperCase();

    const newBot: Player = {
      id: botId,
      nickname: randName,
      isReady: true, // Bots are pre-ready to make testing easy
      isOnline: true,
      joinedAt: Date.now(),
      isBot: true
    };

    const updatedPlayers = [...currentRoom.players, newBot];

    if (isFirebaseActive && firestore) {
      const roomRef = doc(firestore, "rooms", currentRoom.id);
      updateDoc(roomRef, { players: updatedPlayers }).catch(error => {
        console.error("Firebase error adding bot:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        addSimulatedBotLocal(updatedPlayers);
      });
    } else {
      addSimulatedBotLocal(updatedPlayers);
    }
  };

  const addSimulatedBotLocal = (updatedPlayers: Player[]) => {
    if (!currentRoom) return;
    const { rooms } = loadLocalRooms();
    const nextRooms = rooms.map(r => 
      r.id === currentRoom.id ? { ...r, players: updatedPlayers } : r
    );
    saveLocalRooms(nextRooms);
    setCurrentRoom({ ...currentRoom, players: updatedPlayers });
  };

  const clearSimulatedPlayers = () => {
    if (!currentRoom) return;
    if (!isBoss) return;

    // Filter out bot players (isBot flags or prefixes BOT_)
    const updatedPlayers = currentRoom.players.filter(p => !p.isBot && !p.id.startsWith("BOT_"));

    if (isFirebaseActive && firestore) {
      const roomRef = doc(firestore, "rooms", currentRoom.id);
      updateDoc(roomRef, { players: updatedPlayers }).catch(error => {
        console.error("Firebase error clearing bots:", error);
        setFirebaseError(error.message || String(error));
        setIsFirebaseActive(false);
        clearSimulatedLocal(updatedPlayers);
      });
    } else {
      clearSimulatedLocal(updatedPlayers);
    }
  };

  const clearSimulatedLocal = (updatedPlayers: Player[]) => {
    if (!currentRoom) return;
    const { rooms } = loadLocalRooms();
    const nextRooms = rooms.map(r => 
      r.id === currentRoom.id ? { ...r, players: updatedPlayers } : r
    );
    saveLocalRooms(nextRooms);
    setCurrentRoom({ ...currentRoom, players: updatedPlayers });
  };

  // Boss clicks Start Dungeon -> triggers upcoming alert
  const triggerGameplayStart = () => {
    alert(translations[language].gameplayUpcoming);
  };

  return (
    <GameContext.Provider
      value={{
        language,
        translations: translations[language],
        currentRoom,
        player,
        allRooms,
        isBoss,
        isFirebaseActive,
        isLoading,
        firebaseError,
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
        clearFirebaseError,
        changeRoomId
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
