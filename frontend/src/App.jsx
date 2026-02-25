import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import JobApplicationPage from "@/pages/jobs/JobApplicationPage";
import UserProfile from "@/pages/dashboard/profile/UserProfilePage";
import { CandidatesView } from "@/pages/dashboard/views/CandidatesView";
import AddCandidatePage from "@/pages/candidates/AddCandidatePage";
import CandidateDetailPage from "@/pages/candidates/CandidateDetailPage";
import { InterviewsView } from "@/pages/dashboard/views/InterviewsView";
import InterviewSettingsPage from "@/pages/dashboard/interviews/InterviewSettingsPage";
import ScheduleInterview from "@/pages/public/ScheduleInterview";
import { AIVideoView } from "@/pages/dashboard/views/AIVideoView";
import { AnalyticsView } from "@/pages/dashboard/analytics/AnalyticsView.jsx";
import { ANALYTICS_DATA } from "@/utils/data/dashboardData";
import SettingsPage from "@/pages/dashboard/settings/SettingsPage";
import EmailTemplatesPage from "@/pages/dashboard/email-templates/EmailTemplatesPage";
import EmailActivityPage from "@/pages/dashboard/email-templates/EmailActivityPage";

// ── Phase 3: AI Video Interview pages ──
import TechCheckPage from './pages/interview/TechCheckPage';
import LiveInterviewPage from './pages/interview/LiveInterviewPage';
import InterviewCompletePage from './pages/interview/InterviewCompletePage';

export default function HireFlowDashboard() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* ── Public Routes (no auth required) ── */}

        {/* Job application form */}
        <Route path="/apply/:jobId" element={<JobApplicationPage />} />

        {/* Human interview scheduling (magic link) */}
        <Route path="/schedule/:token" element={<ScheduleInterview />} />

        {/* AI Interview candidate flow (magic link → tech check → live → complete) */}
        <Route path="/ai-interview/join/:magicToken" element={<TechCheckPage />} />
        <Route path="/ai-interview/live/:sessionId" element={<LiveInterviewPage />} />
        <Route path="/ai-interview/complete/:sessionId" element={<InterviewCompletePage />} />

        {/* ── Auth Routes ── */}
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

        {/* ── Protected Dashboard Routes ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OverviewView />} />

          <Route path="jobs" element={<JobsView />} />
          <Route path="jobs/create" element={<CreateJob />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="jobs/:id/edit" element={<CreateJob />} />

          <Route path="candidates" element={<CandidatesView />} />
          <Route path="candidates/add" element={<AddCandidatePage />} />
          <Route path="candidates/:id" element={<CandidateDetailPage />} />

          <Route path="interviews" element={<InterviewsView />} />
          <Route path="interviews/settings" element={<InterviewSettingsPage />} />

          <Route path="ai-video" element={<AIVideoView />} />
          <Route path="analytics" element={<AnalyticsView analyticsData={ANALYTICS_DATA} />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="email-templates" element={<EmailTemplatesPage />} />
          <Route path="email-activity" element={<EmailActivityPage />} />
        </Route>

        {/* ── Default redirect ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}