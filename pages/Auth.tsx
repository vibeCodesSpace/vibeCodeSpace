import { Button } from "@/components/ui/button";
import EmailSubscribeForm from "@/components/EmailSubscribeForm";

const Auth = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        <Button
          onClick={() =>
            (window.location.href = "mailto:matty@vibecodes.space")
          }
          className="w-full mb-4"
        >
          Contact
        </Button>
        <div className="text-center text-gray-500 mb-4">OR</div>
        <EmailSubscribeForm />
      </div>
    </div>
  );
};

export default Auth;
