import type { Props } from "astro";
import IconMail from "./assets/icons/IconMail.svg";
import IconGitHub from "./assets/icons/IconGitHub.svg";
import IconBrandX from "./assets/icons/IconBrandX.svg";
import IconLinkedin from "./assets/icons/IconLinkedin.svg";

export const SITE = {
  website: "https://myblog.com/",
  author: "My Name",
  profile: "https://github.com/username",
  desc: "A minimalist tech blog built with Astro.",
  title: "AIKO Nexus' Thinking",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000,
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: false,
    text: "Suggest Changes",
    url: "",
  },
  dynamicOgImage: true,
  dir: "ltr",
  lang: "zh-CN",
  timezone: "Asia/Shanghai",
} as const;

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

export const SOCIALS: Social[] = [
  {
    name: "GitHub",
    href: "https://github.com/username",
    linkTitle: `${SITE.title} on GitHub`,
    icon: IconGitHub,
  },
  {
    name: "Mail",
    href: "mailto:yourmail@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    icon: IconMail,
  },
] as const;

export const SHARE_LINKS: Social[] = [
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: IconMail,
  },
] as const;
