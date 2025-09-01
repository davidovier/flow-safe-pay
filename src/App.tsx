import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import '@/lib/i18n';
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/brand/Projects";
import NewProject from "./pages/brand/NewProject";
import ProjectDetail from "./pages/brand/ProjectDetail";
import Deals from "./pages/Deals";
import Deliverables from "./pages/Deliverables";
import Payouts from "./pages/Payouts";
import Payments from "./pages/Payments";
import Pricing from "./pages/Pricing";
import AdminUsers from "./pages/admin/Users";
import AdminDeals from "./pages/admin/Deals";
import AdminTransactions from "./pages/admin/Transactions";
import Settings from "./pages/Settings";
import KYCStatus from "./pages/KYCStatus";
import Creators from "./pages/Creators";
import CreatorProfile from "./pages/CreatorProfile";
import DealDetail from "./pages/DealDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SubscriptionProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kyc-status" element={
              <ProtectedRoute>
                <AppLayout>
                  <KYCStatus />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/creators" element={
              <ProtectedRoute allowedRoles={['BRAND']}>
                <AppLayout>
                  <Creators />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/creators/:id" element={
              <ProtectedRoute allowedRoles={['BRAND']}>
                <AppLayout>
                  <CreatorProfile />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute allowedRoles={['BRAND']}>
                <AppLayout>
                  <Projects />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/new" element={
              <ProtectedRoute allowedRoles={['BRAND']}>
                <AppLayout>
                  <NewProject />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/:id" element={
              <ProtectedRoute allowedRoles={['BRAND']}>
                <AppLayout>
                  <ProjectDetail />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/deals" element={
              <ProtectedRoute allowedRoles={['CREATOR', 'BRAND']}>
                <AppLayout>
                  <Deals />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/deals/:id" element={
              <ProtectedRoute allowedRoles={['CREATOR', 'BRAND']}>
                <AppLayout>
                  <DealDetail />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/deliverables" element={
              <ProtectedRoute allowedRoles={['CREATOR']}>
                <AppLayout>
                  <Deliverables />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/payouts" element={
              <ProtectedRoute allowedRoles={['CREATOR']}>
                <AppLayout>
                  <Payouts />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute allowedRoles={['BRAND']}>
                <AppLayout>
                  <Payments />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout>
                  <AdminUsers />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/deals" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout>
                  <AdminDeals />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/transactions" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout>
                  <AdminTransactions />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
