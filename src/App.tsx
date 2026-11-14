import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
} from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AgentPipelineWireframe } from './components/agents/AgentPipelineWireframe';
import { AuthMode, AuthPage, AuthUser } from './components/auth/AuthPage';
import { DashboardWireframe } from './components/dashboard/DashboardWireframe';
import { LandingShowcase } from './components/hero/LandingShowcase';
import { OpeningHero } from './components/hero/OpeningHero';
import { IngestionWireframe } from './components/ingestion/IngestionWireframe';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SeoExportWireframe } from './components/seo/SeoExportWireframe';
import { ThumbnailArenaWireframe } from './components/thumbnails/ThumbnailArenaWireframe';
import { WorkbenchWireframe } from './components/workbench/WorkbenchWireframe';
import {
  CONTENT_PRESETS,
  RECENT_PROJECTS_SEED,
  SAMPLE_DEMO_PROJECT,
} from './data/mockProjectData';
import { auth } from './firebase';
import { kodaApi } from './services/api';
import {
  saveUserProject,
  seedStarterProjectsIfEmpty,
  subscribeUserProjects,
  syncUserProfile,
} from './services/firestoreService';
import {
  ContentPreset,
  KodaProject,
  OutputTarget,
  StudioSection,
} from './types/koda';

type AppWindow = 'landing' | 'auth' | 'studio';

function resolveWindowFromHash(hash: string): AppWindow {
  if (hash === '#/studio') return 'studio';
  if (hash === '#/auth' || hash === '#/login' || hash === '#/signup') return 'auth';
  return 'landing';
}

const SECTION_ORDER: StudioSection[] = [
  'dashboard',
  'ingestion',
  'agents',
  'workbench',
  'thumbnails',
  'seo',
];

const MORPH_EASE: [number, number, number, number] = [0.25, 0.08, 0.16, 1];

interface LandingMorphLayerProps {
  exitScrollY: number;
  reducedMotion: boolean;
  children: React.ReactNode;
}

const LandingMorphLayer: React.FC<LandingMorphLayerProps> = ({
  exitScrollY,
  reducedMotion,
  children,
}) => {
  const isPresent = useIsPresent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 0.91,
              filter: 'blur(10px)',
            }
      }
      transition={{ duration: reducedMotion ? 0.2 : 0.78, ease: MORPH_EASE }}
      className={
        isPresent
          ? 'relative z-20 min-h-screen bg-[#D4DAB4] text-[#192418]'
          : 'fixed inset-0 z-10 overflow-hidden pointer-events-none bg-[#D4DAB4] text-[#192418] will-change-transform'
      }
    >
      <div
        style={
          !isPresent && exitScrollY > 0
            ? { transform: `translateY(-${exitScrollY}px)` }
            : undefined
        }
      >
        {children}
      </div>
    </motion.div>
  );
};

interface StudioMorphLayerProps {
  reducedMotion: boolean;
  children: React.ReactNode;
}

const StudioMorphLayer: React.FC<StudioMorphLayerProps> = ({
  reducedMotion,
  children,
}) => {
  const isPresent = useIsPresent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 0.91,
              filter: 'blur(10px)',
            }
      }
      transition={{ duration: reducedMotion ? 0.2 : 0.78, ease: MORPH_EASE }}
      className={`${
        isPresent ? 'relative z-20' : 'fixed inset-0 z-10 pointer-events-none'
      } h-screen h-[100dvh] overflow-hidden bg-[#D4DAB4] text-[#192418] flex will-change-transform`}
    >
      {children}
    </motion.div>
  );
};

interface AuthMorphLayerProps {
  reducedMotion: boolean;
  children: React.ReactNode;
}

const AuthMorphLayer: React.FC<AuthMorphLayerProps> = ({
  reducedMotion,
  children,
}) => {
  const isPresent = useIsPresent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 0.91,
              filter: 'blur(10px)',
            }
      }
      transition={{ duration: reducedMotion ? 0.2 : 0.78, ease: MORPH_EASE }}
      className={`${
        isPresent
          ? 'relative z-20'
          : 'fixed inset-0 z-10 pointer-events-none'
      } h-screen h-[100dvh] overflow-hidden bg-[#121B11] text-[#D4DAB4] will-change-transform`}
    >
      {children}
    </motion.div>
  );
};

interface SectionMorphLayerProps {
  direction: number;
  reducedMotion: boolean;
  onScrollProgress: (progress: number) => void;
  children: React.ReactNode;
}

const SectionMorphLayer: React.FC<SectionMorphLayerProps> = ({
  direction,
  reducedMotion,
  onScrollProgress,
  children,
}) => {
  const isPresent = useIsPresent();

  return (
    <motion.div
      custom={direction}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 0.92,
              y: direction * -10,
              filter: 'blur(7px)',
            }
      }
      transition={{ duration: reducedMotion ? 0.18 : 0.62, ease: MORPH_EASE }}
      onScroll={(e) => {
        if (!isPresent) return;
        const el = e.currentTarget;
        const max = el.scrollHeight - el.clientHeight;
        onScrollProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
      }}
      className={`absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain will-change-transform ${
        isPresent ? 'z-10' : 'z-0 pointer-events-none'
      }`}
    >
      {children}
    </motion.div>
  );
};

export default function App() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const authUserRef = useRef<AuthUser | null>(authUser);
  authUserRef.current = authUser;

  const [activeWindow, setActiveWindow] = useState<AppWindow>(() => {
    const resolved = resolveWindowFromHash(window.location.hash);
    return resolved === 'studio' ? 'auth' : resolved;
  });
  const [authMode, setAuthMode] = useState<AuthMode>(() =>
    window.location.hash === '#/signup' ? 'signup' : 'signin'
  );
  const pendingSectionRef = useRef<StudioSection | null>(
    window.location.hash === '#/studio' ? 'dashboard' : null
  );
  const [landingExitScrollY, setLandingExitScrollY] = useState<number>(0);
  const [projects, setProjects] = useState<KodaProject[]>(RECENT_PROJECTS_SEED);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    SAMPLE_DEMO_PROJECT.id
  );
  const [activeSection, setActiveSection] = useState<StudioSection>('dashboard');
  const [sectionDirection, setSectionDirection] = useState<number>(1);
  const prevSectionRef = useRef<StudioSection>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendMode, setBackendMode] = useState<string>('local_scaffolding');

  // New project / ingestion draft state
  const [draftTitle, setDraftTitle] = useState<string>(
    'Champions Ascent Map 3 — Raw Stream VOD'
  );
  const [draftPreset, setDraftPreset] = useState<ContentPreset>('gaming');
  const [draftOutputs, setDraftOutputs] = useState<OutputTarget[]>(
    CONTENT_PRESETS.gaming.recommendedOutputs
  );
  const [draftFile, setDraftFile] = useState<{ name: string; size: number } | null>(
    null
  );
  const [selectedReelId, setSelectedReelId] = useState<string>(
    SAMPLE_DEMO_PROJECT.reels[0].id
  );
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    kodaApi.checkHealth().then((health) => {
      setBackendMode(health.mode);
    });
  }, []);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const provider = firebaseUser.providerData.some(
          (p) => p.providerId === 'google.com'
        )
          ? 'google'
          : 'password';
        const mappedUser: AuthUser = {
          uid: firebaseUser.uid,
          name:
            firebaseUser.displayName?.trim() ||
            firebaseUser.email?.split('@')[0] ||
            'Creator',
          email: firebaseUser.email || `${firebaseUser.uid}@koda.studio`,
          provider,
        };
        authUserRef.current = mappedUser;
        setAuthUser(mappedUser);
        setAuthReady(true);

        if (window.location.hash === '#/studio') {
          setActiveWindow('studio');
        }
      } else {
        authUserRef.current = null;
        setAuthUser(null);
        setAuthReady(true);
        setProjects(RECENT_PROJECTS_SEED);
        if (window.location.hash === '#/studio') {
          window.history.replaceState(null, '', '#/auth');
          setActiveWindow('auth');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync user profile, seed starter projects if needed, and listen to Firestore projects
  useEffect(() => {
    if (!authReady || !authUser || activeWindow === 'auth') return;

    let cancelled = false;
    let unsubscribeProjects: (() => void) | undefined;

    const initUserWorkspace = async () => {
      try {
        await syncUserProfile({
          uid: authUser.uid,
          displayName: authUser.name,
          email: authUser.email,
          authProvider: authUser.provider,
        });
        await seedStarterProjectsIfEmpty(authUser.uid, RECENT_PROJECTS_SEED);
      } catch (err) {
        console.error('Failed to sync creator workspace:', err);
      }

      if (cancelled) return;
      unsubscribeProjects = subscribeUserProjects(
        authUser.uid,
        (items) => {
          if (items.length === 0) return;
          setProjects(items.map((item) => item.project));
          setActiveProjectId((prevId) =>
            items.some((item) => item.project.id === prevId)
              ? prevId
              : items[0].project.id
          );
        },
        (err) => {
          console.error('Firestore project subscription error:', err);
        }
      );
    };

    void initUserWorkspace();

    return () => {
      cancelled = true;
      if (unsubscribeProjects) unsubscribeProjects();
    };
  }, [authReady, authUser?.uid, activeWindow]);

  useEffect(() => {
    const onHashChange = () => {
      let nextWindow = resolveWindowFromHash(window.location.hash);
      if (nextWindow === 'studio' && !authUserRef.current) {
        pendingSectionRef.current = 'dashboard';
        nextWindow = 'auth';
        window.history.replaceState(null, '', '#/auth');
      }
      if (nextWindow !== 'landing') {
        setLandingExitScrollY(window.scrollY || 0);
      }
      if (window.location.hash === '#/signup') {
        setAuthMode('signup');
      } else if (window.location.hash === '#/login') {
        setAuthMode('signin');
      }
      setActiveWindow(nextWindow);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateSection = (nextSection: StudioSection) => {
    const prevIdx = SECTION_ORDER.indexOf(prevSectionRef.current);
    const nextIdx = SECTION_ORDER.indexOf(nextSection);
    setSectionDirection(nextIdx >= prevIdx ? 1 : -1);
    prevSectionRef.current = nextSection;
    setActiveSection(nextSection);
    setScrollProgress(0);
  };

  const enterStudioDirectly = (section?: StudioSection) => {
    setLandingExitScrollY(window.scrollY || 0);
    if (section) {
      navigateSection(section);
    } else {
      setScrollProgress(0);
    }
    setActiveWindow('studio');
    if (window.location.hash !== '#/studio') {
      window.history.pushState(null, '', '#/studio');
    }
    window.scrollTo({ top: 0 });
  };

  const openAuthWindow = (mode: AuthMode = 'signin') => {
    if (activeWindow === 'landing') {
      setLandingExitScrollY(window.scrollY || 0);
    }
    setMobileOpen(false);
    setAuthMode(mode);
    setActiveWindow('auth');
    if (window.location.hash !== '#/auth') {
      window.history.pushState(null, '', '#/auth');
    }
    window.scrollTo({ top: 0 });
  };

  const openStudioWindow = (section?: StudioSection) => {
    if (!authUserRef.current) {
      pendingSectionRef.current = section ?? 'dashboard';
      openAuthWindow('signin');
      return;
    }
    enterStudioDirectly(section);
  };

  const returnToLandingWindow = () => {
    pendingSectionRef.current = null;
    setActiveWindow('landing');
    setMobileOpen(false);
    if (window.location.hash !== '' && window.location.hash !== '#/') {
      window.history.pushState(null, '', '#/');
    }
    window.scrollTo({ top: 0 });
  };

  const handleAuthSuccess = (user: AuthUser) => {
    authUserRef.current = user;
    setAuthUser(user);
    const targetSection = pendingSectionRef.current ?? 'dashboard';
    pendingSectionRef.current = null;
    enterStudioDirectly(targetSection);
  };

  const handleSignOut = () => {
    authUserRef.current = null;
    pendingSectionRef.current = null;
    setAuthUser(null);
    void signOut(auth).catch((err) => {
      console.error('Sign out error:', err);
    });
    if (activeWindow === 'studio') {
      returnToLandingWindow();
    }
  };

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  const persistProjectUpdate = (projectToSave: KodaProject, reelId = selectedReelId) => {
    const user = authUserRef.current;
    if (!user) return;
    void saveUserProject(user.uid, projectToSave, reelId).catch((err) => {
      console.error('Failed to persist project update:', err);
    });
  };

  const updateActiveProject = (updater: (project: KodaProject) => KodaProject) => {
    if (!activeProject) return;
    const updatedProject = updater(activeProject);
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    persistProjectUpdate(updatedProject);
  };

  const handleLoadDemo = () => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === SAMPLE_DEMO_PROJECT.id);
      return exists ? prev : [SAMPLE_DEMO_PROJECT, ...prev];
    });
    setActiveProjectId(SAMPLE_DEMO_PROJECT.id);
    setSelectedReelId(SAMPLE_DEMO_PROJECT.reels[0].id);
    if (authUserRef.current) {
      persistProjectUpdate(SAMPLE_DEMO_PROJECT, SAMPLE_DEMO_PROJECT.reels[0].id);
    }
    openStudioWindow('agents');
  };

  const handleChangePreset = (preset: ContentPreset) => {
    setDraftPreset(preset);
    setDraftOutputs(CONTENT_PRESETS[preset].recommendedOutputs);
  };

  const handleToggleOutput = (output: OutputTarget) => {
    setDraftOutputs((prev) =>
      prev.includes(output) ? prev.filter((o) => o !== output) : [...prev, output]
    );
  };

  const handleHandOff = () => {
    const presetMeta = CONTENT_PRESETS[draftPreset];
    const newId = `proj_${Date.now()}`;
    const newProject: KodaProject = {
      ...SAMPLE_DEMO_PROJECT,
      id: newId,
      title: draftTitle.trim() || 'Untitled Studio Project',
      createdAt: 'Just now',
      status: 'processing',
      media: {
        ...SAMPLE_DEMO_PROJECT.media,
        filename: draftFile?.name || SAMPLE_DEMO_PROJECT.media.filename,
        fileSizeBytes: draftFile?.size || SAMPLE_DEMO_PROJECT.media.fileSizeBytes,
      },
      config: {
        preset: draftPreset,
        outputs: draftOutputs,
        silenceThresholdDb: presetMeta.silenceThresholdDb,
        minSilenceDurationMs: presetMeta.minSilenceDurationMs,
        targetReelCount: 3,
        autoSelectWinner: true,
      },
      agents: SAMPLE_DEMO_PROJECT.agents.map((agent, index) => ({
        ...agent,
        status: index === 0 ? 'running' : 'queued',
        progress: index === 0 ? 45 : 0,
      })),
    };

    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newId);
    setSelectedReelId(newProject.reels[0].id);
    persistProjectUpdate(newProject, newProject.reels[0].id);
    navigateSection('agents');
  };

  const handleAdvanceStep = () => {
    updateActiveProject((project) => {
      const agents = [...project.agents];
      const runningIdx = agents.findIndex((a) => a.status === 'running');

      if (runningIdx !== -1) {
        agents[runningIdx] = {
          ...agents[runningIdx],
          status: 'completed',
          progress: 100,
        };
        if (runningIdx + 1 < agents.length) {
          agents[runningIdx + 1] = {
            ...agents[runningIdx + 1],
            status: 'running',
            progress: 50,
          };
        }
      } else {
        const nextQueuedIdx = agents.findIndex(
          (a) => a.status === 'queued' || a.status === 'idle'
        );
        if (nextQueuedIdx !== -1) {
          agents[nextQueuedIdx] = {
            ...agents[nextQueuedIdx],
            status: 'completed',
            progress: 100,
          };
          if (nextQueuedIdx + 1 < agents.length) {
            agents[nextQueuedIdx + 1] = {
              ...agents[nextQueuedIdx + 1],
              status: 'running',
              progress: 50,
            };
          }
        }
      }

      const allDone = agents.every((a) => a.status === 'completed');
      return {
        ...project,
        status: allDone ? 'ready' : 'processing',
        agents,
      };
    });
  };

  const handleResetPipeline = () => {
    updateActiveProject((project) => ({
      ...project,
      status: 'processing',
      agents: project.agents.map((agent, index) => ({
        ...agent,
        status: index === 0 ? 'running' : 'queued',
        progress: index === 0 ? 25 : 0,
      })),
    }));
  };

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="relative min-h-screen bg-[#D4DAB4] text-[#192418]">
          <AnimatePresence mode="sync" initial={false}>
            {activeWindow === 'landing' && (
              <LandingMorphLayer
                key="landing-window"
                exitScrollY={landingExitScrollY}
                reducedMotion={prefersReducedMotion}
              >
                <OpeningHero
                  onEnterStudio={openStudioWindow}
                  onLoadDemo={handleLoadDemo}
                  onOpenAuth={openAuthWindow}
                  authUser={authUser}
                  onSignOut={handleSignOut}
                />
                <LandingShowcase
                  onEnterStudio={openStudioWindow}
                  onLoadDemo={handleLoadDemo}
                  onOpenAuth={openAuthWindow}
                  authUser={authUser}
                />
              </LandingMorphLayer>
            )}

            {activeWindow === 'auth' && (
              <AuthMorphLayer
                key="auth-window"
                reducedMotion={prefersReducedMotion}
              >
                <AuthPage
                  initialMode={authMode}
                  onSuccess={handleAuthSuccess}
                  onBackToHome={returnToLandingWindow}
                />
              </AuthMorphLayer>
            )}

            {activeWindow === 'studio' && (
              <StudioMorphLayer
                key="studio-window"
                reducedMotion={prefersReducedMotion}
              >
                <Sidebar
                  activeSection={activeSection}
                  onSelectSection={navigateSection}
                  onReturnToHero={returnToLandingWindow}
                  activeProject={activeProject}
                  mobileOpen={mobileOpen}
                  onCloseMobile={() => setMobileOpen(false)}
                  authUser={authUser}
                  onOpenAuth={openAuthWindow}
                  onSignOut={handleSignOut}
                />

                <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                  <TopBar
                    activeSection={activeSection}
                    projectTitle={activeProject?.title}
                    scrollProgress={scrollProgress}
                    onOpenMobileMenu={() => setMobileOpen(true)}
                    onLoadDemo={handleLoadDemo}
                    onStartNewProject={() => navigateSection('ingestion')}
                  />

                  <div className="relative flex-1 min-h-0 overflow-hidden">
                    <AnimatePresence mode="sync" custom={sectionDirection} initial={false}>
                      <SectionMorphLayer
                        key={activeSection}
                        direction={sectionDirection}
                        reducedMotion={prefersReducedMotion}
                        onScrollProgress={setScrollProgress}
                      >
                        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
                          {activeSection === 'dashboard' && (
                            <DashboardWireframe
                              projects={projects}
                              activeProjectId={activeProject?.id ?? null}
                              backendMode={backendMode}
                              onSelectProject={(projectId, nextSection = 'workbench') => {
                                setActiveProjectId(projectId);
                                navigateSection(nextSection);
                              }}
                              onLoadDemo={handleLoadDemo}
                              onNavigate={navigateSection}
                            />
                          )}

                          {activeSection === 'ingestion' && (
                            <IngestionWireframe
                              selectedPreset={draftPreset}
                              selectedOutputs={draftOutputs}
                              projectTitle={draftTitle}
                              onChangeTitle={setDraftTitle}
                              onChangePreset={handleChangePreset}
                              onToggleOutput={handleToggleOutput}
                              onFileSelected={setDraftFile}
                              selectedFile={draftFile}
                              onHandOff={handleHandOff}
                              onLoadDemo={handleLoadDemo}
                            />
                          )}

                          {activeSection === 'agents' && activeProject && (
                            <AgentPipelineWireframe
                              project={activeProject}
                              onAdvanceStep={handleAdvanceStep}
                              onResetPipeline={handleResetPipeline}
                              onNavigate={navigateSection}
                            />
                          )}

                          {activeSection === 'workbench' && activeProject && (
                            <WorkbenchWireframe
                              project={activeProject}
                              selectedReelId={selectedReelId}
                              onSelectReel={setSelectedReelId}
                              onToggleReelCaption={(reelId) =>
                                updateActiveProject((project) => ({
                                  ...project,
                                  reels: project.reels.map((reel) =>
                                    reel.id === reelId
                                      ? { ...reel, captionsEnabled: !reel.captionsEnabled }
                                      : reel
                                  ),
                                }))
                              }
                            />
                          )}

                          {activeSection === 'thumbnails' && activeProject && (
                            <ThumbnailArenaWireframe
                              project={activeProject}
                              onSelectThumbnail={(thumbnailId) =>
                                updateActiveProject((project) => ({
                                  ...project,
                                  selectedThumbnailId: thumbnailId,
                                }))
                              }
                            />
                          )}

                          {activeSection === 'seo' && activeProject && (
                            <SeoExportWireframe
                              project={activeProject}
                              onUpdateYoutubeTitle={(value) =>
                                updateActiveProject((project) => ({
                                  ...project,
                                  seo: {
                                    ...project.seo,
                                    youtube: { ...project.seo.youtube, title: value },
                                  },
                                }))
                              }
                              onUpdateYoutubeDescription={(value) =>
                                updateActiveProject((project) => ({
                                  ...project,
                                  seo: {
                                    ...project.seo,
                                    youtube: { ...project.seo.youtube, description: value },
                                  },
                                }))
                              }
                              onUpdateInstagramCaption={(value) =>
                                updateActiveProject((project) => ({
                                  ...project,
                                  seo: {
                                    ...project.seo,
                                    instagram: { ...project.seo.instagram, caption: value },
                                  },
                                }))
                              }
                              onUpdateTiktokHook={(value) =>
                                updateActiveProject((project) => ({
                                  ...project,
                                  seo: {
                                    ...project.seo,
                                    tiktok: { ...project.seo.tiktok, hookCaption: value },
                                  },
                                }))
                              }
                            />
                          )}
                        </main>
                      </SectionMorphLayer>
                    </AnimatePresence>
                  </div>
                </div>
              </StudioMorphLayer>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
