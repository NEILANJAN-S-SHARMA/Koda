import React from 'react';
import { Menu, Play, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StudioSection } from '../../types/koda';

interface TopBarProps {
  activeSection: StudioSection;
  projectTitle?: string;
  scrollProgress?: number;
  onOpenMobileMenu: () => void;
  onLoadDemo: () => void;
  onStartNewProject: () => void;
}

const SECTION_LABELS: Record<StudioSection, string> = {
  dashboard: 'Studio Dashboard',
  ingestion: 'New Project & Ingestion',
  agents: 'Agent Orchestration',
  workbench: 'Multi-Cut Workbench',
  thumbnails: 'Thumbnail A/B Arena',
  seo: 'SEO & Export Studio',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  projectTitle,
  scrollProgress = 0,
  onOpenMobileMenu,
  onLoadDemo,
  onStartNewProject,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, scale: 0.95, y: -6, filter: 'blur(4px)' }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transitionEnd: { filter: 'none', transform: 'none' },
      }}
      transition={{ duration: 0.75, delay: 0.05, ease: [0.25, 0.08, 0.16, 1] }}
      className="sticky top-0 h-14 border-b border-[#789575]/60 bg-[#C7CFA3]/95 backdrop-blur-md px-3.5 sm:px-4 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 shrink-0 z-30"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-[#2C3D2B] hover:text-[#192418] border border-[#789575] rounded-md shrink-0 bg-[#D4DAB4]"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] min-w-0">
          <span className="hidden sm:inline text-[#3F523E] font-medium whitespace-nowrap shrink-0">
            Studio
          </span>
          <span className="hidden sm:inline text-[#789575]" aria-hidden="true">
            /
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={activeSection}
              initial={{ opacity: 0, scale: 0.86, filter: 'blur(5px)' }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                transitionEnd: { filter: 'none', transform: 'none' },
              }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
              transition={{ duration: 0.58, ease: [0.25, 0.08, 0.16, 1] }}
              className="text-[#192418] font-semibold truncate inline-block"
            >
              {SECTION_LABELS[activeSection]}
            </motion.span>
          </AnimatePresence>
          {projectTitle && (
            <>
              <span className="hidden md:inline text-[#789575]" aria-hidden="true">
                /
              </span>
              <span className="hidden md:inline text-[#3F523E] truncate max-w-[280px]">
                {projectTitle}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onLoadDemo}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#BDC799] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Play className="w-3 h-3 text-[#3B5239]" />
          Load Sample Demo Data
        </button>

        <button
          type="button"
          onClick={onStartNewProject}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#2C3D2B] rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>

      {scrollProgress > 0 && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2.5px] bg-[#3B5239] transition-[width] duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      )}
    </motion.header>
  );
};
