import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react'; // Import Eye icons
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface DrawerDemoProps {
  serviceName: string;
}

export default function DrawerDemo({ serviceName }: DrawerDemoProps) {
  const [username, setUsername] = React.useState('');
  const [passkey, setPasskey] = React.useState('');
  const [showPasskey, setShowPasskey] = React.useState(false);

  const togglePasskeyVisibility = () => {
    setShowPasskey(!showPasskey);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="backdrop-blur-sm bg-teal-500/10 rounded-md border border-white/20 shadow-lg"
        >
          Configure
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm h-[360px] pt-[40px]">
          <DrawerHeader className="w-full p-0">
            <DrawerTitle className="text-white ">{serviceName}</DrawerTitle>
            <DrawerDescription className="w-full">Set your configurations</DrawerDescription>
          </DrawerHeader>

          <div className="mt-3 h-[120px] flex flex-col gap-5 justify-center w-full max-w-sm">
            <div className="w-full grid gap-5 items-center grid-cols-4 ">
              <div className="text-white text-center text-align col-span-1 ">Username</div>
              <Input
                className="col-span-3 backdrop-blur-sm bg-slate-400/10 rounded-md border border-white/20 shadow-lg text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="w-full grid gap-5 items-center grid-cols-4">
              <div className="text-white text-align col-span-1 text-left">Credentials</div>
              <div className="col-span-3 relative">
                <Input
                  className="w-full backdrop-blur-sm bg-slate-400/10 rounded-md border border-white/20 shadow-lg text-white pr-10"
                  type={showPasskey ? 'text' : 'password'}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasskeyVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showPasskey ? <EyeOff className="h-5 w-5 text-white" /> : <Eye className="h-5 w-5 text-white" />}
                </button>
              </div>
            </div>
          </div>

          <DrawerFooter className="w-full p-0">
            <Button className="backdrop-blur-sm w-full bg-slate-400/10 rounded-md border border-white/20 shadow-lg hover:bg-green-500/10">
              Submit
            </Button>
            <DrawerClose asChild className="w-full">
              <Button className="backdrop-blur-sm w-full bg-slate-400/10 rounded-md border border-white/20 shadow-lg text-white hover:bg-red-400/10">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
