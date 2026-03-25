import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-1 mb-3">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#6B7280] hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
      >
        <i className="ri-arrow-left-line text-sm"></i>
        <span>뒤로</span>
      </button>
      <span className="text-gray-200 text-xs select-none">|</span>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#6B7280] hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
      >
        <i className="ri-home-4-line text-sm"></i>
        <span>홈</span>
      </button>
    </div>
  );
}
