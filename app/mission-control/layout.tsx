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
  { name: "Dashboard", href: "/mission-control", icon: LayoutDashboard },
  { name: "Discovery", href: "/mission-control/discovery", icon: Search },
  { name: "Sources", href: "/mission-control/sources", icon: Globe },
  { name: "Knowledge", href: "/mission-control/knowledge", icon: Database },
  { name: "Rendering", href: "/mission-control/rendering", icon: Layers },
  { name: "Publishing", href: "/mission-control/publishing", icon: FileText },
  { name: "Articles", href: "/mission-control/articles", icon: FileTextIcon },
  { name: "Categories", href: "/mission-control/categories", icon: Activity },
  { name: "SEO", href: "/mission-control/seo", icon: Globe },
  { name: "Internal Links", href: "/mission-control/internal-links", icon: Link2 },
  { name: "Quality", href: "/mission-control/quality", icon: CheckCircle },
  { name: "Automation", href: "/mission-control/automation", icon: Zap },
  { name: "Analytics", href: "/mission-control/analytics", icon: BarChart3 },
  { name: "System Health", href: "/mission-control/system-health", icon: ActivityIcon },
  { name: "Logs", href: "/mission-control/logs", icon: FileText },
  { name: "Settings", href: "/mission-control/settings", icon: Settings },
];

export default async function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/mission-control");
  }

  // Check if user has admin or editor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    redirect("/?error=unauthorized");
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Mission Control</h1>
          <p className="text-sm text-gray-400 mt-1">Valendiro Platform</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
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
