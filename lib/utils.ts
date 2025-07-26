import { cva } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);



// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


export const siteConfig = {
  name: 'Exo',
  slogan: 'Deepen Your Relationships Through Meaningful Conversations',
  hero: 'Deepen Your Relationships Through Meaningful Conversations',
  description:
    'In a world of surface-level interactions, Exo gives you the tools to strengthen your relationships and connect on a deeper level',
  url: '',
  ogImage: '',
  links: {
    twitter: 'https://x.com/rami__maalouf',
    github: 'https://github.com/psycho-baller/exo',
    waitlist: 'https://survey.typeform.com/to/erptGdCr',
    discord: 'https://discord.gg/m9mWXcrstw',
    kofi: 'https://ko-fi.com/ramimaalouf',
    linkedin: 'https://www.linkedin.com/in/rami-m',
    youtube: 'https://youtube.com/@ramimaalouf',
    instagram: 'https://www.instagram.com/psycho.baller/',
    portfolio: 'https://rami-maalouf.tech',
    iOS: 'https://apps.apple.com/app/exo-have-better-conversations/id6740080383',
    android: 'https://play.google.com/store/apps/details?id=com.ramimaalouf.rooots',
  },
} as const


export const headerRoutes = [
  {
    id: 1,
    title: 'About',
    newTab: false,
    path: '/',
  },
  {
    id: 2,
    title: 'Mission',
    newTab: false,
    path: '#mission',
  },
  {
    id: 3,
    title: 'How i work',
    newTab: false,
    path: '#how-i-work',
  },
  {
    id: 4,
    title: 'Discord',
    newTab: true,
    path: siteConfig.links.discord,
  },
  // {
  //   id: 5,
  //   title: 'Support Us',
  //   newTab: true,
  //   path: siteConfig.links.kofi,
  // },
] as const