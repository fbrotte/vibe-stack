import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore, useUser } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useUser();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const { data: userData, isLoading } = trpc.auth.me.useQuery();
  const { data: users } = trpc.users.list.useQuery();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });

  const handleLogout = () => {
    if (refreshToken) {
      logoutMutation.mutate({ refreshToken });
    } else {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Template Dev</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                {user?.name} ({user?.role})
              </span>
              <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome!</CardTitle>
              <CardDescription>You are logged in to the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading user data...</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <strong>Email:</strong> {userData?.email}
                  </p>
                  <p>
                    <strong>Name:</strong> {userData?.name}
                  </p>
                  <p>
                    <strong>Role:</strong> {userData?.role}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>List of registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {users ? (
                <ul className="space-y-2">
                  {users.map((u) => (
                    <li key={u.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Loading users...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
