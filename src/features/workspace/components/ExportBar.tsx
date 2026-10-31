'use client';

/**
 * The plan's export and import controls, plus the shared-link prompt.
 * Every file is built in the browser and every import is validated first.
 */

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAccessibility } from '@/features/accessibility';
import { copyToClipboard, downloadFile } from '@/lib/download';
import { budgetCsv, withBom } from '../csv';
import { buildCalendar } from '@/lib/ics';
import { buildShareUrl, decodeShareFragment, encodeShareFragment } from '@/lib/share';
import { PlanSchema, type Plan } from '@/lib/plan';
import type { PlanView } from '../plan-view';
import type { Dictionary } from '@/lib/i18n';

/** Build the print, calendar, CSV and JSON download actions. */
function useExportActions(view: PlanView) {
  const onPrint = () => {
    if (typeof window !== 'undefined') window.print();
  };
  const onCalendar = () => {
    const calendar = buildCalendar(view.plan);
    downloadFile('gatherly-plan.ics', calendar, 'text/calendar');
  };
  const onCsv = () => {
    const csv = withBom(budgetCsv(view.plan, view.budget));
    downloadFile('gatherly-budget.csv', csv, 'text/csv');
  };
  const onJson = () => {
    downloadFile('gatherly-plan.json', JSON.stringify(view.plan, null, 2), 'application/json');
  };
  return { onPrint, onCalendar, onCsv, onJson };
}

/** Own the share result, the import error and their user feedback. */
function useShareImport(view: PlanView, t: Dictionary) {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const onShare = async () => {
    const fragment = await encodeShareFragment(view.plan);
    const url = buildShareUrl(window.location.origin, fragment);
    const copied = await copyToClipboard(url);
    setShareState(copied ? 'copied' : 'failed');
    window.setTimeout(() => setShareState('idle'), 4000);
  };
  const onImport = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = PlanSchema.safeParse(JSON.parse(text) as unknown);
      if (!parsed.success) {
        setImportError(t.errors.validation);
        return;
      }
      const { setPlan } = await import('@/lib/plan-store');
      setPlan(parsed.data);
    } catch {
      setImportError(t.errors.generic);
    }
  };
  return { shareState, importError, fileInput, onShare, onImport };
}

/**
 * Offer printing, calendar, CSV, JSON, share and import actions for the plan.
 * Copy and import feedback is announced through a polite status region.
 */
export function ExportBar({ view }: { view: PlanView }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const [open, setOpen] = useState(false);
  const { onPrint, onCalendar, onCsv, onJson } = useExportActions(view);
  const { shareState, importError, fileInput, onShare, onImport } = useShareImport(view, t);

  return (
    <div className="no-print">
      <h2>
        <SectionLabel spacing="wider">{t.workspace.exports}</SectionLabel>
      </h2>
      <Button
        aria-expanded={open}
        aria-controls="plan-export-actions"
        onClick={() => setOpen((current) => !current)}
        variant="secondary"
        size="compact"
        className="mt-2 w-full min-[641px]:hidden"
      >
        {t.workspace.exportToggle}
      </Button>
      <div
        id="plan-export-actions"
        className={`${open ? 'flex' : 'hidden'} mt-2 flex-wrap gap-2 min-[641px]:mt-0 min-[641px]:flex`}
      >
        <Button onClick={onPrint} variant="secondary" size="compact">
          {t.workspace.exportPrint}
        </Button>
        <Button onClick={onCalendar} variant="secondary" size="compact">
          {t.workspace.exportCalendar}
        </Button>
        <Button onClick={onCsv} variant="secondary" size="compact">
          {t.workspace.exportCsv}
        </Button>
        <Button onClick={onShare} variant="secondary" size="compact">
          {t.workspace.exportShare}
        </Button>
        <Button onClick={onJson} variant="secondary" size="compact">
          {t.workspace.exportJson}
        </Button>
        <Button variant="secondary" size="compact" onClick={() => fileInput.current?.click()}>
          {t.workspace.importPlan}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label={t.workspace.importPlan}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onImport(file);
            event.target.value = '';
          }}
        />
      </div>

      <p role="status" aria-live="polite" className="mt-2 text-sm text-teal">
        {shareState === 'copied' ? t.workspace.shareCopied : null}
        {shareState === 'failed' ? t.errors.generic : null}
        {importError ? <span className="text-rose">{importError}</span> : null}
      </p>
    </div>
  );
}

/**
 * Offer to open a plan that arrived in the URL fragment.
 * The fragment is untrusted, so it is decoded and validated before it is
 * ever allowed to replace what is on screen.
 */
export function SharedPlanPrompt({ onOpen }: { onOpen: (plan: Plan) => void }) {
  const { dictionary } = useAccessibility();
  const [pending, setPending] = useState<Plan | null>(null);

  const read = async () => {
    if (typeof window === 'undefined') return;
    const fragment = window.location.hash.replace(/^#/, '');
    if (!fragment || !fragment.startsWith('g1')) return;
    const plan = await decodeShareFragment(fragment);
    if (plan) setPending(plan);
  };

  if (!pending) {
    return (
      <Button
        onClick={() => void read()}
        variant="quiet"
        size="none"
        className="no-print underline-offset-4 hover:underline"
      >
        Open a shared plan from this link
      </Button>
    );
  }

  return (
    <Card tone="teal" padding="md" className="no-print">
      <p className="text-sm">
        A shared plan was found in this link. Opening it replaces the plan on this device.
      </p>
      <div className="mt-3 flex gap-2">
        <Button onClick={() => onOpen(pending)} variant="secondary" size="compact">
          Open the shared plan
        </Button>
        <Button onClick={() => setPending(null)} variant="secondary" size="compact">
          {dictionary.common.cancel}
        </Button>
      </div>
    </Card>
  );
}
