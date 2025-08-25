// src/pages/CreateBattlePage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { createBattleFromContenders } from "../services/matchingService";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const ContenderCard = ({ contender, onSelect, isSelected }) => (
  <div
    onClick={() => onSelect(contender)}
    className={`p-3 border-2 rounded-lg cursor-pointer transition-all h-full flex flex-col ${
      isSelected
        ? "border-pink-500 bg-pink-500/20"
        : "border-gray-700 hover:border-pink-500/50"
    }`}
  >
    <img
      src={contender.imageUrl}
      alt={contender.title}
      className="w-full h-40 object-cover rounded-md mb-2 flex-shrink-0"
    />
    <div className="flex-grow flex flex-col justify-center">
      <p className="text-white text-center text-sm font-semibold truncate">
        {contender.title}
      </p>
      <p className="text-gray-500 text-center text-xs mt-1">
        by {contender.creatorName}
      </p>
    </div>
  </div>
);

const CreateBattlePage = () => {
  const navigate = useNavigate();
  const [myContenders, setMyContenders] = useState([]);
  const [otherContenders, setOtherContenders] = useState([]);
  const [selectedMy, setSelectedMy] = useState(null);
  const [selectedOther, setSelectedOther] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchContenders = async () => {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      try {
        const q = query(
          collection(db, "contenders"),
          where("status", "==", "available"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const all = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMyContenders(all.filter((c) => c.creatorId === currentUser.uid));
        setOtherContenders(all.filter((c) => c.creatorId !== currentUser.uid));
      } catch (error) {
        console.error("Error fetching contenders:", error);
        toast.error("콘텐츠를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchContenders();
  }, [navigate]);

  const handleCreateBattle = async () => {
    if (!selectedMy || !selectedOther) {
      return toast.error("자신과 상대의 콘텐츠를 모두 선택하세요.");
    }
    if (selectedMy.category !== selectedOther.category) {
      return toast.error("같은 카테고리의 콘텐츠끼리만 대결할 수 있습니다.");
    }
    setIsCreating(true);
    try {
      await createBattleFromContenders(selectedMy, selectedOther);
      toast.success("배틀이 성공적으로 생성되었습니다!");
      navigate("/");
    } catch (error) {
      console.error("Error creating battle:", error);
      toast.error("배틀 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">새로운 배틀 시작하기</h1>
        <p className="mt-4 text-lg text-gray-400">
          당신의 콘텐츠와 다른 유저의 콘텐츠를 선택하여 배틀을 만들어보세요.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-gray-700">
            1. 내 콘텐츠 선택
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {myContenders.length > 0 ? (
              myContenders.map((c) => (
                <ContenderCard
                  key={c.id}
                  contender={c}
                  onSelect={setSelectedMy}
                  isSelected={selectedMy?.id === c.id}
                />
              ))
            ) : (
              <p className="text-gray-500 col-span-full mt-4">
                업로드한 콘텐츠가 없습니다. 먼저 '게시물 업로드'를 통해 콘텐츠를
                등록해주세요.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-gray-700">
            2. 상대 콘텐츠 선택
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {otherContenders.length > 0 ? (
              otherContenders.map((c) => (
                <ContenderCard
                  key={c.id}
                  contender={c}
                  onSelect={setSelectedOther}
                  isSelected={selectedOther?.id === c.id}
                />
              ))
            ) : (
              <p className="text-gray-500 col-span-full mt-4">
                대결 가능한 상대 콘텐츠가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <button
          onClick={handleCreateBattle}
          disabled={isCreating || !selectedMy || !selectedOther}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg text-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          {isCreating ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            "배틀 시작!"
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateBattlePage;
