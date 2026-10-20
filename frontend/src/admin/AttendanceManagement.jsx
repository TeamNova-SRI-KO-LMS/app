import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileCheck2,
  Inbox,
  Loader2,
  Minus,
  RotateCw,
  Search,
  Table2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  exportAdminAttendanceCsv,
  fetchAdminAttendanceOverview,
  fetchAdminAttendanceRecords,
  fetchAdminAttendanceStudents,
} from '../services/attendanceService';

// ─── Constants ────────────────────────────────────────────────────────────────

// Status colors follow meaning (good → warning → neutral → critical) and are used for
// every mark on this page. Text stays in gray ink, and color always comes with an icon + label.
const STATUS_META = {
  present: { label: 'Present', color: '#0ca30c', Icon: CheckCircle2 },
  late: { label: 'Late', color: '#fab219', Icon: Clock },
  excused: { label: 'Excused', color: '#898781', Icon: FileCheck2 },
  absent: { label: 'Absent', color: '#d03b3b', Icon: XCircle },
};

// Stack order (bottom → top) keeps the green and red segments apart.
const STATUS_ORDER = ['present', 'late', 'excused', 'absent'];

// Students below this rate are flagged; it matches the lowest tier on the student attendance page.
const ATTENTION_RATE = 70;

const RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom range' },
];

const RECORD_SORTS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'updated_desc', label: 'Recently marked' },
];

const STUDENT_SORTS = [
  { value: 'rate_asc', label: 'Lowest rate first' },
  { value: 'rate_desc', label: 'Highest rate first' },
  { value: 'sessions_desc', label: 'Most sessions' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'recent', label: 'Recently marked' },
];

const PAGE_SIZE = 15;
const AUTO_REFRESH_MS = 30000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (value) => String(value).padStart(2, '0');

/** "YYYY-MM-DD" for a date in the admin's local calendar */
const toDayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const rangeFor = (preset, custom) => {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { from: toDayKey(today), to: toDayKey(today) };
    case '7d':
      return { from: toDayKey(addDays(today, -6)), to: toDayKey(today) };
    case '30d':
      return { from: toDayKey(addDays(today, -29)), to: toDayKey(today) };
    case 'month':
      return { from: toDayKey(new Date(today.getFullYear(), today.getMonth(), 1)), to: toDayKey(today) };
    case 'custom':
      return { from: custom.from, to: custom.to };
    default:
      return { from: '', to: '' };
  }
};

// Attendance days are calendar dates stored at UTC midnight, so they are formatted in UTC.
const formatDay = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  if (!value) return '—';
  const date = typeof value === 'string' && value.length === 10 ? new Date(`${value}T00:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
};

const formatDateTime = (value) => (value
  ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '—');

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const formatRate = (rate) => (rate === null || rate === undefined ? '—' : `${rate}%`);

const compactNumber = (value) => (value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : String(value));

const initialsOf = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '?';

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

// Meter fill carries severity; the track is a lighter step of the same hue.
const rateTone = (rate) => {
  if (rate === null || rate === undefined) return { fill: '#d1d5db', track: '#f3f4f6' };
  if (rate >= ATTENTION_RATE) return { fill: '#2563eb', track: '#dbeafe' };
  if (rate >= 50) return { fill: '#fab219', track: '#fdefcc' };
  return { fill: '#d03b3b', track: '#f6d8d8' };
};

// 1, 2, 5 × 10ⁿ steps so the y-axis shows clean numbers
const niceStep = (rough) => {
  if (rough <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return nice * magnitude;
};

// Column path: rounded data end on top, square at the baseline.
const topRoundedBar = (x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Load `load(params)` whenever params change or `reloadToken` bumps. The previous data
 * stays on screen while a refetch is in flight, so refreshing never flashes a skeleton.
 */
const useAdminQuery = (load, params, reloadToken, enabled = true) => {
  const paramsKey = JSON.stringify(params);
  const requestKey = `${paramsKey}#${reloadToken}`;
  const [state, setState] = useState({ requestKey: null, data: null, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let ignore = false;

    load(JSON.parse(paramsKey))
      .then((data) => {
        if (!ignore) setState({ requestKey, data, error: null });
      })
      .catch((error) => {
        if (!ignore) {
          setState((previous) => ({
            requestKey,
            data: previous.data,
            error: errorMessage(error, 'Could not load attendance data. Please try again.'),
          }));
        }
      });

    return () => {
      ignore = true;
    };
  }, [load, paramsKey, requestKey, enabled]);

  return {
    data: state.data,
    error: state.error,
    isFetching: enabled && state.requestKey !== requestKey,
  };
};

const useElementWidth = () => {
  const [width, setWidth] = useState(0);
  const observerRef = useRef(null);

  const ref = useCallback((element) => {
    observerRef.current?.disconnect();
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    observerRef.current = observer;
  }, []);

  return [ref, width];
};

// ─── Small components ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status];
  if (!meta) return <span className="text-xs text-gray-400">—</span>;
  const { Icon } = meta;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 whitespace-nowrap">
      <Icon size={13} style={{ color: meta.color }} aria-hidden="true" />
      {meta.label}
    </span>
  );
};

const RateMeter = ({ rate, showValue = true }) => {
  const tone = rateTone(rate);
  const flagged = rate !== null && rate !== undefined && rate < ATTENTION_RATE;
  return (
    <div className="flex items-center gap-2 min-w-[130px]">
      <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: tone.track }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rate || 0}%`, backgroundColor: tone.fill }} />
      </div>
      {showValue && <span className="w-10 text-right text-xs font-bold text-gray-800 tabular-nums">{formatRate(rate)}</span>}
      {flagged ? (
        <AlertTriangle size={13} className="shrink-0" style={{ color: tone.fill }} aria-label={`Below ${ATTENTION_RATE}% — needs attention`} />
      ) : (
        <span className="w-[13px] shrink-0" aria-hidden="true" />
      )}
    </div>
  );
};

const StatTile = ({ icon: Icon, iconClass, label, value, sub }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-start gap-4">
    <div className={`p-3 rounded-2xl shrink-0 ${iconClass}`}>
      <Icon size={22} aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <span className="text-xs font-medium text-gray-500 block">{label}</span>
      <span className="text-2xl font-bold text-gray-900 mt-0.5 block">{value}</span>
      {sub && <span className="text-[11px] text-gray-400 block mt-0.5 truncate">{sub}</span>}
    </div>
  </div>
);

const SegmentedControl = ({ options, value, onChange, label }) => (
  <div className="inline-flex p-1 bg-gray-100 rounded-xl" role="group" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
          value === option.value ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        {option.icon && <option.icon size={13} aria-hidden="true" />}
        {option.label}
      </button>
    ))}
  </div>
);

const Pagination = ({ pagination, onPage }) => {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
      <span className="text-xs text-gray-500">
        {formatNumber(first)}–{formatNumber(last)} of {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-gray-700 px-1">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const EmptyState = ({ title, hint }) => (
  <div className="py-12 text-center">
    <Inbox size={36} className="text-gray-300 mx-auto mb-3" aria-hidden="true" />
    <p className="text-sm font-semibold text-gray-600">{title}</p>
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const StatusLegend = ({ totals }) => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
    {STATUS_ORDER.map((status) => (
      <li key={status} className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_META[status].color }} aria-hidden="true" />
        <span>{STATUS_META[status].label}</span>
        {totals && <span className="font-semibold text-gray-900 tabular-nums">{formatNumber(totals[status])}</span>}
      </li>
    ))}
  </ul>
);

// ─── Overview pieces ──────────────────────────────────────────────────────────

const COMPARISON_LABELS = { today: 'yesterday', '7d': 'previous 7 days', '30d': 'previous 30 days' };

// A rate change against only a handful of earlier sessions is noise, so skip it
const MIN_COMPARISON_SESSIONS = 5;

const RateTile = ({ totals, previous, preset, rangeLabel }) => {
  const rate = totals.attendanceRate;
  const previousRate = previous?.attendanceRate;
  const comparable = rate !== null && previousRate !== null && previousRate !== undefined
    && previous.totalSessions >= MIN_COMPARISON_SESSIONS;
  const delta = comparable ? rate - previousRate : null;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaClass = delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-gray-500';

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-gray-500 block">Attendance rate</span>
          <span className="text-4xl font-bold text-gray-900 tracking-tight block mt-1">{formatRate(rate)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
          <CalendarCheck size={22} aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3">
        <RateMeter rate={rate} showValue={false} />
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        {delta === null ? (
          <>Present ÷ all sessions · {rangeLabel}</>
        ) : (
          <span className={`inline-flex items-center gap-1 font-semibold ${deltaClass}`}>
            <DeltaIcon size={12} aria-hidden="true" />
            {delta > 0 ? '+' : ''}{delta} pts vs {COMPARISON_LABELS[preset] || 'previous period'}
          </span>
        )}
      </p>
    </div>
  );
};

const StatusMix = ({ totals }) => {
  const total = totals.totalSessions || 0;
  const present = STATUS_ORDER.filter((status) => totals[status] > 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Status breakdown</h3>
        <span className="text-xs text-gray-400">{formatNumber(total)} sessions</span>
      </div>

      {total > 0 ? (
        <div
          className="flex h-3 w-full gap-[2px]"
          role="img"
          aria-label={STATUS_ORDER.map((status) => `${STATUS_META[status].label} ${totals[status]}`).join(', ')}
        >
          {present.map((status, index) => (
            <div
              key={status}
              title={`${STATUS_META[status].label}: ${formatNumber(totals[status])}`}
              className={`h-full min-w-[3px] ${index === 0 ? 'rounded-l-full' : ''} ${index === present.length - 1 ? 'rounded-r-full' : ''}`}
              style={{ flexGrow: totals[status], flexBasis: 0, backgroundColor: STATUS_META[status].color }}
            />
          ))}
        </div>
      ) : (
        <div className="h-3 w-full rounded-full bg-gray-100" />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const share = total ? Math.round((totals[status] / total) * 100) : 0;
          return (
            <div key={status} className="flex items-start gap-2">
              <meta.Icon size={16} className="mt-0.5 shrink-0" style={{ color: meta.color }} aria-hidden="true" />
              <div>
                <div className="text-lg font-bold text-gray-900 leading-tight">{formatNumber(totals[status])}</div>
                <div className="text-[11px] text-gray-500">{meta.label} · {share}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CHART_HEIGHT = 208;
const PLOT_TOP = 10;
const BASELINE = 176;
const Y_AXIS_WIDTH = 34;
const TOOLTIP_WIDTH = 188;

const TrendChart = ({ days }) => {
  const [containerRef, width] = useElementWidth();
  const [hovered, setHovered] = useState(null);

  const maxTotal = Math.max(0, ...days.map((day) => day.totalSessions));
  const step = niceStep(Math.max(maxTotal, 1) / 4);
  const yMax = step * 4;
  const plotHeight = BASELINE - PLOT_TOP;
  const scale = (value) => (value / yMax) * plotHeight;
  const plotWidth = Math.max(width - Y_AXIS_WIDTH, 0);
  const band = days.length ? plotWidth / days.length : 0;
  const barWidth = Math.max(2, Math.min(24, band * 0.6));
  const labelEvery = Math.max(1, Math.ceil(days.length / Math.max(1, Math.floor(plotWidth / 56))));
  const hoveredDay = hovered !== null ? days[hovered] : null;
  const tooltipLeft = hovered !== null
    ? Math.min(Math.max(Y_AXIS_WIDTH + band * hovered + band / 2 - TOOLTIP_WIDTH / 2, 0), Math.max(width - TOOLTIP_WIDTH, 0))
    : 0;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: CHART_HEIGHT }} onMouseLeave={() => setHovered(null)}>
      {width > 0 && (
        <svg width={width} height={CHART_HEIGHT} role="img" aria-label={`Daily attendance, ${days.length} days, stacked by status`}>
          {[0, 2, 4].map((multiple) => {
            const value = step * multiple;
            const y = BASELINE - scale(value);
            return (
              <g key={multiple}>
                <line x1={Y_AXIS_WIDTH} x2={width} y1={y} y2={y} stroke={multiple === 0 ? '#cbd5e1' : '#f1f5f9'} strokeWidth="1" />
                <text x={Y_AXIS_WIDTH - 8} y={y + 4} textAnchor="end" fill="#9ca3af" style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                  {compactNumber(value)}
                </text>
              </g>
            );
          })}

          {days.map((day, index) => {
            const center = Y_AXIS_WIDTH + band * index + band / 2;
            const x = center - barWidth / 2;
            const segments = STATUS_ORDER.filter((status) => day[status] > 0);
            const dimmed = hovered !== null && hovered !== index;
            let cursor = BASELINE;

            return (
              <g key={day.date} opacity={dimmed ? 0.45 : 1}>
                {segments.map((status, segmentIndex) => {
                  const height = scale(day[status]);
                  const top = cursor - height;
                  cursor = top;
                  const isTop = segmentIndex === segments.length - 1;
                  // 2px surface gap between stacked segments
                  const drawn = isTop ? height : height - 2;
                  if (drawn <= 0.5) return null;
                  return isTop ? (
                    <path key={status} d={topRoundedBar(x, top, barWidth, drawn, 4)} fill={STATUS_META[status].color} />
                  ) : (
                    <rect key={status} x={x} y={top + 2} width={barWidth} height={drawn} fill={STATUS_META[status].color} />
                  );
                })}

                {/* Labels step back from the newest day so it is always labeled without crowding */}
                {(days.length - 1 - index) % labelEvery === 0 && (
                  <text
                    x={Math.min(Math.max(center, Y_AXIS_WIDTH + 18), width - 18)}
                    y={BASELINE + 18}
                    textAnchor="middle"
                    fill="#9ca3af"
                    style={{ fontSize: 11 }}
                  >
                    {formatDay(day.date, { month: 'short', day: 'numeric' })}
                  </text>
                )}

                {/* Hit target: the whole column band, bigger than the mark */}
                <rect
                  x={Y_AXIS_WIDTH + band * index}
                  y={PLOT_TOP}
                  width={band}
                  height={BASELINE - PLOT_TOP + 24}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatDay(day.date)}: ${day.totalSessions} sessions, ${STATUS_ORDER.map((status) => `${day[status]} ${status}`).join(', ')}`}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  style={{ outline: 'none', cursor: 'default' }}
                />
              </g>
            );
          })}
        </svg>
      )}

      {hoveredDay && (
        <div
          className="absolute top-0 z-10 pointer-events-none rounded-xl border border-gray-200 bg-white shadow-lg px-3 py-2.5"
          style={{ left: tooltipLeft, width: TOOLTIP_WIDTH }}
        >
          <p className="text-[11px] font-semibold text-gray-500">{formatDay(hoveredDay.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          <p className="text-sm text-gray-900 mt-0.5">
            <span className="font-bold">{formatNumber(hoveredDay.totalSessions)}</span>{' '}
            <span className="text-gray-500 text-xs">sessions</span>
            {hoveredDay.totalSessions > 0 && (
              <span className="text-gray-500 text-xs"> · {Math.round((hoveredDay.present / hoveredDay.totalSessions) * 100)}% present</span>
            )}
          </p>
          <ul className="mt-1.5 space-y-1">
            {[...STATUS_ORDER].reverse().map((status) => (
              <li key={status} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: STATUS_META[status].color }} aria-hidden="true" />
                <span className="font-bold text-gray-900 tabular-nums w-6">{hoveredDay[status]}</span>
                <span className="text-gray-500">{STATUS_META[status].label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const TrendTable = ({ days }) => (
  <div className="max-h-[208px] overflow-y-auto">
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-white">
        <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <th className="py-2 text-left">Date</th>
          <th className="py-2 text-right">Sessions</th>
          {STATUS_ORDER.map((status) => (
            <th key={status} className="py-2 text-right">{STATUS_META[status].label}</th>
          ))}
          <th className="py-2 text-right">Present %</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50 tabular-nums">
        {[...days].reverse().map((day) => (
          <tr key={day.date}>
            <td className="py-1.5 text-gray-700">{formatDay(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
            <td className="py-1.5 text-right font-semibold text-gray-900">{day.totalSessions}</td>
            {STATUS_ORDER.map((status) => (
              <td key={status} className="py-1.5 text-right text-gray-600">{day[status]}</td>
            ))}
            <td className="py-1.5 text-right text-gray-600">
              {day.totalSessions ? `${Math.round((day.present / day.totalSessions) * 100)}%` : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TrendCard = ({ trend, totals }) => {
  const [view, setView] = useState('chart');
  const hasData = trend.days.some((day) => day.totalSessions > 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs lg:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Daily attendance</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Sessions per day by status · {formatDay(trend.from, { month: 'short', day: 'numeric' })} – {formatDay(trend.to)}
          </p>
        </div>
        <SegmentedControl
          label="Chart or table view"
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'Chart', icon: BarChart3 },
            { value: 'table', label: 'Table', icon: Table2 },
          ]}
        />
      </div>

      <div className="mb-3">
        <StatusLegend totals={totals} />
      </div>

      {!hasData ? (
        <EmptyState title="No attendance recorded in this period" hint="Records appear here as soon as students mark them." />
      ) : view === 'chart' ? (
        <TrendChart days={trend.days} />
      ) : (
        <TrendTable days={trend.days} />
      )}
    </div>
  );
};

const CourseBreakdown = ({ rows }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-gray-900">By course</h3>
      <span className="text-xs text-gray-400">{rows.length} course{rows.length === 1 ? '' : 's'}</span>
    </div>
    {rows.length === 0 ? (
      <EmptyState title="No course attendance yet" />
    ) : (
      <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {rows.map((row) => (
          <li key={row.courseId} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold text-gray-800 truncate" title={row.title}>{row.title}</span>
              <span className="text-[11px] text-gray-400 whitespace-nowrap tabular-nums">{formatNumber(row.totalSessions)} sessions</span>
            </div>
            <RateMeter rate={row.attendanceRate} />
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ─── Tables ───────────────────────────────────────────────────────────────────

const StudentCell = ({ name, email }) => (
  <div className="flex items-center gap-3 min-w-0">
    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
      {initialsOf(name)}
    </div>
    <div className="min-w-0">
      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{name || 'Deleted user'}</p>
      {email && <p className="text-[11px] text-gray-400 truncate">{email}</p>}
    </div>
  </div>
);

const RecordsTable = ({ records, showStudent = true }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs sm:text-sm">
      <thead>
        <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <th className="py-3 pr-4">Date</th>
          {showStudent && <th className="py-3 pr-4">Student</th>}
          <th className="py-3 pr-4">Course</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 pr-4">Notes</th>
          <th className="py-3 text-right">Marked</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {records.map((record) => (
          <tr key={record._id} className="hover:bg-gray-50/60 transition-colors">
            <td className="py-3 pr-4 font-semibold text-gray-900 whitespace-nowrap">{formatDay(record.date)}</td>
            {showStudent && (
              <td className="py-3 pr-4 max-w-[220px]">
                <StudentCell name={record.student?.name} email={record.student?.email} />
              </td>
            )}
            <td className="py-3 pr-4 text-gray-700 max-w-[200px] truncate" title={record.course?.title}>
              {record.course?.title || 'Deleted course'}
            </td>
            <td className="py-3 pr-4"><StatusBadge status={record.status} /></td>
            <td className="py-3 pr-4 text-gray-500 max-w-[200px] truncate" title={record.notes || ''}>{record.notes || '—'}</td>
            <td
              className="py-3 text-right text-[11px] text-gray-400 whitespace-nowrap"
              title={`Recorded ${formatDateTime(record.createdAt)}${record.updatedAt !== record.createdAt ? ` · updated ${formatDateTime(record.updatedAt)}` : ''}`}
            >
              {formatDateTime(record.updatedAt || record.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StudentsTable = ({ students, onSelect }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs sm:text-sm">
      <thead>
        <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <th className="py-3 pr-4">Student</th>
          <th className="py-3 pr-4 text-right">Sessions</th>
          {STATUS_ORDER.map((status) => (
            <th key={status} className="py-3 pr-4 text-right hidden md:table-cell">{STATUS_META[status].label}</th>
          ))}
          <th className="py-3 pr-4">Attendance rate</th>
          <th className="py-3 text-right">Last session</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {students.map((student) => (
          <tr
            key={student.studentId}
            onClick={() => onSelect(student)}
            className="hover:bg-blue-50/40 transition-colors cursor-pointer"
          >
            <td className="py-3 pr-4 max-w-[240px]">
              <button
                type="button"
                className="text-left w-full cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(student);
                }}
                aria-label={`View attendance for ${student.name}`}
              >
                <StudentCell name={student.name} email={student.email} />
              </button>
            </td>
            <td className="py-3 pr-4 text-right font-semibold text-gray-900 tabular-nums">{formatNumber(student.totalSessions)}</td>
            {STATUS_ORDER.map((status) => (
              <td key={status} className="py-3 pr-4 text-right text-gray-600 tabular-nums hidden md:table-cell">{formatNumber(student[status])}</td>
            ))}
            <td className="py-3 pr-4"><RateMeter rate={student.attendanceRate} /></td>
            <td className="py-3 text-right text-[11px] text-gray-500 whitespace-nowrap">{formatDay(student.lastSessionDate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StudentDetailModal = ({ student, filters, reloadToken, onClose }) => {
  const { data, error, isFetching } = useAdminQuery(
    fetchAdminAttendanceRecords,
    { ...filters, search: '', studentId: student.studentId, limit: 50, sort: 'date_desc' },
    reloadToken,
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const records = data?.records || [];
  const total = data?.pagination?.total || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-student-title"
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-100"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Student attendance</span>
            <h3 id="attendance-student-title" className="text-lg font-bold text-gray-900 truncate">{student.name}</h3>
            <p className="text-xs text-gray-400 truncate">{student.email}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-gray-100">
          <div>
            <span className="text-[11px] text-gray-500 block">Attendance rate</span>
            <span className="text-xl font-bold text-gray-900">{formatRate(student.attendanceRate)}</span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Sessions</span>
            <span className="text-xl font-bold text-gray-900">{formatNumber(student.totalSessions)}</span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Courses</span>
            <span className="text-xl font-bold text-gray-900">{formatNumber(student.coursesCount)}</span>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 block">Last marked</span>
            <span className="text-sm font-semibold text-gray-900">{formatDateTime(student.lastMarkedAt)}</span>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <StatusLegend totals={student} />
          </div>
        </div>

        <div className={`p-5 overflow-y-auto transition-opacity ${isFetching && data ? 'opacity-60' : ''}`}>
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
          {!data && isFetching ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
          ) : records.length === 0 ? (
            <EmptyState title="No records in the selected period" />
          ) : (
            <>
              <RecordsTable records={records} showStudent={false} />
              {total > records.length && (
                <p className="text-[11px] text-gray-400 mt-3">Showing the latest {records.length} of {formatNumber(total)} records. Use Export CSV for the full list.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const OverviewSkeleton = () => (
  <div className="space-y-5 animate-pulse" aria-hidden="true">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((key) => <div key={key} className="h-32 bg-white border border-gray-100 rounded-2xl" />)}
    </div>
    <div className="h-36 bg-white border border-gray-100 rounded-2xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="h-72 bg-white border border-gray-100 rounded-2xl lg:col-span-2" />
      <div className="h-72 bg-white border border-gray-100 rounded-2xl" />
    </div>
  </div>
);

// Loading / error / empty handling shared by the Records and Students tabs.
// A refetch keeps the current rows visible (dimmed) instead of showing a spinner.
const TabBody = ({ query, hasRows, emptyTitle, emptyHint, children }) => {
  if (!query.data && query.isFetching) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin text-blue-500" size={24} aria-label="Loading" />
      </div>
    );
  }

  if (query.error && !query.data) {
    return <p className="py-8 text-center text-sm text-red-600">{query.error}</p>;
  }

  if (!hasRows) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return <div className={`transition-opacity ${query.isFetching ? 'opacity-60' : ''}`}>{children}</div>;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AttendanceManagement = () => {
  const [preset, setPreset] = useState('30d');
  const [customRange, setCustomRange] = useState(() => rangeFor('30d'));
  const [courseId, setCourseId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('records');
  const [recordStatus, setRecordStatus] = useState('all');
  const [recordSort, setRecordSort] = useState('date_desc');
  const [studentSort, setStudentSort] = useState('rate_asc');
  const [reloadToken, setReloadToken] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Debounce the student search box
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Pick up new attendance automatically: poll while the tab is visible, and on focus
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const refresh = () => setReloadToken((token) => token + 1);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, AUTO_REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [autoRefresh]);

  const range = rangeFor(preset, customRange);
  const customRangeInvalid = preset === 'custom' && range.from && range.to && range.from > range.to;
  const filters = useMemo(
    () => ({
      from: customRangeInvalid ? '' : range.from,
      to: customRangeInvalid ? '' : range.to,
      courseId,
      search,
    }),
    [range.from, range.to, courseId, search, customRangeInvalid],
  );
  const filtersKey = JSON.stringify(filters);
  const todayKey = toDayKey(new Date());

  // Page numbers reset to 1 whenever the filters, status or sort change
  const recordsKey = `${filtersKey}|${recordStatus}|${recordSort}`;
  const [recordsPaging, setRecordsPaging] = useState({ key: recordsKey, page: 1 });
  const recordsPage = recordsPaging.key === recordsKey ? recordsPaging.page : 1;

  const studentsKey = `${filtersKey}|${studentSort}`;
  const [studentsPaging, setStudentsPaging] = useState({ key: studentsKey, page: 1 });
  const studentsPage = studentsPaging.key === studentsKey ? studentsPaging.page : 1;

  const overview = useAdminQuery(fetchAdminAttendanceOverview, { ...filters, today: todayKey }, reloadToken);
  const records = useAdminQuery(
    fetchAdminAttendanceRecords,
    { ...filters, status: recordStatus, sort: recordSort, page: recordsPage, limit: PAGE_SIZE },
    reloadToken,
    activeTab === 'records',
  );
  const students = useAdminQuery(
    fetchAdminAttendanceStudents,
    { ...filters, sort: studentSort, page: studentsPage, limit: PAGE_SIZE },
    reloadToken,
    activeTab === 'students',
  );

  const isRefreshing = overview.isFetching || records.isFetching || students.isFetching;
  const rangeLabel = RANGE_PRESETS.find((option) => option.id === preset)?.label || 'Selected range';
  const hasActiveFilters = preset !== '30d' || courseId !== 'all' || searchInput !== '';
  const data = overview.data;

  const resetFilters = () => {
    setPreset('30d');
    setCustomRange(rangeFor('30d'));
    setCourseId('all');
    setSearchInput('');
    setSearch('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAdminAttendanceCsv({ ...filters, status: recordStatus });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${filters.from || 'all-time'}${filters.to ? `-to-${filters.to}` : ''}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Attendance exported');
    } catch {
      toast.error('Could not export attendance. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const closeStudent = useCallback(() => setSelectedStudent(null), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Attendance</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Live attendance marked by students, straight from the database.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
              className="accent-blue-600"
            />
            Auto-refresh
            {autoRefresh && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />}
          </label>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            title="Download the filtered records as CSV (newest 10,000)"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters: one row, scoping everything below */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
            <select
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
              aria-label="Date range"
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {RANGE_PRESETS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customRange.from}
                max={customRange.to || undefined}
                onChange={(event) => setCustomRange((current) => ({ ...current, from: event.target.value }))}
                aria-label="From date"
                className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customRange.to}
                min={customRange.from || undefined}
                onChange={(event) => setCustomRange((current) => ({ ...current, to: event.target.value }))}
                aria-label="To date"
                className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="relative">
            <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              aria-label="Course"
              className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer max-w-[240px] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All courses</option>
              {(data?.courses || []).map((course) => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search students by name or email…"
            aria-label="Search students"
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
          >
            <X size={13} /> Reset filters
          </button>
        )}
      </div>

      {customRangeInvalid && (
        <p className="text-xs text-red-600 -mt-3">The start date must be on or before the end date.</p>
      )}

      {overview.error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
          <span>{overview.error}</span>
          <button type="button" onClick={() => setReloadToken((token) => token + 1)} className="text-xs font-semibold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Overview */}
      {!data ? (
        overview.error ? null : <OverviewSkeleton />
      ) : (
        <div className={`space-y-5 transition-opacity ${overview.isFetching ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RateTile totals={data.totals} previous={data.previous} preset={preset} rangeLabel={rangeLabel} />
            <StatTile
              icon={CalendarCheck}
              iconClass="bg-emerald-50 text-emerald-600"
              label="Sessions recorded"
              value={formatNumber(data.totals.totalSessions)}
              sub={rangeLabel}
            />
            <StatTile
              icon={Users}
              iconClass="bg-indigo-50 text-indigo-600"
              label="Students tracked"
              value={formatNumber(data.totals.studentsTracked)}
              sub={`Across ${data.totals.coursesTracked} course${data.totals.coursesTracked === 1 ? '' : 's'}`}
            />
            <StatTile
              icon={Clock}
              iconClass="bg-amber-50 text-amber-600"
              label={`Today · ${formatDay(data.today.date, { month: 'short', day: 'numeric' })}`}
              value={formatNumber(data.today.totalSessions)}
              sub={data.today.totalSessions
                ? `${data.today.present} present · ${data.today.absent} absent`
                : 'No sessions marked yet today'}
            />
          </div>

          <StatusMix totals={data.totals} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <TrendCard trend={data.trend} totals={data.totals} />
            <CourseBreakdown rows={data.courseBreakdown} />
          </div>

          <p className="text-[11px] text-gray-400">
            Updated {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            {data.lastActivityAt && <> · last attendance marked {formatDateTime(data.lastActivityAt)}</>}
            {autoRefresh && <> · refreshes every 30 seconds</>}
          </p>
        </div>
      )}

      {/* Records / Students */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <SegmentedControl
            label="Records or students"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'records', label: 'Attendance records', icon: CalendarCheck },
              { value: 'students', label: 'Students', icon: Users },
            ]}
          />

          {activeTab === 'records' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Filter by status">
                {['all', ...STATUS_ORDER].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setRecordStatus(status)}
                    aria-pressed={recordStatus === status}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      recordStatus === status ? 'bg-blue-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status !== 'all' && (
                      <span className="w-2 h-2 rounded-full ring-1 ring-white/70" style={{ backgroundColor: STATUS_META[status].color }} aria-hidden="true" />
                    )}
                    {status === 'all' ? 'All' : STATUS_META[status].label}
                  </button>
                ))}
              </div>
              <select
                value={recordSort}
                onChange={(event) => setRecordSort(event.target.value)}
                aria-label="Sort records"
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
              >
                {RECORD_SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <AlertTriangle size={12} className="text-amber-500" aria-hidden="true" /> below {ATTENTION_RATE}% needs attention
              </span>
              <select
                value={studentSort}
                onChange={(event) => setStudentSort(event.target.value)}
                aria-label="Sort students"
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
              >
                {STUDENT_SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {activeTab === 'records' ? (
          <TabBody
            query={records}
            emptyTitle="No attendance records match these filters"
            emptyHint="Try a wider date range or clear the filters."
            hasRows={(records.data?.records || []).length > 0}
          >
            <RecordsTable records={records.data?.records || []} />
            <Pagination
              pagination={records.data?.pagination}
              onPage={(page) => setRecordsPaging({ key: recordsKey, page })}
            />
          </TabBody>
        ) : (
          <TabBody
            query={students}
            emptyTitle="No students match these filters"
            emptyHint="Students appear once they mark attendance."
            hasRows={(students.data?.students || []).length > 0}
          >
            <StudentsTable students={students.data?.students || []} onSelect={setSelectedStudent} />
            <Pagination
              pagination={students.data?.pagination}
              onPage={(page) => setStudentsPaging({ key: studentsKey, page })}
            />
          </TabBody>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          filters={filters}
          reloadToken={reloadToken}
          onClose={closeStudent}
        />
      )}
    </div>
  );
};

export default AttendanceManagement;
