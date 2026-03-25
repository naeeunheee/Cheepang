import { useState } from 'react';
import { Link } from 'react-router-dom';

interface ImageKeyResult {
  id: string;
  imageKey: string;
  url: string;
  status: 'valid' | 'invalid' | 'error' | 'pending';
  statusCode?: number;
  errorMessage?: string;
  location: string;
  checkedAt?: string;
}

export default function ImageValidatorPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [imageKeys, setImageKeys] = useState<ImageKeyResult[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 프로젝트 파일에서 이미지 키 스캔
  const handleScanProject = async () => {
    setIsScanning(true);
    
    // 시뮬레이션: 실제로는 프로젝트 파일을 스캔합니다
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockImageKeys: ImageKeyResult[] = [
      {
        id: '1',
        imageKey: 'https://readdy.ai/api/search-image?query=modern%20dental%20equipment%20professional%20product%20photography%20with%20clean%20white%20background%20studio%20lighting%20high%20quality%20commercial%20image&width=400&height=400&seq=prod1&orientation=squarish',
        url: 'https://readdy.ai/api/search-image?query=modern%20dental%20equipment%20professional%20product%20photography%20with%20clean%20white%20background%20studio%20lighting%20high%20quality%20commercial%20image&width=400&height=400&seq=prod1&orientation=squarish',
        status: 'pending',
        location: 'src/pages/admin/image-classifier/page.tsx:line 45'
      },
      {
        id: '2',
        imageKey: 'https://readdy.ai/api/search-image?query=abstract%20gradient%20background%20soft%20blue%20and%20white%20colors%20smooth%20texture%20modern%20minimal%20design%20suitable%20for%20website%20backdrop&width=800&height=600&seq=bg1&orientation=landscape',
        url: 'https://readdy.ai/api/search-image?query=abstract%20gradient%20background%20soft%20blue%20and%20white%20colors%20smooth%20texture%20modern%20minimal%20design%20suitable%20for%20website%20backdrop&width=800&height=600&seq=bg1&orientation=landscape',
        status: 'pending',
        location: 'src/pages/admin/image-classifier/page.tsx:line 52'
      },
      {
        id: '3',
        imageKey: 'https://readdy.ai/api/search-image?query=simple%20tooth%20icon%20minimalist%20dental%20logo%20clean%20design%20vector%20style%20professional%20medical%20symbol%20white%20background&width=200&height=200&seq=icon1&orientation=squarish',
        url: 'https://readdy.ai/api/search-image?query=simple%20tooth%20icon%20minimalist%20dental%20logo%20clean%20design%20vector%20style%20professional%20medical%20symbol%20white%20background&width=200&height=200&seq=icon1&orientation=squarish',
        status: 'pending',
        location: 'src/pages/admin/image-classifier/page.tsx:line 59'
      },
      {
        id: '4',
        imageKey: 'https://readdy.ai/api/search-image?query=professional%20dentist%20portrait%20smiling%20doctor%20in%20white%20coat%20medical%20professional%20friendly%20appearance%20clinic%20background&width=400&height=500&seq=person1&orientation=portrait',
        url: 'https://readdy.ai/api/search-image?query=professional%20dentist%20portrait%20smiling%20doctor%20in%20white%20coat%20medical%20professional%20friendly%20appearance%20clinic%20background&width=400&height=500&seq=person1&orientation=portrait',
        status: 'pending',
        location: 'src/pages/admin/image-classifier/page.tsx:line 66'
      },
      {
        id: '5',
        imageKey: 'https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png',
        url: 'https://static.readdy.ai/image/4634c18daa6eee5863d25b64dc634e79/e9f38864fa7382fcb0337c65f027674d.png',
        status: 'pending',
        location: 'src/pages/admin/image-classifier/page.tsx:line 89'
      },
      {
        id: '6',
        imageKey: 'https://readdy.ai/api/search-image?query=broken-image-test&width=400&height=400&seq=invalid1&orientation=squarish',
        url: 'https://readdy.ai/api/search-image?query=broken-image-test&width=400&height=400&seq=invalid1&orientation=squarish',
        status: 'pending',
        location: 'src/pages/home/components/Hero.tsx:line 23'
      }
    ];

    setImageKeys(mockImageKeys);
    setIsScanning(false);
  };

  // 이미지 URL 유효성 검증
  const validateImageUrl = async (url: string): Promise<{ status: 'valid' | 'invalid' | 'error'; statusCode?: number; errorMessage?: string }> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        return { status: 'valid', statusCode: response.status };
      } else if (response.status === 404) {
        return { status: 'invalid', statusCode: 404, errorMessage: '이미지를 찾을 수 없습니다' };
      } else {
        return { status: 'error', statusCode: response.status, errorMessage: `HTTP ${response.status} 오류` };
      }
    } catch (error) {
      return { 
        status: 'error', 
        errorMessage: error instanceof Error ? error.message : '네트워크 오류' 
      };
    }
  };

  // 일괄 검증 실행
  const handleValidateAll = async () => {
    if (imageKeys.length === 0) {
      alert('먼저 프로젝트를 스캔해주세요.');
      return;
    }

    setIsValidating(true);
    setValidationProgress(0);

    const updatedKeys: ImageKeyResult[] = [];

    for (let i = 0; i < imageKeys.length; i++) {
      const key = imageKeys[i];
      const result = await validateImageUrl(key.url);
      
      updatedKeys.push({
        ...key,
        status: result.status,
        statusCode: result.statusCode,
        errorMessage: result.errorMessage,
        checkedAt: new Date().toLocaleString('ko-KR')
      });

      setValidationProgress(Math.round(((i + 1) / imageKeys.length) * 100));
      
      // UI 업데이트를 위한 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setImageKeys(updatedKeys);
    setIsValidating(false);
  };

  // 개별 검증
  const handleValidateSingle = async (id: string) => {
    const key = imageKeys.find(k => k.id === id);
    if (!key) return;

    setImageKeys(imageKeys.map(k => 
      k.id === id ? { ...k, status: 'pending' } : k
    ));

    const result = await validateImageUrl(key.url);

    setImageKeys(imageKeys.map(k => 
      k.id === id 
        ? {
            ...k,
            status: result.status,
            statusCode: result.statusCode,
            errorMessage: result.errorMessage,
            checkedAt: new Date().toLocaleString('ko-KR')
          }
        : k
    ));
  };

  const stats = {
    total: imageKeys.length,
    valid: imageKeys.filter(k => k.status === 'valid').length,
    invalid: imageKeys.filter(k => k.status === 'invalid').length,
    error: imageKeys.filter(k => k.status === 'error').length,
    pending: imageKeys.filter(k => k.status === 'pending').length
  };

  const filteredKeys = imageKeys.filter(key => {
    const matchesStatus = filterStatus ? key.status === filterStatus : true;
    const matchesSearch = searchQuery 
      ? key.imageKey.toLowerCase().includes(searchQuery.toLowerCase()) || 
        key.location.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <i className="ri-checkbox-circle-fill text-green-600"></i>;
      case 'invalid':
        return <i className="ri-close-circle-fill text-red-600"></i>;
      case 'error':
        return <i className="ri-error-warning-fill text-orange-600"></i>;
      case 'pending':
        return <i className="ri-time-line text-gray-400"></i>;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return '유효';
      case 'invalid':
        return '무효';
      case 'error':
        return '오류';
      case 'pending':
        return '대기중';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'invalid':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'error':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'pending':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  이미지 분류
                </Link>
                <Link 
                  to="/admin/image-validator" 
                  className="px-4 py-2 text-sm font-medium text-[#2B5F9E] bg-blue-50 rounded-lg cursor-pointer"
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
            <h1 className="text-2xl font-bold text-gray-900">이미지 키 자동 검증</h1>
            <p className="text-gray-500 mt-1">프로젝트 내 이미지 URL의 유효성을 자동으로 검증합니다</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleScanProject}
              disabled={isScanning || isValidating}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  스캔 중...
                </>
              ) : (
                <>
                  <i className="ri-search-line text-lg"></i>
                  프로젝트 스캔
                </>
              )}
            </button>
            <button
              onClick={handleValidateAll}
              disabled={imageKeys.length === 0 || isValidating || isScanning}
              className="flex items-center gap-2 px-5 py-3 bg-[#2B5F9E] text-white rounded-lg font-medium hover:bg-[#234b7d] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {isValidating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  검증 중... {validationProgress}%
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line text-lg"></i>
                  일괄 검증
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <i className="ri-image-line text-2xl text-blue-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">전체</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.valid}</p>
                <p className="text-sm text-gray-500">유효</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <i className="ri-close-circle-line text-2xl text-red-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.invalid}</p>
                <p className="text-sm text-gray-500">무효</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <i className="ri-error-warning-line text-2xl text-orange-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.error}</p>
                <p className="text-sm text-gray-500">오류</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-2xl text-gray-600"></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">대기중</p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Progress */}
        {isValidating && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">검증 진행 중</p>
                  <p className="text-sm text-gray-500">이미지 URL 유효성을 확인하고 있습니다...</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-[#2B5F9E]">{validationProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${validationProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {imageKeys.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="이미지 URL 또는 파일 위치 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] focus:ring-1 focus:ring-[#2B5F9E]"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2B5F9E] cursor-pointer"
              >
                <option value="">전체 상태</option>
                <option value="valid">유효</option>
                <option value="invalid">무효</option>
                <option value="error">오류</option>
                <option value="pending">대기중</option>
              </select>
            </div>
          </div>
        )}

        {/* Image Keys Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">이미지 키 목록</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredKeys.length > 0 
                ? `${filteredKeys.length}개의 이미지 키가 발견되었습니다`
                : '이미지 키가 없습니다'
              }
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지 URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    파일 위치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    검증 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <i className="ri-image-line text-3xl text-gray-400"></i>
                        </div>
                        <p className="text-gray-500 mb-2">
                          {imageKeys.length === 0 
                            ? '프로젝트를 스캔하여 이미지 키를 찾아보세요'
                            : '검색 결과가 없습니다'
                          }
                        </p>
                        {imageKeys.length === 0 && (
                          <button
                            onClick={handleScanProject}
                            className="mt-3 px-5 py-2 bg-[#2B5F9E] text-white rounded-lg text-sm font-medium hover:bg-[#234b7d] transition-colors whitespace-nowrap cursor-pointer"
                          >
                            프로젝트 스캔 시작
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(key.status)}`}>
                          {getStatusIcon(key.status)}
                          {getStatusText(key.status)}
                        </div>
                        {key.statusCode && (
                          <p className="text-xs text-gray-500 mt-1">HTTP {key.statusCode}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {key.status === 'valid' ? (
                              <img
                                src={key.url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="ri-image-line text-gray-400"></i>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate font-mono">{key.imageKey}</p>
                            {key.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">{key.errorMessage}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 font-mono">{key.location}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {key.checkedAt || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleValidateSingle(key.id)}
                          disabled={isValidating}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#2B5F9E] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title="다시 검증"
                        >
                          <i className="ri-refresh-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Section */}
        {imageKeys.length === 0 && !isScanning && (
          <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-information-line text-xl text-blue-600"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">이미지 키 검증 도구 사용 방법</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-blue-600 mt-0.5"></i>
                    <span><strong>프로젝트 스캔:</strong> 프로젝트 내 모든 이미지 URL을 자동으로 찾아냅니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-blue-600 mt-0.5"></i>
                    <span><strong>일괄 검증:</strong> 발견된 모든 이미지 URL의 유효성을 한 번에 확인합니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-blue-600 mt-0.5"></i>
                    <span><strong>개별 검증:</strong> 특정 이미지만 다시 검증할 수 있습니다</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-line text-blue-600 mt-0.5"></i>
                    <span><strong>필터링:</strong> 상태별로 이미지를 필터링하여 문제가 있는 이미지를 빠르게 찾을 수 있습니다</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
