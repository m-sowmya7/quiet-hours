import { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';

export default function RunMigrations() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  const runMigrations = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/run-migrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_MIGRATION_API_KEY || 'test-key'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ error: data.error || 'Failed to run migrations' });
      } else {
        setResult({ success: true, message: data.message || 'Migrations completed successfully' });
      }
    } catch (error: any) {
      setResult({ error: error.message || 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  // Only allow admin users to run migrations
  if (!user || user.email !== 'admin@example.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-xl font-semibold text-red-600">Access Denied</h1>
          <p className="mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Run Migrations - Quiet Hours</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Database Migrations</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will run the initial database setup migrations to create all necessary tables in your Supabase database.
            </p>
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
              <p className="text-yellow-700 font-medium">⚠️ Warning</p>
              <p className="text-yellow-600 text-sm mt-1">
                Running migrations may modify your database schema. Make sure you have a backup if needed.
              </p>
            </div>
          </div>
          
          <button
            onClick={runMigrations}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
          >
            {isLoading ? 'Running Migrations...' : 'Run Migrations'}
          </button>
          
          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div className="text-green-700">
                  <p className="font-medium">✓ Success!</p>
                  <p className="mt-1 text-sm">{result.message}</p>
                </div>
              ) : (
                <div className="text-red-700">
                  <p className="font-medium">✗ Error</p>
                  <p className="mt-1 text-sm">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}