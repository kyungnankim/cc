// 파일 경로: src/components/ApplePublicDomainGame.jsx - 모바일 최적화 버전 (정리완료)

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Music,
  Heart,
  Star,
  Target,
} from "lucide-react";

const ApplePublicDomainGame = ({ user }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [notes, setNotes] = useState([]);
  const [musicKitReady, setMusicKitReady] = useState(false);
  const [userAuthorized, setUserAuthorized] = useState(false);
  const [isSongFinished, setIsSongFinished] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchedLanes, setTouchedLanes] = useState(new Set());

  const animationRef = useRef();
  const noteIdRef = useRef(0);
  const keysPressed = useRef(new Set());
  const musicKitRef = useRef(null);
  const notesSpawned = useRef(new Set());

  // 반응형 게임 크기
  const [gameSize, setGameSize] = useState({
    width: 400,
    height: 500,
    noteHeight: 35,
    laneWidth: 100,
  });

  const LANES = 4;
  const NOTE_SPEED = 500;
  const HIT_LINE_RATIO = 0.85;
  const VIVALDI_SUMMER_PRESTO_ID = "1440785341";

  const beatPattern = [
    { time: 0.5, lane: 0 },
    { time: 0.7, lane: 1 },
    { time: 0.9, lane: 0 },
    { time: 1.1, lane: 1 },
    { time: 1.5, lane: 2 },
    { time: 1.7, lane: 3 },
    { time: 1.9, lane: 2 },
    { time: 2.1, lane: 3 },
    { time: 2.5, lane: 0 },
    { time: 2.7, lane: 2 },
    { time: 2.9, lane: 1 },
    { time: 3.1, lane: 3, special: true },
    { time: 4.0, lane: 0 },
    { time: 4.2, lane: 1 },
    { time: 4.4, lane: 2 },
    { time: 4.6, lane: 3 },
    { time: 4.8, lane: 0 },
    { time: 5.0, lane: 1 },
    { time: 5.2, lane: 2 },
    { time: 5.4, lane: 3, special: true },
    { time: 6.2, lane: 3 },
    { time: 6.4, lane: 2 },
    { time: 6.6, lane: 1 },
    { time: 6.8, lane: 0, special: true },
    { time: 7.5, lane: 1 },
    { time: 7.7, lane: 2 },
    { time: 8.0, lane: 0 },
    { time: 8.2, lane: 3, special: true },
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
    const initMusicKit = async () => {
      try {
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
          declarativeMarkup: true,
          suppressErrorDialog: true,
        });

        const music = window.MusicKit.getInstance();
        musicKitRef.current = music;
        setUserAuthorized(music.isAuthorized);

        music.addEventListener("authorizationStatusDidChange", (event) => {
          setUserAuthorized(music.isAuthorized);
        });

        music.addEventListener("playbackStateDidChange", (event) => {
          if (event.state === "completed") {
            setIsPlaying(false);
            setIsSongFinished(true);
            if (animationRef.current)
              cancelAnimationFrame(animationRef.current);
          }
        });

        setMusicKitReady(true);
      } catch (error) {
        console.error("MusicKit 초기화 실패:", error);
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
      setTotalNotes((t) => t + 1);
    },
    [gameSize.noteHeight]
  );

  const gameLoop = useCallback(() => {
    const music = musicKitRef.current;
    if (!music || !isPlaying) return;
    const currentTime = music.currentPlaybackTime;
    setGameTime(currentTime);
    const noteAppearanceTime = gameSize.height / NOTE_SPEED;

    beatPattern.forEach((beat) => {
      if (
        currentTime >= beat.time - noteAppearanceTime &&
        !notesSpawned.current.has(beat.time)
      ) {
        spawnNote(beat.lane, beat.special || false, beat.time);
        notesSpawned.current.add(beat.time);
      }
    });

    setNotes((prevNotes) =>
      prevNotes.filter((note) => {
        const timeToHit = note.spawnTime - currentTime;
        note.y = HIT_LINE_Y - timeToHit * NOTE_SPEED;
        if (note.y > gameSize.height + gameSize.noteHeight && !note.hit) {
          setCombo(0);
          return false;
        }
        return !note.hit;
      })
    );

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, spawnNote, gameSize.height, gameSize.noteHeight]);

  const toggleGame = async () => {
    if (!musicKitReady) return;
    if (isSongFinished) {
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
          await music.authorize();
          if (!music.isAuthorized) {
            alert("Apple Music 인증이 필요합니다.");
            return;
          }
        }
        if (music.nowPlayingItem?.id !== VIVALDI_SUMMER_PRESTO_ID) {
          await music.setQueue({ songs: [VIVALDI_SUMMER_PRESTO_ID] });
        }
        await music.play();
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(gameLoop);
      } catch (error) {
        alert(
          "음악을 재생할 수 없습니다. Apple Music 구독 상태를 확인해주세요."
        );
      }
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    musicKitRef.current?.stop();
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameTime(0);
    setNotes([]);
    notesSpawned.current.clear();
    setIsSongFinished(false);
    setHitCount(0);
    setTotalNotes(0);
    setTouchedLanes(new Set());
    keysPressed.current.clear();
  };

  const hitNote = useCallback(
    (lane) => {
      const perfectRange = 30;
      const goodRange = 60;
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
        setHitCount((h) => h + 1);
        noteToHit.hit = true;
        return true;
      }
      return false;
    },
    [notes, combo, HIT_LINE_Y]
  );

  const handleKeyPress = (lane, keyCode) => {
    if (!isPlaying) return;
    if (!keysPressed.current.has(keyCode)) {
      keysPressed.current.add(keyCode);
      if (!hitNote(lane)) {
        setCombo(0);
      }
    }
  };

  const handleKeyRelease = (keyCode) => {
    keysPressed.current.delete(keyCode);
  };

  // 키보드 이벤트 (데스크톱용)
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
    }
  };

  const handleTouchEnd = (lane) => {
    setTouchedLanes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(lane);
      return newSet;
    });
  };

  const accuracy =
    totalNotes > 0 ? ((hitCount / totalNotes) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-800 via-red-900 to-black flex flex-col items-center overflow-hidden">
      {/* 사용자 정보 */}
      {user && (
        <div className="absolute top-4 left-4 bg-black/50 p-2 rounded-lg text-white text-xs z-10">
          <p>
            플레이어: <strong>{user.displayName || user.email}</strong>
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-4 px-2 pt-4">
        <div className="text-white text-center sm:text-left mb-2 sm:mb-0">
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center sm:justify-start gap-2">
            <Music className="text-yellow-400" size={isMobile ? 20 : 24} />
            Vivaldi's Summer - Presto
          </h1>
          <p className="text-yellow-200 text-sm sm:text-base">
            비발디 사계 '여름' 3악장으로 플레이합니다.
          </p>
        </div>
      </div>

      {/* 스코어 보드 */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center sm:justify-between items-center mb-4 text-white px-2 gap-2">
        <div className="flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400">
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-gray-300">Score</div>
          </div>
          <div className="text-center">
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
            <div className="text-sm sm:text-lg font-bold text-cyan-400 flex items-center gap-1">
              <Target size={12} /> {accuracy}%
            </div>
            <div className="text-xs text-gray-300">Acc</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm sm:text-lg text-gray-300">
            {Math.floor(gameTime / 60)}:
            {(gameTime % 60).toFixed(0).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* 게임 영역 */}
      <div className="relative flex flex-col items-center">
        <div
          className="relative bg-black/30 backdrop-blur-sm border border-red-500/30 rounded-xl overflow-hidden"
          style={{ width: gameSize.width, height: gameSize.height }}
        >
          {/* 레인 */}
          {Array.from({ length: LANES }).map((_, index) => (
            <div
              key={index}
              className={`absolute border-r border-red-400/30 ${
                (
                  isMobile
                    ? touchedLanes.has(index)
                    : keysPressed.current.has(Object.keys(keyMap)[index])
                )
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
            className="absolute w-full h-1 bg-gradient-to-r from-yellow-500 to-red-500 shadow-lg shadow-red-500/50"
            style={{ top: HIT_LINE_Y }}
          />

          {/* 노트 */}
          {notes.map((note) => (
            <div
              key={note.id}
              className={`absolute rounded-lg border-2 ${
                note.isSpecial
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-300"
                  : "bg-gradient-to-r from-red-600 to-orange-500 border-red-300"
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

          {/* 게임 종료 스크린 */}
          {isSongFinished && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
              <div className="text-center text-white p-4">
                <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-yellow-300">
                  연주 종료
                </h2>
                <div className="space-y-2 text-sm sm:text-lg">
                  <p>
                    Final Score:{" "}
                    <span className="font-bold text-yellow-400">
                      {score.toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Max Combo:{" "}
                    <span className="font-bold text-orange-400">
                      {maxCombo}
                    </span>
                  </p>
                  <p>
                    Accuracy:{" "}
                    <span className="font-bold text-cyan-400">{accuracy}%</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    ({hitCount} / {totalNotes} Notes)
                  </p>
                </div>
                <button
                  onClick={resetGame}
                  className="mt-4 px-4 py-2 sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 rounded-lg font-bold transition-colors text-sm sm:text-base"
                >
                  다시 하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex justify-center mt-4 gap-1 sm:gap-2">
          {keyArray.map((key, index) => (
            <button
              key={key}
              className={`w-12 h-12 sm:w-16 sm:h-16 border-2 rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg select-none ${
                (
                  isMobile
                    ? touchedLanes.has(index)
                    : keysPressed.current.has(`Key${key}`)
                )
                  ? "bg-white text-black border-white"
                  : "bg-black/30 text-white border-red-400/50"
              } ${
                isMobile ? "touch-manipulation active:scale-95" : ""
              } transition-all duration-100`}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.preventDefault();
                  handleTouchStart(index);
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.preventDefault();
                  handleTouchEnd(index);
                }
              }}
              onTouchCancel={(e) => {
                if (isMobile) {
                  e.preventDefault();
                  handleTouchEnd(index);
                }
              }}
              style={{
                touchAction: isMobile ? "manipulation" : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <p className="text-center text-yellow-200 text-xs sm:text-sm mt-2 px-2">
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
          className="flex items-center gap-2 px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold text-sm sm:text-lg transition-all"
        >
          {isPlaying ? (
            <Pause size={isMobile ? 16 : 24} />
          ) : (
            <Play size={isMobile ? 16 : 24} />
          )}
          {!musicKitReady
            ? "로딩 중..."
            : isSongFinished
            ? "다시 시작"
            : isPlaying
            ? "일시정지"
            : "게임 시작!"}
        </button>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-3 py-3 sm:px-6 sm:py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-sm sm:text-base transition-colors"
        >
          <RotateCcw size={isMobile ? 14 : 20} /> 리셋
        </button>
      </div>
    </div>
  );
};

export default ApplePublicDomainGame;
