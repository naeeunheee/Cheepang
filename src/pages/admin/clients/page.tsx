import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import AdminHeader from '../../../components/feature/AdminHeader';
import ChargeRequestNotify from '../../../components/feature/ChargeRequestNotify';
import ChargeRequestModal from '../client-detail/components/ChargeRequestModal';
import BalanceAdjustModal from './components/BalanceAdjustModal';
import CsvBalanceUploadModal from './components/CsvBalanceUploadModal';
import PackageChangeModal from './components/PackageChangeModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BackButton from '../../../components/feature/BackButton';

interface Client {
  id: string;
  name: string;
  clinic_name: string;
  business_number: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  address_detail?: string;
  business_type?: string;
  business_category?: string;
  fax?: string;
  contact_person?: string;
  notes?: string;
  point_balance: number;
  outstanding_balance: number;
  created_at: string;
  user_id?: string;
  auth_user_id?: string;
  auth_linked?: boolean;
  biz_license_url?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verification_note?: string;
  verified_at?: string;
  package_tier?: number | null;
}

type SortField = 'clinic_name' | 'business_number' | 'representative' | 'point_balance' | 'outstanding_balance' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sortField, setSortField] = useState<SortField>('clinic_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedClientForCharge, setSelectedClientForCharge] = useState<Client | null>(null);
  const [chargeSuccessMsg, setChargeSuccessMsg] = useState('');
  const [pkgSavedMsg, setPkgSavedMsg] = useState('');
  const navigate = useNavigate();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyingClient, setVerifyingClient] = useState<Client | null>(null);
  const [showBalanceAdjustModal, setShowBalanceAdjustModal] = useState(false);
  const [selectedClientForBalance, setSelectedClientForBalance] = useState<Client | null>(null);
  const [showCsvBalanceModal, setShowCsvBalanceModal] = useState(false);
  const [balanceAdjustMsg, setBalanceAdjustMsg] = useState('');
  const [showPkgChangeModal, setShowPkgChangeModal] = useState(false);
  const [pendingPkgChange, setPendingPkgChange] = useState<{
    clientId: string;
    clientName: string;
    previousTier: number | null;
    newTier: number | null;
  } | null>(null);
  const [pkgChangeSaving, setPkgChangeSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('거래처 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedClients = () => {
    const filtered = clients.filter(client =>
      client.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.business_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.representative?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // 한글 정렬을 위한 localeCompare 사용
      if (sortField === 'clinic_name' || sortField === 'representative') {
        aValue = aValue || '';
        bValue = bValue || '';
        const comparison = aValue.localeCompare(bValue, 'ko');
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // 숫자 정렬
      if (sortField === 'point_balance' || sortField === 'outstanding_balance') {
        aValue = aValue || 0;
        bValue = bValue || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 날짜 정렬
      if (sortField === 'created_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // 문자열 정렬 (사업자번호 등)
      aValue = String(aValue || '');
      bValue = String(bValue || '');
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <i className="ri-arrow-up-down-line text-gray-400 ml-1"></i>;
    }
    return sortDirection === 'asc' 
      ? <i className="ri-arrow-up-line text-teal-600 ml-1"></i>
      : <i className="ri-arrow-down-line text-teal-600 ml-1"></i>;
  };

  const filteredClients = clients.filter(client =>
    (client.clinic_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.business_number || '').includes(searchTerm) ||
    (client.representative || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = async (formData: any) => {
    try {
      const { error } = await supabase.from('clients').insert([{
        name: formData.clinicName,
        clinic_name: formData.clinicName,
        business_number: formData.businessNo,
        representative: formData.representative,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        point_balance: formData.pointBalance || 0,
        outstanding_balance: formData.outstandingBalance || 0,
      }]);
      if (error) throw error;
      await fetchClients();
      setShowAddModal(false);
    } catch (error) {
      console.error('거래처 추가 실패:', error);
      alert('거래처 추가에 실패했습니다.');
    }
  };

  const handleUpdateClient = async (formData: any) => {
    if (!editingClient) return;
    try {
      const { error } = await supabase.from('clients').update({
        clinic_name: formData.clinicName,
        business_number: formData.businessNo,
        representative: formData.representative,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        point_balance: formData.pointBalance,
        outstanding_balance: formData.outstandingBalance,
      }).eq('id', editingClient.id);
      if (error) throw error;
      await fetchClients();
      setEditingClient(null);
    } catch (error) {
      console.error('거래처 수정 실패:', error);
      alert('거래처 수정에 실패했습니다.');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      await fetchClients();
    } catch (error) {
      console.error('거래처 삭제 실패:', error);
      alert('거래처 삭제에 실패했습니다.');
    }
  };

  const handleViewDetail = (clientId: string) => {
    navigate(`/admin/clients/${clientId}`);
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <i className="ri-shield-check-line mr-1"></i>인증완료
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <i className="ri-time-line mr-1"></i>승인대기
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <i className="ri-close-circle-line mr-1"></i>거절됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            미제출
          </span>
        );
    }
  };

  const handleApproveVerification = async (clientId: string) => {
    if (!confirm('사업자 인증을 승인하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('clients').update({
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verification_note: null,
      }).eq('id', clientId);
      if (error) throw error;
      await fetchClients();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인 처리에 실패했습니다.');
    }
  };

  const handleRejectVerification = (client: Client) => {
    setVerifyingClient(client);
    setShowVerificationModal(true);
  };

  const handleRejectSubmit = async (note: string) => {
    if (!verifyingClient) return;
    try {
      const { error } = await supabase.from('clients').update({
        verification_status: 'rejected',
        verification_note: note,
        verified_at: new Date().toISOString(),
      }).eq('id', verifyingClient.id);
      if (error) throw error;
      await fetchClients();
      setShowVerificationModal(false);
      setVerifyingClient(null);
    } catch (error) {
      console.error('거절 실패:', error);
      alert('거절 처리에 실패했습니다.');
    }
  };

  const handleOpenChargeModal = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClientForCharge(client);
    setShowChargeModal(true);
  };

  const handleOpenBalanceAdjust = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setSelectedClientForBalance(client);
    setShowBalanceAdjustModal(true);
  };

  const handleBalanceAdjustSuccess = () => {
    setShowBalanceAdjustModal(false);
    const name = selectedClientForBalance?.clinic_name || selectedClientForBalance?.name || '';
    setBalanceAdjustMsg(`${name} 잔액이 조정되었습니다`);
    setTimeout(() => setBalanceAdjustMsg(''), 3000);
    setSelectedClientForBalance(null);
    fetchClients();
  };

  const handlePackageTierChange = (clientId: string, previousTier: number | null, newTier: number | null) => {
    const client = clients.find(c => c.id === clientId);
    setPendingPkgChange({
      clientId,
      clientName: client?.clinic_name || client?.name || clientId,
      previousTier,
      newTier,
    });
    setShowPkgChangeModal(true);
  };

  const handlePackageChangeConfirm = async (reason: string) => {
    if (!pendingPkgChange) return;
    setPkgChangeSaving(true);
    try {
      const { clientId, clientName, previousTier, newTier } = pendingPkgChange;
      const client = clients.find(c => c.id === clientId);

      const { error } = await supabase
        .from('clients')
        .update({ package_tier: newTier })
        .eq('id', clientId);
      if (error) throw error;

      // package_logs 이력 저장
      await supabase.from('package_logs').insert({
        client_id: clientId,
        client_name: clientName,
        business_number: client?.business_no || '',
        previous_tier: previousTier !== null ? String(previousTier) : null,
        new_tier: newTier !== null ? String(newTier) : null,
        reason,
        admin_name: '관리자',
      });

      setClients(prev =>
        prev.map(c => (c.id === clientId ? { ...c, package_tier: newTier } : c)),
      );
      setPkgSavedMsg(`${clientName} 패키지가 변경되었습니다`);
      setTimeout(() => setPkgSavedMsg(''), 3000);
    } catch (err) {
      console.error('패키지 업데이트 실패:', err);
      alert('패키지 변경에 실패했습니다.');
    } finally {
      setPkgChangeSaving(false);
      setShowPkgChangeModal(false);
      setPendingPkgChange(null);
    }
  };

  const handleChargeSuccess = () => {
    setShowChargeModal(false);
    const name = selectedClientForCharge?.clinic_name || selectedClientForCharge?.name || '';
    setChargeSuccessMsg(`${name} 충전 요청이 생성되었습니다`);
    setTimeout(() => setChargeSuccessMsg(''), 4000);
    setSelectedClientForCharge(null);
  };

  const exportToExcel = () => {
    const exportData = filteredClients.map(client => ({
      '거래처명': client.clinic_name,
      '사업자번호': client.business_number,
      '대표자': client.representative,
      '전화번호': client.phone,
      '이메일': client.email,
      '주소': client.address,
      '포인트잔액': client.point_balance ?? 0,
      '채권잔액(미수금)': client.outstanding_balance ?? 0,
      '계정연결': client.user_id ? '연결됨' : '미연결',
      '등록일': new Date(client.created_at).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래처목록');
    XLSX.writeFile(wb, `거래처목록_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Client List', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 22);
    const tableData = getSortedClients().map((client) => [
      client.clinic_name,
      client.business_number,
      client.representative,
      client.phone,
      (client.point_balance ?? 0).toLocaleString(),
      (client.outstanding_balance ?? 0).toLocaleString(),
      client.user_id ? 'Y' : 'N',
    ]);
    autoTable(doc, {
      startY: 28,
      head: [['거래처명', '사업자번호', '대표자', '전화번호', '포인트잔액', '채권잔액', '계정연결']],
      body: tableData,
      styles: { font: 'helvetica', fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });
    doc.save(`거래처목록_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  const connectedCount = clients.filter(c => c.user_id).length;
  const disconnectedCount = clients.length - connectedCount;
  const sortedClients = getSortedClients();

  const pendingCount = clients.filter(c => c.verification_status === 'pending').length;
  const approvedCount = clients.filter(c => c.verification_status === 'approved').length;
  const rejectedCount = clients.filter(c => c.verification_status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <ChargeRequestNotify />

      {/* 패키지 저장 토스트 */}
      {pkgSavedMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold">
          <i className="ri-checkbox-circle-line text-lg"></i>
          패키지 저장됨
        </div>
      )}

      {/* 잔액 조정 토스트 */}
      {balanceAdjustMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold">
          <i className="ri-coin-line text-lg"></i>
          {balanceAdjustMsg}
        </div>
      )}

      {/* 충전 요청 성공 토스트 */}
      {chargeSuccessMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-teal-600 text-white px-5 py-3.5 rounded-xl shadow-lg">
          <i className="ri-checkbox-circle-fill text-xl"></i>
          <div>
            <p className="font-semibold text-sm">{chargeSuccessMsg}</p>
            <p className="text-teal-100 text-xs mt-0.5">포인트 관리 &gt; 충전 요청 탭에서 승인해주세요</p>
          </div>
          <button onClick={() => setChargeSuccessMsg('')} className="ml-2 cursor-pointer">
            <i className="ri-close-line text-teal-200 hover:text-white"></i>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">거래처 관리</h1>
          <p className="text-sm text-gray-500">
            전체 <strong>{clients.length}</strong>개 거래처
            <span className="ml-3 text-teal-600">
              <i className="ri-link-m mr-1"></i>계정 연결 <strong>{connectedCount}</strong>개
            </span>
            <span className="ml-3 text-gray-400">
              미연결 <strong>{disconnectedCount}</strong>개
            </span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">전체 거래처</div>
            <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">계정 연결</div>
            <div className="text-2xl font-bold text-teal-600">{connectedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-yellow-600">승인 대기</div>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-green-600">승인 완료</div>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-red-600">거절됨</div>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </div>
        </div>

        {/* 승인 대기 알림 배너 */}
        {pendingCount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-alarm-warning-line text-white text-xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-yellow-700 mb-1">
                  사업자 인증 승인 대기 중
                </h4>
                <p className="text-xs text-yellow-600">
                  <strong>{pendingCount}</strong>개 거래처가 사업자 인증 승인을 기다리고 있습니다. 
                  사업자등록증을 확인하고 승인 또는 거절 처리해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="거래처명, 사업자번호, 대표자, 전화번호로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCsvBalanceModal(true)}
                className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="ri-scales-line"></i>
                <span className="hidden sm:inline">잔액 일괄 업로드</span>
                <span className="sm:hidden">잔액CSV</span>
              </button>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setShowAddModal(true);
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
              >
                <i className="ri-add-line"></i>
                <span className="hidden sm:inline">거래처 추가</span>
                <span className="sm:hidden">추가</span>
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 카드뷰 */}
        <div className="md:hidden space-y-3 mb-6">
          {sortedClients.map((client) => {
            const balance = client.outstanding_balance || 0;
            const isDebt = balance > 0;
            const isAvailable = balance < 0;
            
            return (
              <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div 
                  onClick={() => handleViewDetail(client.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 mb-1 hover:text-teal-600 transition-colors">{client.clinic_name || client.name}</h3>
                      <p className="text-xs text-gray-500">{client.business_number || '-'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {client.user_id ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <i className="ri-check-line mr-1"></i>연결
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          미연결
                        </span>
                      )}
                      {getVerificationBadge(client.verification_status)}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">대표자</span>
                      <span className="text-gray-700">{client.representative || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">연락처</span>
                      <span className="text-gray-700">{client.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">잔액</span>
                      {balance === 0 ? (
                        <span className="text-gray-500">0원</span>
                      ) : isDebt ? (
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-1">미수금</span>
                          <p className="text-sm font-semibold text-red-600">₩{balance.toLocaleString()}</p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">사용 가능 잔액</span>
                          <p className="text-sm font-semibold text-green-600">₩{Math.abs(balance).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">등록일</span>
                      <span className="text-gray-600">{new Date(client.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {client.verification_status === 'pending' && client.biz_license_url && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(client.biz_license_url, '_blank');
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-file-text-line mr-1"></i>
                        등록증 보기
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveVerification(client.id);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-check-line"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectVerification(client);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </>
                  )}
                  {client.verification_status !== 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(client.id);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-teal-600 text-white rounded-md text-xs font-medium hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        상세보기
                      </button>
                      {/* 충전 요청 빠른 액션 버튼 */}
                      <button
                        onClick={(e) => handleOpenChargeModal(e, client)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-coin-line mr-1"></i>충전 요청
                      </button>
                      {/* 잔액 조정 버튼 */}
                      <button
                        onClick={(e) => handleOpenBalanceAdjust(e, client)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <i className="ri-scales-line mr-1"></i>조정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClient(client);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {sortedClients.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
              <i className="ri-building-line text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'}
              </p>
            </div>
          )}
        </div>

        {/* 데스크톱 테이블 */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('clinic_name')}
                  >
                    <div className="flex items-center gap-1">
                      거래처명
                      {sortField === 'clinic_name' ? (
                        sortDirection === 'asc' ? <i className="ri-arrow-up-line text-sm text-teal-600"></i> : <i className="ri-arrow-down-line text-sm text-teal-600"></i>
                      ) : <i className="ri-arrow-up-down-line text-sm text-gray-400"></i>}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('business_number')}
                  >
                    <div className="flex items-center gap-1">
                      사업자번호
                      {sortField === 'business_number' ? (
                        sortDirection === 'asc' ? <i className="ri-arrow-up-line text-sm text-teal-600"></i> : <i className="ri-arrow-down-line text-sm text-teal-600"></i>
                      ) : <i className="ri-arrow-up-down-line text-sm text-gray-400"></i>}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('representative')}
                  >
                    <div className="flex items-center gap-1">
                      대표자
                      {sortField === 'representative' ? (
                        sortDirection === 'asc' ? <i className="ri-arrow-up-line text-sm text-teal-600"></i> : <i className="ri-arrow-down-line text-sm text-teal-600"></i>
                      ) : <i className="ri-arrow-up-down-line text-sm text-gray-400"></i>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    연락처
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    주소
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    패키지
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('outstanding_balance')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      잔액
                      {sortField === 'outstanding_balance' ? (
                        sortDirection === 'asc' ? <i className="ri-arrow-up-line text-sm text-teal-600"></i> : <i className="ri-arrow-down-line text-sm text-teal-600"></i>
                      ) : <i className="ri-arrow-up-down-line text-sm text-gray-400"></i>}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedClients.map((client) => {
                  const balance = client.outstanding_balance || 0;
                  const isDebt = balance > 0;
                  const isAvailable = balance < 0;
                  
                  return (
                    <tr 
                      key={client.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetail(client.id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors">{client.clinic_name || client.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">{client.business_number || client.business_no || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{client.representative || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{client.phone || '-'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500 max-w-[180px] truncate" title={client.address}>
                          {client.address || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <PackageTierSelect
                          value={client.package_tier ?? null}
                          onChange={(newTier) => handlePackageTierChange(client.id, client.package_tier ?? null, newTier)}
                          currentValue={client.package_tier ?? null}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        {balance === 0 ? (
                          <span className="text-sm text-gray-400">₩0</span>
                        ) : isDebt ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">미수금</span>
                            <span className="text-sm font-semibold text-red-600">₩{balance.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">잔액 있음</span>
                            <span className="text-sm font-semibold text-sky-600">₩{Math.abs(balance).toLocaleString()}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getVerificationBadge(client.verification_status)}
                          {client.user_id || client.auth_user_id || client.auth_linked ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <i className="ri-check-line mr-0.5"></i>연결됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              미연결
                            </span>
                          )}
                          {client.verification_status === 'pending' && client.biz_license_url && (
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(client.biz_license_url, '_blank'); }}
                                className="inline-flex items-center px-1.5 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700 cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-file-text-line mr-0.5"></i>등록증
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApproveVerification(client.id); }}
                                className="inline-flex items-center px-1.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 cursor-pointer"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRejectVerification(client); }}
                                className="inline-flex items-center px-1.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 cursor-pointer"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewDetail(client.id); }}
                            className="inline-flex items-center px-2 py-1.5 bg-teal-600 text-white rounded-md text-xs font-medium hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-eye-line mr-1"></i>상세
                          </button>
                          <button
                            onClick={(e) => handleOpenChargeModal(e, client)}
                            className="inline-flex items-center px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-coin-line mr-1"></i>충전
                          </button>
                          <button
                            onClick={(e) => handleOpenBalanceAdjust(e, client)}
                            className="inline-flex items-center px-2 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-scales-line mr-1"></i>조정
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <ClientFormModal onClose={() => setShowAddModal(false)} onSubmit={handleAddClient} />
      )}
      {editingClient && (
        <ClientFormModal client={editingClient} onClose={() => setEditingClient(null)} onSubmit={handleUpdateClient} />
      )}
      {showUploadModal && (
        <ExcelUploadModal
          onClose={() => setShowUploadModal(false)}
          onComplete={() => {
            setShowUploadModal(false);
            fetchClients();
          }}
        />
      )}
      {showVerificationModal && verifyingClient && (
        <VerificationRejectModal
          client={verifyingClient}
          onClose={() => {
            setShowVerificationModal(false);
            setVerifyingClient(null);
          }}
          onSubmit={handleRejectSubmit}
        />
      )}
      {/* 충전 요청 모달 */}
      {showChargeModal && selectedClientForCharge && (
        <ChargeRequestModal
          client={selectedClientForCharge}
          onClose={() => {
            setShowChargeModal(false);
            setSelectedClientForCharge(null);
          }}
          onSuccess={handleChargeSuccess}
        />
      )}
      {/* 잔액 조정 모달 */}
      {showBalanceAdjustModal && selectedClientForBalance && (
        <BalanceAdjustModal
          client={selectedClientForBalance}
          onClose={() => { setShowBalanceAdjustModal(false); setSelectedClientForBalance(null); }}
          onSuccess={handleBalanceAdjustSuccess}
        />
      )}
      {/* CSV 잔액 일괄 업로드 모달 */}
      {showCsvBalanceModal && (
        <CsvBalanceUploadModal
          clients={clients}
          onClose={() => setShowCsvBalanceModal(false)}
          onSuccess={() => { setShowCsvBalanceModal(false); fetchClients(); }}
        />
      )}
      {/* 패키지 변경 모달 */}
      {showPkgChangeModal && pendingPkgChange && (
        <PackageChangeModal
          clientName={pendingPkgChange.clientName}
          previousTier={pendingPkgChange.previousTier}
          newTier={pendingPkgChange.newTier}
          onClose={() => { setShowPkgChangeModal(false); setPendingPkgChange(null); }}
          onConfirm={handlePackageChangeConfirm}
          saving={pkgChangeSaving}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
interface PackageTierSelectProps {
  value: number | null;
  onChange: (tier: number | null) => void;
}

const TIER_OPTIONS: { value: number; label: string; bg: string; text: string; border: string }[] = [
  { value: 1000,  label: '1000',  bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300' },
  { value: 2000,  label: '2000',  bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300' },
  { value: 3000,  label: '3000',  bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300' },
  { value: 5000,  label: '5000',  bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { value: 10000, label: '10000', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300' },
];

function PackageTierSelect({ value, onChange, currentValue }: PackageTierSelectProps) {
  const selected = TIER_OPTIONS.find((o) => o.value === value);
  const baseClass = selected
    ? `${selected.bg} ${selected.text} border ${selected.border}`
    : 'bg-gray-50 text-gray-500 border border-gray-200';

  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? null : Number(e.target.value);
        onChange(val);
      }}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors ${baseClass}`}
    >
      <option value="">미설정</option>
      {TIER_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}{opt.value === 10000 ? ' ★VIP' : ''}
        </option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────────── */
interface ClientFormModalProps {
  client?: Client;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function ClientFormModal({ client, onClose, onSubmit }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    clinicName: client?.clinic_name || '',
    businessNo: client?.business_number || '',
    representative: client?.representative || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    pointBalance: String(client?.point_balance ?? ''),
    outstandingBalance: String(client?.outstanding_balance ?? ''),
  });

  const formatBusinessNo = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = {
      ...formData,
      pointBalance: formData.pointBalance === '' ? 0 : Number(formData.pointBalance),
      outstandingBalance: formData.outstandingBalance === '' ? 0 : Number(formData.outstandingBalance),
    };

    // Readdy Form 제출 (application/x-www-form-urlencoded)
    try {
      const body = new URLSearchParams();
      body.append('거래처명', formData.clinicName);
      body.append('사업자번호', formData.businessNo);
      body.append('대표자', formData.representative);
      body.append('전화번호', formData.phone);
      body.append('email', formData.email);
      body.append('주소', formData.address);
      body.append('포인트잔액', String(parsed.pointBalance));
      body.append('채권잔액', String(parsed.outstandingBalance));
      body.append('구분', client ? '수정' : '신규등록');

      await fetch('https://readdy.ai/api/form/d6idaukbcbcsu13rggo0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    } catch (err) {
      console.error('폼 제출 오류:', err);
    }

    onSubmit(parsed);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">{client ? '거래처 수정' : '거래처 추가'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} data-readdy-form className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">거래처명 *</label>
              <input
                type="text" required name="거래처명"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호 *</label>
              <input
                type="text" required name="사업자번호"
                value={formData.businessNo}
                onChange={(e) => setFormData({ ...formData, businessNo: formatBusinessNo(e.target.value) })}
                placeholder="000-00-00000"
                maxLength={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자 *</label>
              <input
                type="text" required name="대표자"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 *</label>
              <input
                type="tel" required name="전화번호"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email" name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
              <input
                type="text" name="주소"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">포인트 잔액 (원)</label>
              <input
                type="number" name="포인트잔액"
                value={formData.pointBalance}
                onChange={(e) => setFormData({ ...formData, pointBalance: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">채권잔액 / 미수금 (원)</label>
              <input
                type="number" name="채권잔액"
                value={formData.outstandingBalance}
                onChange={(e) => setFormData({ ...formData, outstandingBalance: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap text-sm cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap text-sm font-medium cursor-pointer"
            >
              {client ? '수정 저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
interface ExcelUploadModalProps {
  onClose: () => void;
  onComplete: (result: { success: number; fail: number }) => void;
}

type UploadTab = 'clients' | 'balance';

function ExcelUploadModal({ onClose, onComplete }: ExcelUploadModalProps) {
  const [tab, setTab] = useState<UploadTab>('clients');
  const [clientsFile, setClientsFile] = useState<File | null>(null);
  const [balanceFile, setBalanceFile] = useState<File | null>(null);
  const [clientsPreview, setClientsPreview] = useState<any[]>([]);
  const [balancePreview, setBalancePreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [doneResult, setDoneResult] = useState<{ success: number; fail: number; failDetails: string[] } | null>(null);
  const [error, setError] = useState('');
  const clientsRef = useRef<HTMLInputElement>(null);
  const balanceRef = useRef<HTMLInputElement>(null);

  const parseExcel = (file: File): Promise<any[]> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          resolve(rows as any[]);
        } catch {
          reject(new Error('파일을 읽을 수 없습니다.'));
        }
      };
      reader.readAsArrayBuffer(file);
    });

  const handleClientsFile = async (file: File) => {
    setClientsFile(file);
    setError('');
    try {
      const rows = await parseExcel(file);
      setClientsPreview(rows.slice(0, 5));
    } catch {
      setError('거래처 명단 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const handleBalanceFile = async (file: File) => {
    setBalanceFile(file);
    setError('');
    try {
      const rows = await parseExcel(file);
      setBalancePreview(rows.slice(0, 5));
    } catch {
      setError('잔액 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const findCol = (row: any, candidates: string[]) => {
    for (const key of Object.keys(row)) {
      const normalized = key.replace(/\s/g, '');
      if (candidates.some(c => normalized.includes(c))) return row[key];
    }
    return '';
  };

  const handleUpload = async () => {
    if (!clientsFile) { setError('거래처 명단 파일을 선택해주세요.'); return; }
    setUploading(true);
    setError('');
    let success = 0;
    let fail = 0;
    const failDetails: string[] = [];

    try {
      const clientRows = await parseExcel(clientsFile);

      if (clientRows.length > 0) {
        console.log('[업로드] 감지된 컬럼:', Object.keys(clientRows[0]));
      }

      const balanceMap: Record<string, number> = {};
      if (balanceFile) {
        const balRows = await parseExcel(balanceFile);
        for (const row of balRows) {
          const name = String(findCol(row, ['거래처명', '거래처', '치과명', '병원명', 'name', 'clinic'])).trim();
          const bal = Number(String(findCol(row, ['채권잔액', '잔액', '미수금', 'balance', 'outstanding'])).replace(/[^0-9.-]/g, '')) || 0;
          if (name) balanceMap[name] = bal;
        }
      }

      for (const row of clientRows) {
        try {
          const clinicName = String(findCol(row, ['거래처명', '거래처', '치과명', '병원명', 'name', 'clinic'])).trim();
          if (!clinicName) {
            fail++;
            failDetails.push(`행 건너뜀: 거래처명 없음`);
            continue;
          }

          const businessNumber = String(findCol(row, ['사업자번호', '사업자', 'business_number', 'business', 'biz'])).trim();
          const businessNo = businessNumber;
          const representative = String(findCol(row, ['대표자명', '대표자', '대표', 'representative', 'rep'])).trim();
          const phone = String(findCol(row, ['전화번호', '전화', '연락처', 'phone', 'tel'])).trim();
          const fax = String(findCol(row, ['팩스', 'fax'])).trim();
          const email = String(findCol(row, ['이메일', 'email', 'mail'])).trim();
          const businessType = String(findCol(row, ['업태', 'business_type'])).trim();
          const businessCategory = String(findCol(row, ['종목', 'business_category'])).trim();
          const contactPerson = String(findCol(row, ['담당자', 'contact_person'])).trim();
          const notes = String(findCol(row, ['비고', 'notes', '메모'])).trim();

          const addr1 = String(findCol(row, ['주소1', '주소 1', '주소(1)', '도로명주소', '주소'])).trim();
          const addr2 = String(findCol(row, ['주소2', '주소 2', '주소(2)', '상세주소', 'address_detail'])).trim();
          const address = addr2 ? `${addr1} ${addr2}`.trim() : addr1;

          let creditAmount = 0;
          if (balanceMap[clinicName] !== undefined) {
            creditAmount = balanceMap[clinicName];
          } else {
            creditAmount = Number(String(findCol(row, ['채권잔액', '잔액', '미수금', 'balance', 'outstanding'])).replace(/[^0-9.-]/g, '')) || 0;
          }
          const pointBalance = creditAmount;

          // CSV에 값이 있는 필드만 업데이트 (null로 덮어쓰지 않기)
          const upsertPayload: Record<string, unknown> = {
            name: clinicName,
            clinic_name: clinicName,
            business_number: businessNumber || undefined,
            point_balance: pointBalance,
            outstanding_balance: 0,
          };
          if (representative) upsertPayload.representative = representative;
          if (phone) upsertPayload.phone = phone;
          if (fax) upsertPayload.fax = fax;
          if (email) upsertPayload.email = email;
          if (businessType) upsertPayload.business_type = businessType;
          if (businessCategory) upsertPayload.business_category = businessCategory;
          if (contactPerson) upsertPayload.contact_person = contactPerson;
          if (notes) upsertPayload.notes = notes;
          if (address) upsertPayload.address = address;
          if (addr2) upsertPayload.address_detail = addr2;

          // business_number가 있으면 그걸로 매칭, 없으면 clinic_name으로
          const conflictCol = businessNumber ? 'business_number' : 'clinic_name';
          const { error: dbErr } = await supabase.from('clients').upsert(
            [upsertPayload],
            { onConflict: conflictCol }
          );

          if (dbErr) {
            // business_number upsert 실패 시 clinic_name으로 재시도
            const { error: dbErr2 } = await supabase.from('clients').upsert(
              [{ ...upsertPayload }],
              { onConflict: 'clinic_name' }
            );
            if (dbErr2) {
              fail++;
              failDetails.push(`"${clinicName}" 실패: ${dbErr2.message}`);
            } else {
              success++;
            }
          } else {
            success++;
          }
        } catch (rowErr: any) {
          fail++;
          failDetails.push(`행 처리 오류: ${rowErr?.message || '알 수 없는 오류'}`);
        }
      }

      const result = { success, fail, failDetails };
      setDoneResult(result);
      setUploadDone(true);
      onComplete({ success, fail });
    } catch (e: any) {
      setError(e.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleClients = () => {
    const sample = [
      { 거래처명: '하이니스-샘플치과', 사업자번호: '123-45-67890', 대표자명: '홍길동', 전화번호: '02-1234-5678', 이메일: 'sample@clinic.com', 주소1: '서울시 강남구', 주소2: '테헤란로 123', 채권잔액: -1000000 },
      { 거래처명: '미소치과의원', 사업자번호: '234-56-78901', 대표자명: '김철수', 전화번호: '031-234-5678', 이메일: 'miso@clinic.com', 주소1: '경기도 수원시', 주소2: '영통구 456', 채권잔액: 500000 },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래처명단');
    XLSX.writeFile(wb, '거래처명단_샘플.xlsx');
  };

  const downloadSampleBalance = () => {
    const sample = [
      { 거래처명: '하이니스-샘플치과', 채권잔액: -250000 },
      { 거래처명: '미소치과의원', 채권잔액: 120000 },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '채권잔액');
    XLSX.writeFile(wb, '채권잔액_샘플.xlsx');
  };

  const previewCols = tab === 'clients'
    ? (clientsPreview[0] ? Object.keys(clientsPreview[0]) : [])
    : (balancePreview[0] ? Object.keys(balancePreview[0]) : []);
  const previewRows = tab === 'clients' ? clientsPreview : balancePreview;

  // 업로드 완료 화면
  if (uploadDone && doneResult) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-teal-100 rounded-full">
              <i className="ri-checkbox-circle-fill text-teal-500 text-4xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">업로드 완료!</h2>
            <p className="text-gray-600 text-sm">거래처 정보가 등록/업데이트되었습니다.</p>
          </div>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-600">{doneResult.success}</p>
              <p className="text-xs text-gray-500 mt-1">성공</p>
            </div>
            {doneResult.fail > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{doneResult.fail}</p>
                <p className="text-xs text-gray-500 mt-1">실패</p>
              </div>
            )}
          </div>

          {/* 실패 상세 이유 */}
          {doneResult.failDetails.length > 0 && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                <i className="ri-error-warning-line"></i>실패 상세 이유
              </p>
              <ul className="space-y-1">
                {doneResult.failDetails.map((msg, i) => (
                  <li key={i} className="text-xs text-red-600 flex items-start gap-1">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {doneResult.fail === 0 && (
            <p className="text-xs text-gray-400 text-center mb-5">
              채권금액이 포인트로 자동 변환되어 저장되었습니다. (1원 = 1포인트)
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm whitespace-nowrap cursor-pointer"
          >
            확인 — 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">엑셀 업로드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 탭 */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['clients', 'balance'] as UploadTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'clients' ? '① 거래처 명단' : '② 채권잔액 (선택)'}
              </button>
            ))}
          </div>

          {tab === 'clients' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-xs text-teal-800 space-y-1">
                <p className="font-semibold">📋 거래처 명단 파일 형식</p>
                <p>필수 컬럼: <strong>거래처명</strong></p>
                <p>선택 컬럼: 사업자번호, 대표자명, 전화번호, 이메일, 주소1, 주소2, 채권잔액</p>
                <p>같은 거래처명이 이미 있으면 정보가 업데이트됩니다.</p>
                <p className="text-teal-700 font-medium">💡 사업자번호가 일치하는 회원가입 계정과 자동 연결됩니다.</p>
                <p className="text-teal-700 font-semibold mt-2">💰 채권금액 → 포인트 자동 변환 (1원 = 1포인트)</p>
                <p className="text-teal-600">• 음수(-) 금액 = 선결제 → 포인트로 저장</p>
                <p className="text-teal-600">• 양수(+) 금액 = 미수금 → 미수금으로 저장</p>
              </div>
              <button
                onClick={downloadSampleClients}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-download-line"></i>샘플 파일 다운로드
              </button>
              <div
                onClick={() => clientsRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  clientsFile ? 'border-teal-400 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={clientsRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleClientsFile(e.target.files[0])}
                />
                <div className="w-10 h-10 flex items-center justify-center mx-auto mb-2 text-gray-400">
                  <i className="ri-file-excel-2-line text-4xl"></i>
                </div>
                {clientsFile ? (
                  <p className="text-sm font-medium text-teal-700">{clientsFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">클릭하여 파일 선택</p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx / .xls / .csv 지원</p>
                  </>
                )}
              </div>
            </div>
          )}

          {tab === 'balance' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">💰 채권잔액 파일 형식</p>
                <p>필수 컬럼: <strong>거래처명</strong>, <strong>채권잔액</strong></p>
                <p>거래처 명단의 거래처명과 정확히 일치해야 합니다.</p>
                <p>이 파일은 선택사항입니다. 없으면 명단 파일의 채권잔액 컬럼을 사용합니다.</p>
                <p className="text-amber-700 font-semibold mt-2">💰 채권금액 → 포인트 자동 변환 (1원 = 1포인트)</p>
                <p className="text-amber-600">• 음수(-) 금액 = 선결제 → 포인트로 저장</p>
                <p className="text-amber-600">• 양수(+) 금액 = 미수금 → 미수금으로 저장</p>
              </div>
              <button
                onClick={downloadSampleBalance}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-download-line"></i>샘플 파일 다운로드
              </button>
              <div
                onClick={() => balanceRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  balanceFile ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={balanceRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleBalanceFile(e.target.files[0])}
                />
                <div className="w-10 h-10 flex items-center justify-center mx-auto mb-2 text-gray-400">
                  <i className="ri-file-excel-2-line text-4xl"></i>
                </div>
                {balanceFile ? (
                  <p className="text-sm font-medium text-amber-700">{balanceFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">클릭하여 파일 선택 (선택사항)</p>
                    <p className="text-xs text-gray-400 mt-1">.xlsx / .xls / .csv 지원</p>
                  </>
                )}
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">미리보기 (최대 5행)</p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewCols.map(col => (
                        <th key={col} className="px-3 py-2 text-left text-gray-600 font-medium whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {previewCols.map(col => (
                          <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">{String(row[col])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <i className="ri-error-warning-line mr-1"></i>{error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className={clientsFile ? 'text-teal-600' : 'text-gray-400'}>
                <i className={`ri-${clientsFile ? 'checkbox-circle' : 'checkbox-blank-circle'}-line`}></i>
              </span>
              <span>거래처 명단 파일: {clientsFile ? clientsFile.name : '미선택'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={balanceFile ? 'text-amber-600' : 'text-gray-400'}>
                <i className={`ri-${balanceFile ? 'checkbox-circle' : 'checkbox-blank-circle'}-line`}></i>
              </span>
              <span>채권잔액 파일: {balanceFile ? balanceFile.name : '미선택 (선택사항)'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap text-sm cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !clientsFile}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <><i className="ri-loader-4-line animate-spin"></i>업로드 중...</>
              ) : (
                <><i className="ri-upload-2-line"></i>업로드 시작</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
interface VerificationRejectModalProps {
  client: Client;
  onClose: () => void;
  onSubmit: (note: string) => void;
}

function VerificationRejectModal({ client, onClose, onSubmit }: VerificationRejectModalProps) {
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }
    onSubmit(note.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">사업자 인증 거절</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              <i className="ri-information-line mr-1"></i>
              <strong>{client.clinic_name || client.name}</strong>의 사업자 인증을 거절하시겠습니까?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거절 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="거절 사유를 입력해주세요. (예: 사업자등록증이 불명확합니다, 사업자번호가 일치하지 않습니다)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              거절 사유는 거래처에게 표시됩니다.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap text-sm cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap text-sm font-medium cursor-pointer"
            >
              거절 확정
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
