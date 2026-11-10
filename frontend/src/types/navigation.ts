export type NavItem = {
  label: string;
  path: string;
  icon: string;
  permission?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};
