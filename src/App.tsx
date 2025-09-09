// OPTIMIZATION: Bundle splitting with lazy loading
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { HelmetProvider } from 'react-helmet-async';
import '@/lib/i18n';
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useEffect, Suspense, lazy } from "react";
import { initXSSProtection } from "@/utils/security/xssProtection";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRoutePrefetching } from "@/hooks/useRoutePrefetching";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorBoundary from "@/components/error/ErrorBoundary";
// OPTIMIZATION: Eager load critical pages, lazy load others
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

// OPTIMIZATION: Lazy load role-specific and less critical pages
const Projects = lazy(() => import(/* webpackChunkName: "brand" */ "./pages/brand/Projects"));
const NewProject = lazy(() => import(/* webpackChunkName: "brand" */ "./pages/brand/NewProject"));
const ProjectDetail = lazy(() => import(/* webpackChunkName: "brand" */ "./pages/brand/ProjectDetail"));
const Deals = lazy(() => import(/* webpackChunkName: "deals" */ "./pages/Deals"));
const Deliverables = lazy(() => import(/* webpackChunkName: "creator" */ "./pages/Deliverables"));
const Payouts = lazy(() => import(/* webpackChunkName: "creator" */ "./pages/Payouts"));
const Payments = lazy(() => import(/* webpackChunkName: "brand" */ "./pages/Payments"));
const Creators = lazy(() => import(/* webpackChunkName: "brand" */ "./pages/Creators"));
const CreatorProfile = lazy(() => import(/* webpackChunkName: "brand" */ "./pages/CreatorProfile"));
const DealDetail = lazy(() => import(/* webpackChunkName: "deals" */ "./pages/DealDetail"));
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ "./pages/Settings"));
const KYCStatus = lazy(() => import(/* webpackChunkName: "settings" */ "./pages/KYCStatus"));

// OPTIMIZATION: Lazy load admin pages
const AdminUsers = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/Users"));
const AdminDeals = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/Deals"));
const AdminTransactions = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/Transactions"));

// OPTIMIZATION: Lazy load marketing/static pages
const Pricing = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/Pricing"));
const Blog = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/Blog"));
const BlogPost = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/BlogPost"));
const Privacy = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/Privacy"));
const Terms = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/Terms"));
const Cookies = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/Cookies"));
const Security = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/Security"));
const Help = lazy(() => import(/* webpackChunkName: "support" */ "./pages/Help"));
const Contact = lazy(() => import(/* webpackChunkName: "support" */ "./pages/Contact"));
const Status = lazy(() => import(/* webpackChunkName: "support" */ "./pages/Status"));
const Community = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/Community"));
const ApiDocs = lazy(() => import(/* webpackChunkName: "developer" */ "./pages/ApiDocs"));
const Api = lazy(() => import(/* webpackChunkName: "developer" */ "./pages/Api"));
const Integrations = lazy(() => import(/* webpackChunkName: "developer" */ "./pages/Integrations"));
const Changelog = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/Changelog"));
const Partnerships = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/Partnerships"));
const MediaKit = lazy(() => import(/* webpackChunkName: "marketing" */ "./pages/MediaKit"));
const Compliance = lazy(() => import(/* webpackChunkName: "legal" */ "./pages/Compliance"));
const NotFound = lazy(() => import(/* webpackChunkName: "error" */ "./pages/NotFound"));

const queryClient = new QueryClient();

// OPTIMIZATION: Loading fallback component
const PageLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-64" />
        ))}
      </div>
    </div>
  </div>
);

const AppContent = () => {
  // OPTIMIZATION: Initialize route prefetching
  useRoutePrefetching();

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/security" element={<Security />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/status" element={<Status />} />
            <Route path="/community" element={<Community />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/api" element={<Api />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/media-kit" element={<MediaKit />} />
            <Route path="/compliance" element={<Compliance />} />
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
      </Suspense>
    );
};

const App = () => {
  // Initialize security protections
  useEffect(() => {
    initXSSProtection();
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthProvider>
              <SubscriptionProvider>
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </SubscriptionProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
