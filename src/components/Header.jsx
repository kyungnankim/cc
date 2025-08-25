// 파일 경로: src/components/Header.jsx

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Plus, User, ChevronDown, Sword } from "lucide-react";

const getDisplayName = (user) =>
  user?.displayName || user?.email?.split("@")[0] || "사용자";
const getAvatarUrl = (user) =>
  user?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    getDisplayName(user)
  )}&background=random&color=fff`;

const Header = ({ user, onLogout, onCreateBattle }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-pink-500">Battle</span> Seoul
            </h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-300 hover:text-pink-400">
              About
            </Link>
            <Link to="/magazine" className="text-gray-300 hover:text-pink-400">
              Culture Magazine
            </Link>
            <Link
              to="/entertainment"
              className="text-gray-300 hover:text-pink-400"
            >
              Entertainment
            </Link>
            <Link to="/game" className="text-gray-300 hover:text-pink-400">
              Game
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/create-battle">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Sword className="w-4 h-4" /> 배틀 만들기
                  </button>
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover bg-gray-700"
                    />
                    <span className="hidden md:inline font-semibold text-sm text-white">
                      {displayName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm font-semibold text-white">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/mypage"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        마이페이지
                      </Link>
                      <button
                        onClick={() => {
                          onLogout();
                          setDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-semibold"
              >
                로그인
              </button>
            )}
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
    </header>
  );
};

export default Header;
