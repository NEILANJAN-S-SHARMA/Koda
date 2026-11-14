import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  Scissors,
  Eye,
  Share2,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { KodaProject, StudioSection } from '../../types/koda';
import { AuthMode, AuthUser } from '../auth/AuthPage';

interface SidebarProps {
  activeSection: StudioSection;
  onSelectSection: (section: StudioSection) => void;
  onReturnToHero: () => void;
  activeProject: KodaProject | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  authUser: AuthUser | null;
  onOpenAuth: (mode?: AuthMode) => void;
  onSignOut: () => void;
}

const NAV_ITEMS: {
  id: StudioSection;
  label: string;
  step: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Studio Dashboard', step: '01', icon: LayoutDashboard },
  { id: 'ingestion', label: 'New Project', step: '02', icon: UploadCloud },
  { id: 'agents', label: 'Agent Pipeline', step: '03', icon: Cpu },
  { id: 'workbench', label: 'Multi-Cut Workbench', step: '04', icon: Scissors },
  { id: 'thumbnails', label: 'Thumbnail A/B Arena', step: '05', icon: Eye },
  { id: 'seo', label: 'SEO & Export Studio', step: '06', icon: Share2 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onReturnToHero,
  activeProject,
  mobileOpen,
  onCloseMobile,
  authUser,
  onOpenAuth,
  onSignOut,
}) => {
  const renderRail = (scope: 'desktop' | 'mobile') => (
    <div className="flex flex-col h-full bg-[#2C3D2B] border-r border-[#789575]/50 w-60 shrink-0 text-[#D4DAB4]">
      <div className="h-14 px-5 border-b border-[#789575]/35 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => {
            onReturnToHero();
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-7 h-7 rounded-md bg-[#789575] border border-[#D4DAB4]/35 flex items-center justify-center shrink-0 group-hover:bg-[#89A686] transition-colors">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <rect
                x="3.5"
                y="4.5"
                width="17"
                height="15"
                rx="2"
                stroke="#192418"
                strokeWidth="1.9"
              />
              <path d="M10 9.25L15.25 12L10 14.75V9.25Z" fill="#D4DAB4" />
            </svg>
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-[#D4DAB4] font-display leading-none block">
              Koda
            </span>
            <p className="text-[11px] text-[#C5D1B8] mt-0.5 leading-none">
              Autonomous Co-Editor
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden min-w-[36px] min-h-[36px] flex items-center justify-center text-[#C5D1B8] hover:text-[#D4DAB4] rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Studio sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[13px] transition-colors text-left ${
                isActive
                  ? 'text-[#192418] font-semibold'
                  : 'text-[#C7CFA3] hover:text-[#D4DAB4] hover:bg-[#3A4F38]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={`sidebar-active-morph-${scope}`}
                  transition={{ type: 'spring', stiffness: 170, damping: 26, mass: 1.05 }}
                  className="absolute inset-0 rounded-md bg-[#D4DAB4] shadow-xs"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#3A4F38]' : 'text-[#9BB498]'
                  }`}
                />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              <span
                className={`relative z-10 font-mono text-[11px] tabular-nums shrink-0 ml-2 transition-colors ${
                  isActive ? 'text-[#3F523E]' : 'text-[#9BB498]'
                }`}
              >
                {item.step}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[#789575]/35 bg-[#243323] space-y-3">
        <div>
          <p className="text-[11px] text-[#9BB498]">Active Workspace</p>
          {activeProject ? (
            <div className="mt-1.5">
              <p className="text-xs font-medium text-[#D4DAB4] leading-snug line-clamp-2">
                {activeProject.title}
              </p>
              <p className="text-[11px] text-[#B8C6AA] mt-1 font-mono tabular-nums">
                {activeProject.config.preset} · {activeProject.status}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#C5D1B8] mt-1">No project loaded</p>
          )}
        </div>

        {authUser ? (
          <div className="pt-2.5 border-t border-[#789575]/25 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#D4DAB4] truncate">
                {authUser.name}
              </p>
              <p className="text-[11px] text-[#9BB498] truncate">{authUser.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onCloseMobile();
              }}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 text-[#C7CFA3] hover:text-[#D4DAB4] bg-[#2C3D2B] hover:bg-[#3B5239] border border-[#789575]/45 rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onOpenAuth('signin');
              onCloseMobile();
            }}
            className="w-full py-1.5 px-2.5 text-xs font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#C7CFA3] rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in / Create account
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onReturnToHero();
            onCloseMobile();
          }}
          className="w-full py-1.5 px-2.5 text-xs font-medium text-[#C7CFA3] hover:text-[#D4DAB4] bg-[#2C3D2B] hover:bg-[#3B5239] border border-[#789575]/45 rounded-md transition-colors text-center"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transitionEnd: { filter: 'none', transform: 'none' },
        }}
        transition={{ duration: 0.8, ease: [0.25, 0.08, 0.16, 1] }}
        className="hidden lg:block h-screen sticky top-0 shrink-0"
      >
        {renderRail('desktop')}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex h-[100dvh] overscroll-contain">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.48, ease: [0.32, 0.02, 0.18, 1] }}
              className="fixed inset-0 bg-[#192418]/55 backdrop-blur-[2px]"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0.8 }}
              transition={{ duration: 0.56, ease: [0.32, 0.02, 0.18, 1] }}
              className="relative z-10 h-full"
            >
              {renderRail('mobile')}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
