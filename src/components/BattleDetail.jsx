// src/components/BattleDetail.jsx - 메인 배틀 상세 컴포넌트 (투표 상태 확인 개선)

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getBattleDetail } from "../services/battleService";
import toast from "react-hot-toast";

// 분리된 컴포넌트들 import
import BattleDetailHeader from "./BattleDetail/BattleDetailHeader";
import BattleDetailInfo from "./BattleDetail/BattleDetailInfo";
import BattleVSSection from "./BattleDetail/BattleVSSection";
import BattleStats from "./BattleDetail/BattleStats";
import BattleComments from "./BattleDetail/BattleComments";
import BattleTrending from "./BattleDetail/BattleTrending";

const BattleDetail = () => {
  const { id: battleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedSide, setSelectedSide] = useState(null);
  const [liked, setLiked] = useState(false);
  const [viewStartTime] = useState(Date.now());

  useEffect(() => {
    loadBattleDetail();
  }, [battleId, user]); // user 의존성 추가

  useEffect(() => {
    // 페이지 이탈 시 조회 시간 기록
    return () => {
      if (battle && user) {
        const viewDuration = Date.now() - viewStartTime;
        if (viewDuration > 5000) {
          recordDetailedView(viewDuration);
        }
      }
    };
  }, [battle, user, viewStartTime]);

  const loadBattleDetail = async () => {
    try {
      setLoading(true);
      const result = await getBattleDetail(battleId, user?.uid);

      if (result.success) {
        setBattle(result.battle);

        // 사용자가 이미 투표했는지 확인 (더 정확하게)
        if (user && result.battle.participants?.includes(user.uid)) {
          setHasVoted(true);
          // TODO: 어느 쪽에 투표했는지 확인하는 로직 필요
          // 현재는 단순히 투표 여부만 확인
        } else {
          setHasVoted(false);
          setSelectedSide(null);
        }

        // 좋아요 상태 확인
        if (user && result.battle.likedBy?.includes(user.uid)) {
          setLiked(true);
        } else {
          setLiked(false);
        }
      } else {
        toast.error(result.message || "배틀 정보를 불러올 수 없습니다.");
        navigate("/");
      }
    } catch (error) {
      console.error("배틀 상세 정보 로드 실패:", error);
      toast.error("배틀 정보를 불러오는 중 오류가 발생했습니다.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const recordDetailedView = async (viewDuration) => {
    // 상세 조회 기록은 별도 처리 (향후 분석용)
    console.log(`Battle ${battleId} viewed for ${viewDuration}ms`);
  };

  // 배틀 데이터 업데이트 함수
  const updateBattle = (updatedBattle) => {
    setBattle(updatedBattle);
  };

  // 투표 상태 업데이트 함수 (더 안전하게)
  const updateVoteStatus = (voted, side) => {
    setHasVoted(voted);
    setSelectedSide(side);

    // 투표 상태가 변경되면 battle 데이터도 동기화
    if (voted && battle && user) {
      const updatedBattle = { ...battle };
      if (!updatedBattle.participants?.includes(user.uid)) {
        updatedBattle.participants = [
          ...(updatedBattle.participants || []),
          user.uid,
        ];
        setBattle(updatedBattle);
      }
    }
  };

  // 좋아요 상태 업데이트 함수
  const updateLikeStatus = (likedStatus) => {
    setLiked(likedStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">배틀 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">배틀을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <BattleDetailHeader
        battle={battle}
        liked={liked}
        onBack={() => navigate("/")}
        onLike={updateLikeStatus}
        onBattleUpdate={updateBattle}
      />

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 배틀 정보 헤더 */}
        <BattleDetailInfo battle={battle} />

        {/* VS 섹션 */}
        <BattleVSSection
          battle={battle}
          user={user}
          hasVoted={hasVoted}
          selectedSide={selectedSide}
          onVote={updateVoteStatus}
          onBattleUpdate={updateBattle}
          onNavigate={navigate}
        />

        {/* 배틀 설명 */}
        {battle.description && (
          <div className="bg-gray-800/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-3">배틀 소개</h3>
            <p className="text-gray-300 leading-relaxed">
              {battle.description}
            </p>
          </div>
        )}

        {/* 통계 */}
        <BattleStats battle={battle} />

        {/* 트렌딩 정보 */}
        {battle.trendingScore > 0 && <BattleTrending battle={battle} />}

        {/* 댓글 섹션 */}
        <BattleComments
          battle={battle}
          user={user}
          onBattleUpdate={updateBattle}
          onNavigate={navigate}
        />
      </div>
    </div>
  );
};

export default BattleDetail;
