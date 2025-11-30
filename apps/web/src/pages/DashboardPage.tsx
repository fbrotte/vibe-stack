import { useState } from 'react';
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
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmMessage, setLlmMessage] = useState('Hello! Who are you? Answer in one short sentence.');

  const { data: userData, isLoading } = trpc.auth.me.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const { data: llmStatus } = trpc.llm.status.useQuery();

  const llmTestMutation = trpc.llm.test.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setLlmResponse(data.response);
        setLlmError(null);
      } else {
        setLlmError(data.error);
        setLlmResponse(null);
      }
    },
    onError: (error) => {
      setLlmError(error.message);
      setLlmResponse(null);
    },
  });

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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>LLM Test (Langfuse)</CardTitle>
              <CardDescription>
                Test LLM call via tRPC - Check Langfuse dashboard for traces
                {llmStatus && (
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${llmStatus.configured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {llmStatus.configured ? 'LLM Configured' : 'LLM Not Configured'}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={llmMessage}
                  onChange={(e) => setLlmMessage(e.target.value)}
                  className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your message..."
                />
                <Button
                  onClick={() => llmTestMutation.mutate({ message: llmMessage })}
                  disabled={llmTestMutation.isPending || !llmMessage.trim()}
                >
                  {llmTestMutation.isPending ? 'Calling LLM...' : 'Send'}
                </Button>

                {llmResponse && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm font-medium text-green-800">Response:</p>
                    <p className="text-sm text-green-700 mt-1">{llmResponse}</p>
                  </div>
                )}

                {llmError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Error:</p>
                    <p className="text-sm text-red-700 mt-1">{llmError}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
