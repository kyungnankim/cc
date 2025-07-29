import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Plus, User, ChevronDown, Sword } from "lucide-react";

const Header = ({ user, onLogout, onCreateBattle, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    about: false,
    magazine: false,
    entertainment: false,
  });

  // 🔧 타이머 관리를 위한 ref
  const dropdownTimers = useRef({});

  // 🔧 드롭다운 열기 (즉시)
  const openDropdown = (key) => {
    // 기존 타이머가 있으면 취소
    if (dropdownTimers.current[key]) {
      clearTimeout(dropdownTimers.current[key]);
      delete dropdownTimers.current[key];
    }

    setDropdownOpen((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  // 🔧 드롭다운 닫기 (지연)
  const closeDropdown = (key) => {
    // 500ms 후에 닫기
    dropdownTimers.current[key] = setTimeout(() => {
      setDropdownOpen((prev) => ({
        ...prev,
        [key]: false,
      }));
      delete dropdownTimers.current[key];
    }, 300);
  };

  // 🔧 컴포넌트 언마운트 시 타이머 정리
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

                {/* 🔧 드롭다운 메뉴 개선 */}
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
                          // 클릭 후 드롭다운 즉시 닫기
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
            {/* --- ⭐️ [수정] 로그인 상태에 따라 UI를 다르게 표시 --- */}
            {user ? (
              // --- 로그인 했을 때 보여줄 UI ---
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

                {/* 🔧 사용자 프로필 드롭다운도 개선 */}
                <div
                  className="relative group"
                  onMouseEnter={() => openDropdown("user")}
                  onMouseLeave={() => closeDropdown("user")}
                >
                  <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors py-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-700">
                      <img
                        src={
                          user.photoURL ||
                          `https://ui-avatars.com/api/?name=${user.email}&background=random`
                        }
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="hidden md:inline font-semibold">
                      {user.displayName || user.email.split("@")[0]}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {dropdownOpen.user && (
                    <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 min-w-[150px] z-50">
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
                        }}
                        className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // --- 로그아웃 상태일 때 보여줄 UI ---
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
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-4 py-4 space-y-2">
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

                {/* 🔧 모바일에서 서브메뉴 표시 */}
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

            {user && (
              <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
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
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
