import { 
  Phone, 
  MessageSquare, 
  Users, 
  Terminal, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  LayoutDashboard,
  FileText
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'console', label: 'Operator Console', icon: <Terminal size={20} /> },
  { id: 'approvals', label: 'Approvals', icon: <ShieldAlert size={20} /> },
  { id: 'calls', label: 'Calls & Conf', icon: <Phone size={20} /> },
  { id: 'sms', label: 'Messaging', icon: <MessageSquare size={20} /> },
  { id: 'audit', label: 'Audit Logs', icon: <FileText size={20} /> },
];

export const MOCK_CHART_DATA = [
  { time: '09:00', value: 12 },
  { time: '10:00', value: 19 },
  { time: '11:00', value: 35 },
  { time: '12:00', value: 24 },
  { time: '13:00', value: 42 },
  { time: '14:00', value: 58 },
  { time: '15:00', value: 45 },
];
