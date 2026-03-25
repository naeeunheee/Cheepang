import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/feature/ProtectedRoute';
import LoginRequiredRoute from '../components/feature/LoginRequiredRoute';

const Home = lazy(() => import('../pages/home/page'));
const ProductDetail = lazy(() => import('../pages/product/page'));
const LoginPage = lazy(() => import('../pages/login/page'));
const OrdersPage = lazy(() => import('../pages/admin/orders/page'));
const ClientsPage = lazy(() => import('../pages/admin/clients/page'));
const ClientDetailPage = lazy(() => import('../pages/admin/client-detail/page'));
const ClientOrdersPage = lazy(() => import('../pages/admin/client-orders/page'));
const ImageClassifierPage = lazy(() => import('../pages/admin/image-classifier/page'));
const ImageValidatorPage = lazy(() => import('../pages/admin/image-validator/page'));
const TemplateEditorPage = lazy(() => import('../pages/admin/template-editor/page'));
const ProductsManagementPage = lazy(() => import('../pages/admin/products/page'));
const PriceTiersPage = lazy(() => import('../pages/admin/price-tiers/page'));
const CategoryPage = lazy(() => import('../pages/category/page'));
const MyOrdersPage = lazy(() => import('../pages/my-orders/page'));
const MyPointsPage = lazy(() => import('../pages/my-points/page'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AdminPointsPage = lazy(() => import('../pages/admin/points/page'));
const FixtureComparePage = lazy(() => import('../pages/fixture-compare/page'));
const PrivacyPage = lazy(() => import('../pages/privacy/page'));
const TermsPage = lazy(() => import('../pages/terms/page'));
const RefundPage = lazy(() => import('../pages/refund/page'));
const AdminDataPage = lazy(() => import('../pages/admin/admin-data/page'));
const AdminChatPage = lazy(() => import('../pages/admin/chat/page'));
const PaymentSuccessPage = lazy(() => import('../pages/payment/success/page'));
const PaymentFailPage = lazy(() => import('../pages/payment/fail/page'));
const AdminNoticesPage = lazy(() => import('../pages/admin/notices/page'));
const MyPaymentsPage = lazy(() => import('../pages/my-payments/page'));
const AiConsultationPage = lazy(() => import('../pages/ai-consultation/page'));
const AdminConsultationsPage = lazy(() => import('../pages/admin/consultations/page'));
const MyPagePage = lazy(() => import('../pages/my-page/page'));
const AdminDashboardPage = lazy(() => import('../pages/admin/dashboard/page'));
const AiChatPage = lazy(() => import('../pages/ai-chat/page'));

const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/my-orders', element: <LoginRequiredRoute><MyOrdersPage /></LoginRequiredRoute> },
  { path: '/my-points', element: <LoginRequiredRoute><MyPointsPage /></LoginRequiredRoute> },
  { path: '/my-payments', element: <LoginRequiredRoute><MyPaymentsPage /></LoginRequiredRoute> },
  { path: '/my-page', element: <LoginRequiredRoute><MyPagePage /></LoginRequiredRoute> },
  { path: '/ai-consultation', element: <AiConsultationPage /> },
  { path: '/ai-chat', element: <AiChatPage /> },
  { path: '/product/:id', element: <ProductDetail /> },
  { path: '/category/:id', element: <CategoryPage /> },
  { path: '/fixture-compare', element: <FixtureComparePage /> },
  { path: '/payment/success', element: <PaymentSuccessPage /> },
  { path: '/payment/fail', element: <PaymentFailPage /> },
  { 
    path: '/admin/orders', 
    element: <ProtectedRoute><OrdersPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/dashboard', 
    element: <ProtectedRoute><AdminDashboardPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/clients', 
    element: <ProtectedRoute><ClientsPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/clients/:id', 
    element: <ProtectedRoute><ClientDetailPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/client-orders', 
    element: <ProtectedRoute><ClientOrdersPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/points', 
    element: <ProtectedRoute><AdminPointsPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/chat', 
    element: <ProtectedRoute><AdminChatPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/image-classifier', 
    element: <ProtectedRoute><ImageClassifierPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/image-validator', 
    element: <ProtectedRoute><ImageValidatorPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/template-editor', 
    element: <ProtectedRoute><TemplateEditorPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/products', 
    element: <ProtectedRoute><ProductsManagementPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/price-tiers', 
    element: <ProtectedRoute><PriceTiersPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/notices', 
    element: <ProtectedRoute><AdminNoticesPage /></ProtectedRoute> 
  },
  { 
    path: '/admin/consultations', 
    element: <ProtectedRoute><AdminConsultationsPage /></ProtectedRoute> 
  },
  { 
    path: '/admin-data', 
    element: <ProtectedRoute><AdminDataPage /></ProtectedRoute> 
  },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/refund', element: <RefundPage /> },
  { path: '*', element: <NotFound /> },
];

export default routes;