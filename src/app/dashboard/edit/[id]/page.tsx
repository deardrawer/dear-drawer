"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Invitation, InvitationInput } from "@/types/invitation";
import { TEMPLATES } from "@/types/invitation";

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 폼 상태
  const [form, setForm] = useState<InvitationInput>({
    template_id: "classic",
    groom_name: "",
    bride_name: "",
    wedding_date: "",
    wedding_time: "",
    venue_name: "",
    venue_address: "",
    venue_detail: "",
    greeting_message: "",
    contact_groom: "",
    contact_bride: "",
  });

  // 청첩장 데이터 로드
  useEffect(() => {
    if (id === "new") {
      // 새 청첩장 생성
      createNewInvitation();
    } else {
      // 기존 청첩장 로드
      loadInvitation();
    }
  }, [id]);

  const createNewInvitation = async () => {
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: "classic" }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error("Failed to create invitation");
      }

      const data = await res.json();
      router.replace(`/dashboard/edit/${data.invitation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation");
      setLoading(false);
    }
  };

  const loadInvitation = async () => {
    try {
      const res = await fetch(`/api/invitations/${id}`);

      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error("Failed to load invitation");
      }

      const data = await res.json();
      setInvitation(data.invitation);
      setForm({
        template_id: data.invitation.template_id,
        groom_name: data.invitation.groom_name || "",
        bride_name: data.invitation.bride_name || "",
        wedding_date: data.invitation.wedding_date || "",
        wedding_time: data.invitation.wedding_time || "",
        venue_name: data.invitation.venue_name || "",
        venue_address: data.invitation.venue_address || "",
        venue_detail: data.invitation.venue_detail || "",
        greeting_message: data.invitation.greeting_message || "",
        contact_groom: data.invitation.contact_groom || "",
        contact_bride: data.invitation.contact_bride || "",
        main_image: data.invitation.main_image || "",
        gallery_images: JSON.parse(data.invitation.gallery_images || "[]"),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  // 폼 필드 업데이트
  const updateField = (field: keyof InvitationInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 저장
  const handleSave = useCallback(async () => {
    if (!invitation || saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/invitations/${invitation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const data = await res.json();
      setInvitation(data.invitation);
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [invitation, form, saving]);

  // 이미지 업로드
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "main_image" | "gallery"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      if (field === "main_image") {
        setForm((prev) => ({ ...prev, main_image: data.url }));
      } else {
        setForm((prev) => ({
          ...prev,
          gallery_images: [...(prev.gallery_images || []), data.url],
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  // 갤러리 이미지 삭제
  const removeGalleryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images?.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-slate-500">
                마지막 저장: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                "임시저장"
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 템플릿 선택 */}
        <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">템플릿 선택</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => updateField("template_id", template.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  form.template_id === template.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="w-full aspect-[3/4] bg-slate-700 rounded-lg mb-2" />
                <p className="text-sm font-medium text-white">{template.name}</p>
                <p className="text-xs text-slate-400">{template.description}</p>
                {template.isPremium && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">
                    Premium
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 신랑신부 정보 */}
        <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">신랑신부 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">신랑 이름</label>
              <input
                type="text"
                value={form.groom_name}
                onChange={(e) => updateField("groom_name", e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">신부 이름</label>
              <input
                type="text"
                value={form.bride_name}
                onChange={(e) => updateField("bride_name", e.target.value)}
                placeholder="김영희"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">신랑 연락처</label>
              <input
                type="tel"
                value={form.contact_groom}
                onChange={(e) => updateField("contact_groom", e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">신부 연락처</label>
              <input
                type="tel"
                value={form.contact_bride}
                onChange={(e) => updateField("contact_bride", e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 결혼식 정보 */}
        <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">결혼식 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">결혼식 날짜</label>
              <input
                type="date"
                value={form.wedding_date}
                onChange={(e) => updateField("wedding_date", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">결혼식 시간</label>
              <input
                type="time"
                value={form.wedding_time}
                onChange={(e) => updateField("wedding_time", e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">예식장 이름</label>
              <input
                type="text"
                value={form.venue_name}
                onChange={(e) => updateField("venue_name", e.target.value)}
                placeholder="더채플앳청담"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">예식장 주소</label>
              <input
                type="text"
                value={form.venue_address}
                onChange={(e) => updateField("venue_address", e.target.value)}
                placeholder="서울특별시 강남구 청담동 123-45"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">상세 위치</label>
              <input
                type="text"
                value={form.venue_detail}
                onChange={(e) => updateField("venue_detail", e.target.value)}
                placeholder="3층 그랜드볼룸"
                className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 인사말 */}
        <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">인사말</h2>
          <textarea
            value={form.greeting_message}
            onChange={(e) => updateField("greeting_message", e.target.value)}
            placeholder="소중한 분들을 초대합니다..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </section>

        {/* 대표 이미지 */}
        <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">대표 이미지</h2>
          <div className="flex flex-col items-center gap-4">
            {form.main_image ? (
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden">
                <img
                  src={form.main_image}
                  alt="대표 이미지"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setForm((prev) => ({ ...prev, main_image: "" }))}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="w-full max-w-sm aspect-[3/4] rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-400 text-sm">클릭하여 이미지 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "main_image")}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </section>

        {/* 갤러리 */}
        <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">갤러리</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {form.gallery_images?.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={url} alt={`갤러리 ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 cursor-pointer flex items-center justify-center transition-colors">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, "gallery")}
                className="hidden"
              />
            </label>
          </div>
        </section>
      </main>
    </div>
  );
}
