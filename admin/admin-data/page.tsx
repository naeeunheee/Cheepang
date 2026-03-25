import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import customersData from '../../../data/customers.json';

interface Customer {
  businessNo: string;
  clinicName: string;
  pointBalance: number;
  arBalance: number;
  creditLimit: number;
  grade: string;
}

interface Inquiry {
  id: string;
  type: string;
  dental_name?: string;
  business_number?: string;
  representative_name?: string;
  contact?: string;
  email?: string;
  inquiry_content?: string;
  product_name?: string;
  manufacturer?: string;
  category?: string;
  specifications?: string;
  desired_price?: string;
  attachment_url?: string;
  status: string;
  created_at: string;
}

export default function AdminDataPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState<'customers' | 'inquiries'>('customers');

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminDataAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      loadCustomers();
      loadInquiries();
    }
  }, []);

  const loadCustomers = () => {
    const uploadedData = localStorage.getItem('customersData');
    if (uploadedData) {
      try {
        setCustomers(JSON.parse(uploadedData));
      } catch (e) {
        setCustomers(customersData as Customer[]);
      }
    } else {
      setCustomers(customersData as Customer[]);
    }
  };

  const loadInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setInquiries(data);
    } catch (error) {
      console.error('문의 목록 로드 오류:', error);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'chipang2025') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminDataAuth', 'true');
      setError('');
      loadCustomers();
      loadInquiries();
    } else {
      setError('잘못된 비밀번호입니다.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  const parseCSV = (text: string): Customer[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // 컬럼명 검증
    const requiredColumns = ['businessNo', 'clinicName', 'pointBalance', 'arBalance', 'creditLimit', 'grade'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`);
    }
    
    const data: Customer[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 6) {
        data.push({
          businessNo: values[0],
          clinicName: values[1],
          pointBalance: parseInt(values[2]) || 0,
          arBalance: parseInt(values[3]) || 0,
          creditLimit: parseInt(values[4]) || 0,
          grade: values[5]
        });
      }
    }
    return data;
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('❌ CSV 파일만 업로드 가능합니다.');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        
        if (parsedData.length === 0) {
          setUploadStatus('❌ 유효한 데이터가 없습니다.');
          setTimeout(() => setUploadStatus(''), 3000);
          return;
        }

        localStorage.setItem('customersData', JSON.stringify(parsedData));
        setCustomers(parsedData);
        setUploadStatus(`✅ ${parsedData.length}개 거래처 데이터가 업로드되었습니다.`);
        
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '파일 파싱 중 오류가 발생했습니다.';
        setUploadStatus(`❌ ${errorMessage}`);
        setTimeout(() => setUploadStatus(''), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const downloadTemplate = () => {
    const template = 'businessNo,clinicName,pointBalance,arBalance,creditLimit,grade\n761-88-01913,하이니스(테스트),1000000,0,5000000,VIP\n123-45-67890,○○치과,250000,1350000,3000000,A\n222-33-44444,△△치과,0,780000,2000000,B';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'customers_template.csv';
    link.click();
  };

  const getArBalanceStatus = (arBalance: number) => {
    if (arBalance > 0) {
      return { label: '미수 있음', colorClass: 'bg-red-100 text-red-700' };
    }
    if (arBalance === 0) {
      return { label: '정상', colorClass: 'bg-emerald-100 text-emerald-700' };
    }
    return { label: '선수금', colorClass: 'bg-blue-100 text-blue-700' };
  };

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', inquiryId);

      if (error) throw error;
      
      setInquiries(prev =>
        prev.map(inq => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq))
      );
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; colorClass: string }> = {
      '접수': { label: '접수', colorClass: 'bg-blue-100 text-blue-700' },
      '검토중': { label: '검토중', colorClass: 'bg-yellow-100 text-yellow-700' },
      '완료': { label: '완료', colorClass: 'bg-green-100 text-green-700' },
      '보류': { label: '보류', colorClass: 'bg-gray-100 text-gray-700' },
    };
    return statusMap[status] || statusMap['접수'];
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <i className="ri-lock-password-line text-5xl text-teal-600 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-900">관리자 인증</h1>
            <p className="text-sm text-gray-600 mt-2">거래처 데이터 관리 페이지</p>
          </div>
          
          <form onSubmit={handleAuth}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="관리자 비밀번호 입력"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              인증하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">거래처 데이터 관리</h1>
              <p className="text-gray-600">CSV 파일을 업로드하여 거래처 정보를 관리하세요</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-home-line mr-2"></i>
              홈으로
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-building-line mr-2"></i>
              거래처 관리
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'inquiries'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-questionnaire-line mr-2"></i>
              입점문의 / 신규제품 ({inquiries.length})
            </button>
          </div>
        </div>

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <>
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">CSV 파일 업로드</h2>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <i className="ri-upload-cloud-2-line text-6xl text-gray-400 mb-4"></i>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  CSV 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  필수 컬럼: businessNo, clinicName, pointBalance, arBalance, creditLimit, grade
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-file-upload-line mr-2"></i>
                    파일 선택
                  </button>
                  
                  <button
                    onClick={downloadTemplate}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-download-line mr-2"></i>
                    템플릿 다운로드
                  </button>
                </div>
              </div>
              
              {uploadStatus && (
                <div className={`mt-4 p-4 rounded-lg ${
                  uploadStatus.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  현재 거래처 데이터 ({customers.length}개)
                </h2>
                <button
                  onClick={() => {
                    localStorage.removeItem('customersData');
                    loadCustomers();
                    setUploadStatus('✅ 기본 데이터로 초기화되었습니다.');
                    setTimeout(() => setUploadStatus(''), 3000);
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  초기화
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">사업자번호</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">거래처명</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">포인트 잔액</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">미수잔액</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">여신한도</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">등급</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer, index) => {
                      const status = getArBalanceStatus(customer.arBalance);
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{customer.businessNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{customer.clinicName}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {customer.pointBalance.toLocaleString()}P
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            {customer.arBalance.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {customer.creditLimit.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              customer.grade === 'VIP' ? 'bg-purple-100 text-purple-700' :
                              customer.grade === 'A' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {customer.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.colorClass}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              접수된 문의 ({inquiries.length}개)
            </h2>
            
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">접수된 문의가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => {
                  const statusBadge = getStatusBadge(inquiry.status);
                  return (
                    <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            inquiry.type === '입점문의' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {inquiry.type}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.colorClass}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(inquiry.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>

                      {inquiry.type === '입점문의' ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">치과명:</span>
                            <span className="ml-2 text-gray-900 font-medium">{inquiry.dental_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">사업자번호:</span>
                            <span className="ml-2 text-gray-900">{inquiry.business_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">대표자명:</span>
                            <span className="ml-2 text-gray-900">{inquiry.representative_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">연락처:</span>
                            <span className="ml-2 text-gray-900">{inquiry.contact}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">이메일:</span>
                            <span className="ml-2 text-gray-900">{inquiry.email}</span>
                          </div>
                          {inquiry.inquiry_content && (
                            <div className="col-span-2">
                              <span className="text-gray-500">문의내용:</span>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{inquiry.inquiry_content}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">제품명:</span>
                            <span className="ml-2 text-gray-900 font-medium">{inquiry.product_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">제조사:</span>
                            <span className="ml-2 text-gray-900">{inquiry.manufacturer}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">카테고리:</span>
                            <span className="ml-2 text-gray-900">{inquiry.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">규격/사양:</span>
                            <span className="ml-2 text-gray-900">{inquiry.specifications}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">희망단가:</span>
                            <span className="ml-2 text-gray-900">{inquiry.desired_price}</span>
                          </div>
                          {inquiry.attachment_url && (
                            <div>
                              <a
                                href={inquiry.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:text-teal-700 cursor-pointer"
                              >
                                <i className="ri-attachment-line mr-1"></i>
                                첨부파일 보기
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => handleStatusChange(inquiry.id, '검토중')}
                          className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded text-xs hover:bg-yellow-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          검토중
                        </button>
                        <button
                          onClick={() => handleStatusChange(inquiry.id, '완료')}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          완료
                        </button>
                        <button
                          onClick={() => handleStatusChange(inquiry.id, '보류')}
                          className="px-3 py-1 bg-gray-50 text-gray-700 rounded text-xs hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          보류
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}