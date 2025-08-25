<<<<<<< HEAD
// 파일 경로: src/components/Game.jsx - 모바일 최적화 버전

=======
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Music, Heart, Star, Zap } from "lucide-react";

const Game = ({ user }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [notes, setNotes] = useState([]);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [musicKitReady, setMusicKitReady] = useState(false);
  const [musicKitLoading, setMusicKitLoading] = useState(true);
  const [musicKitError, setMusicKitError] = useState(null);
  const [userAuthorized, setUserAuthorized] = useState(false);
<<<<<<< HEAD
  const [isMobile, setIsMobile] = useState(false);
  const [touchedLanes, setTouchedLanes] = useState(new Set());

=======
  const [touchedKeys, setTouchedKeys] = useState(new Set());
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
  const animationRef = useRef();
  const noteIdRef = useRef(0);
  const keysPressed = useRef(new Set());
  const musicKitRef = useRef(null);
  const notesSpawned = useRef(new Set());
  const gameContainerRef = useRef(null);

  // 반응형 게임 크기
  const [gameSize, setGameSize] = useState({
    width: 400,
    height: 500,
    noteHeight: 35,
    laneWidth: 100,
  });

<<<<<<< HEAD
  const LANES = 4;
  const NOTE_SPEED = 400;
  const HIT_LINE_RATIO = 0.85; // 게임 높이의 85% 지점
=======
  const GAME_HEIGHT = 250;
  const NOTE_HEIGHT = 40;
  const NOTE_SPEED = 400;
  const LANES = 4;
  const LANE_WIDTH = 100;
  const HIT_LINE_Y = GAME_HEIGHT - 50;
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
  const INTO_YOU_SONG_ID = "1522636431";

  const beatPattern = [
    { time: 6.9, lane: 0 },
    { time: 7.2, lane: 1 },
    { time: 7.5, lane: 2 },
    { time: 7.8, lane: 3 },
    { time: 8.1, lane: 0 },
    { time: 8.4, lane: 1 },
    { time: 8.7, lane: 2 },
    { time: 9.0, lane: 3 },
    { time: 9.6, lane: 1, special: true },
    { time: 10.8, lane: 2 },
    { time: 11.1, lane: 3, special: true },
    { time: 12.3, lane: 0 },
    { time: 12.6, lane: 1 },
    { time: 12.9, lane: 2, special: true },
    { time: 14.1, lane: 3 },
    { time: 14.7, lane: 0 },
    { time: 15.0, lane: 1, special: true },
    { time: 16.2, lane: 2 },
    { time: 16.5, lane: 3 },
    { time: 16.8, lane: 0, special: true },
  ];

  const keyMap = { KeyA: 0, KeyS: 1, KeyD: 2, KeyF: 3 };
  const keyArray = ["A", "S", "D", "F"];

  // 모바일 감지 및 크기 조정
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(mobile);

      // 화면 크기에 따른 게임 크기 조정
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (mobile) {
        const width = Math.min(viewportWidth * 0.95, 350);
        const height = Math.min(viewportHeight * 0.6, 450);
        setGameSize({
          width,
          height,
          noteHeight: 30,
          laneWidth: width / LANES,
        });
      } else {
        setGameSize({
          width: 400,
          height: 500,
          noteHeight: 35,
          laneWidth: 100,
        });
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const HIT_LINE_Y = gameSize.height * HIT_LINE_RATIO;

  useEffect(() => {
    if (user)
      console.log(`🎮 Game page: Welcome, ${user.displayName || user.email}!`);
    else console.log("🎮 Game page: Welcome, guest!");
  }, [user]);

  useEffect(() => {
    const initMusicKit = async () => {
      try {
        setMusicKitLoading(true);
        const response = await fetch("/api/generate-token");
        if (!response.ok) throw new Error("서버 토큰 로드 실패");
        const { token: developerToken } = await response.json();

        if (!window.MusicKit) {
          const script = document.createElement("script");
          script.src = "https://js-cdn.music.apple.com/musickit/v1/musickit.js";
          script.async = true;
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () =>
              reject(new Error("MusicKit 스크립트 로드 실패"));
          });
        }

        await window.MusicKit.configure({
          developerToken,
          app: {
            name: "Rhythm Game",
            build: "1.0.0",
            icon: window.location.origin + "/favicon.ico",
          },
          // 리디렉트 문제 해결을 위한 설정
          declarativeMarkup: true,
          suppressErrorDialog: true,
        });

        const music = window.MusicKit.getInstance();
        musicKitRef.current = music;
        setUserAuthorized(music.isAuthorized);

        music.addEventListener("authorizationStatusDidChange", (event) => {
          setUserAuthorized(music.isAuthorized);
          // 인증 후 자동으로 게임 페이지로 돌아오도록 처리
          if (music.isAuthorized && window.location.pathname === "/game") {
            // 이미 게임 페이지에 있으므로 추가 처리 불필요
          }
        });

        // 음악 재생 상태 변화 감지
        music.addEventListener("playbackStateDidChange", (event) => {
          if (event.state === "completed" || event.state === "stopped") {
            setIsPlaying(false);
            if (animationRef.current)
              cancelAnimationFrame(animationRef.current);
          }
        });

        setMusicKitReady(true);
      } catch (error) {
        setMusicKitError(error.message);
      } finally {
        setMusicKitLoading(false);
      }
    };
    initMusicKit();
  }, []);

  const spawnNote = useCallback(
    (lane, isSpecial, spawnTime) => {
      const newNote = {
        id: noteIdRef.current++,
        lane,
        y: -gameSize.noteHeight,
        hit: false,
        isSpecial,
        spawnTime,
      };
      setNotes((prev) => [...prev, newNote]);
    },
    [gameSize.noteHeight]
  );

  const gameLoop = useCallback(() => {
    const music = musicKitRef.current;
    if (!music || !isPlaying) return;

    const currentTime = music.currentPlaybackTime;
    setGameTime(currentTime);

    beatPattern.forEach((beat) => {
      if (
        currentTime >= beat.time - gameSize.height / NOTE_SPEED &&
        !notesSpawned.current.has(beat.time)
      ) {
        spawnNote(beat.lane, beat.special || false, beat.time);
        notesSpawned.current.add(beat.time);
      }
    });

    setNotes((prevNotes) => {
      return prevNotes
        .map((note) => {
          const y = HIT_LINE_Y - (note.spawnTime - currentTime) * NOTE_SPEED;
          return { ...note, y };
        })
        .filter((note) => {
          if (note.y > gameSize.height + gameSize.noteHeight && !note.hit) {
            setCombo(0);
            setHealth((h) => Math.max(0, h - 5));
            return false;
          }
          return !note.hit;
        });
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, spawnNote, gameSize.height, gameSize.noteHeight]);

  const toggleGame = async () => {
    if (!musicKitReady || health <= 0) {
      resetGame();
      return;
    }
    const music = musicKitRef.current;
    if (isPlaying) {
      setIsPlaying(false);
      music.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      try {
        if (!userAuthorized) {
          // 모바일에서 팝업 차단 문제 해결
          const authResult = await music.authorize();
          if (!music.isAuthorized) {
            alert("Apple Music 인증이 필요합니다.");
            return;
          }
        }
        await music.setQueue({ songs: [INTO_YOU_SONG_ID] });
        await music.play();
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(gameLoop);
      } catch (error) {
        console.error("⚠ 게임 시작 또는 음악 재생 오류:", error);
        alert(
          "음악을 재생할 수 없습니다. Apple Music 구독 상태를 확인해주세요."
        );
      }
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (musicKitRef.current) musicKitRef.current.stop();
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameTime(0);
    setNotes([]);
    setHealth(100);
    setLevel(1);
    notesSpawned.current.clear();
    setTouchedLanes(new Set());
  };

  const hitNote = useCallback(
    (lane) => {
      const perfectRange = 25;
      const goodRange = 50;
      const noteToHit = notes.find(
        (n) =>
          !n.hit && n.lane === lane && Math.abs(n.y - HIT_LINE_Y) < goodRange
      );
      if (noteToHit) {
        const distance = Math.abs(noteToHit.y - HIT_LINE_Y);
        let scoreIncrease = distance <= perfectRange ? 300 : 100;
        if (noteToHit.isSpecial) scoreIncrease *= 2;
        setScore((s) => s + scoreIncrease * (combo + 1));
        setCombo((c) => {
          const newCombo = c + 1;
          setMaxCombo((mc) => Math.max(mc, newCombo));
          return newCombo;
        });
        noteToHit.hit = true;
        return true;
      }
      return false;
    },
    [notes, combo]
  );

<<<<<<< HEAD
  // 키보드 이벤트 (데스크톱용)
=======
  const handleKeyPress = (lane, keyCode) => {
    if (!isPlaying) return;

    if (!keysPressed.current.has(keyCode)) {
      keysPressed.current.add(keyCode);
      if (!hitNote(lane)) {
        setCombo(0);
        setHealth((prev) => Math.max(0, prev - 10));
      }
    }
  };

  const handleKeyRelease = (keyCode) => {
    keysPressed.current.delete(keyCode);
  };

  const handleTouchStart = (lane, key) => {
    const keyCode = `Key${key}`;
    setTouchedKeys((prev) => new Set(prev).add(key));
    handleKeyPress(lane, keyCode);
  };

  const handleTouchEnd = (key) => {
    const keyCode = `Key${key}`;
    setTouchedKeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
    handleKeyRelease(keyCode);
  };

>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e) => {
      const lane = keyMap[e.code];
      if (lane !== undefined) {
        handleKeyPress(lane, e.code);
      }
    };

    const handleKeyUp = (e) => {
      handleKeyRelease(e.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, hitNote, isMobile]);

  // 터치 이벤트 핸들러 (모바일용)
  const handleTouchStart = (lane) => {
    if (!isPlaying) return;
    setTouchedLanes((prev) => new Set([...prev, lane]));
    if (!hitNote(lane)) {
      setCombo(0);
      setHealth((prev) => Math.max(0, prev - 10));
    }
  };

  const handleTouchEnd = (lane) => {
    setTouchedLanes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(lane);
      return newSet;
    });
  };

  const isGameOver = health <= 0;

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-800 flex flex-col items-center overflow-hidden">
      {/* 모바일 viewport 설정을 위한 스타일 */}
      <style jsx>{`
        html,
        body {
          overflow-x: hidden;
          width: 100%;
          height: 100%;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>
=======
    <div
      className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-purple-800 flex flex-col overflow-hidden"
      style={{
        margin: 0,
        padding: 0,
        width: "100vw",
        height: "100vh",
        minHeight: "100vh",
        maxWidth: "100vw",
        touchAction: "manipulation",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* 네비게이션 영역 */}
      <div className="w-full bg-black/20 backdrop-blur-sm border-b border-pink-700/50 flex-shrink-0">
        <div className="flex justify-between items-center px-3 py-5">
          <div className="flex items-center gap-3">
            <div className="text-white font-bold text-sm">🎵 Rhythm</div>
            <nav className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-300 text-xs">
                Default
              </button>
              <button className="text-pink-400 hover:text-pink-300 text-xs font-medium">
                Apple
              </button>
              <button className="text-gray-400 hover:text-gray-300 text-xs">
                Vivaldi
              </button>
            </nav>
          </div>
          <div className="text-gray-400 text-xs">♪</div>
        </div>
      </div>
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9

      {user && (
        <div className="absolute top-16 left-2 bg-black/50 p-2 rounded-lg text-white text-xs z-10">
          <p>
            플레이어: <strong>{user.displayName || user.email}</strong>
          </p>
        </div>
      )}

<<<<<<< HEAD
      {/* 헤더 - 모바일 최적화 */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-4 px-2 pt-4">
        <div className="text-white text-center sm:text-left mb-2 sm:mb-0">
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center sm:justify-start gap-2">
            <Music className="text-pink-400" size={isMobile ? 20 : 24} />
            Into You - Rhythm Game
          </h1>
          <p className="text-pink-200 text-sm sm:text-base">
            Apple Music과 함께 연주하세요!
          </p>
        </div>
        <div className="text-center sm:text-right">
          {musicKitLoading ? (
            <div className="text-yellow-400 text-xs sm:text-sm">
              🔄 Apple Music 로딩중...
            </div>
          ) : musicKitError ? (
            <div className="text-red-400 text-xs sm:text-sm">
              ⚠ MusicKit 오류: {musicKitError}
            </div>
          ) : musicKitReady ? (
            <div className="flex flex-col items-center sm:items-end gap-2">
              {!userAuthorized && (
                <button
                  onClick={() => musicKitRef.current?.authorize()}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-bold transition-colors"
                >
                  🔓 Apple Music 인증
                </button>
              )}
              <p className="text-xs text-pink-200">
                {userAuthorized ? "✅ 인증됨" : "🔒 인증 필요"}
              </p>
            </div>
          ) : (
            <div className="text-gray-400 text-xs sm:text-sm">
              MusicKit 비활성화
            </div>
          )}
        </div>
      </div>

      {/* 스코어 보드 - 모바일 최적화 */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center sm:justify-between items-center mb-4 text-white px-2 gap-2">
        <div className="flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400">
=======
      {/* 게임 정보 및 컨트롤 */}
      <div className="w-full flex justify-between items-center px-3 py-2 flex-shrink-0">
        <div className="text-white">
          <h1 className="text-sm font-bold flex items-center gap-1">
            <Music className="text-pink-400" size={12} />
            Into You
          </h1>
          <p className="text-pink-200 text-xs">Apple Music과 함께</p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium"
          >
            <RotateCcw size={10} /> 리셋
          </button>
          <button
            onClick={toggleGame}
            disabled={!musicKitReady}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded text-xs font-medium"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
            {health <= 0 ? "다시" : isPlaying ? "정지" : "시작"}
          </button>
        </div>
      </div>

      {/* MusicKit 상태 */}
      <div className="w-full px-3 py-1 flex-shrink-0">
        {musicKitLoading ? (
          <div className="text-yellow-400 text-xs">
            🔄 Apple Music 로딩중...
          </div>
        ) : musicKitError ? (
          <div className="text-red-400 text-xs">
            ❌ MusicKit 오류: {musicKitError}
          </div>
        ) : musicKitReady ? (
          <div className="flex justify-between items-center">
            {!userAuthorized && (
              <button
                onClick={() => musicKitRef.current?.authorize()}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium"
              >
                🔐 Apple Music 인증
              </button>
            )}
            <p className="text-xs text-pink-200">
              {userAuthorized ? "✅ 인증됨" : "🔒 인증 필요"}
            </p>
          </div>
        ) : (
          <div className="text-gray-400 text-xs">MusicKit 비활성화</div>
        )}
      </div>

      {/* 스코어 및 상태 정보 */}
      <div className="w-full flex justify-between items-center px-3 py-2 flex-shrink-0 text-white">
        <div className="flex gap-3 items-center text-xs">
          <div className="text-center">
            <div className="text-xs font-bold text-yellow-400">
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-gray-300">Score</div>
          </div>
          <div className="text-center">
<<<<<<< HEAD
            <div className="text-lg sm:text-xl font-bold text-orange-400">
              {combo}
            </div>
            <div className="text-xs text-gray-300">Combo</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-blue-400">
              {maxCombo}
            </div>
            <div className="text-xs text-gray-300">Max</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-green-400">
              Lv.{level}
            </div>
            <div className="text-xs text-gray-300">Level</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-right">
            <div className="text-xs text-gray-300">Health</div>
            <div className="w-20 sm:w-32 h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden">
=======
            <div className="text-xs font-bold text-orange-400">{combo}</div>
            <div className="text-xs text-gray-300">Combo</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-blue-400">{maxCombo}</div>
            <div className="text-xs text-gray-300">Max</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-green-400">Lv.{level}</div>
            <div className="text-xs text-gray-300">Level</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-300">Health</div>
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
              <div
                className={`h-full transition-all duration-300 ${
                  health > 60
                    ? "bg-green-500"
                    : health > 30
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
<<<<<<< HEAD
          <div className="text-sm sm:text-lg text-gray-300">
=======
          <div className="text-xs text-gray-300">
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
            {Math.floor(gameTime / 60)}:
            {(gameTime % 60).toFixed(0).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* 게임 영역 */}
<<<<<<< HEAD
      <div className="relative flex flex-col items-center">
        <div
          ref={gameContainerRef}
          className="relative bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl overflow-hidden"
          style={{ width: gameSize.width, height: gameSize.height }}
=======
      <div className="flex-1 flex flex-col items-center justify-center w-full px-2">
        <div
          className="relative bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded overflow-hidden mb-3"
          style={{ width: LANES * LANE_WIDTH, height: GAME_HEIGHT }}
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
        >
          {/* 레인 */}
          {Array.from({ length: LANES }).map((_, index) => (
            <div
              key={index}
              className={`absolute border-r border-purple-400/30 ${
<<<<<<< HEAD
                (
                  isMobile
                    ? touchedLanes.has(index)
                    : keysPressed.current.has(Object.keys(keyMap)[index])
                )
=======
                keysPressed.current.has(Object.keys(keyMap)[index]) ||
                touchedKeys.has(keyArray[index])
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
                  ? "bg-white/20"
                  : "bg-transparent"
              } transition-colors duration-100`}
              style={{
                left: index * gameSize.laneWidth,
                width: gameSize.laneWidth,
                height: gameSize.height,
              }}
            />
          ))}

          {/* 히트 라인 */}
          <div
            className="absolute w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/50"
            style={{ top: HIT_LINE_Y }}
          />

          {/* 노트 */}
          {notes.map((note) => (
            <div
              key={note.id}
              className={`absolute rounded-lg border-2 ${
                note.isSpecial
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-300"
                  : "bg-gradient-to-r from-pink-500 to-purple-500 border-pink-300"
              }`}
              style={{
                left: note.lane * gameSize.laneWidth + gameSize.laneWidth * 0.1,
                width: gameSize.laneWidth * 0.8,
                height: gameSize.noteHeight,
                top: note.y - gameSize.noteHeight / 2,
                transform: "translateZ(0)",
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                {note.isSpecial ? (
                  <Star className="text-white" size={isMobile ? 14 : 20} />
                ) : (
                  <Heart className="text-white" size={isMobile ? 12 : 16} />
                )}
              </div>
            </div>
          ))}

          {/* 게임 오버 스크린 */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
<<<<<<< HEAD
              <div className="text-center text-white p-4">
                <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                  Game Over
                </h2>
                <p className="text-lg sm:text-xl mb-2">
                  Final Score: {score.toLocaleString()}
                </p>
                <p className="text-base sm:text-lg mb-4">
                  Max Combo: {maxCombo}
                </p>
=======
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Game Over</h2>
                <p className="text-lg mb-2">
                  Final Score: {score.toLocaleString()}
                </p>
                <p className="text-sm mb-4">Max Combo: {maxCombo}</p>
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
                <button
                  onClick={resetGame}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-bold transition-colors text-sm sm:text-base"
                >
                  다시 하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
<<<<<<< HEAD
        <div className="flex justify-center mt-4 gap-1 sm:gap-2">
          {["A", "S", "D", "F"].map((key, index) => (
            <div
              key={key}
              className={`w-12 h-12 sm:w-16 sm:h-16 border-2 rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg ${
                (
                  isMobile
                    ? touchedLanes.has(index)
                    : keysPressed.current.has(`Key${key}`)
                )
                  ? "bg-white text-black border-white"
                  : "bg-black/30 text-white border-purple-400/50"
              } ${isMobile ? "touch-manipulation" : ""}`}
              {...(isMobile
                ? {
                    onTouchStart: (e) => {
                      e.preventDefault();
                      handleTouchStart(index);
                    },
                    onTouchEnd: (e) => {
                      e.preventDefault();
                      handleTouchEnd(index);
                    },
                  }
                : {})}
=======
        <div className="flex justify-center gap-1 w-full px-2">
          {keyArray.map((key, index) => (
            <button
              key={key}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTouchStart(index, key);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTouchEnd(key);
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTouchEnd(key);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                handleTouchStart(index, key);
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                handleTouchEnd(key);
              }}
              onMouseLeave={(e) => {
                e.preventDefault();
                handleTouchEnd(key);
              }}
              className={`h-16 border-2 rounded-lg flex items-center justify-center font-bold text-xl select-none touch-manipulation ${
                keysPressed.current.has(`Key${key}`) || touchedKeys.has(key)
                  ? "bg-white text-black border-white"
                  : "bg-black/30 text-white border-purple-400/50"
              } active:scale-95 transition-all duration-100`}
              style={{
                flex: "1 1 0",
                minWidth: "70px",
                minHeight: "64px",
                touchAction: "manipulation",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
                cursor: "pointer",
                padding: "8px",
                margin: "0 2px",
              }}
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
            >
              {key}
            </button>
          ))}
        </div>
<<<<<<< HEAD
        <p className="text-center text-pink-200 text-xs sm:text-sm mt-2 px-2">
          {isMobile
            ? "버튼을 터치하여 연주하세요!"
            : "A, S, D, F 키를 사용하여 연주하세요!"}
        </p>
      </div>

      {/* 게임 컨트롤 버튼 */}
      <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 px-2">
        <button
          onClick={toggleGame}
          disabled={!musicKitReady}
          className="flex items-center gap-2 px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold text-sm sm:text-lg"
        >
          {isPlaying ? (
            <Pause size={isMobile ? 16 : 24} />
          ) : (
            <Play size={isMobile ? 16 : 24} />
          )}
          {health <= 0 ? "다시 시작" : isPlaying ? "일시정지" : "게임 시작!"}
        </button>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-3 py-3 sm:px-6 sm:py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-sm sm:text-base"
        >
          <RotateCcw size={isMobile ? 14 : 20} /> 리셋
        </button>
      </div>
=======
        <p className="text-center text-pink-200 text-xs mt-2">
          A, S, D, F 키를 사용하거나 버튼을 터치하여 연주하세요!
        </p>
      </div>
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
    </div>
  );
};

export default Game;
