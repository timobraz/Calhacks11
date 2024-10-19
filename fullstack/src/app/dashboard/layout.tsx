'use client';
import React, { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '../../components/ui/sidebar';
import { IconArrowLeft, IconSettings, IconChartBar, IconHistory, IconSparkles } from '@tabler/icons-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import jason from '../../public/jason.jpeg';

function Layout({ children }: { children: React.ReactNode }) {
  const links = [
    {
      label: 'Action',
      href: '/dashboard/action',
      icon: <IconSparkles className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Previous Actions',
      href: '/dashboard/history',
      icon: <IconHistory className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: <IconChartBar className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Configurations',
      href: '/dashboard/config',
      icon: <IconSettings className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
    {
      label: 'Logout',
      href: '#',
      icon: <IconArrowLeft className="text-neutral-200 h-5 w-5 flex-shrink-0" />,
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row bg-neutral-800 w-screen flex-1 mx-auto overflow-hidden',
        'h-screen', // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: 'jarfish',
                href: '#',
                icon: (
                  <Image
                    src={jason}
                    className="h-7 w-7 flex-shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="p-2 md:p-10 rounded-tl-2xl border-t border-l border-r border-neutral-700 bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
export const Logo = () => {
  return (
    <Link href="/start" className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20">
      <div className="h-5 w-6  bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium  text-white whitespace-pre">
        Spider
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link href="#" className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};

export default Layout;
