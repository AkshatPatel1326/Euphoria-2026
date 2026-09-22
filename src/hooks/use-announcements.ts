import { useState, useEffect, useCallback } from "react";
import { apiGet } from "@/lib/api";

export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  isPinned: boolean;
  publishedAt?: string | null;
  createdAt: string;
}

export function useAnnouncements(limit?: number) {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = limit ? `/announcements?limit=${limit}` : "/announcements";
      const res = await apiGet<{
        status: string;
        count: number;
        data: { announcements: PublicAnnouncement[] };
      }>(url);
      setAnnouncements(res.data?.announcements || []);
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      setError(err.message || "Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { announcements, isLoading, error, refetch: fetchAnnouncements };
}
