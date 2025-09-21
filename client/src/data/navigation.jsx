import { HomeIcon, WrenchScrewdriverIcon, InformationCircleIcon, NewspaperIcon } from "@heroicons/react/24/solid";

export const navigation = [
  { name: "Home", href: "/", icon: <HomeIcon className='w-5 h-5' /> },
  { name: "Tools", href: "/tools", icon: <WrenchScrewdriverIcon className='w-5 h-5' /> },
  { name: "Blog", href: "/blog", icon: <NewspaperIcon className='w-5 h-5' /> },
  { name: "About", href: "/about", icon: <InformationCircleIcon className='w-5 h-5' /> },
];

export default navigation;
