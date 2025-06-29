import React from "react";

const AnimatedBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 space-background"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AnimatedBackground;
