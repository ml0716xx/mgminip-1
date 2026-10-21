/* ==========================================================================
   三相不平衡治理 · 数据层（小程序端）
   --------------------------------------------------------------------------
   与 web 用户端 components/phaseImbalanceData.ts 同一套口径，两端月度数字必须对得上：
     · 关口三相有功 = 三相负荷 - 储能 PCS 各相出力（正=下网，负=上网）
     · 储能各相出力：治理开 = 总指令/3 + K_gain × 相偏差，并受单相边界钳位
     · 不平衡度 = 最大偏差 / 三相平均 × 100%（国标口径）

   收益口径：
     节省功率 = min(治理前阈值 - 关口总下网功率, 最大释放裕量)
     节省电量 = 节省功率 × 1/60 h
     节约电费 = 节省电量 × 该分钟分时电价

   ------------------------------------------------------------------
   与 web 端的唯一差异：小程序没有 localStorage，也没有「策略配置 · 增值服务」
   页面，所以阈值不做读写，直接给配置常量。以后配置下发了，把 PHASE_CONFIG
   换成接口返回值即可，卡片与算数都不用改。
   ========================================================================== */

/** 治理前阈值（kW）：人工维护的历史值，月度核算认这个数 */
const BASELINE = '30';
/** 当前阈值（kW）：公共配置 · 逆流参数里那个值 */
const CURRENT = '10';

export interface PhaseConfig {
  /** 增值服务开关：关掉后算法不参与 PCS 各相出力分解，回到总功率均分 */
  on: boolean;
  /** 治理前阈值（kW） */
  baseline: string;
  /** 当前生效的逆流阈值（kW） */
  current: string;
}

export const PHASE_CONFIG: PhaseConfig = { on: true, baseline: BASELINE, current: CURRENT };

/** 最大释放裕量 = 治理前阈值 - 当前阈值；填反了或压降为负按 0 处理 */
export function phaseReleaseMax(cfg: Pick<PhaseConfig, 'baseline' | 'current'>): number {
  const diff = (parseFloat(cfg.baseline) || 0) - (parseFloat(cfg.current) || 0);
  return diff > 0 ? diff : 0;
}

/* ---------------------------------------------------------------- 月度收益 */

/** 确定性伪随机：同一天多次刷新曲线不抖 */
function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export interface PhaseDailyRow {
  day: string;
  /** 当日释放电量 kWh */
  energy: number;
  /** 当日节约电费 元 */
  saving: number;
  /** 当日有效治理时长 h */
  hours: number;
  /** 当日治理时段平均不平衡度 %（治理后） */
  ubAfter: number;
  /** 当日不治理时的平均不平衡度 % */
  ubBefore: number;
}

/**
 * 2026-09 的逐日数据（30 天）。
 * 阴天光伏不足、储能不动，就没有边界收益 —— 这几个接近 0 的值是故意留的：
 * 收益不是每天都一样，全绿反而不可信。
 *
 * 只有「强度、时长、电价」是固化的天气与负荷特征，电量和电费按传入的释放裕量
 * 现算 —— 治理前阈值一改，月度报告要跟着变，不能停在写死的 20kW 上。
 */
const CLOUDY_DAYS = [7, 8, 19, 20];

const MONTH_BASE = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1;
  const isCloudy = CLOUDY_DAYS.includes(d);
  const r = jitter(d * 3.7);
  const r2 = jitter(d * 8.1 + 17);

  return {
    day: `09-${String(d).padStart(2, '0')}`,
    /* 强度：阴天几乎不触发；晴天在 0.38~0.78 之间波动（受负荷与削峰影响） */
    strength: isCloudy ? 0.008 + r * 0.006 : 0.38 + r * 0.4,
    hours: +(6 + r2 * 4).toFixed(1),
    /* 电价：治理多发生在峰平段，均价按 0.78~0.96 折算 */
    price: 0.78 + r2 * 0.18,
    /* 不平衡度：治理后 1.2~2.4%，不治理 5.2~7.8%（按国标偏差口径） */
    ubAfter: +(1.2 + r * 1.2).toFixed(1),
    ubBefore: +(5.2 + r2 * 2.6).toFixed(1),
  };
});

/** 逐日释放电量与电费，按当前释放裕量现算 */
export function phaseMonthDaily(releaseMax: number): PhaseDailyRow[] {
  return MONTH_BASE.map((b) => {
    const energy = +(releaseMax * b.hours * b.strength).toFixed(1);
    const saving = +(energy * b.price).toFixed(0);
    return {
      day: b.day,
      energy,
      saving,
      hours: energy > 0 ? b.hours : 0,
      ubAfter: b.ubAfter,
      ubBefore: b.ubBefore,
    };
  });
}

const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

/** 月度汇总。口径：取治理前阈值最后一次保存的数值 */
export function phaseMonth(releaseMax: number) {
  const rows = phaseMonthDaily(releaseMax);
  return {
    totalEnergy: +sum(rows.map((r) => r.energy)).toFixed(1),
    totalSaving: Math.round(sum(rows.map((r) => r.saving))),
    /** 有效治理天：释放电量低于 5kWh 的算没吃到裕量，阴天基本落在这档 */
    activeDays: rows.filter((r) => r.energy >= 5).length,
    totalHours: +sum(rows.map((r) => r.hours)).toFixed(1),
    avgUbAfter: +(sum(rows.map((r) => r.ubAfter)) / rows.length).toFixed(1),
    avgUbBefore: +(sum(rows.map((r) => r.ubBefore)) / rows.length).toFixed(1),
  };
}

/** 与 web 端同一套色值，两端看同一件事不能换颜色 */
export const PHASE_COLOR = {
  ub: '#D946EF',
  energy: '#E9D5F5',
} as const;
