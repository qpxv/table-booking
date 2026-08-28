"use client";

import type { JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavGroup } from "./nav-types";

export default function NavGroupMenu({ group }: { group: NavGroup }): JSX.Element {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="gap-1 text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground aria-expanded:bg-header-foreground/10 aria-expanded:text-header-foreground"
          />
        }
      >
        {group.label}
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {group.items.map((item) => (
          <DropdownMenuItem
            key={item.href}
            data-active={pathname === item.href || undefined}
            className="data-active:bg-accent data-active:text-accent-foreground"
            render={<Link href={item.href}>{item.label}</Link>}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
