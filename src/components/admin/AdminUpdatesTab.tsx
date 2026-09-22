import { useState, useEffect, useMemo, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import type { AdminAnnouncement } from "@/types/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Loader2,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface AdminUpdatesTabProps {
  isAdmin: boolean;
}

const CATEGORY_OPTIONS = [
  "GENERAL",
  "URGENT",
  "SCHEDULE",
  "COMPETITION",
  "PRO NIGHT",
  "REGISTRATION",
  "VENUE",
];

export function AdminUpdatesTab({ isAdmin }: AdminUpdatesTabProps) {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAnnouncement | null>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("GENERAL");
  const [formContent, setFormContent] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formLinkText, setFormLinkText] = useState("");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsPublished, setFormIsPublished] = useState(false);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<{
        status: string;
        count: number;
        data: { announcements: AdminAnnouncement[] };
      }>("/admin/announcements");
      setAnnouncements(res.data.announcements || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnnouncements();
    }
  }, [isAdmin, fetchAnnouncements]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCategory("GENERAL");
    setFormContent("");
    setFormLinkUrl("");
    setFormLinkText("");
    setFormIsPinned(false);
    setFormIsPublished(true); // Default to publish
    setIsFormOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: AdminAnnouncement) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category || "GENERAL");
    setFormContent(item.content);
    setFormLinkUrl(item.linkUrl || "");
    setFormLinkText(item.linkText || "");
    setFormIsPinned(item.isPinned);
    setFormIsPublished(item.isPublished);
    setIsFormOpen(true);
  };

  // Submit Create or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Announcement title is required.");
      return;
    }
    if (!formContent.trim()) {
      toast.error("Announcement content is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory.trim() || "GENERAL",
        content: formContent.trim(),
        imageUrl: null,
        linkUrl: formLinkUrl.trim() || null,
        linkText: formLinkText.trim() || null,
        isPinned: formIsPinned,
        isPublished: formIsPublished,
      };

      if (editingItem) {
        // Edit existing
        const res = await apiPut<{
          status: string;
          message: string;
          data: { announcement: AdminAnnouncement };
        }>(`/admin/announcements/${editingItem.id}`, payload);

        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingItem.id ? res.data.announcement : a))
        );
        toast.success(res.message || "Announcement updated successfully.");
      } else {
        // Create new
        const res = await apiPost<{
          status: string;
          message: string;
          data: { announcement: AdminAnnouncement };
        }>("/admin/announcements", payload);

        setAnnouncements((prev) => [res.data.announcement, ...prev]);
        toast.success(res.message || "Announcement created successfully.");
      }

      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (item: AdminAnnouncement) => {
    try {
      const res = await apiPatch<{
        status: string;
        message: string;
        data: { announcement: AdminAnnouncement };
      }>(`/admin/announcements/${item.id}/publish`);

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? res.data.announcement : a))
      );
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  // Toggle Pin
  const handleTogglePin = async (item: AdminAnnouncement) => {
    try {
      const res = await apiPatch<{
        status: string;
        message: string;
        data: { announcement: AdminAnnouncement };
      }>(`/admin/announcements/${item.id}/pin`);

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? res.data.announcement : a))
      );
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle pin");
    }
  };

  // Delete Announcement
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await apiDelete<{ status: string; message: string }>(
        `/admin/announcements/${deleteId}`
      );
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success(res.message || "Announcement deleted.");
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete announcement");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed metrics
  const stats = useMemo(() => {
    const total = announcements.length;
    const published = announcements.filter((a) => a.isPublished).length;
    const drafts = total - published;
    const pinned = announcements.filter((a) => a.isPinned).length;
    return { total, published, drafts, pinned };
  }, [announcements]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchContent = item.content.toLowerCase().includes(query);
        if (!matchTitle && !matchContent) return false;
      }
      // Category
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }
      // Status
      if (statusFilter === "PUBLISHED" && !item.isPublished) return false;
      if (statusFilter === "DRAFT" && item.isPublished) return false;

      return true;
    });
  }, [announcements, searchQuery, categoryFilter, statusFilter]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-white/60">
        <AlertCircle className="size-8 mx-auto text-red-400 mb-2" />
        <p>Access denied. This section is restricted to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="size-5 text-euphoria-gold" />
            Updates & Announcements Management
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Broadcast dynamic updates, schedule changes, and notices to the public festival website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnnouncements}
            disabled={isLoading}
            className="border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-euphoria-gold text-euphoria-dark hover:bg-euphoria-gold/90 font-semibold"
          >
            <Plus className="size-4 mr-1.5" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-white/[0.08] bg-[#140f26]/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-white/60">Total Updates</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </Card>
        <Card className="border-white/[0.08] bg-[#140f26]/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-emerald-400">Live on Website</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.published}</p>
        </Card>
        <Card className="border-white/[0.08] bg-[#140f26]/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-amber-400">Drafts (Hidden)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.drafts}</p>
        </Card>
        <Card className="border-white/[0.08] bg-[#140f26]/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-euphoria-aqua">Pinned Highlights</p>
          <p className="text-2xl font-bold text-euphoria-aqua mt-1">{stats.pinned}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[#140f26]/40 p-3 rounded-xl border border-white/[0.06]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <Input
            placeholder="Search by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.03] border-white/10 text-white placeholder:text-white/40 h-9 text-xs"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/10 text-white text-xs h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs">
            <SelectItem value="ALL">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(val: "ALL" | "PUBLISHED" | "DRAFT") => setStatusFilter(val)}
        >
          <SelectTrigger className="w-[140px] bg-white/[0.03] border-white/10 text-white text-xs h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs">
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements Table */}
      <div className="rounded-xl border border-white/[0.08] bg-[#140f26]/60 backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-6 animate-spin text-euphoria-gold" />
            <p className="text-xs text-white/60">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="py-16 text-center text-white/60">
            <Megaphone className="size-10 mx-auto text-white/20 mb-3" />
            <p className="text-sm font-medium">No announcements found</p>
            <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
              {searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search or filters."
                : "Create your first announcement to share festival updates with attendees."}
            </p>
            {!searchQuery && categoryFilter === "ALL" && statusFilter === "ALL" && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="mt-4 bg-euphoria-gold text-euphoria-dark hover:bg-euphoria-gold/90 font-semibold"
              >
                <Plus className="size-4 mr-1.5" />
                Create Announcement
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/[0.08]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-white/60 text-xs font-semibold w-12 text-center">Pin</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold">Title & Content</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold w-32">Category</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold w-28">Status</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold w-32">Date</TableHead>
                <TableHead className="text-white/60 text-xs font-semibold w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnnouncements.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                >
                  {/* Pinned Toggle */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      title={item.isPinned ? "Pinned (click to unpin)" : "Unpinned (click to pin)"}
                      onClick={() => handleTogglePin(item)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        item.isPinned
                          ? "bg-euphoria-aqua/20 text-euphoria-aqua hover:bg-euphoria-aqua/30"
                          : "text-white/20 hover:text-white/60 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Pin className={`size-3.5 ${item.isPinned ? "fill-current" : ""}`} />
                    </button>
                  </TableCell>

                  {/* Title & Preview */}
                  <TableCell className="max-w-[340px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm line-clamp-1">
                          {item.title}
                        </span>
                        {item.linkUrl && (
                          <span className="text-[10px] bg-white/[0.08] text-white/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                            Link <ExternalLink className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/[0.04] text-white/80 text-[11px] font-medium"
                    >
                      {item.category || "GENERAL"}
                    </Badge>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(item)}
                      className="cursor-pointer"
                    >
                      {item.isPublished ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 gap-1 text-[11px]">
                          <CheckCircle2 className="size-3" />
                          Live
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/30 gap-1 text-[11px]">
                          <EyeOff className="size-3" />
                          Draft
                        </Badge>
                      )}
                    </button>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="text-xs text-white/50">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit announcement"
                        className="size-7 text-white/70 hover:text-white hover:bg-white/[0.08]"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(item.id)}
                        title="Delete announcement"
                        className="size-7 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-[#16102a] border border-white/10 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Megaphone className="size-5 text-euphoria-gold" />
              {editingItem ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              {editingItem
                ? "Update announcement content and publishing visibility."
                : "Broadcast an important update or schedule notice to festival attendees."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Title *</label>
              <Input
                required
                placeholder="e.g. Move & Groove Dance Audition Timings Announced"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 text-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Category / Tag</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1435] border-white/10 text-white text-xs">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Announcement Content *</label>
              <textarea
                required
                rows={4}
                placeholder="Write the full announcement details here..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full rounded-lg bg-white/[0.04] border border-white/10 p-3 text-sm text-white placeholder:text-white/40 focus:outline-hidden focus:border-euphoria-purple/60 resize-y"
              />
            </div>

            {/* Action Link & Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">Action Link URL (Optional)</label>
                <Input
                  placeholder="e.g. #passes or /category/cultural"
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">Button Text (Optional)</label>
                <Input
                  placeholder="e.g. View Schedule / Register Now"
                  value={formLinkText}
                  onChange={(e) => setFormLinkText(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 text-xs"
                />
              </div>
            </div>

            {/* Toggles: Pin & Publish */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="size-4 accent-euphoria-aqua rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-white">Pin to Top</p>
                  <p className="text-[10px] text-white/50">Show at the top of the updates feed</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.08] cursor-pointer hover:bg-white/[0.04] transition-colors">
                <input
                  type="checkbox"
                  checked={formIsPublished}
                  onChange={(e) => setFormIsPublished(e.target.checked)}
                  className="size-4 accent-emerald-500 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-white">Publish Immediately</p>
                  <p className="text-[10px] text-white/50">Make visible to public attendees</p>
                </div>
              </label>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-white/10 bg-transparent text-white hover:bg-white/[0.06]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-euphoria-gold text-euphoria-dark hover:bg-euphoria-gold/90 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : editingItem ? (
                  "Update Announcement"
                ) : (
                  "Create Announcement"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-[#16102a] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="size-4" />
              Delete Announcement
            </DialogTitle>
            <DialogDescription className="text-xs text-white/60">
              Are you sure you want to permanently delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-white/10 bg-transparent text-white hover:bg-white/[0.06]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
