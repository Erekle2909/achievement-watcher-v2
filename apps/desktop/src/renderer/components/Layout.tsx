import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { Page } from "../App";

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
