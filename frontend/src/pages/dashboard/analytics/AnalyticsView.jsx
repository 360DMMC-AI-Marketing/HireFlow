import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card } from "../shared/Card";
import { SectionHeader } from "../shared/SectionHeader";

export const AnalyticsView = ({ analyticsData }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <SectionHeader title="Recruitment Analytics" subtitle="Data-driven hiring performance metrics" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="p-6">
        <h3 className="font-bold mb-6">Source of Hire</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{name: 'LinkedIn', value: 45}, {name: 'Direct', value: 25}, {name: 'Referral', value: 30}]}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#4F46E5" />
                <Cell fill="#10B981" />
                <Cell fill="#F59E0B" />
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="font-bold mb-6">Time to Hire (Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px'}} />
              <Bar dataKey="applicants" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </div>
);
