import { useState, useEffect, useRef, useCallback } from 'react';

type ProgressStage = {
  label: string;
  maxProgress: number; // 此阶段的最大进度值（0-100）
  duration: number; // 此阶段的持续时间（毫秒）
};

type UseOptimisticProgressOptions = {
  stages: ProgressStage[];
};

export function useOptimisticProgress({ stages }: UseOptimisticProgressOptions) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('');
  const [isActive, setIsActive] = useState(false);

  const startTimeRef = useRef<number>(0);
  const currentStageIndexRef = useRef<number>(0);
  const stageStartTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    if (!isActive) return;

    const now = Date.now();
    const currentStageIndex = currentStageIndexRef.current;

    if (currentStageIndex >= stages.length) {
      setIsActive(false);
      return;
    }

    const currentStage = stages[currentStageIndex];
    const elapsed = now - stageStartTimeRef.current;

    // 指数缓动函数：快速启动，逐渐减速
    const stageProgress = Math.min(
      1,
      1 - Math.exp((-3 * elapsed) / currentStage.duration)
    );

    // 计算累计基础进度（前面阶段的进度总和）
    const baseProgress = stages
      .slice(0, currentStageIndex)
      .reduce((sum, stage) => sum + stage.maxProgress, 0);

    // 当前阶段的进度贡献
    const currentProgress = stageProgress * currentStage.maxProgress;

    setProgress(Math.min(100, baseProgress + currentProgress));
    setLabel(currentStage.label);

    // 如果当前阶段完成，进入下一阶段
    if (stageProgress >= 0.99) {
      currentStageIndexRef.current++;
      stageStartTimeRef.current = Date.now();
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [isActive, stages]);

  useEffect(() => {
    if (isActive) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive, animate]);

  const start = useCallback(() => {
    setProgress(0);
    setLabel(stages[0]?.label || '');
    setIsActive(true);
    startTimeRef.current = Date.now();
    stageStartTimeRef.current = Date.now();
    currentStageIndexRef.current = 0;
  }, [stages]);

  const complete = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    setProgress(100);
    setLabel('');
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    setProgress(0);
    setLabel('');
    setIsActive(false);
    currentStageIndexRef.current = 0;
  }, []);

  return {
    progress,
    label,
    isActive,
    start,
    complete,
    reset,
  };
}
