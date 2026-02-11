import { createBrowserRouter } from "react-router-dom";

import { LoginPage } from "@/app/components/auth/login/LoginPage";
import { SignupPage } from "@/app/components/auth/signup/SignupPage";
import { EmailVerificationView } from "@/app/components/auth/signup/EmailVerificationView";     
import { MainLayout } from "@/layouts/MainLayout";
import { OverviewView } from "@/app/components/dashboard/views/OverviewView";
import { JobsView } from "@/app/components/dashboard/views/JobsView";
import { CandidatesView } from "@/app/components/dashboard/views/CandidatesView";
import { InterviewsView } from "@/app/components/dashboard/views/InterviewsView";
import { AIVideoView } from "@/app/components/dashboard/views/AIVideoView";
import { AnalyticsView } from "@/app/components/dashboard/views/AnalyticsView"; 
import { SettingsView } from "@/app/components/dashboard/views/SettingsView";
import CandidateDetailPage from "@/pages/candidates/CandidateDetailPage";
import AddCandidatePage from "@/pages/candidates/AddCandidatePage";
import JobApplicationPage from "@/pages/jobs/JobApplicationPage";

const router = createBrowserRouter([
    // Public routes (no auth required)
    {
        path: "/apply/:jobId",
        element: <JobApplicationPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/signup",
        element: <SignupPage />,
    },
    // Protected routes (require auth)
    {
        element: <MainLayout />,
        children: [
            {  
                path: "/dashboard",
                element: <OverviewView />,
            },
            { path: "/jobs", element: <JobsView /> },
            {
                path: "/candidates",
                element: <CandidatesView />,
            },
            {
                path: "/dashboard/candidates/add",
                element: <AddCandidatePage />,
            },
            {
                path: "/dashboard/candidates/:id",
                element: <CandidateDetailPage />,
            },
            {   
                path:"/interviews",
                element:<InterviewsView/>,
            },
            {   
                path:"/ai-video",
                element:<AIVideoView/>,
            },
            {   
                path:"/analytics",
                element:<AnalyticsView/>,
            },
            {
                path:"/settings",
                element:<SettingsView/>,        
            },
        ],
    },
]);

export default router;
