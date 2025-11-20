import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Chat from './Chat';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || 'dummy-pool-id',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || 'dummy-client-id',
    }
  }
});

export default function App() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Authenticator>
        {({ signOut, user }) => (
          <main className="w-full min-h-screen bg-gray-100">
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900">Agent Lab Chat</h1>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Hello, <span className="font-medium text-gray-900">{user?.username}</span></span>
                  <button
                    onClick={signOut}
                    className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
            <div className="py-8">
              <Chat />
            </div>
          </main>
        )}
      </Authenticator>
    </div>
  );
}

