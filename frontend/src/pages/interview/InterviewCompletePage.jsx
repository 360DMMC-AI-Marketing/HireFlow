import React from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const InterviewCompletePage = () => {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Thank You!
        </h1>

        <p className="text-slate-600 mb-6">
          Your interview has been completed successfully. Our team will review your
          responses and get back to you soon.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Interview recorded
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Responses submitted
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            AI analysis in progress
          </div>
        </div>

        <p className="text-xs text-slate-400">
          You can safely close this tab now.
        </p>
      </div>
    </div>
  );
};

export default InterviewCompletePage;