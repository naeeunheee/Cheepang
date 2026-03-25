import { BrowserRouter, useLocation } from "react-router-dom";
import { AppRoutes } from "./router";
import ChatWidget from "./components/feature/ChatWidget";
import AdminBottomNav from "./components/feature/AdminBottomNav";
import { AuthProvider } from "./contexts/AuthContext";

function RouteAwareWidgets() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '';
  const isAiChatPage = location.pathname === '/ai-chat';
  return (
    <>
      {!isHomePage && !isAiChatPage && <ChatWidget />}
      <AdminBottomNav />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppRoutes />
        <RouteAwareWidgets />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
