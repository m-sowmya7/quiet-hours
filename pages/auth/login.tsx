import Login from '../../components/Auth/Login';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Quiet Hours</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Quiet Hours</h1>
          <p className="text-gray-600">Login to your account</p>
        </div>
        <Login />
      </div>
    </>
  );
}