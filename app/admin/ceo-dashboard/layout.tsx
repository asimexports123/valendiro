import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Search, 
  Database, 
  FileText, 
  Settings, 
  Activity,
  Globe,
  Layers,
  CheckCircle,
  Link2,
  Zap,
  BarChart3,
  Activity as ActivityIcon,
  FileText as FileTextIcon,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin/ceo-dashboard", icon: LayoutDashboard },
  { name: "Discovery", href: "/admin/ceo-dashboard/discovery", icon: Search },
  { name: "Sources", href: "/admin/ceo-dashboard/sources", icon: Globe },
  { name: "Knowledge", href: "/admin/ceo-dashboard/knowledge", icon: Database },
  { name: "Rendering", href: "/admin/ceo-dashboard/rendering", icon: Layers },
  { name: "Publishing", href: "/admin/ceo-dashboard/publishing", icon: FileText },
  { name: "Articles", href: "/admin/ceo-dashboard/articles", icon: FileTextIcon },
  { name: "Categories", href: "/admin/ceo-dashboard/categories", icon: Activity },
  { name: "SEO", href: "/admin/ceo-dashboard/seo", icon: Globe },
  { name: "Internal Links", href: "/admin/ceo-dashboard/internal-links", icon: Link2 },
  { name: "Quality", href: "/admin/ceo-dashboard/quality", icon: CheckCircle },
  { name: "Automation", href: "/admin/ceo-dashboard/automation", icon: Zap },
  { name: "Analytics", href: "/admin/ceo-dashboard/analytics", icon: BarChart3 },
  { name: "System Health", href: "/admin/ceo-dashboard/system-health", icon: ActivityIcon },
  { name: "Logs", href: "/admin/ceo-dashboard/logs", icon: FileText },
  { name: "Settings", href: "/admin/ceo-dashboard/settings", icon: Settings },
];

export default function CEODashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Mission Control</h1>
          <p className="text-sm text-gray-400 mt-1">Valendiro Platform</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="ml-2 text-sm text-gray-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
