// upload/CategorySelector.jsx
import React from "react";
import { Music, Shirt, Pizza } from "lucide-react";

const CategorySelector = ({ category, setCategory }) => {
  const categories = [
    { value: "music", label: "Music", icon: Music, color: "pink" },
    { value: "fashion", label: "Fashion", icon: Shirt, color: "purple" },
    { value: "food", label: "Food", icon: Pizza, color: "orange" },
  ];

  return (
    <div>
      <label className="text-gray-300 text-sm font-medium mb-3 block">
        카테고리 선택
      </label>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                category === cat.value
                  ? `border-${cat.color}-500 bg-${cat.color}-500/20 text-white`
                  : "border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
