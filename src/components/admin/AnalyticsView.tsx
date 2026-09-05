"use client";

import React from "react";
import { Briefcase, GraduationCap, LayoutTemplate, UserCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PerformanceByRoleChart } from "./PerformanceByRoleChart";
import { PerformanceByQualificationChart } from "./PerformanceByQualificationChart";
import { PerformanceByAssessmentChart } from "./PerformanceByAssessmentChart";
import { ExaminerPerformanceTable } from "./ExaminerPerformanceTable";
import {
  RolePerformanceData,
  QualificationPerformanceData,
  AssessmentPerformanceData,
  ExaminerPerformanceData,
} from "./analytics-types";

interface Props {
  roleData: RolePerformanceData[];
  qualificationData: QualificationPerformanceData[];
  assessmentData: AssessmentPerformanceData[];
  examinerData: ExaminerPerformanceData[];
}

export function AnalyticsView({ roleData, qualificationData, assessmentData, examinerData }: Props) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="role">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="role" className="cursor-pointer gap-1.5 font-semibold text-xs">
            <Briefcase className="size-3.5" /> By Role
          </TabsTrigger>
          <TabsTrigger value="qualification" className="cursor-pointer gap-1.5 font-semibold text-xs">
            <GraduationCap className="size-3.5" /> By Qualification
          </TabsTrigger>
          <TabsTrigger value="assessment" className="cursor-pointer gap-1.5 font-semibold text-xs">
            <LayoutTemplate className="size-3.5" /> By Assessment
          </TabsTrigger>
          <TabsTrigger value="examiner" className="cursor-pointer gap-1.5 font-semibold text-xs">
            <UserCheck className="size-3.5" /> By Examiner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="role" className="pt-2">
          <PerformanceByRoleChart data={roleData} />
        </TabsContent>

        <TabsContent value="qualification" className="pt-2">
          <PerformanceByQualificationChart data={qualificationData} />
        </TabsContent>

        <TabsContent value="assessment" className="pt-2">
          <PerformanceByAssessmentChart data={assessmentData} />
        </TabsContent>

        <TabsContent value="examiner" className="pt-2">
          <ExaminerPerformanceTable data={examinerData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
