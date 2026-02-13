'use client';

import { useCallback, useEffect, useState } from 'react';
import UploadCard from '@/components/dashboard/UploadCard';
import StyleCard from '@/components/dashboard/StyleCard';
import GenerateCard from '@/components/dashboard/GenerateCard';
import OutputCard from '@/components/dashboard/OutputCard';
import HistoryCard from '@/components/dashboard/HistoryCard';

export type GenerationResult = {
  id: string;
  title: string;
  article: string;
  article_char_count: number;
  target_length: number;
  deviation_percent?: number;
  created_at: string;
};

type StyleProfileData = {
  profile_json: Record<string, unknown> | null;
  profile_summary: string | null;
  updated_at: string | null;
};

export default function DashboardPage() {
  const [articles, setArticles] = useState<
    Array<{
      id: string;
      filename: string;
      file_type: string;
      extracted_char_count: number;
      created_at: string;
      preview: string;
    }>
  >([]);
  const [styleProfile, setStyleProfile] = useState<StyleProfileData | null>(null);
  const [generations, setGenerations] = useState<GenerationResult[]>([]);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingGenerations, setLoadingGenerations] = useState(true);

  const fetchArticles = useCallback(async () => {
    const res = await fetch('/api/articles');
    const json = await res.json();
    if (json.ok && json.data?.articles) setArticles(json.data.articles);
  }, []);

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/style-profile');
    const json = await res.json();
    if (json.ok) setStyleProfile(json.data);
    setLoadingProfile(false);
  }, []);

  const fetchGenerations = useCallback(async () => {
    const res = await fetch('/api/generations?limit=10');
    const json = await res.json();
    if (json.ok && json.data?.generations) setGenerations(json.data.generations);
    setLoadingGenerations(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const onUploadSuccess = useCallback(
    async (profileFromUpload?: StyleProfileData | null) => {
      await fetchArticles();

      if (profileFromUpload?.profile_summary) {
        setStyleProfile(profileFromUpload);
        setLoadingProfile(false);
        return;
      }

      await fetchProfile();
    },
    [fetchArticles, fetchProfile]
  );

  const onDeleteSuccess = useCallback(async () => {
    await fetchArticles();
    setStyleProfile(null);
    setLoadingProfile(false);
  }, [fetchArticles]);

  const articleItems = articles.map((a) => ({
    id: a.id,
    filename: a.filename,
    file_type: a.file_type,
    extracted_char_count: a.extracted_char_count,
    created_at: a.created_at,
    preview: a.preview,
  }));

  const onGenerateSuccess = (result: GenerationResult) => {
    setLastResult(result);
    fetchGenerations();
  };

  const onGenerationDelete = useCallback((deletedId: string) => {
    // 立即从本地状态移除
    setGenerations((prev) => prev.filter((g) => g.id !== deletedId));

    // 如果删除的是当前显示的结果，清空OutputCard
    setLastResult((prev) => (prev?.id === deletedId ? null : prev));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">工作台</h1>

      <div className="grid gap-6 md:grid-cols-1">
        <UploadCard
          articles={articleItems}
          onSuccess={onUploadSuccess}
          onDeleteSuccess={onDeleteSuccess}
        />
        <StyleCard
          profile={styleProfile}
          loading={loadingProfile}
        />
        <GenerateCard
          hasProfile={!!styleProfile?.profile_summary}
          hasArticles={articles.length > 0}
          onSuccess={onGenerateSuccess}
        />
        <OutputCard result={lastResult} />
        <HistoryCard
          generations={generations}
          loading={loadingGenerations}
          onSelect={setLastResult}
          onRefresh={fetchGenerations}
          onDelete={onGenerationDelete}
        />
      </div>
    </div>
  );
}
