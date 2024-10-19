import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export default function DrawerDemo() {
  const [goal, setGoal] = React.useState(350);

  function onClick(adjustment: number) {
    setGoal(Math.max(200, Math.min(400, goal + adjustment)));
  }

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
        <div className="mx-auto w-full max-w-sm ">
          <DrawerHeader className="w-full p-0">
            <DrawerTitle className="text-white ">Move Goal</DrawerTitle>
            <DrawerDescription className="w-full">Set your account info</DrawerDescription>
          </DrawerHeader>

          <div className="mt-3 h-[120px] flex flex-col gap-5 justify-center w-full max-w-sm">
            <div className="w-full grid gap-5 items-center grid-cols-4 ">
              <div className="text-white text-center text-align col-span-1 ">Username</div>
              <Input className="col-span-3 backdrop-blur-sm bg-slate-400/10 rounded-md border border-white/20 shadow-lg text-white" />
            </div>
            <div className="w-full grid gap-5 items-center grid-cols-4">
              <div className="text-white  text-align col-span-1 text-left">Passkey</div>
              <Input className="col-span-3 backdrop-blur-sm bg-slate-400/10 rounded-md border border-white/20 shadow-lg text-white" />
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
