import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "@/pages/auth/shared/AuthLayout";
import { LoginPage } from "@/pages/auth/login/LoginPage";
import { SignupPage } from "@/pages/auth/signup/SignupPage";
import { EmailVerificationView } from "@/pages/auth/signup/EmailVerificationView";
import ForgotPasswordPage from "@/pages/auth/forgot-password/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/reset-password/ResetPasswordPage";
import { ProtectedRoute } from "@/pages/auth/ProtectedRoute";
import { DashboardLayout } from "@/pages/dashboard/layout/DashboardLayout";
import { OverviewView } from "@/pages/dashboard/views/OverviewView";
import { JobsView } from "@/pages/dashboard/views/JobsView";
import CreateJob from "@/pages/jobs/CreateJob";
import JobDetail from "@/pages/jobs/JobDetail";
import UserProfile from "@/pages/dashboard/profile/UserProfilePage";
import { CandidatesView } from "@/pages/dashboard/views/CandidatesView";
import { InterviewsView } from "@/pages/dashboard/views/InterviewsView";
import { AIVideoView } from "@/pages/dashboard/views/AIVideoView";
import { AnalyticsView } from "@/pages/dashboard/views/AnalyticsView";
import { DASHBOARD_STATS, ANALYTICS_DATA, RECENT_CANDIDATES } from "@/utils/data/dashboardData";

export default function HireFlowDashboard() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          <AuthLayout title="Platform Login" subtitle="Secure access to your recruitment command center.">
            <LoginPage />
          </AuthLayout>
        } />
        
        <Route path="/signup" element={
          <AuthLayout title="Register Company" subtitle="Join 500+ enterprises optimizing their talent acquisition.">
            <SignupPage />
          </AuthLayout>
        } />
        
        <Route path="/verify-email" element={
          <AuthLayout title="" subtitle="">
            <EmailVerificationView />
          </AuthLayout>
        } />
        
        <Route path="/forgot-password" element={
          <AuthLayout title="Reset Password" subtitle="Enter your email to receive reset instructions.">
            <ForgotPasswordPage />
          </AuthLayout>
        } />

        <Route path="/reset-password/:token" element={
          <AuthLayout title="Create New Password" subtitle="Choose a strong password for your account.">
            <ResetPasswordPage />
          </AuthLayout>
        } />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OverviewView dashboardStats={DASHBOARD_STATS} analyticsData={ANALYTICS_DATA} recentCandidates={RECENT_CANDIDATES} />} />
          <Route path="jobs" element={<JobsView />} />
          <Route path="jobs/create" element={<CreateJob />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="jobs/:id/edit" element={<CreateJob />} />
          <Route path="candidates" element={<CandidatesView />} />
          <Route path="interviews" element={<InterviewsView />} />
          <Route path="ai-video" element={<AIVideoView />} />
          <Route path="analytics" element={<AnalyticsView analyticsData={ANALYTICS_DATA} />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<UserProfile />} />
        </Route>
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
