'use client';

import React from 'react';

interface Props {
  error: string | null;
  onClose: () => void;
}

const GoogleLoginFallbackModal = ({ error, onClose }: Props) => {
  return (
    // Backdrop
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
      {/* Modal Panel */}
      <div className="bg-gray-800 text-white w-full max-w-sm p-6 rounded-lg shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">
          {error ? 'Authentication Failed' : 'Signing in with Google'}
        </h2>
        
        {error ? (
          <>
            <p className="text-sm text-red-300 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-300 mb-6">
              Please wait while we securely finalize your session...
            </p>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleLoginFallbackModal;