import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  icon: ReactNode;
};

export default function PagePlaceholder({
  title,
  description,
  icon,
}: Props) {
  return (
    <div className="p-5 md:p-8">
      <div className="rounded-xl border border-cyan-500/15 bg-[#071020] p-6 md:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-white">{title}</h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          {description}
        </p>

        <div className="mt-6 inline-flex rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-500">
          Module initialized · Implementation pending
        </div>
      </div>
    </div>
  );
}