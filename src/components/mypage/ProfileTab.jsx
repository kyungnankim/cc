// components/mypage/ProfileTab.jsx - 프로필 탭
import React, { useState } from "react";
import {
  Edit3,
  Save,
  X,
  Camera,
  User,
  MapPin,
  Globe,
  Calendar,
  Loader2,
} from "lucide-react";
import { updateProfile } from "../../services/userService.js";
import toast from "react-hot-toast";

const ProfileTab = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    birthYear: user?.birthYear || "",
    gender: user?.gender || "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(user.uid, formData);
      toast.success("프로필이 업데이트되었습니다!");
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("프로필 업데이트에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    try {
      setAvatarLoading(true);
      // 실제 환경에서는 Cloudinary나 Firebase Storage에 업로드
      // 여기서는 임시로 로컬 URL 생성
      const imageUrl = URL.createObjectURL(file);

      await updateProfile(user.uid, { photoURL: imageUrl });
      toast.success("프로필 사진이 업데이트되었습니다!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("프로필 사진 업로드에 실패했습니다.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const genderOptions = [
    { value: "", label: "선택 안함" },
    { value: "male", label: "남성" },
    { value: "female", label: "여성" },
    { value: "other", label: "기타" },
  ];

  const currentYear = new Date().getFullYear();
  const birthYearOptions = Array.from(
    { length: 100 },
    (_, i) => currentYear - 13 - i
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">프로필 정보</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          {isEditing ? (
            <X className="w-4 h-4" />
          ) : (
            <Edit3 className="w-4 h-4" />
          )}
          {isEditing ? "취소" : "수정하기"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 프로필 사진 섹션 */}
        <div className="lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}

                {avatarLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-pink-500 p-2 rounded-full hover:bg-pink-600 transition-colors cursor-pointer">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={avatarLoading}
                  />
                </label>
              )}
            </div>

            <h4 className="text-xl font-semibold mb-1">
              {formData.displayName || user?.email?.split("@")[0] || "사용자"}
            </h4>
            <p className="text-gray-400 text-sm mb-2">{user?.email}</p>

            {/* 시민권 번호 */}
            <div className="bg-gray-700/50 px-3 py-2 rounded-lg text-sm">
              <p className="text-xs text-gray-400 mb-1">시민권 번호</p>
              <p className="font-mono text-pink-400">
                BS{user?.uid?.slice(-8)?.toUpperCase() || "00000000"}
              </p>
            </div>
          </div>
        </div>

        {/* 프로필 정보 섹션 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-gray-700/30 rounded-xl p-6">
            <h5 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              기본 정보
            </h5>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  표시 이름
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    placeholder="표시할 이름을 입력하세요"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                    {formData.displayName || "설정되지 않음"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이메일
                </label>
                <p className="text-gray-400 bg-gray-700/30 px-4 py-3 rounded-lg">
                  {user?.email}
                  <span className="text-xs text-gray-500 block mt-1">
                    (변경 불가)
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  출생년도
                </label>
                {isEditing ? (
                  <select
                    value={formData.birthYear}
                    onChange={(e) =>
                      handleInputChange("birthYear", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">선택해주세요</option>
                    {birthYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                    {formData.birthYear
                      ? `${formData.birthYear}년`
                      : "설정되지 않음"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  성별
                </label>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                    {genderOptions.find((opt) => opt.value === formData.gender)
                      ?.label || "설정되지 않음"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="bg-gray-700/30 rounded-xl p-6">
            <h5 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              추가 정보
            </h5>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  자기소개
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="자신을 소개해보세요..."
                    rows="4"
                    maxLength="500"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none resize-none"
                  />
                ) : (
                  <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg min-h-[100px] whitespace-pre-wrap">
                    {formData.bio || "설정되지 않음"}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 글자
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    위치
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder="예: 서울, 대한민국"
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                      {formData.location || "설정되지 않음"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    웹사이트
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                      {formData.website ? (
                        <a
                          href={formData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:underline break-all"
                        >
                          {formData.website}
                        </a>
                      ) : (
                        "설정되지 않음"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 계정 정보 */}
          <div className="bg-gray-700/30 rounded-xl p-6">
            <h5 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              계정 정보
            </h5>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  가입일
                </label>
                <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString(
                        "ko-KR"
                      )
                    : "정보 없음"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  최근 로그인
                </label>
                <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                  {user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                        "ko-KR"
                      )
                    : "정보 없음"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이메일 인증
                </label>
                <p
                  className={`px-4 py-3 rounded-lg ${
                    user?.emailVerified
                      ? "text-green-400 bg-green-500/20"
                      : "text-yellow-400 bg-yellow-500/20"
                  }`}
                >
                  {user?.emailVerified ? "인증 완료" : "인증 필요"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  로그인 방식
                </label>
                <p className="text-white bg-gray-700/50 px-4 py-3 rounded-lg">
                  {user?.providerData?.[0]?.providerId === "google.com"
                    ? "Google"
                    : user?.providerData?.[0]?.providerId === "password"
                    ? "이메일/비밀번호"
                    : "기타"}
                </p>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          {isEditing && (
            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    displayName: user?.displayName || "",
                    bio: user?.bio || "",
                    location: user?.location || "",
                    website: user?.website || "",
                    birthYear: user?.birthYear || "",
                    gender: user?.gender || "",
                  });
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 프로필 완성도 */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-6">
        <h5 className="text-lg font-semibold mb-4">프로필 완성도</h5>

        {(() => {
          const completionItems = [
            {
              key: "displayName",
              label: "표시 이름",
              completed: !!formData.displayName,
            },
            { key: "bio", label: "자기소개", completed: !!formData.bio },
            { key: "location", label: "위치", completed: !!formData.location },
            {
              key: "avatar",
              label: "프로필 사진",
              completed: !!user?.photoURL,
            },
            {
              key: "emailVerified",
              label: "이메일 인증",
              completed: !!user?.emailVerified,
            },
          ];

          const completedCount = completionItems.filter(
            (item) => item.completed
          ).length;
          const completionPercentage = Math.round(
            (completedCount / completionItems.length) * 100
          );

          return (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-300">
                  {completedCount}/{completionItems.length} 항목 완료
                </span>
                <span className="text-sm font-medium text-purple-400">
                  {completionPercentage}%
                </span>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {completionItems.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2 text-sm ${
                      item.completed ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        item.completed ? "bg-green-500" : "bg-gray-600"
                      }`}
                    >
                      {item.completed && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              {completionPercentage < 100 && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    💡 프로필을 완성하면 더 많은 사용자들이 회원님을 찾을 수
                    있어요!
                  </p>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default ProfileTab;
