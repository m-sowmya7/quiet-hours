import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ProtectedRoute from '../components/ProtectedRoute';
import Head from 'next/head';
import { withServerSideAuth } from '../lib/serverAuth';
import { GetServerSideProps } from 'next';
import Link from 'next/link';

export const getServerSideProps: GetServerSideProps = withServerSideAuth;

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (!user) {
        console.log('Dashboard - No user available for fetching blocks');
        return;
      }

      console.log('Dashboard - Fetching blocks for user:', user.id);

      try {
        // Get the user's access token from Supabase Auth
        let accessToken = null;
        if (supabase && supabase.auth) {
          const session = await supabase.auth.getSession();
          accessToken = session?.data?.session?.access_token;
        }

        if (!accessToken) {
          throw new Error('User is not authenticated or token missing');
        }

        const response = await fetch('/api/blocks?user_id=' + encodeURIComponent(user.id), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to fetch blocks');
        }
        const data = await response.json();
        setBlocks(data.blocks || []);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard - Quiet Hours</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Quiet Hours</h1>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-blue-600 hover:text-blue-800">
                Profile
              </Link>
              <button 
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <h2 className="text-lg font-semibold text-black mb-4">Your Quiet Hours Blocks</h2>
            
            <div className="flex justify-end mb-4">
              <Link 
                href="/create-block" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create New Block
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-12">Loading your blocks...</div>
            ) : blocks.length > 0 ? (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                  {blocks.map((block: any) => (
                    <li key={block.id || block._id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{block.title || 'Untitled Block'}</h3>
                          <p className="text-gray-600">
                            {new Date(block.start_time).toLocaleString()} - {new Date(block.end_time).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {block.notified && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                              Notification Sent
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">You don't have any quiet hours blocks yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}