import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  buildSignedCoachBrief,
  generateCoachPrepMarkdown,
  verifySignedCoachBrief,
} from '../engine/exporter';
import {
  buildSampleCsvTemplate,
  buildSampleGridSeriesJsonTemplate,
  validateAndParseMatchInput,
} from '../engine/importer';
import type {
  AntiStratCall,
  EconomySimResult,
  ImportParseResult,
  MapId,
  MatchAnalytics,
  MatchSeries,
  OpponentTendency,
} from '../types/telemetry';

interface ImporterExportViewProps {
  match: MatchSeries;
  analytics: MatchAnalytics;
  tendencies: OpponentTendency[];
  calls: AntiStratCall[];
  economyResult: EconomySimResult;
  onImportMatch: (imported: MatchSeries) => void;
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImporterExportView({
  match,
  analytics,
  tendencies,
  calls,
  economyResult,
  onImportMatch,
}: ImporterExportViewProps) {
  const [rawInput, setRawInput] = useState<string>(() => buildSampleGridSeriesJsonTemplate());
  const [mapFallback, setMapFallback] = useState<MapId>('haven');
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [verifyMessage, setVerifyMessage] = useState<string>('');

  const markdownBrief = useMemo(
    () => generateCoachPrepMarkdown(match, analytics, tendencies, calls, economyResult),
    [match, analytics, tendencies, calls, economyResult],
  );

  const signedBrief = useMemo(
    () => buildSignedCoachBrief(match, analytics, tendencies, calls, economyResult),
    [match, analytics, tendencies, calls, economyResult],
  );

  const signedJsonText = useMemo(
    () =>
      JSON.stringify(
        {
          payload: signedBrief.payload,
          integritySha256: signedBrief.integritySha256,
        },
        null,
        2,
      ),
    [signedBrief],
  );

  const handleValidateAndImport = () => {
    const result = validateAndParseMatchInput(rawInput, mapFallback);
    setParseResult(result);
    if (result.ok && result.match) {
      onImportMatch(result.match);
    }
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setRawInput(text);
    const result = validateAndParseMatchInput(text, mapFallback);
    setParseResult(result);
    if (result.ok && result.match) {
      onImportMatch(result.match);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdownBrief);
      setCopyStatus('Copied Markdown Coach Prep Sheet');
    } catch {
      setCopyStatus('Clipboard unavailable in sandbox — use Download .md');
    }
  };

  const handleVerifyDigest = () => {
    const verification = verifySignedCoachBrief(signedJsonText);
    setVerifyMessage(
      verification.valid
        ? `VERIFIED SHA-256 MATCH (${verification.computedSha256.slice(0, 16)}...)`
        : 'SHA-256 MISMATCH DETECTED',
    );
  };

  return (
    <div className="equal-two-grid">
      {/* Left: GRID / CSV Importer */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <Upload size={17} color="var(--c9-cyan)" />
              GRID-Compatible Telemetry Importer & Validator
            </h2>
            <p className="panel-subtitle">
              Accepts GRID Series State JSON, native grid-valorant-v1 JSON, or tactical round CSV.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setRawInput(buildSampleGridSeriesJsonTemplate());
              setParseResult(null);
            }}
          >
            Load Sample GRID JSON
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setRawInput(buildSampleCsvTemplate());
              setParseResult(null);
            }}
          >
            Load Sample CSV
          </button>
          <select
            className="select-control"
            style={{ padding: '5px 9px', fontSize: '0.78rem' }}
            value={mapFallback}
            onChange={(e) => setMapFallback(e.target.value as MapId)}
            aria-label="Default map if omitted in CSV"
          >
            <option value="ascent">CSV Fallback: Ascent</option>
            <option value="haven">CSV Fallback: Haven</option>
            <option value="bind">CSV Fallback: Bind</option>
          </select>
          <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
            Upload File
            <input
              type="file"
              accept=".json,.csv,.txt"
              style={{ display: 'none' }}
              onChange={(e) => void handleFileUpload(e.target.files?.[0])}
            />
          </label>
        </div>

        <textarea
          className="code-textarea"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          aria-label="Paste GRID JSON or CSV telemetry"
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleValidateAndImport}
          >
            Validate & Load Match
          </button>
          {parseResult && (
            <span className={`badge ${parseResult.ok ? 'badge-emerald' : 'badge-red'}`}>
              Format: {parseResult.formatDetected}
            </span>
          )}
        </div>

        {parseResult && (
          <div className={`alert-box ${parseResult.ok ? 'alert-ok' : 'alert-err'}`}>
            {parseResult.ok ? (
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <XCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <div>
              {parseResult.ok && parseResult.match ? (
                <div>
                  <strong>
                    Imported {parseResult.match.teamC9Name} vs {parseResult.match.opponentName} (
                    {parseResult.match.rounds.length} rounds on {parseResult.match.map.toUpperCase()})
                  </strong>
                  <div>Switched active dashboard to this dataset automatically.</div>
                </div>
              ) : (
                <div>
                  <strong>Validation Failed ({parseResult.issues.length} issue(s))</strong>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {parseResult.issues.map((issue, idx) => (
                      <li key={idx}>
                        <span className="mono">{issue.field}</span>: {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Right: Coach Prep Sheet + SHA-256 Brief */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">
              <FileText size={17} color="var(--emerald)" />
              Export Coach Prep Sheet & SHA-256 Brief
            </h2>
            <p className="panel-subtitle">
              Tamper-evident brief ready for Cloud9 coaching handoff and tournament prep.
            </p>
          </div>
          <span className="badge badge-c9 mono">
            SHA-256: {signedBrief.integritySha256.slice(0, 12)}…
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() =>
              downloadTextFile(
                `skyscout-${match.id}-prep.md`,
                markdownBrief,
                'text/markdown;charset=utf-8',
              )
            }
          >
            <Download size={14} /> Download .md Prep Sheet
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              downloadTextFile(
                `skyscout-${match.id}-signed-brief.json`,
                signedJsonText,
                'application/json;charset=utf-8',
              )
            }
          >
            <Download size={14} /> Download SHA-256 JSON
          </button>
          <button type="button" className="btn btn-sm" onClick={() => void handleCopyMarkdown()}>
            <Copy size={14} /> Copy Markdown
          </button>
          <button type="button" className="btn btn-sm" onClick={handleVerifyDigest}>
            <ShieldCheck size={14} /> Verify SHA-256
          </button>
        </div>

        {(copyStatus || verifyMessage) && (
          <div className="alert-box alert-ok">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="mono" style={{ fontSize: '0.76rem' }}>
              {verifyMessage || copyStatus}
            </div>
          </div>
        )}

        <div>
          <span className="kpi-label">Live Markdown Preview</span>
          <pre className="code-preview" style={{ marginTop: '6px' }}>
            {markdownBrief}
          </pre>
        </div>

        <div>
          <span className="kpi-label">Canonical SHA-256 Digest</span>
          <div className="code-preview mono" style={{ marginTop: '6px', maxHeight: '80px' }}>
            {signedBrief.integritySha256}
          </div>
        </div>
      </section>
    </div>
  );
}
