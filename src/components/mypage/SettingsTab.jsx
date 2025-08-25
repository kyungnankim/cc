// components/mypage/SettingsTab.jsx - 설정 탭 (Default Export 버전)
import React, { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Eye,
  Globe,
  Smartphone,
  Trash2,
  Download,
  Upload,
  Key,
  AlertTriangle,
  Save,
  Loader2,
  Lock,
  User,
  Mail,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Languages,
  HelpCircle,
  FileText,
  Heart,
} from "lucide-react";
import {
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../../firebase/config";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import toast from "react-hot-toast";

const SettingsTab = ({ user }) => {
  const [settings, setSettings] = useState({
    // 알림 설정
    emailNotifications: true,
    pushNotifications: true,
    battleNotifications: true,
    voteNotifications: true,
    weeklyReport: true,

    // 개인정보 설정
    profileVisibility: "public", // public, friends, private
    showEmail: false,
    showVoteHistory: true,
    showBattleHistory: true,

    // 앱 설정
    theme: "dark", // dark, light, system
    language: "ko",
    soundEnabled: true,
    autoplay: false,

    // 보안 설정
    twoFactorEnabled: false,
    loginAlerts: true,
  });

  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);

      // Firestore에 설정 저장
      await updateDoc(doc(db, "userSettings", user.uid), {
        ...settings,
        updatedAt: new Date(),
      });

      toast.success("설정이 저장되었습니다!");
    } catch (error) {
      console.error("Settings save error:", error);
      toast.error("설정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    try {
      // 사용자 데이터 수집 및 JSON으로 다운로드
      const userData = {
        profile: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.metadata.creationTime,
        },
        settings: settings,
        exportedAt: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `battlestage-data-${user.uid}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("데이터가 다운로드되었습니다!");
    } catch (error) {
      console.error("Data export error:", error);
      toast.error("데이터 내보내기에 실패했습니다.");
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error("'DELETE'를 정확히 입력해주세요.");
      return;
    }

    if (!currentPassword) {
      toast.error("현재 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 재인증
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Firestore에서 사용자 데이터 삭제
      await deleteDoc(doc(db, "users", user.uid));
      await deleteDoc(doc(db, "userSettings", user.uid));

      // Firebase Auth에서 계정 삭제
      await deleteUser(user);

      toast.success("계정이 완전히 삭제되었습니다.");
      window.location.href = "/";
    } catch (error) {
      console.error("Account deletion error:", error);
      if (error.code === "auth/wrong-password") {
        toast.error("비밀번호가 올바르지 않습니다.");
      } else {
        toast.error("계정 삭제에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    { value: "dark", label: "다크 모드", icon: Moon },
    { value: "light", label: "라이트 모드", icon: Sun },
    { value: "system", label: "시스템 설정", icon: Monitor },
  ];

  const languageOptions = [
    { value: "ko", label: "한국어" },
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
  ];

  const privacyOptions = [
    { value: "public", label: "전체 공개" },
    { value: "friends", label: "친구만" },
    { value: "private", label: "비공개" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">설정</h3>
        <button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          설정 저장
        </button>
      </div>

      {/* 알림 설정 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림 설정
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-gray-400">
                중요한 소식을 이메일로 받아보세요
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  handleSettingChange("emailNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">푸시 알림</p>
              <p className="text-sm text-gray-400">
                브라우저 푸시 알림을 받아보세요
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  handleSettingChange("pushNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">배틀 알림</p>
              <p className="text-sm text-gray-400">
                새로운 배틀 소식을 받아보세요
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.battleNotifications}
                onChange={(e) =>
                  handleSettingChange("battleNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">투표 알림</p>
              <p className="text-sm text-gray-400">
                투표 결과 및 관련 소식을 받아보세요
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voteNotifications}
                onChange={(e) =>
                  handleSettingChange("voteNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">주간 리포트</p>
              <p className="text-sm text-gray-400">
                매주 활동 요약을 받아보세요
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.weeklyReport}
                onChange={(e) =>
                  handleSettingChange("weeklyReport", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 개인정보 설정 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          개인정보 설정
        </h4>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              프로필 공개 범위
            </label>
            <div className="grid grid-cols-3 gap-3">
              {privacyOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    settings.profileVisibility === option.value
                      ? "border-pink-500 bg-pink-500/20"
                      : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="profileVisibility"
                    value={option.value}
                    checked={settings.profileVisibility === option.value}
                    onChange={(e) =>
                      handleSettingChange("profileVisibility", e.target.value)
                    }
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 주소 공개</p>
              <p className="text-sm text-gray-400">
                다른 사용자에게 이메일을 공개합니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showEmail}
                onChange={(e) =>
                  handleSettingChange("showEmail", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">투표 내역 공개</p>
              <p className="text-sm text-gray-400">
                내 투표 내역을 다른 사용자에게 공개합니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showVoteHistory}
                onChange={(e) =>
                  handleSettingChange("showVoteHistory", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">배틀 내역 공개</p>
              <p className="text-sm text-gray-400">
                내가 만든 배틀을 다른 사용자에게 공개합니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showBattleHistory}
                onChange={(e) =>
                  handleSettingChange("showBattleHistory", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 앱 설정 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />앱 설정
        </h4>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              테마 설정
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((theme) => {
                const Icon = theme.icon;
                return (
                  <label
                    key={theme.value}
                    className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.theme === theme.value
                        ? "border-pink-500 bg-pink-500/20"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.theme === theme.value}
                      onChange={(e) =>
                        handleSettingChange("theme", e.target.value)
                      }
                      className="sr-only"
                    />
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">{theme.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              언어 설정
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange("language", e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
            >
              {languageOptions.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-green-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">사운드 효과</p>
                <p className="text-sm text-gray-400">
                  버튼 클릭 및 알림 사운드
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) =>
                  handleSettingChange("soundEnabled", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">비디오 자동 재생</p>
              <p className="text-sm text-gray-400">
                배틀 콘텐츠를 자동으로 재생합니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoplay}
                onChange={(e) =>
                  handleSettingChange("autoplay", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 보안 설정 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          보안 설정
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">2단계 인증</p>
              <p className="text-sm text-gray-400">
                추가 보안을 위한 2단계 인증을 활성화합니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={(e) =>
                  handleSettingChange("twoFactorEnabled", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">로그인 알림</p>
              <p className="text-sm text-gray-400">
                새로운 기기에서 로그인할 때 알림을 보냅니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loginAlerts}
                onChange={(e) =>
                  handleSettingChange("loginAlerts", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:ring-pink-500 peer-focus:ring-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-600">
            <button
              onClick={() => {
                /* 비밀번호 변경 모달 열기 */
              }}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Key className="w-4 h-4" />
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          데이터 관리
        </h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">내 데이터 내보내기</p>
              <p className="text-sm text-gray-400">
                모든 사용자 데이터를 JSON 파일로 다운로드합니다
              </p>
            </div>
            <button
              onClick={exportUserData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">데이터 가져오기</p>
              <p className="text-sm text-gray-400">
                백업된 데이터를 복원합니다
              </p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              가져오기
              <input type="file" accept=".json" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 도움말 및 지원 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          도움말 및 지원
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="/help"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <div>
              <p className="font-medium">도움말 센터</p>
              <p className="text-sm text-gray-400">자주 묻는 질문과 가이드</p>
            </div>
          </a>

          <a
            href="/contact"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Mail className="w-5 h-5 text-green-400" />
            <div>
              <p className="font-medium">고객 지원</p>
              <p className="text-sm text-gray-400">문의사항 및 신고</p>
            </div>
          </a>

          <a
            href="/terms"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FileText className="w-5 h-5 text-purple-400" />
            <div>
              <p className="font-medium">이용약관</p>
              <p className="text-sm text-gray-400">서비스 이용 약관</p>
            </div>
          </a>

          <a
            href="/privacy"
            className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Shield className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="font-medium">개인정보처리방침</p>
              <p className="text-sm text-gray-400">개인정보 보호 정책</p>
            </div>
          </a>
        </div>
      </div>

      {/* 계정 삭제 */}
      <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          위험한 작업
        </h4>

        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">계정 삭제</p>
                <p className="text-sm text-gray-300 mt-1">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수
                  없습니다. 배틀, 투표 내역, 포인트 등 모든 정보가 삭제됩니다.
                </p>
                <ul className="text-xs text-red-300 mt-2 space-y-1">
                  <li>• 모든 배틀 및 콘텐츠 삭제</li>
                  <li>• 투표 내역 및 포인트 삭제</li>
                  <li>• 프로필 및 설정 삭제</li>
                  <li>• 구독 정보 삭제</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            계정 삭제
          </button>
        </div>
      </div>

      {/* 계정 삭제 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h5 className="text-lg font-semibold">계정 삭제 확인</h5>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  확인을 위해 'DELETE'를 입력하세요
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm("");
                    setCurrentPassword("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={
                    loading || deleteConfirm !== "DELETE" || !currentPassword
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 앱 정보 */}
      <div className="bg-gray-700/30 rounded-xl p-6">
        <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />앱 정보
        </h4>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold mb-2">BattleStage</h5>
            <p className="text-sm text-gray-400 mb-3">
              콘텐츠 창작자들을 위한 배틀 플랫폼
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-400">버전: 1.0.0</p>
              <p className="text-gray-400">빌드: 2024.12.20</p>
              <p className="text-gray-400">개발: BattleStage Team</p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold mb-2">지원 정보</h5>
            <div className="space-y-2 text-sm">
              <p className="text-gray-400">이메일: support@battlestage.kr</p>
              <p className="text-gray-400">운영시간: 평일 09:00-18:00</p>
              <p className="text-gray-400">응답시간: 24시간 이내</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-600">
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/terms" className="text-blue-400 hover:underline">
              이용약관
            </a>
            <a href="/privacy" className="text-blue-400 hover:underline">
              개인정보처리방침
            </a>
            <a href="/help" className="text-blue-400 hover:underline">
              도움말
            </a>
            <a href="/contact" className="text-blue-400 hover:underline">
              문의하기
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            © 2024 BattleStage. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
