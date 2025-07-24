import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
    title: 'Home',
    newTab: false,
    path: '/',
  },
  {
    id: 2,
    title: 'Features',
    newTab: false,
    path: '/#features',
  },
  {
    id: 3,
    title: 'Contact',
    newTab: false,
    path: '/contact',
  },
  {
    id: 4,
    title: 'GitHub',
    newTab: true,
    path: siteConfig.links.github,
  },
  {
    id: 5,
    title: 'Support Us',
    newTab: true,
    path: siteConfig.links.kofi,
  },
] as const