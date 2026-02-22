/**
 * PhoneFrame - Simple phone mockup frame
 * Replacement for Iphone15Pro primitive
 */

import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="relative mx-auto w-[375px] h-[812px] bg-black rounded-[3rem] p-3 shadow-2xl">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10" />
      
      {/* Screen */}
      <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
        {children}
      </div>
    </div>
  );
};

