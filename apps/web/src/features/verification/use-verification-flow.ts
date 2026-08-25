/**
 * The one client-side binding to the verification session state machine.
 *
 * This hook owns *no* verification logic. It reads the session, forwards user
 * intent to the service, and writes the service's authoritative snapshot back
 * into the query cache. Progression, latency, and outcomes all come from
 * `session-service.ts`.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import type { IdentityVerificationInput, VerificationSession } from "@/types/verification-session";

import {
  advanceCredentialStage,
  pollOfficialConfirmation,
  requestOfficialConfirmation,
  sessionQueries,
  skipOfficialConfirmation,
  verifyIdentity,
} from "./session-service";

/** Cadence of the confirmation poll. The service decides when it resolves. */
const POLL_INTERVAL_MS = 1500;

export function useVerificationFlow(sessionId: string) {
  const queryClient = useQueryClient();
  const sessionOptions = sessionQueries.session(sessionId);
  const query = useQuery(sessionOptions);
  const session = query.data ?? null;

  const write = useCallback(
    (next: VerificationSession) => {
      queryClient.setQueryData(sessionOptions.queryKey, next);
      void queryClient.invalidateQueries({ queryKey: ["verification", "history"] });
      void queryClient.invalidateQueries({ queryKey: ["verification", "receipt", sessionId] });
    },
    // queryKey is a stable tuple for a given sessionId
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, sessionId],
  );

  /* ---------------------------------------------- credential leg progression */

  const advancing = useRef(false);
  const stage = session?.state;
  const completedChecks = session?.checks.length ?? 0;

  useEffect(() => {
    if (stage !== "validating") return;
    if (advancing.current) return;

    advancing.current = true;
    let cancelled = false;

    advanceCredentialStage(sessionId)
      .then((next) => {
        if (!cancelled) write(next);
      })
      .catch(() => {
        /* the session query remains the source of truth */
      })
      .finally(() => {
        advancing.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [stage, completedChecks, sessionId, write]);

  /* ------------------------------------------------------------- identity */

  const identity = useMutation({
    mutationFn: (input: IdentityVerificationInput) => verifyIdentity(sessionId, input),
    onSuccess: write,
  });

  /* -------------------------------------------------- official confirmation */

  const requestConfirmation = useMutation({
    mutationFn: () => requestOfficialConfirmation(sessionId),
    onSuccess: write,
  });

  const skipConfirmation = useMutation({
    mutationFn: () => skipOfficialConfirmation(sessionId),
    onSuccess: write,
  });

  /**
   * Controlled polling. React Query owns the interval, so it stops on unmount
   * and the instant the service reports a settled confirmation state.
   */
  const polling =
    session?.confirmation.state === "pending" && session.state !== "session_expired";

  useQuery({
    queryKey: ["verification", "confirmation-poll", sessionId],
    queryFn: async () => {
      const next = await pollOfficialConfirmation(sessionId);
      write(next);
      return next.confirmation.state;
    },
    enabled: polling,
    refetchInterval: polling ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: false,
    gcTime: 0,
    retry: false,
  });

  return {
    query,
    session,
    identity,
    requestConfirmation,
    skipConfirmation,
    isPolling: polling,
    /** True while the credential leg is still walking its stages. */
    isAdvancing: stage === "validating",
  };
}
