import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Performance from "./pages/Performance";
import KPI from "./pages/KPI";
import Accounts from "./pages/Accounts";
import Tutorials from "./pages/Tutorials";
import SOPs from "./pages/SOPs";
import Tools from "./pages/Tools";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import DailyReport from "./pages/DailyReport"; // <-- Halaman baru telah diimpor

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/employees" element={
        <ProtectedRoute requireManager>
          <Layout>
            <Employees />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/performance" element={
        <ProtectedRoute>
          <Layout>
            <Performance />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/kpi" element={
        <ProtectedRoute>
          <Layout>
            <KPI />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/accounts" element={
        <ProtectedRoute requireManager>
          <Layout>
            <Accounts />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/tutorials" element={
        <ProtectedRoute>
          <Layout>
            <Tutorials />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/sops" element={
        <ProtectedRoute>
          <Layout>
            <SOPs />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/tools" element={
        <ProtectedRoute>
          <Layout>
            <Tools />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute>
          <Layout>
            <Products />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Rute baru untuk Laporan Harian */}
      <Route path="/daily-report" element={
        <ProtectedRoute>
          <Layout>
            <DailyReport />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
