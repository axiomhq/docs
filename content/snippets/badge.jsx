export const Badge = ({ children }) => {
  return (
    <div className="inline-block px-1.5 py-0.5 mr-1 uppercase rounded-md text-[0.7rem] leading-tight font-semibold bg-amber-50 border border-amber-500/20 dark:border-amber-500/30 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200">
      {children}
    </div>
  );
};
