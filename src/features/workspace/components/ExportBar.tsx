'use client';

/**
 * The plan's export and import controls, plus the shared-link prompt.
 * Every file is built in the browser and every import is validated first.
 */

import { useRef, useState } from 'react';
import { useAccessibility } from '@/features/accessibility';
import { copyToClipboard, downloadFile } from '@/lib/download';
import { budgetCsv, withBom } from '../csv';
import { buildCalendar } from '@/lib/ics';
import { buildShareUrl, decodeShareFragment, encodeShareFragment } from '@/lib/share';
import { PlanSchema, type Plan } from '@/lib/plan';
import type { PlanView } from '../plan-view';
import type { Dictionary } from '@/lib/i18n';

const BUTTON_CLASS =
  'inline-flex min-h-[44px] items-center justify-center rounded-pill border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink hover:bg-raised';

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
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
        {t.workspace.exports}
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="plan-export-actions"
        onClick={() => setOpen((current) => !current)}
        className={`${BUTTON_CLASS} mt-2 w-full min-[641px]:hidden`}
      >
        {t.workspace.exportToggle}
      </button>
      <div
        id="plan-export-actions"
        className={`${open ? 'flex' : 'hidden'} mt-2 flex-wrap gap-2 min-[641px]:mt-0 min-[641px]:flex`}
      >
        <button type="button" onClick={onPrint} className={BUTTON_CLASS}>
          {t.workspace.exportPrint}
        </button>
        <button type="button" onClick={onCalendar} className={BUTTON_CLASS}>
          {t.workspace.exportCalendar}
        </button>
        <button type="button" onClick={onCsv} className={BUTTON_CLASS}>
          {t.workspace.exportCsv}
        </button>
        <button type="button" onClick={onShare} className={BUTTON_CLASS}>
          {t.workspace.exportShare}
        </button>
        <button type="button" onClick={onJson} className={BUTTON_CLASS}>
          {t.workspace.exportJson}
        </button>
        <button type="button" className={BUTTON_CLASS} onClick={() => fileInput.current?.click()}>
          {t.workspace.importPlan}
        </button>
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
      <button
        type="button"
        onClick={() => void read()}
        className="no-print text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Open a shared plan from this link
      </button>
    );
  }

  return (
    <div className="no-print rounded-card border border-teal bg-teal/5 p-4">
      <p className="text-sm">
        A shared plan was found in this link. Opening it replaces the plan on this device.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onOpen(pending)} className={BUTTON_CLASS}>
          Open the shared plan
        </button>
        <button type="button" onClick={() => setPending(null)} className={BUTTON_CLASS}>
          {dictionary.common.cancel}
        </button>
      </div>
    </div>
  );
}
