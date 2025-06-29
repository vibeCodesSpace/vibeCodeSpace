import { Button } from "@/components/ui/button";

const Auth = () => {
  const handleGitHubSignIn = () => {
    window.location.href = "/api/auth/github";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        <Button onClick={handleGitHubSignIn} className="w-full">
          Sign in with GitHub
        </Button>
      </div>
    </div>
  );
};

export default Auth;
