/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 测点趋势 · 数据层
 * --------------------------------------------------------------------------
 * 点表里每个测点都是「某一刻的值」，这一层把它展开成「一整天怎么变的」。
 *
 * 两条硬规矩：
 *   ① 锚点必须是点表上那个数 —— 今天是几点画的，曲线在那一刻的值就等于点表值。
 *      两处对不上，现场一对账就穿帮。
 *   ② 走势要讲得通 —— 功率跟着日负荷曲线起伏，累计电量只增不减，
 *      电压频率只小幅抖动。不生成「半夜光伏满发」这种一眼假的形状。
 *
 * 所有随机都是确定性的（按 设备 + 测点 + 日期 做种子），
 * 同一天反复进来看到的曲线完全一样，切走再切回不会变。
 */

import type { DeviceItem, DevicePoint } from './deviceData';

export interface TrendSample {
  /** 距 0 点的分钟数 */
  minute: number;
  /** 时刻标签 HH:mm */
  t: string;
  v: number;
}

export interface TrendStateSeg {
  from: number;
  to: number;
  label: string;
  /** 色条用的类名 */
  cls: string;
}

export interface PointTrend {
  kind: 'number' | 'state';
  unit: string;
  decimals: number;
  /** 数值型：绘图用的采样点（已降到 1 分钟一个，15 秒全量只用于算极值） */
  samples: TrendSample[];
  /** 数值型：当日最大 / 最小 */
  stats: { max: number; min: number } | null;
  /** 极值出现在哪一刻，图上要标出来 */
  extremes: { max: { minute: number; v: number }; min: { minute: number; v: number } } | null;
  /** 状态型：当日状态分段 */
  states: TrendStateSeg[];
  /** 今天还没过完：曲线只画到此刻，右侧留白 */
  partial: boolean;
  /** 曲线终点（今天时等于点表值） */
  last: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (dateStr: string, delta: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const nd = new Date(y, m - 1, d + delta);
  return fmtDate(nd);
};

export const isToday = (dateStr: string) => dateStr === fmtDate(new Date());

/** 只能往前翻 7 天：再往前不是这份台账的口径 */
export const HISTORY_DAYS = 7;

export const canGoNext = (dateStr: string) => !isToday(dateStr);
export const canGoPrev = (dateStr: string) => dateStr > addDays(fmtDate(new Date()), -HISTORY_DAYS);

/** 从「82.4 %」「1,600 kW」「-41.2 kW」里拆出数值、单位、小数位 */
export const parsePointValue = (text: string) => {
  const m = text.trim().match(/^(-?[\d,]+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return { num: null as number | null, unit: '', decimals: 0 };
  const raw = m[1].replace(/,/g, '');
  const num = Number(raw);
  if (!Number.isFinite(num)) return { num: null as number | null, unit: '', decimals: 0 };
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return { num, unit: m[2].trim(), decimals };
};

/** 日负荷包络：0.3 打底，6–18 点抬起来，跟站里的光伏 / 生产班次同形 */
const dayShape = (minute: number) => {
  const h = minute / 60;
  const s = Math.sin(((h - 6) / 12) * Math.PI);
  return 0.3 + 0.7 * (s > 0 ? s : 0);
};

/**
 * SOC 的一天不该是个对称的山包：夜里趴着、上午充上去、午后有段平台、傍晚放下来。
 * 用分段折线比正弦更像现场，也能让「平台期」在图上看得出来。
 */
const socShape = (minute: number) => {
  const h = minute / 60;
  if (h < 6) return 0.2;
  if (h < 10.5) return 0.2 + (0.55 * (h - 6)) / 4.5;
  if (h < 12) return 0.75 + (0.25 * (h - 10.5)) / 1.5;
  if (h < 15) return 1 - (0.05 * (h - 12)) / 3;
  if (h < 19) return 0.95 - (0.7 * (h - 15)) / 4;
  return 0.25 - (0.05 * (h - 19)) / 5;
};

/** 确定性伪随机：同一个种子永远给同一串波动 */
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

const wobble = (seed: number, minute: number, slow = false) =>
  Math.sin(minute / (slow ? 180 : 47) + seed) * 0.62 +
  Math.sin(minute / (slow ? 61 : 13) + seed * 2.1) * 0.38;

/** 累计量：只增不减，今天从 0 点长到此刻的值 */
const CUMULATIVE = /总充电量|总放电量|发电量|正向|反向|今日|累计/;
/** 电压 / 频率这类，只该小幅抖。
 *  注意别写成「率$」—— 功率也以率结尾，会被误判成电压一样的窄幅量。 */
const STIFF = /电压|频率|功率因数|离散率|效率|达成率/;
/** 温度 */
const TEMP = /温度|温控/;
/** SOC / 百分比：一天走几个点，不能像功率那样翻倍 */
const SOC = /SOC/i;
const RATIO = /功率因数|离散率|效率|达成率/;

/** 状态量的颜色按语义给：充电蓝、放电琥珀、运行绿、故障红、待机灰 */
const stateTone = (label: string) => {
  if (/故障|错误|异常|报警|越限/.test(label)) return 'bg-red-400';
  if (/充电/.test(label)) return 'bg-sky-400';
  if (/放电/.test(label)) return 'bg-amber-400';
  if (/运行|正常|并网|开启|投入|无/.test(label)) return 'bg-emerald-400';
  return 'bg-slate-300';
};

const fmtTime = (minute: number) => `${pad(Math.floor(minute / 60) % 24)}:${pad(Math.floor(minute % 60))}`;

/**
 * 生成某台设备某个测点在指定日期的趋势。
 * date 传 yyyy-mm-dd；今天只生成到当前时刻，历史日期给完整 24 小时。
 */
export const buildPointTrend = (
  device: DeviceItem,
  point: DevicePoint,
  date: string,
): PointTrend => {
  const { num, unit, decimals } = parsePointValue(point.value);
  const today = isToday(date);
  const now = new Date();
  const nowMinute = today ? now.getHours() * 60 + now.getMinutes() : 1440;
  const seed = hash(`${device.id}|${point.label}|${date}`);

  /* -------- 状态量：没有连续曲线，给当日状态时序 -------- */
  if (num === null) {
    const end = Math.max(nowMinute, 120);
    const bounds = [0, 0.22, 0.48, 0.74, 1].map((r) => Math.round(r * end));
    const alt = ['待机', '运行', '待机'];
    return {
      kind: 'state',
      unit: '',
      decimals: 0,
      samples: [],
      stats: null,
      extremes: null,
      partial: today,
      last: null,
      states: bounds.slice(0, -1).map((from, i) => {
        const label = i === 3 ? point.value : alt[i];
        return { from, to: bounds[i + 1], label, cls: stateTone(label) };
      }),
    };
  }

  /* -------- 数值量 -------- */
  const base = num;
  /* 历史日期：每天整体水平略有差异，不至于七条曲线长得一模一样 */
  const dayFactor = today ? 1 : 0.84 + ((seed % 29) / 29) * 0.3;
  const anchor = base * dayFactor;
  const isCum = CUMULATIVE.test(point.label);
  const isStiff = STIFF.test(point.label);
  const isTemp = TEMP.test(point.label);
  const isSoc = SOC.test(point.label);
  const isRatio = RATIO.test(point.label);
  const isPercent = unit === '%' && Math.abs(base) <= 100;

  const amp = (() => {
    if (isCum) return 0;
    if (isSoc) return 9;
    if (isRatio) return Math.max(Math.abs(anchor) * 0.04, 0.02);
    if (isPercent) return Math.min(Math.abs(anchor) * 0.12, 8);
    if (isStiff) return Math.max(Math.abs(anchor) * 0.02, 0.15);
    if (isTemp) return 3;
    return Math.max(Math.abs(anchor) * 0.3, 0.6);
  })();

  /* SOC 这类百分比本该平缓：噪声压到最低、周期拉长，不然 5 分钟一个锯齿 */
  const wobbleWeight = isSoc || isPercent || isRatio ? 0.06 : 0.25;
  const slowWobble = isSoc || isPercent || isRatio;

  /* 累计量的当日增量：按满量程的千分之二估 */
  const dayDelta = Math.max(Math.abs(anchor) * 0.002, 1);
  /* 今天的锚点 = 点表值；历史的锚点按日系数缩放 */
  const shapeOf = isSoc ? socShape : dayShape;
  const anchorShape = shapeOf(nowMinute);
  const anchorWobble = wobble(seed, nowMinute, slowWobble);

  const samples: TrendSample[] = [];
  const all: TrendSample[] = [];
  /* 采集是 15 秒一个点（STEP=0.25 分钟）；图上一分钟一个点就够，
     5760 个点全塞进去，手机上拖动会明显卡 */
  const STEP = 0.25;
  const DRAW_EVERY = 4;

  for (let m = 0; m <= nowMinute + 1e-6; m += STEP) {
    let v: number;
    if (isCum) {
      /* 从 0 点累计到此刻（历史整天累计到 24 点） */
      v = anchor - dayDelta * (1 - m / Math.max(nowMinute, 1));
    } else {
      const shape = shapeOf(m) - anchorShape;
      const wob = wobble(seed, m, slowWobble) - anchorWobble;
      v = anchor + amp * shape + amp * wobbleWeight * wob;
    }
    if (isStiff || isTemp) v = Math.max(v, 0);
    /* 百分比类的物理边界：SOC 不能画出 107% 这种数 */
    if (isPercent) v = Math.min(100, Math.max(0, v));
    all.push({ minute: m, t: fmtTime(m), v: Number(v.toFixed(Math.max(decimals, 1))) });
  }

  /* 终点对齐点表值：今天必须严丝合缝，历史日期按日系数走 */
  if (all.length) {
    const lastSample = all[all.length - 1];
    if (today) {
      lastSample.v = Number(base.toFixed(Math.max(decimals, 1)));
    } else if (isCum) {
      lastSample.v = Number(anchor.toFixed(Math.max(decimals, 1)));
    }
  }

  /* 极值按全量算 —— 抽稀之后峰值容易被抹掉 */
  let maxV = -Infinity;
  let minV = Infinity;
  let maxAt = 0;
  let minAt = 0;
  all.forEach((s) => {
    if (s.v > maxV) {
      maxV = s.v;
      maxAt = s.minute;
    }
    if (s.v < minV) {
      minV = s.v;
      minAt = s.minute;
    }
  });

  all.forEach((s, i) => {
    if (i % DRAW_EVERY === 0) samples.push(s);
  });
  /* 收尾那一点不能丢：它就是点表上的数 */
  if (all.length && samples[samples.length - 1] !== all[all.length - 1]) {
    samples.push(all[all.length - 1]);
  }

  return {
    kind: 'number',
    unit,
    decimals,
    samples,
    stats: all.length ? { max: maxV, min: minV } : null,
    extremes: all.length
      ? { max: { minute: maxAt, v: maxV }, min: { minute: minAt, v: minV } }
      : null,
    states: [],
    partial: today,
    last: samples.length ? samples[samples.length - 1].v : null,
  };
};

/** 数值按测点原本的小数位显示，千分位照旧 */
export const fmtValue = (v: number, decimals: number) =>
  v.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
