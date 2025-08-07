// src/hooks/useAuth.js

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
// ❗️ authUtils에서 getCurrentUser를 가져오는 것이 핵심입니다.
import { getCurrentUser } from "../utils/authUtils";

export const useAuth = () => {
  // 앱이 처음 로드될 때 세션 스토리지에서 사용자 정보를 가져와 초기값으로 설정합니다.
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  // 페이지 이동(URL 변경)을 감지하기 위해 useLocation 훅을 사용합니다.
  const location = useLocation();

  useEffect(() => {
    // '/callback'에서 메인 페이지('/')로 이동하는 것과 같은 URL 변경이 일어날 때마다 이 코드가 실행됩니다.
    console.log("경로 변경 감지:", location.pathname);

    // 세션 스토리지를 포함하여 현재 로그인된 사용자가 있는지 다시 확인합니다.
    const currentUser = getCurrentUser();
    console.log("useAuth 훅이 찾은 현재 사용자:", currentUser); // 👈 브라우저 콘솔에서 이 로그를 확인해보세요.

    // 확인된 사용자로 상태를 업데이트합니다.
    setUser(currentUser);
    setLoading(false);

    // location.pathname이 바뀔 때마다 실행되도록 의존성 배열에 추가합니다.
  }, [location.pathname]);

  return { user, loading };
};
