import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
            <AuthForm
              mode={mode}
              onToggle={() => setMode(mode === "login" ? "signup" : "login")}
            />
            <div className="mt-4">
                <Button onClick={handleGoogleSignIn} className="w-full">Sign in with Google</Button>
            </div>
        </div>
    </div>
  );
};

export default Auth;
