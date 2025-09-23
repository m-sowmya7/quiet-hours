import Register from '../../components/Auth/Register';
import Head from 'next/head';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <>
      <Head>
        <title>Register - Quiet Hours</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Quiet Hours</h1>
          <p className="text-black">Create your account to get started</p>
        </div>
        <Register />
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}