import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ImportResult } from '../lib/api';
import { parseCsv, readFileText } from '../lib/csv';
import { Button, Modal } from './ui';

/**
 * Generic CSV import dialog. The caller supplies a row mapper (CSV record ->
 * API payload) and the import call. Handles file selection, a live preview
 * count, submission and the result summary.
 */
export function ImportModal({
  open,
  onClose,
  title,
  description,
  sampleHeader,
  mapRow,
  onImport,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  sampleHeader: string;
  mapRow: (record: Record<string, string>) => Record<string, unknown>;
  onImport: (rows: Record<string, unknown>[]) => Promise<ImportResult>;
  onDone: () => void;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setFileName('');
    setResult(null);
    setError(null);
  };

  const onFile = async (file: File) => {
    try {
      setError(null);
      const text = await readFileText(file);
      const parsed = parseCsv(text).map(mapRow);
      setRows(parsed);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read file');
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await onImport(rows);
      setResult(res);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title={title}>
      <p className="text-sm text-ink-2">{description}</p>
      <p className="mt-2 rounded-sm border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-ink-2">
        {sampleHeader}
      </p>

      {result ? (
        <div className="mt-4 rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok-ink">
          Imported {result.created} new, updated {result.updated}.
          {result.errors.length > 0 && (
            <span className="text-serious-ink"> {result.errors.length} row(s) skipped.</span>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="micro flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-line-2 bg-surface px-4 py-6 text-sm text-ink-2 hover:border-accent hover:bg-surface-2"
            >
              <UploadCloud aria-hidden className="h-6 w-6 text-ink-3" />
              {fileName ? (
                <span className="text-ink-1">
                  {fileName} — <b>{rows.length}</b> rows ready
                </span>
              ) : (
                <span>Choose a CSV file</span>
              )}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-crit-ink">
              {error}
            </p>
          )}
        </>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={close}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button variant="primary" size="sm" disabled={rows.length === 0 || busy} onClick={submit}>
            {busy ? 'Importing…' : `Import ${rows.length || ''}`}
          </Button>
        )}
      </div>
    </Modal>
  );
}
