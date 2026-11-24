import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-navy text-white">
            <GraduationCap className="size-4" />
          </span>
          <span className="text-sm font-semibold">Admissions Prep</span>
        </div>
        {children}
      </div>
    </div>
  );
}
