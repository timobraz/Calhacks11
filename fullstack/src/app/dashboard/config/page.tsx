'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconPlus, IconBrandSpotify, IconBrandInstagram, IconBrandTwitter } from '@tabler/icons-react';
import DrawerDemo from '@/components/drawer';

type Service = {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
};

const initialServices: Service[] = [
  { name: 'Spotify', icon: <IconBrandSpotify className="w-6 h-6" />, connected: true },
  { name: 'Instagram', icon: <IconBrandInstagram className="w-6 h-6" />, connected: true },
  { name: 'Twitter', icon: <IconBrandTwitter className="w-6 h-6" />, connected: true },
];

function ConfigPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [newServiceName, setNewServiceName] = useState('');

  const handleConnect = (index: number) => {
    const updatedServices = [...services];
    updatedServices[index].connected = !updatedServices[index].connected;
    setServices(updatedServices);
  };

  const handleAddService = () => {
    if (newServiceName.trim()) {
      setServices([
        ...services,
        { name: newServiceName.trim(), icon: <IconPlus className="w-6 h-6" />, connected: false },
      ]);
      setNewServiceName('');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-16  text-white">
      <div className="w-full max-w-4xl p-8 ">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Service Configuration</h1>

        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 backdrop-blur-sm bg-white/10 rounded-md border border-white/20 shadow-lg"
            >
              <div className="flex items-center space-x-4">
                {service.icon}
                <span className="text-lg">{service.name}</span>
              </div>
              <DrawerDemo serviceName={service.name} />
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">Add New Service</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="Enter service name"
              className="flex-grow py-2 px-4 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-teal-500 backdrop-blur-sm bg-teal-500/10 rounded-md border border-white/20 shadow-lg"
            />
            <button
              onClick={handleAddService}
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
            >
              Add Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPage;
