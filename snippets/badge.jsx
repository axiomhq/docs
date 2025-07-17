import React from "react";

export const Badge = ({ children }) => {
  return (
    <div className="inline-block px-1.5 py-0.5 mr-2 uppercase rounded-md text-[0.7rem] leading-tight font-semibold bg-yellow-200 text-gray-600 dark:bg-yellow-600 dark:text-gray-900">
      {children}
    </div>
  );
};
