import {
  Timestamp,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { KodaProject } from '../types/koda';

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const docLockQueues = new Map<string, Promise<unknown>>();

function withDocLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = docLockQueues.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  const cleanup = next.finally(() => {
    if (docLockQueues.get(key) === cleanup) {
      docLockQueues.delete(key);
    }
  });
  docLockQueues.set(key, cleanup);
  return next;
}

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned && ID_PATTERN.test(cleaned) ? cleaned : fallback;
}

function clampString(value: string, maxLength: number, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

export interface PersistedStudioProject {
  project: KodaProject;
  selectedReelId: string;
  updatedAtMs: number;
}

export async function syncUserProfile(params: {
  uid: string;
  displayName: string;
  email: string;
  authProvider: 'password' | 'google';
}): Promise<void> {
  const uid = sanitizeId(params.uid, 'user');
  const displayName = clampString(params.displayName, 100, 'Creator');
  const email = clampString(params.email, 180, `${uid}@koda.studio`);
  const authProvider = params.authProvider;
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  return withDocLock(userPath, async () => {
    let op: OperationType = OperationType.GET;
    try {
      await runTransaction(db, async (tx) => {
        op = OperationType.GET;
        const existingSnap = await tx.get(userRef);
        if (!existingSnap.exists()) {
          op = OperationType.CREATE;
          tx.set(userRef, {
            uid,
            displayName,
            email,
            authProvider,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          op = OperationType.UPDATE;
          tx.update(userRef, {
            displayName,
            email,
            authProvider,
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      handleFirestoreError(error, op, userPath);
    }
  });
}

export async function recordOtpVerification(
  input:
    | string
    | {
        uid: string;
        displayName?: string;
        email?: string;
        authProvider?: 'password' | 'google';
      }
): Promise<void> {
  const params = typeof input === 'string' ? { uid: input } : input;
  const uid = sanitizeId(params.uid, 'user');
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  return withDocLock(userPath, async () => {
    let op: OperationType = OperationType.GET;
    try {
      await runTransaction(db, async (tx) => {
        op = OperationType.GET;
        const existingSnap = await tx.get(userRef);
        if (existingSnap.exists()) {
          op = OperationType.UPDATE;
          tx.update(userRef, {
            lastVerifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          op = OperationType.CREATE;
          const displayName = clampString(
            params.displayName ?? params.email?.split('@')[0] ?? 'Creator',
            100,
            'Creator'
          );
          const email = clampString(
            params.email ?? `${uid}@koda.studio`,
            180,
            `${uid}@koda.studio`
          );
          const authProvider = params.authProvider ?? 'password';
          tx.set(userRef, {
            uid,
            displayName,
            email,
            authProvider,
            lastVerifiedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      handleFirestoreError(error, op, userPath);
    }
  });
}

export async function saveUserProject(
  rawUid: string,
  project: KodaProject,
  rawSelectedReelId: string
): Promise<void> {
  const uid = sanitizeId(rawUid, 'user');
  const projectId = sanitizeId(project.id, `proj_${Date.now()}`);
  const projectPath = `users/${uid}/projects/${projectId}`;
  const projectRef = doc(db, 'users', uid, 'projects', projectId);

  const title = clampString(project.title, 180, 'Untitled Studio Project');
  const createdAtLabel = clampString(project.createdAt, 64, 'Just now');
  const selectedThumbnailId = clampString(
    project.selectedThumbnailId,
    128,
    project.thumbnails[0]?.id ?? 'thumb_a'
  );
  const selectedReelId = clampString(
    rawSelectedReelId,
    128,
    project.reels[0]?.id ?? 'reel_01'
  );

  // Strip top-level metadata and store structured native Maps/Lists in projectData
  const projectData = {
    media: project.media,
    config: project.config,
    agents: project.agents,
    transcript: project.transcript,
    removedSilences: project.removedSilences,
    chapters: project.chapters,
    tensionMoments: project.tensionMoments,
    reels: project.reels,
    thumbnails: project.thumbnails,
    seo: project.seo,
    exportManifest: project.exportManifest,
  };

  return withDocLock(projectPath, async () => {
    let op: OperationType = OperationType.GET;
    try {
      await runTransaction(db, async (tx) => {
        op = OperationType.GET;
        const existingSnap = await tx.get(projectRef);
        if (!existingSnap.exists()) {
          op = OperationType.CREATE;
          tx.set(projectRef, {
            id: projectId,
            ownerId: uid,
            title,
            createdAtLabel,
            status: project.status,
            preset: project.config.preset,
            selectedThumbnailId,
            selectedReelId,
            projectData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          op = OperationType.UPDATE;
          tx.update(projectRef, {
            title,
            status: project.status,
            preset: project.config.preset,
            selectedThumbnailId,
            selectedReelId,
            projectData,
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      handleFirestoreError(error, op, projectPath);
    }
  });
}

export async function seedStarterProjectsIfEmpty(
  rawUid: string,
  starterProjects: KodaProject[]
): Promise<void> {
  const uid = sanitizeId(rawUid, 'user');
  const projectsPath = `users/${uid}/projects`;
  const projectsCol = collection(db, 'users', uid, 'projects');

  return withDocLock(`${projectsPath}/__seed__`, async () => {
    let existingSnap;
    try {
      existingSnap = await getDocs(
        query(projectsCol, where('ownerId', '==', uid), limit(1))
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, projectsPath);
    }

    if (!existingSnap.empty) return;

    for (const project of starterProjects) {
      await saveUserProject(uid, project, project.reels[0]?.id ?? 'reel_01');
    }
  });
}

export function subscribeUserProjects(
  rawUid: string,
  onProjects: (items: PersistedStudioProject[]) => void,
  onError?: (error: Error) => void
): () => void {
  const uid = sanitizeId(rawUid, 'user');
  const projectsPath = `users/${uid}/projects`;
  const projectsQuery = query(
    collection(db, 'users', uid, 'projects'),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const parsed: PersistedStudioProject[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const payload = (data.projectData ?? {}) as Partial<KodaProject>;
        const updatedAt = data.updatedAt as Timestamp | undefined;

        const reconstructed: KodaProject = {
          id: String(data.id ?? docSnap.id),
          title: String(data.title ?? 'Untitled Studio Project'),
          createdAt: String(data.createdAtLabel ?? 'Just now'),
          status: (data.status as KodaProject['status']) ?? 'ready',
          media: payload.media as KodaProject['media'],
          config: payload.config as KodaProject['config'],
          agents: (payload.agents ?? []) as KodaProject['agents'],
          transcript: (payload.transcript ?? []) as KodaProject['transcript'],
          removedSilences: (payload.removedSilences ??
            []) as KodaProject['removedSilences'],
          chapters: (payload.chapters ?? []) as KodaProject['chapters'],
          tensionMoments: (payload.tensionMoments ??
            []) as KodaProject['tensionMoments'],
          reels: (payload.reels ?? []) as KodaProject['reels'],
          thumbnails: (payload.thumbnails ?? []) as KodaProject['thumbnails'],
          selectedThumbnailId: String(data.selectedThumbnailId ?? 'thumb_a'),
          seo: payload.seo as KodaProject['seo'],
          exportManifest: (payload.exportManifest ??
            []) as KodaProject['exportManifest'],
        };

        parsed.push({
          project: reconstructed,
          selectedReelId: String(
            data.selectedReelId ?? reconstructed.reels[0]?.id ?? 'reel_01'
          ),
          updatedAtMs: updatedAt?.toMillis?.() ?? 0,
        });
      });

      parsed.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onProjects(parsed);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, projectsPath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}
