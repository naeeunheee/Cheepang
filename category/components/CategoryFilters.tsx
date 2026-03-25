import { useState } from 'react';

interface CategoryFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  optionFilter: string;
  onOptionFilterChange: (v: string) => void;
  allOptionLabels: string[];
  resultCount: number;
  totalCount: number;
  subTypeFilter?: string;
  onSubTypeFilterChange?: (v: string) => void;
  showSubTypeFilter?: boolean;
}

export default function CategoryFilters({
  searchQuery,
  onSearchChange,
  optionFilter,
  onOptionFilterChange,
  allOptionLabels,
  resultCount,
  totalCount,
  subTypeFilter = 'all',
  onSubTypeFilterChange,
  showSubTypeFilter = false,
}: CategoryFiltersProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
      <div className="flex flex-col gap-4">
        {/* 서브타입 필터 (픽스쳐 카테고리 전용) */}
        {showSubTypeFilter && onSubTypeFilterChange && (
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">타입:</span>
            <button
              onClick={() => onSubTypeFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                subTypeFilter === 'all'
                  ? 'bg-[#1A2B3C] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => onSubTypeFilterChange('bone_level')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                subTypeFilter === 'bone_level'
                  ? 'bg-[#2B5F9E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bone Level
            </button>
            <button
              onClick={() => onSubTypeFilterChange('tissue_level')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                subTypeFilter === 'tissue_level'
                  ? 'bg-[#2B5F9E] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tissue Level
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* 검색바 */}
          <div
            className={`relative flex-1 max-w-sm transition-all ${
              focused ? 'ring-2 ring-[#2B5F9E]/20 rounded-xl' : ''
            }`}
          >
            <div className="w-9 h-9 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <i className="ri-search-line text-gray-400 text-base" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="제품명 또는 모델코드 검색..."
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#2B5F9E] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-gray-400 text-xs" />
              </button>
            )}
          </div>

          {/* 옵션 필터 */}
          {allOptionLabels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">필터:</span>
              <button
                onClick={() => onOptionFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  optionFilter === 'all'
                    ? 'bg-[#1A2B3C] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {allOptionLabels.map((label) => (
                <button
                  key={label}
                  onClick={() => onOptionFilterChange(label)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    optionFilter === label
                      ? 'bg-[#2B5F9E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 결과 수 */}
          <div className="ml-auto text-xs text-gray-400 whitespace-nowrap">
            <span className="font-bold text-[#1A2B3C] text-sm">{resultCount}</span>
            <span> / {totalCount}개</span>
          </div>
        </div>
      </div>
    </div>
  );
}