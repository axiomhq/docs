export type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

export const redirects: LegacyRedirect[];
