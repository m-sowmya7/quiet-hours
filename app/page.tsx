import Link from 'next/link';

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-6">Welcome to Quiet Hours</h1>
        <p className="text-xl text-gray-600 mb-8">
          Schedule your focus time and get notified when it's time to concentrate.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-medium">
            Login
          </Link>
          <Link href="/auth/register" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg text-lg font-medium">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
