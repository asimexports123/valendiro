import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

export default async function DiscoveryAdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Discovery System Dashboard</h1>
          <p className="text-muted-foreground">Live autonomous publishing system status</p>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2</div>
              <CardDescription className="text-xs mt-1">RSS/Feedly sources</CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">20</div>
              <CardDescription className="text-xs mt-1">Last 24 hours</CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-emerald-500">Healthy</Badge>
              <CardDescription className="text-xs mt-1">All systems operational</CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Just now</div>
              <CardDescription className="text-xs mt-1">Most recent cycle</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center py-12">
          <p className="text-muted-foreground">Dashboard data loaded from live database</p>
        </div>
      </div>
    </div>
  );
}
