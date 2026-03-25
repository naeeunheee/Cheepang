import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  prompt: string;
  color: string;
}

interface ClassifiedImage {
  id: string;
  url: string;
  category: string;
  confidence: number;
  timestamp: string;
}

export default function ImageClassifierPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<{
    category: string;
    confidence: number;
  } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: '제품 이미지',
      prompt: '이 이미지가 제품 사진인지 판단해주세요. 제품이 명확하게 보이고, 배경이 단순하며, 상업적 용도로 사용 가능한 이미지인 경우 이 카테고리로 분류합니다.',
      color: '#3B82F6'
    },
    {
      id: '2',
      name: '배경 이미지',
      prompt: '이 이미지가 배경용 이미지인지 판단해주세요. 풍경, 텍스처, 패턴 등 배경으로 사용하기 적합한 이미지인 경우 이 카테고리로 분류합니다.',
      color: '#10B981'
    },
    {
      id: '3',
      name: '아이콘/로고',
      prompt: '이 이미지가 아이콘이나 로고인지 판단해주세요. 심플한 디자인, 명확한 형태, 작은 크기에서도 식별 가능한 이미지인 경우 이 카테고리로 분류합니다.',
      color: '#F59E0B'
    },
    {
      id: '4',
      name: '인물 사진',
      prompt: '이 이미지에 사람이 포함되어 있는지 판단해주세요. 인물이 주요 피사체인 경우 이 카테고리로 분류합니다.',
      color: '#EF4444'
    },
    {
      id: '5',
      name: '기타',
      prompt: '위의 카테고리에 해당하지 않는 이미지입니다.',
      color: '#6B7280'
    }
  ]);

  const [classifiedImages, setClassifiedImages] = useState<ClassifiedImage[]>([
    {
      id: '1',
      url: 'https://readdy.ai/api/search-image?query=modern%20dental%20equipment%20professional%20product%20photography%20with%20clean%20white%20background%20studio%20lighting%20high%20quality%20commercial%20image&width=400&height=400&seq=prod1&orientation=squarish',
      category: '제품 이미지',
      confidence: 95,
      timestamp: '2024-01-15 14:30:22'
    },
    {
      id: '2',
      url: 'https://readdy.ai/api/search-image?query=abstract%20gradient%20background%20soft%20blue%20and%20white%20colors%20smooth%20texture%20modern%20minimal%20design%20suitable%20for%20website%20backdrop&width=800&height=600&seq=bg1&orientation=landscape',
      category: '배경 이미지',
      confidence: 92,
      timestamp: '2024-01-15 14:28:15'
    },
    {
      id: '3',
      url: 'https://readdy.ai/api/search-image?query=simple%20tooth%20icon%20minimalist%20dental%20logo%20clean%20design%20vector%20style%20professional%20medical%20symbol%20white%20background&width=200&height=200&seq=icon1&orientation=squarish',
      category: '아이콘/로고',
      confidence: 98,
      timestamp: '2024-01-15 14:25:40'
    },
    {
      id: '4',
      url: 'https://readdy.ai/api/search-image?query=professional%20dentist%20portrait%20smiling%20doctor%20in%20white%20coat%20medical%20professional%20friendly%20appearance%20clinic%20background&width=400&height=500&seq=person1&orientation=portrait',
      category: '인물 사진',
      confidence: 96,
      timestamp: '2024-01-15 14:22:10'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    color: '#3B82F6'
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageUrl('');
      setClassificationResult(null);
    }
  };

  const handleUrlInput = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
    setUploadedFile(null);
    setClassificationResult(null);
  };

  const handleClassify = async () => {
    if (!previewUrl) return;

    setIsClassifying(true);
    
    // 시뮬레이션: 실제로는 AI API를 호출합니다
    await new Promise(resolve => setTimeout(resolve, 2000));

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;

    const result = {
      category: randomCategory.name,
      confidence
    };

    setClassificationResult(result);

    // 분류된 이미지 목록에 추가
    const newImage: ClassifiedImage = {
      id: Date.now().toString(),
      url: previewUrl,
      category: result.category,
      confidence: result.confidence,
      timestamp: new Date().toLocaleString('ko-KR')
    };

    setClassifiedImages([newImage, ...classifiedImages]);
    setIsClassifying(false);
  };

  const handleOpenPromptModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        prompt: category.prompt,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        prompt: '',
        color: '#3B82F6'
      });
    }
    setIsPromptModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData }
          : cat
      ));
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData
      };
      setCategories([...categories, newCategory]);
    }
    
    setIsPromptModalOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) {
      alert('최소 1개의 카테고리는 유지되어야 합니다.');
      return;
    }
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const filteredImages = categoryFilter
    ? classifiedImages.filter(img => img.category === categoryFilter)
    : classifiedImages;

  const stats = {
    total: classifiedImages.length,
    byCategory: categories.map(cat => ({
      name: cat.name,
      count: classifiedImages.filter(img => img.category === cat.name).length,
      color: cat.color
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="cursor-pointer">
                <img 
                  src="https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png" 
                  alt="CHIPANG Logo" 
                  className="h-10"
                />
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link 
                  to="/admin/orders" 
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  주문 관리
                </Link>
                <Link 
                  to="/admin/clients" 
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  거래처 관리
                </Link>
                <Link 
                  to="/admin/image-classifier" 
                  className="px-4 py-2 text-sm font-medium text-[#2B5F9E] bg-blue-50 rounded-lg cursor-pointer"
                >
                  이미지 분류
                </Link>
                <Link 
                  to="/admin/image-validator" 
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  이미지 검증
                </Link>
              </nav>
            </div>
            <Link 
              to="/" 
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <i className="ri-arrow-left-line"></i>
              홈으로
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 이미지 자동 분류</h1>
            <p className="text-gray-500 mt-1">이미지를 업로드하거나 URL을 입력하여 자동으로 분류합니다</p>
          </div>
          <button
            onClick={() => handleOpenPromptModal()}
            className="flex items-center gap-2 px-5 py-3 bg-[#2B5F9E] text-white rounded-lg font-medium hover:bg-[#234b7d] transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line text-lg"></i>
            카테고리 추가
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <i className="ri-image-line text-2xl text-blue-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">전체 이미지</p>
              </div>
            </div>
          </div>
          {stats.byCategory.slice(0, 3).map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <i 
                    className="ri-folder-image-line text-2xl"
                    style={{ color: stat.color }}
                  ></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">이미지 업로드</h2>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#2B5F9E] transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ri-upload-cloud-line text-3xl text-gray-400"></i>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  클릭하여 이미지 업로드
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF 파일 지원
                </p>
              </label>
            </div>

            {/* URL Input */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500">또는</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <input
                type="text"
                placeholder="이미지 URL 입력"
                value={imageUrl}
                onChange={(e) => handleUrlInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4">
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={handleClassify}
                  disabled={isClassifying}
                  className="w-full mt-4 px-6 py-3 bg-[#2B5F9E] text-white rounded-lg font-medium hover:bg-[#234b7d] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  {isClassifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      분류 중...
                    </span>
                  ) : (
                    '이미지 분류하기'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">분류 결과</h2>
            
            {classificationResult ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <i className="ri-check-line text-2xl text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">분류 완료</p>
                      <p className="text-xl font-bold text-gray-900">{classificationResult.category}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">신뢰도</span>
                      <span className="font-semibold text-gray-900">{classificationResult.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${classificationResult.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">분류 기준</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {categories.find(cat => cat.name === classificationResult.category)?.prompt}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <i className="ri-image-ai-line text-4xl text-gray-400"></i>
                </div>
                <p className="text-gray-500 mb-2">이미지를 업로드하고</p>
                <p className="text-gray-500">분류를 시작하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div 
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <i 
                        className="ri-folder-line text-xl"
                        style={{ color: category.color }}
                      ></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-xs text-gray-500">
                        {classifiedImages.filter(img => img.category === category.name).length}개 이미지
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenPromptModal(category)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#2B5F9E] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{category.prompt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Classified Images List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">분류된 이미지 목록</h2>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
              >
                <option value="">전체 카테고리</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신뢰도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    분류 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredImages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <i className="ri-image-line text-3xl text-gray-400"></i>
                        </div>
                        <p className="text-gray-500">분류된 이미지가 없습니다</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredImages.map((image) => {
                    const category = categories.find(cat => cat.name === image.category);
                    return (
                      <tr key={image.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={image.url}
                              alt="Classified"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: `${category?.color}20`,
                              color: category?.color
                            }}
                          >
                            <i className="ri-folder-line"></i>
                            {image.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                                style={{ width: `${image.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{image.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {image.timestamp}
                        </td>
                        <td className="px-6 py-4">
                          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Category Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
              </h3>
              <button
                onClick={() => setIsPromptModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 제품 이미지"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">분류 프롬프트 *</label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="AI가 이미지를 분류할 때 사용할 기준을 자세히 작성해주세요..."
                  rows={6}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.prompt.length}/500자</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPromptModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#2B5F9E] text-white rounded-lg font-medium hover:bg-[#234b7d] transition-colors whitespace-nowrap cursor-pointer"
                >
                  {editingCategory ? '저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
