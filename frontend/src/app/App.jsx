import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthLayout } from "@/app/components/auth/shared/AuthLayout";
import { LoginPage } from "@/app/components/auth/login/LoginPage";
import { SignupPage } from "@/app/components/auth/signup/SignupPage";
import { EmailVerificationView } from "@/app/components/auth/signup/EmailVerificationView";
import ForgotPasswordPage from "@/app/components/auth/forgot-password/ForgotPasswordPage";
import ResetPasswordPage from "@/app/components/auth/reset-password/ResetPasswordPage";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/app/components/dashboard/layout/DashboardLayout";
import { OverviewView } from "@/app/components/dashboard/views/OverviewView";
import { JobsView } from "@/app/components/dashboard/views/JobsView";
import { CandidatesView } from "@/app/components/dashboard/views/CandidatesView";
import { InterviewsView } from "@/app/components/dashboard/views/InterviewsView";
import { AIVideoView } from "@/app/components/dashboard/views/AIVideoView";
import { AnalyticsView } from "@/app/components/dashboard/views/AnalyticsView";
import { DASHBOARD_STATS, ANALYTICS_DATA, RECENT_CANDIDATES } from "@/app/data/dashboardData";

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
          <Route path="candidates" element={<CandidatesView />} />
          <Route path="interviews" element={<InterviewsView />} />
          <Route path="ai-video" element={<AIVideoView />} />
          <Route path="analytics" element={<AnalyticsView analyticsData={ANALYTICS_DATA} />} />
        </Route>
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
