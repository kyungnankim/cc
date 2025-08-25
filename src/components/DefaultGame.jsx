<<<<<<< HEAD
// 파일 경로: src/components/DefaultGame.jsx - 모바일 최적화 버전

=======
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
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

const DefaultGame = ({ user }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [notes, setNotes] = useState([]);
  const [level, setLevel] = useState(1);
  const [isSongFinished, setIsSongFinished] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [effects, setEffects] = useState([]);
<<<<<<< HEAD
  const [isMobile, setIsMobile] = useState(false);
  const [touchedLanes, setTouchedLanes] = useState(new Set());
=======
  const [touchedKeys, setTouchedKeys] = useState(new Set());
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9

  const animationRef = useRef();
  const noteIdRef = useRef(0);
  const keysPressed = useRef(new Set());
  const defaultAudioRef = useRef(null);
  const notesSpawned = useRef(new Set());
  const nextRandomNoteTime = useRef(0);

<<<<<<< HEAD
  // 반응형 게임 크기
  const [gameSize, setGameSize] = useState({
    width: 400,
    height: 500,
    noteHeight: 35,
    laneWidth: 100,
  });

  const LANES = 4;
  const NOTE_SPEED = 400;
  const HIT_LINE_RATIO = 0.85;
=======
  const GAME_HEIGHT = 200;
  const NOTE_HEIGHT = 40;
  const NOTE_SPEED = 400;
  const LANES = 4;
  const LANE_WIDTH = 100;
  const HIT_LINE_Y = GAME_HEIGHT - 40;
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9

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

  const lastPatternTime =
    beatPattern.length > 0 ? beatPattern[beatPattern.length - 1].time : 0;
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
    const audioElement = defaultAudioRef.current;
    if (!audioElement) return;
    const handleSongEnd = () => {
      setIsPlaying(false);
      setIsSongFinished(true);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    audioElement.addEventListener("ended", handleSongEnd);
    return () => audioElement.removeEventListener("ended", handleSongEnd);
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

  const createEffect = useCallback((lane, type) => {
    const newEffect = {
      id: Date.now() + Math.random(),
      lane,
      type,
      opacity: 1,
      scale: 0.3,
    };
    setEffects((prev) => [...prev, newEffect]);
  }, []);

  const gameLoop = useCallback(() => {
    if (!defaultAudioRef.current) return;
    const currentTime = defaultAudioRef.current.currentTime;
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

    if (currentTime > lastPatternTime) {
      if (currentTime > nextRandomNoteTime.current) {
        const randomLane = Math.floor(Math.random() * LANES);
        const isSpecial = Math.random() < 0.15;
        const spawnTime = currentTime + noteAppearanceTime;
        spawnNote(randomLane, isSpecial, spawnTime);
        const randomInterval = 0.4 + Math.random() * 0.6;
        nextRandomNoteTime.current = currentTime + randomInterval;
      }
    }

    setNotes((prevNotes) =>
      prevNotes.filter((note) => {
        const timeToHit = note.spawnTime - currentTime;
        note.y = HIT_LINE_Y - timeToHit * NOTE_SPEED;
        if (note.y > gameSize.height + gameSize.noteHeight && !note.hit) {
          setCombo(0);
          setMissCount((m) => m + 1);
          return false;
        }
        return !note.hit;
      })
    );

    setEffects((prevEffects) =>
      prevEffects
        .map((effect) => ({
          ...effect,
          opacity: effect.opacity - 0.04,
          scale: effect.scale + 0.1,
        }))
        .filter((effect) => effect.opacity > 0)
    );

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [spawnNote, lastPatternTime, gameSize.height, gameSize.noteHeight]);

  const toggleGame = () => {
    if (isSongFinished) {
      resetGame();
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      defaultAudioRef.current?.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      setIsPlaying(true);
      defaultAudioRef.current
        ?.play()
        .catch((e) => console.error("Audio play failed:", e));
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const resetGame = () => {
    setIsPlaying(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (defaultAudioRef.current) {
      defaultAudioRef.current.pause();
      defaultAudioRef.current.currentTime = 0;
    }
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameTime(0);
    setNotes([]);
    setLevel(1);
    notesSpawned.current.clear();
    nextRandomNoteTime.current = 0;
    setIsSongFinished(false);
    setHitCount(0);
    setMissCount(0);
    setTotalNotes(0);
    setEffects([]);
    setTouchedLanes(new Set());
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
        const hitType = distance <= perfectRange ? "perfect" : "good";
        let scoreIncrease = hitType === "perfect" ? 300 : 100;
        if (noteToHit.isSpecial) scoreIncrease *= 2;

        setScore((s) => s + scoreIncrease * (combo + 1));
        setCombo((c) => {
          const newCombo = c + 1;
          setMaxCombo((mc) => Math.max(mc, newCombo));
          return newCombo;
        });
        setHitCount((h) => h + 1);
        noteToHit.hit = true;
        createEffect(lane, hitType);
        return true;
      }
      return false;
    },
    [notes, combo, createEffect]
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
        setMissCount((m) => m + 1);
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
      setMissCount((m) => m + 1);
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
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex flex-col items-center overflow-hidden">
      {/* 모바일 viewport 설정을 위한 스타일 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <audio ref={defaultAudioRef} src="/default-music.mp3" />

=======
    <div
      className="fixed inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex flex-col overflow-hidden"
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
      <audio ref={defaultAudioRef} src="/default-music.mp3" />

      {/* 네비게이션 영역 */}
      <div className="w-full bg-black/20 backdrop-blur-sm border-b border-gray-700/50 flex-shrink-0">
        <div className="flex justify-between items-center px-3 py-5">
          <div className="flex items-center gap-2">
            <div className="text-white font-bold text-sm">🎵 Rhythm</div>
            <nav className="flex gap-1">
              <button className="text-teal-400 hover:text-teal-300 text-xs font-medium">
                Default
              </button>
              <button className="text-gray-400 hover:text-gray-300 text-xs">
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
      {/* 헤더 */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-4 px-2 pt-4">
        <div className="text-white text-center sm:text-left mb-2 sm:mb-0">
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center sm:justify-start gap-2">
            <Music className="text-teal-400" size={isMobile ? 20 : 24} />
            Local Music Mode
          </h1>
          <p className="text-teal-200 text-sm sm:text-base">
            기본 음원으로 플레이합니다.
          </p>
        </div>
      </div>

      {/* 스코어 보드 */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center sm:justify-between items-center mb-4 text-white px-2 gap-2">
        <div className="flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-400">
=======
      {/* 게임 정보 및 컨트롤 */}
      <div className="w-full flex justify-between items-center px-3 py-2 flex-shrink-0">
        <div className="text-white">
          <h1 className="text-sm font-bold flex items-center gap-1">
            <Music className="text-teal-400" size={12} />
            Local Music
          </h1>
          <p className="text-teal-200 text-xs">기본 음원으로 플레이</p>
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
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded text-xs font-medium"
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
            {isSongFinished ? "다시" : isPlaying ? "정지" : "시작"}
          </button>
        </div>
      </div>

      {/* 스코어 정보 */}
      <div className="w-full flex justify-between items-center px-3 py-1 flex-shrink-0">
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
            <div className="text-sm sm:text-lg font-bold text-cyan-400 flex items-center gap-1">
              <Target size={12} /> {accuracy}%
=======
            <div className="text-xs font-bold text-orange-400">{combo}</div>
            <div className="text-xs text-gray-300">Combo</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-blue-400">{maxCombo}</div>
            <div className="text-xs text-gray-300">Max</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              <Target size={8} /> {accuracy}%
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
            </div>
            <div className="text-xs text-gray-300">Acc</div>
          </div>
        </div>
<<<<<<< HEAD
        <div className="flex items-center gap-4">
          <div className="text-sm sm:text-lg text-gray-300">
=======
        <div className="flex items-center gap-1">
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
          className="relative bg-black/30 backdrop-blur-sm border border-teal-500/30 rounded-xl overflow-hidden"
          style={{ width: gameSize.width, height: gameSize.height }}
=======
      <div className="flex-1 flex flex-col items-center justify-center w-full px-2">
        <div
          className="relative bg-black/30 backdrop-blur-sm border border-teal-500/30 rounded overflow-hidden mb-3"
          style={{ width: LANES * LANE_WIDTH, height: GAME_HEIGHT }}
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
        >
          {/* 레인 */}
          {Array.from({ length: LANES }).map((_, index) => (
            <div
              key={index}
              className={`absolute border-r border-teal-400/30 ${
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
            className="absolute w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/50"
            style={{ top: HIT_LINE_Y }}
          />

          {/* 노트 */}
          {notes.map((note) => (
            <div
              key={note.id}
              className={`absolute rounded-lg border-2 ${
                note.isSpecial
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-300"
                  : "bg-gradient-to-r from-teal-500 to-cyan-500 border-teal-300"
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

          {/* 히트 이펙트 */}
          {effects.map((effect) => (
            <div
              key={effect.id}
              className="absolute pointer-events-none"
              style={{
                left: `${effect.lane * gameSize.laneWidth}px`,
                top: `${HIT_LINE_Y - gameSize.laneWidth / 2}px`,
                width: `${gameSize.laneWidth}px`,
                height: `${gameSize.laneWidth}px`,
                borderRadius: "50%",
                opacity: effect.opacity,
                transform: `scale(${effect.scale})`,
                border: `4px solid ${
                  effect.type === "perfect" ? "#67e8f9" : "#a78bfa"
                }`,
              }}
            />
          ))}

          {/* 게임 종료 스크린 */}
          {isSongFinished && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
<<<<<<< HEAD
              <div className="text-center text-white p-4">
                <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-cyan-300">
                  게임 종료
                </h2>
                <div className="space-y-2 text-sm sm:text-lg">
=======
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4 text-cyan-300">
                  게임 종료
                </h2>
                <div className="space-y-2 text-sm">
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
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
<<<<<<< HEAD
                  <p className="text-xs sm:text-sm text-gray-400">
=======
                  <p className="text-xs text-gray-400">
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
                    ({hitCount} / {totalNotes} Notes)
                  </p>
                </div>
                <button
                  onClick={resetGame}
<<<<<<< HEAD
                  className="mt-4 px-4 py-2 sm:px-6 sm:py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-bold transition-colors text-sm sm:text-base"
=======
                  className="mt-4 px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-bold transition-colors"
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
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
                  : "bg-black/30 text-white border-teal-400/50"
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
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-black/30 text-white border-teal-400/50"
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
                // 터치 영역 확장
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
        <p className="text-center text-teal-200 text-xs sm:text-sm mt-2 px-2">
          {isMobile
            ? "버튼을 터치하여 연주하세요!"
            : "A, S, D, F 키를 사용하여 연주하세요!"}
        </p>
      </div>

      {/* 게임 컨트롤 버튼 */}
      <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6 px-2">
        <button
          onClick={toggleGame}
          className="flex items-center gap-2 px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold text-sm sm:text-lg"
        >
          {isPlaying ? (
            <Pause size={isMobile ? 16 : 24} />
          ) : (
            <Play size={isMobile ? 16 : 24} />
          )}
          {isSongFinished ? "다시 시작" : isPlaying ? "일시정지" : "게임 시작!"}
        </button>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-3 py-3 sm:px-6 sm:py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold text-sm sm:text-base"
        >
          <RotateCcw size={isMobile ? 14 : 20} /> 리셋
        </button>
      </div>
=======
        <p className="text-center text-teal-200 text-xs mt-2">
          터치나 키보드로 연주하세요!
        </p>
      </div>
>>>>>>> bcaa1bb59e1dd2f2fdabff1b166a7b40aef75ab9
    </div>
  );
};

export default DefaultGame;
