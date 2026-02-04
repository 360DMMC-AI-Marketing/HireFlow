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
const router = createBrowserRouter([
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
            {
                path: "/login",
                element: <LoginPage />,
            },
        ],
    },
    {       
            }

]);
