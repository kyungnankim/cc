// components/mypage/index.js - MyPage 컴포넌트들 통합 export

// 메인 컴포넌트
export { default as MyPage } from "../MyPage";

// 탭 컴포넌트들
export { default as ProfileTab } from "./ProfileTab";
export { default as BattlesTab } from "./BattlesTab";
export { default as VotesTab } from "./VotesTab";
export { PointsTab } from "./PointsTab";
export { default as SubscriptionTab } from "./SubscriptionTab";
export { SettingsTab } from "./SettingsTab";

// 사용 예시:
// import { MyPage, ProfileTab, SubscriptionTab } from './components/mypage';
