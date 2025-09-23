import { HomeIcon, WrenchScrewdriverIcon, InformationCircleIcon, NewspaperIcon, UserCircleIcon, UserPlusIcon, LockClosedIcon } from "@heroicons/react/24/solid";

export const navigation = [
  { name: "Home", href: "/", icon: <HomeIcon className='w-5 h-5' /> },
  { name: "Tools", href: "/tools", icon: <WrenchScrewdriverIcon className='w-5 h-5' /> },
  { name: "Blog", href: "/blog", icon: <NewspaperIcon className='w-5 h-5' /> },
  { name: "About", href: "/about", icon: <InformationCircleIcon className='w-5 h-5' /> },
  { name: "Profile", href: "/profile", icon: <UserCircleIcon className='w-5 h-5' /> },
  { name: "Register", href: "/register", icon: <UserPlusIcon className='w-5 h-5' /> },
  { name: "Login", href: "/login", icon: <LockClosedIcon className='w-5 h-5' /> },
];