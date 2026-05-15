import { useState, useEffect } from "react";
import SuperLayout from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Loader2 } from "lucide-react";
import { getSuperToken, superFetch } from "./super-auth";

const GRADE_SCALES = [
  { label: "A+ to F (10-point)", value: "10point" },
  { label: "A to F (5-point)", value: "5point" },
  { label: "Percentage Only", value: "percentage" },
  { label: "GPA (4.0 Scale)", value: "gpa" },
];

const defaultSettings = {
  schoolName: "Emblazers School",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  schoolLogo: "",
  gradeScale: "10point",
  showAttendance: true,
  showRemarks: true,
  showPosition: true,
  showPercentage: true,
  showGrade: true,
  showSignatures: true,
  principalName: "",
  principalTitle: "Principal",
  examinerTitle: "Class Teacher",
  footerText: "This is a computer-generated report card.",
  passingPercentage: "33",
};

export default function ReportCardSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getSuperToken();
    if (!token) { setLoading(false); return; }
    superFetch("/api/super/report-card-settings")
      .then(r => r.json())
      .then(data => {
        if (data && data.id) {
          setSettings({
            schoolName: data.schoolName ?? defaultSettings.schoolName,
            schoolAddress: data.schoolAddress ?? "",
            schoolPhone: data.schoolPhone ?? "",
            schoolEmail: data.schoolEmail ?? "",
            schoolLogo: data.schoolLogo ?? "",
            gradeScale: data.gradeScale ?? "10point",
            showAttendance: data.showAttendance ?? true,
            showRemarks: data.showRemarks ?? true,
            showPosition: data.showPosition ?? true,
            showPercentage: data.showPercentage ?? true,
            showGrade: data.showGrade ?? true,
            showSignatures: data.showSignatures ?? true,
            principalName: data.principalName ?? "",
            principalTitle: data.principalTitle ?? "Principal",
            examinerTitle: data.examinerTitle ?? "Class Teacher",
            footerText: data.footerText ?? "This is a computer-generated report card.",
            passingPercentage: data.passingPercentage != null ? String(data.passingPercentage) : "33",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await superFetch("/api/super/report-card-settings", {
        method: "POST",
        body: JSON.stringify({
          ...settings,
          passingPercentage: parseFloat(settings.passingPercentage) || 33,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Settings saved", description: "Report card settings have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SuperLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </SuperLayout>
    );
  }

  return (
    <SuperLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-report-settings-title">
              <FileText className="w-6 h-6" /> Report Card Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Configure how student report cards are generated and displayed</p>
          </div>
          <Button onClick={handleSave} disabled={saving} data-testid="button-save-settings">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Information</CardTitle>
              <CardDescription>Details displayed on the report card header</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input id="schoolName" value={settings.schoolName} onChange={e => updateSetting("schoolName", e.target.value)} data-testid="input-school-name" />
              </div>
              <div>
                <Label htmlFor="schoolAddress">School Address</Label>
                <Textarea id="schoolAddress" value={settings.schoolAddress} onChange={e => updateSetting("schoolAddress", e.target.value)} rows={2} data-testid="input-school-address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="schoolPhone">Phone</Label>
                  <Input id="schoolPhone" value={settings.schoolPhone} onChange={e => updateSetting("schoolPhone", e.target.value)} data-testid="input-school-phone" />
                </div>
                <div>
                  <Label htmlFor="schoolEmail">Email</Label>
                  <Input id="schoolEmail" value={settings.schoolEmail} onChange={e => updateSetting("schoolEmail", e.target.value)} data-testid="input-school-email" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grading Configuration</CardTitle>
              <CardDescription>Set grade scale and passing criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gradeScale">Grade Scale</Label>
                <Select value={settings.gradeScale} onValueChange={v => updateSetting("gradeScale", v)}>
                  <SelectTrigger id="gradeScale" data-testid="select-grade-scale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_SCALES.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
                <Input
                  id="passingPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.passingPercentage}
                  onChange={e => updateSetting("passingPercentage", e.target.value)}
                  data-testid="input-passing-percentage"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Display Options</CardTitle>
              <CardDescription>Choose what sections appear on the report card</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "showAttendance", label: "Show Attendance Summary" },
                { key: "showRemarks", label: "Show Teacher Remarks" },
                { key: "showPosition", label: "Show Class Position/Rank" },
                { key: "showPercentage", label: "Show Percentage" },
                { key: "showGrade", label: "Show Letter Grade" },
                { key: "showSignatures", label: "Show Signature Blocks" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <Label htmlFor={item.key}>{item.label}</Label>
                  <Switch
                    id={item.key}
                    checked={(settings as any)[item.key]}
                    onCheckedChange={v => updateSetting(item.key, v)}
                    data-testid={`switch-${item.key}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signatures & Footer</CardTitle>
              <CardDescription>Configure signature blocks and footer text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  value={settings.principalName}
                  onChange={e => updateSetting("principalName", e.target.value)}
                  data-testid="input-principal-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="principalTitle">Principal Title</Label>
                  <Input
                    id="principalTitle"
                    value={settings.principalTitle}
                    onChange={e => updateSetting("principalTitle", e.target.value)}
                    data-testid="input-principal-title"
                  />
                </div>
                <div>
                  <Label htmlFor="examinerTitle">Examiner Title</Label>
                  <Input
                    id="examinerTitle"
                    value={settings.examinerTitle}
                    onChange={e => updateSetting("examinerTitle", e.target.value)}
                    data-testid="input-examiner-title"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={settings.footerText}
                  onChange={e => updateSetting("footerText", e.target.value)}
                  rows={2}
                  data-testid="input-footer-text"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperLayout>
  );
}
