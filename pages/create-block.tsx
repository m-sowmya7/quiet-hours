import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CreateBlock() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Combine date and time into a single datetime
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60 * 1000);

      console.log('CreateBlock - Inserting block for user:', user.id);

      // Get the user's access token from Supabase Auth
      let accessToken = null;
      if (supabase && supabase.auth) {
        const session = await supabase.auth.getSession();
        accessToken = session?.data?.session?.access_token;
      }

      if (!accessToken) {
        throw new Error('User is not authenticated or token missing');
      }

      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          title: title.trim() || 'Quiet Time',
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          notified: false,
          created_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('CreateBlock - Error inserting block:', errData);
        throw new Error(errData.message || 'Failed to create block');
      }

      const data = await response.json();
      console.log('CreateBlock - Block created successfully:', data);
      // Redirect to dashboard after successful creation
      router.push('/dashboard');
    } catch (err: any) {
      console.error('CreateBlock - Error details:', err);
      setError(`Failed to create block: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Set default values for date and time
  useState(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = '09:00';
    
    setStartDate(dateStr);
    setStartTime(timeStr);
  });

  return (
    <ProtectedRoute>
      <Head>
        <title>Create Block - Quiet Hours</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-black py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Create Quiet Hours Block</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Study Session, Deep Work, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
              >
                {loading ? 'Creating...' : 'Create Block'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
            )}
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}