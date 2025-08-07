import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Plus, User, ChevronDown, Sword } from "lucide-react";

// 사용자 표시명을 안전하게 가져오는 함수
const getDisplayName = (user) => {
  if (!user) return "사용자";

  if (user.displayName) {
    return user.displayName;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "사용자";
};

// 사용자 아바타 URL을 안전하게 가져오는 함수
const getAvatarUrl = (user) => {
  if (!user) return null;

  if (user.photoURL && user.photoURL.startsWith("http")) {
    return user.photoURL;
  }

  const name = getDisplayName(user);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=random&color=fff&size=128`;
};

// 프로바이더별 뱃지 정보
const getProviderBadge = (user) => {
  if (!user) return null;

  switch (user.provider) {
    case "spotify":
      return { icon: "🎵", text: "Spotify", color: "bg-green-500" };
    case "google":
      return { icon: "🚀", text: "Google", color: "bg-blue-500" };
    case "email":
      return { icon: "📧", text: "Email", color: "bg-gray-500" };
    default:
      return { icon: "👤", text: "User", color: "bg-gray-500" };
  }
};

// 현재 세션 사용자를 가져오는 함수
const getCurrentSessionUser = () => {
  const sessionUser = sessionStorage.getItem("currentUser");
  if (sessionUser) {
    try {
      const userData = JSON.parse(sessionUser);
      return userData && userData.isLoggedIn ? userData : null;
    } catch (error) {
      console.error("Session user parsing error:", error);
      return null;
    }
  }
  return null;
};

const Header = ({ user: propUser, onLogout, onCreateBattle, onNavigate }) => {
  // Header 자체에서 사용자 상태 관리
  const [currentUser, setCurrentUser] = useState(
    propUser || getCurrentSessionUser()
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    about: false,
    magazine: false,
    entertainment: false,
    user: false,
  });

  const dropdownTimers = useRef({});

  // 실시간 사용자 상태 감지
  useEffect(() => {
    // Props에서 받은 user와 세션의 user 중 최신 것을 사용
    const sessionUser = getCurrentSessionUser();
    const latestUser = sessionUser || propUser;

    if (JSON.stringify(currentUser) !== JSON.stringify(latestUser)) {
      console.log("🔄 Header: User state updated", latestUser);
      setCurrentUser(latestUser);
    }
  }, [propUser, currentUser]);

  // 세션 스토리지 변경 감지
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "currentUser") {
        console.log("📦 Header: Session storage changed", e.newValue);
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setCurrentUser(userData);
          } catch (error) {
            console.error("Failed to parse user data:", error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };

    // 포커스 이벤트로 세션 확인 (같은 탭에서의 변경 감지)
    const handleFocus = () => {
      const sessionUser = getCurrentSessionUser();
      if (JSON.stringify(currentUser) !== JSON.stringify(sessionUser)) {
        console.log("🔄 Header: Focus event - updating user", sessionUser);
        setCurrentUser(sessionUser);
      }
    };

    // 커스텀 이벤트 감지 (SpotifyCallback에서 발생)
    const handleAuthStateChanged = (event) => {
      console.log("🔄 Header: Auth state change event", event.detail);
      const sessionUser = getCurrentSessionUser();
      setCurrentUser(sessionUser);
    };

    // 주기적으로 세션 확인 (폴링)
    const pollInterval = setInterval(() => {
      const sessionUser = getCurrentSessionUser();
      if (JSON.stringify(currentUser) !== JSON.stringify(sessionUser)) {
        console.log("🔄 Header: Polling - user state changed", sessionUser);
        setCurrentUser(sessionUser);
      }
    }, 1000); // 1초마다 확인

    // 이벤트 리스너 등록
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("authStateChanged", handleAuthStateChanged);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
    };
  }, [currentUser]);

  // 드롭다운 관리 함수들
  const openDropdown = (key) => {
    if (dropdownTimers.current[key]) {
      clearTimeout(dropdownTimers.current[key]);
      delete dropdownTimers.current[key];
    }

    setDropdownOpen((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const closeDropdown = (key) => {
    dropdownTimers.current[key] = setTimeout(() => {
      setDropdownOpen((prev) => ({
        ...prev,
        [key]: false,
      }));
      delete dropdownTimers.current[key];
    }, 300);
  };

  useEffect(() => {
    return () => {
      Object.values(dropdownTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  const menuItems = [
    {
      label: "About",
      path: "/about",
      hasDropdown: true,
      dropdownKey: "about",
      subItems: [
        { label: "Introduction", path: "/about/introduction" },
        { label: "Mayor", path: "/about/mayor" },
        { label: "History", path: "/about/history" },
      ],
    },
    {
      label: "Culture Magazine",
      path: "/magazine",
      hasDropdown: true,
      dropdownKey: "magazine",
      subItems: [
        { label: "Hot", path: "/magazine/hot" },
        { label: "Best", path: "/magazine/best" },
        { label: "Application", path: "/magazine/application" },
      ],
    },
    {
      label: "Entertainment",
      path: "/entertainment",
      hasDropdown: true,
      dropdownKey: "entertainment",
      subItems: [
        { label: "Artist", path: "/entertainment/artist" },
        { label: "Game", path: "/entertainment/game" },
        { label: "SVC", path: "/entertainment/svc" },
      ],
    },
  ];

  // 사용자 정보 추출
  const displayName = getDisplayName(currentUser);
  const avatarUrl = getAvatarUrl(currentUser);
  const providerBadge = getProviderBadge(currentUser);

  console.log("🎯 Header render - currentUser:", currentUser?.email || "null"); // 간소화된 로그

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate("/")}
            className="flex-shrink-0 flex items-center"
          >
            <h1 className="text-2xl font-bold text-white">
              <span className="text-pink-500">Battle</span> Seoul
            </h1>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <div key={item.label} className="relative">
                <button
                  onMouseEnter={() =>
                    item.hasDropdown && openDropdown(item.dropdownKey)
                  }
                  onMouseLeave={() =>
                    item.hasDropdown && closeDropdown(item.dropdownKey)
                  }
                  onClick={() => onNavigate(item.path)}
                  className="flex items-center gap-1 text-gray-300 hover:text-pink-400 transition-colors py-2"
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="w-4 h-4" />}
                </button>

                {item.hasDropdown && dropdownOpen[item.dropdownKey] && (
                  <div
                    onMouseEnter={() => openDropdown(item.dropdownKey)}
                    onMouseLeave={() => closeDropdown(item.dropdownKey)}
                    className="absolute top-full -left-4 mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 min-w-[200px] z-50"
                  >
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.path}
                        onClick={() => {
                          onNavigate(subItem.path);
                          setDropdownOpen((prev) => ({
                            ...prev,
                            [item.dropdownKey]: false,
                          }));
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {currentUser ? (
              // 로그인 했을 때 UI
              <>
                <Link to="/create-battle">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Sword className="w-4 h-4" />
                    배틀 만들기
                  </button>
                </Link>
                <button
                  onClick={onCreateBattle}
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  콘텐츠 업로드
                </button>

                {/* 사용자 프로필 드롭다운 */}
                <div
                  className="relative group"
                  onMouseEnter={() => openDropdown("user")}
                  onMouseLeave={() => closeDropdown("user")}
                >
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-700">
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            displayName
                          )}&background=6b7280&color=fff&size=128`;
                        }}
                      />
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="font-semibold text-sm">
                        {displayName}
                      </span>
                      {providerBadge && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full text-white ${providerBadge.color}`}
                        >
                          {providerBadge.icon} {providerBadge.text}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {dropdownOpen.user && (
                    <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                      {/* 사용자 정보 헤더 */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                displayName
                              )}&background=6b7280&color=fff&size=128`;
                            }}
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {displayName}
                            </div>
                            {currentUser.email && (
                              <div className="text-xs text-gray-400">
                                {currentUser.email}
                              </div>
                            )}
                            {providerBadge && (
                              <span
                                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${providerBadge.color}`}
                              >
                                {providerBadge.icon} {providerBadge.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onNavigate("/mypage");
                          setDropdownOpen((prev) => ({ ...prev, user: false }));
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        마이페이지
                      </button>
                      <button
                        onClick={() => {
                          onLogout();
                          setDropdownOpen((prev) => ({ ...prev, user: false }));
                          // 로그아웃 후 즉시 상태 업데이트
                          setCurrentUser(null);
                        }}
                        className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border-t border-gray-700 text-red-400 hover:text-red-300"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // 로그아웃 상태일 때 UI
              <button
                onClick={() => onNavigate("/login")}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-semibold"
              >
                로그인
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {currentUser && (
              <div className="border-b border-gray-700 pb-4 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        displayName
                      )}&background=6b7280&color=fff&size=128`;
                    }}
                  />
                  <div>
                    <div className="font-semibold text-white">
                      {displayName}
                    </div>
                    {currentUser.email && (
                      <div className="text-xs text-gray-400">
                        {currentUser.email}
                      </div>
                    )}
                    {providerBadge && (
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${providerBadge.color}`}
                      >
                        {providerBadge.icon} {providerBadge.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {menuItems.map((item) => (
              <div key={item.label}>
                <button
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-lg text-gray-300 hover:text-pink-400 transition-colors"
                >
                  {item.label}
                </button>

                {item.hasDropdown && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.path}
                        onClick={() => {
                          onNavigate(subItem.path);
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left py-2 text-base text-gray-400 hover:text-pink-300 transition-colors"
                      >
                        • {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {currentUser && (
              <div className="border-t border-gray-700 pt-4 mt-4 space-y-4 pb-4">
                <Link to="/create-battle">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Sword className="w-4 h-4" />
                    배틀 만들기
                  </button>
                </Link>
                <button
                  onClick={() => {
                    onCreateBattle();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  콘텐츠 업로드
                </button>
                <button
                  onClick={() => {
                    onNavigate("/mypage");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  마이페이지
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
