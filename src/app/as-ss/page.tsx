'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AuthGuard from '@/components/AuthGuard';
import { useUser } from '@/hooks/useUser';

/* ─── 상태 머신 정의 ─────────────────────────────────────────── */
const STATUS_FLOW = {
  // 신규
  '접수대기':     { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📋', next: ['접수확인', '조치완료(통화)'], prev: null },
  '조치완료(통화)': { color: 'bg-sky-100 text-sky-700 border-sky-200', icon: '📞', next: [], prev: '접수대기' },
  '접수확인':     { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✅', next: ['방문대기'], prev: '접수대기' },
  '방문대기':     { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🚗', next: ['작업완료'], prev: '접수확인' },
  '작업완료':     { color: 'bg-green-100 text-green-700 border-green-200', icon: '✓', next: ['방문대기'], prev: '방문대기' },
  // 구버전 및 임의 상태 호환성 보장
  '접수중':       { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📋', next: ['접수확인', '조치완료(통화)'], prev: null },
  '진행중':       { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '⏳', next: ['방문대기', '작업완료'], prev: '접수중' },
  '모니터링중':    { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '👀', next: ['작업완료'], prev: '진행중' },
  '완료':         { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '✓', next: ['방문대기'], prev: '모니터링중' },
} as const;

type StatusKey = keyof typeof STATUS_FLOW;

const getStatusInfo = (status: string) => {
  return STATUS_FLOW[status as StatusKey] || STATUS_FLOW['접수대기'];
};

/* ─── 고장 부위 옵션 ─────────────────────────────────────────── */
const symptomOptions = [
  { label: '모터/구동부', icon: '⚙️' },
  { label: '엔코더/센서', icon: '📡' },
  { label: '유압/공압', icon: '🔩' },
  { label: 'PLC/프로그램', icon: '💻' },
  { label: '기구적파손', icon: '🔧' },
  { label: '노이즈/통신', icon: '📶' },
];

/* ─── 접수 모달 컴포넌트 ─────────────────────────────────────── */
interface ReceiptModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editRecord?: any;
}

const ReceiptModal = ({ onClose, onSuccess, editRecord }: ReceiptModalProps) => {
  /* ── 접수번호 자동 생성 (YYYYMMDD-##) ── */
  const [asNo, setAsNo] = useState(editRecord?.as_no || '');
  useEffect(() => {
    if (editRecord) return;
    const fetchAsNo = async () => {
      const now = new Date();
      // KST 날짜 포맷
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }).replace(/-/g, '');
      const { data } = await supabase
        .from('as_records')
        .select('as_no')
        .like('as_no', `${dateStr}-%`)
        .order('as_no', { ascending: false })
        .limit(1);

      let seq = 1;
      if (data && data.length > 0 && data[0].as_no) {
        const lastSeq = parseInt(data[0].as_no.split('-')[1] || '0', 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      setAsNo(`${dateStr}-${seq.toString().padStart(2, '0')}`);
    };
    fetchAsNo();
  }, [editRecord]);

  /* ── 폼 상태 ── */
  const [formData, setFormData] = useState({
    service_type: editRecord?.service_type || 'AS',
    project_site: editRecord?.site_name || editRecord?.customer_name || '',
    manager_name: editRecord?.manager_name || '',
    requester_name: editRecord?.requester_name || '',
    requester_phone: editRecord?.requester_phone || '',
    receipt_method: editRecord?.receipt_method || '전화',
    symptoms: editRecord?.symptoms || ([] as string[]),
    description: editRecord?.description || '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<{ project_number: string; project_name: string }[]>([]);
  const [users, setUsers] = useState<{ name: string; username: string }[]>([]);
  const [projectSearch, setProjectSearch] = useState(editRecord ? (editRecord.site_name || editRecord.customer_name || '') : '');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* 프로젝트 목록 로드 */
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const list = data
          .filter(p => p.project_name || p.project_number)
          .map(p => ({ project_number: p.project_number || '', project_name: p.project_name || '' }));
        setProjects(list);
      })
      .catch(() => {});
  }, []);

  /* 유저 목록 로드 (담당자 지정용) */
  useEffect(() => {
    supabase.from('users').select('id, name, username').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setUsers(data); });
  }, []);

  const filteredProjects = React.useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(p =>
      p.project_name.toLowerCase().includes(q) ||
      p.project_number.toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addSymptomLine = () => setFormData(prev => ({ ...prev, symptoms: [...prev.symptoms, ''] }));
  const updateSymptomLine = (idx: number, val: string) => {
    const newSymptoms = [...formData.symptoms];
    newSymptoms[idx] = val;
    setFormData(prev => ({ ...prev, symptoms: newSymptoms }));
  };
  const removeSymptomLine = (idx: number) => {
    setFormData(prev => ({ ...prev, symptoms: prev.symptoms.filter((_, i) => i !== idx) }));
  };

  const handlePhoto = async () => {
    try {
      const { Camera, CameraResultType } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Base64 });
      if (image.base64String) {
        setImages(prev => [...prev, `data:image/jpeg;base64,${image.base64String}`].slice(0, 5));
      }
    } catch {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 5));
        setImageFiles(prev => [...prev, file].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!formData.project_site.trim()) { alert('프로젝트/현장명은 필수입니다.'); return; }
    setIsSubmitting(true);
    try {
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const fileName = `receipt_${asNo}_${Date.now()}_${i}.jpg`;
        const blob = await (await fetch(images[i])).blob();
        const { error: uploadError } = await supabase.storage.from('as-images').upload(`receipts/${fileName}`, blob);
        if (!uploadError) {
          const { data: pubData } = supabase.storage.from('as-images').getPublicUrl(`receipts/${fileName}`);
          if (pubData?.publicUrl) uploadedImageUrls.push(pubData.publicUrl);
        }
      }
      const recordToSave = {
        as_no: asNo,
        service_type: formData.service_type,
        site_name: formData.project_site.trim(),
        customer_name: formData.project_site.trim(),
        project_name: formData.project_site.trim(),
        device_id: '-',
        manager_name: formData.manager_name,
        requester_name: formData.requester_name.trim(),
        requester_phone: formData.requester_phone.trim(),
        receipt_method: formData.receipt_method,
        symptoms: formData.symptoms,
        description: formData.description.trim(),
      };

      if (editRecord) {
        const { error: dbError } = await supabase.from('as_records').update(recordToSave).eq('id', editRecord.id);
        if (dbError) throw dbError;
        alert(`수정 완료!`);
      } else {
        const { error: dbError } = await supabase.from('as_records').insert([{
          ...recordToSave,
          receipt_images: uploadedImageUrls,
          status: '접수대기',
          repair_log: [{
            date: new Date().toISOString(),
            note: `신규 ${formData.service_type} 접수 — 접수자: ${formData.requester_name || '미입력'} / 방법: ${formData.receipt_method}`,
          }],
        }]);
        if (dbError) throw dbError;
        alert(`접수번호 [${asNo}] 등록 완료!`);
      }
      onSuccess();
    } catch (error: any) {
      console.error('접수 실패:', error);
      alert('접수 중 오류가 발생했습니다: ' + (error?.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!formData.project_site.trim();

  const modalJsx = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <style>{`@keyframes modalSlideUp { from { opacity:0; transform:translateY(28px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ animation: 'modalSlideUp 0.22s ease', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 타이틀 */}
        <div className="bg-gradient-to-r from-slate-800 to-blue-900 px-7 py-5 flex items-start justify-between shrink-0">
          <div>
            <p className="text-blue-300 text-[10px] font-bold tracking-widest uppercase mb-1">New Receipt</p>
            <h2 className="text-xl font-black text-white italic tracking-tight">AS / SS 신규 접수</h2>
            <p className="text-blue-200 text-xs mt-1">장비 고장 및 서비스 요청을 접수합니다.</p>
          </div>
          <button onClick={onClose} className="text-blue-300 hover:text-white text-2xl leading-none mt-0.5 transition-colors" aria-label="닫기">✕</button>
        </div>

        {/* 폼 */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* 1. 구분 + 접수번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">구분 *</label>
              <select
                className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors bg-white"
                value={formData.service_type}
                onChange={e => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
              >
                <option value="AS">AS (After Service)</option>
                <option value="SS">SS (Spot Service)</option>
                <option value="OV">OV (Overhaul / 개조)</option>
                <option value="YS">YS (Yearly Service / 정기점검)</option>
                <option value="Etc">Etc (기타)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">접수번호 (자동생성)</label>
              <input className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-mono font-medium bg-gray-50 outline-none" value={asNo} readOnly />
            </div>
          </div>

          {/* 2. 프로젝트/현장명 + 장비번호 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">프로젝트/현장명 *</label>
              <input
                className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors placeholder:text-gray-300"
                placeholder="프로젝트명 또는 현장명 검색..."
                value={projectSearch}
                onChange={e => { setProjectSearch(e.target.value); setFormData(prev => ({ ...prev, project_site: e.target.value })); setShowProjectDropdown(true); }}
                onFocus={() => setShowProjectDropdown(true)}
                autoFocus
              />
              {showProjectDropdown && filteredProjects.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredProjects.map((p, i) => (
                    <button key={`${p.project_number}-${i}`} type="button"
                      className="w-full text-left px-3.5 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                      onClick={() => {
                        const display = p.project_name ? `[${p.project_number}] ${p.project_name}` : p.project_number;
                        setProjectSearch(display);
                        setFormData(prev => ({ ...prev, project_site: display }));
                        setShowProjectDropdown(false);
                      }}>
                      <span className="font-mono text-blue-600 text-xs mr-1.5">{p.project_number}</span>
                      <span className="text-gray-800 font-medium">{p.project_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">담당자 지정</label>
              <select className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors bg-white"
                value={formData.manager_name} onChange={e => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}>
                <option value="">담당자 선택 (선택사항)</option>
                {users.map((u, i) => <option key={i} value={u.name}>{u.name} ({u.username})</option>)}
              </select>
            </div>
          </div>

          {/* 3. 접수자 / 연락처 / 접수방법 */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">접수자 이름</label>
                <input className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors placeholder:text-gray-300" placeholder="예: 홍길동"
                  value={formData.requester_name} onChange={e => setFormData(prev => ({ ...prev, requester_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">연락처</label>
                <input type="tel" className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors placeholder:text-gray-300" placeholder="010-0000-0000"
                  value={formData.requester_phone} onChange={e => setFormData(prev => ({ ...prev, requester_phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">접수방법</label>
              <select className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors bg-white"
                value={formData.receipt_method} onChange={e => setFormData(prev => ({ ...prev, receipt_method: e.target.value }))}>
                <option value="전화">전화</option>
                <option value="카톡">카카오톡</option>
                <option value="메일">이메일</option>
                <option value="현장">현장 직접</option>
              </select>
            </div>
          </div>

          {/* 4. 고장 내역 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                고장 내역 <span className="normal-case font-normal text-gray-400">(한 줄씩 입력)</span>
              </label>
            </div>
            <div className="space-y-2">
              {formData.symptoms.map((symptom, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3.5 py-2 border-2 border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:border-blue-500 outline-none transition-colors"
                    placeholder={`고장 내역 ${idx + 1}`}
                    value={symptom}
                    onChange={(e) => updateSymptomLine(idx, e.target.value)}
                  />
                  <button type="button" onClick={() => removeSymptomLine(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              <button type="button" onClick={addSymptomLine} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm font-bold text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
                + 고장 내역 추가
              </button>
            </div>
          </div>

          {/* 5. 요청사항 + 사진 */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">요청사항</label>
            <textarea className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:border-blue-500 outline-none transition-colors resize-none h-28 placeholder:text-gray-300"
              placeholder="요청사항 및 상세 증상을 입력하세요" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />
            <div className="mt-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">📸 사진 첨부</p>
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={`첨부 ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">✕</button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button type="button" onClick={handlePhoto} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all">
                    <span className="text-2xl leading-none">+</span><span className="text-[9px] mt-0.5">사진</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              {images.length > 0 && <p className="text-[11px] text-gray-400 mt-1">{images.length}/5장 첨부됨</p>}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm">취소</button>
          <button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}
            className="flex-[2] py-2.5 bg-blue-900 text-white rounded-xl font-black text-sm shadow-lg hover:bg-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
            {isSubmitting ? (<span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />전송 중...</span>) : `${formData.service_type} 접수 등록`}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalJsx, document.body);
};

/* ─── 방문일정 모달 ─────────────────────────────────────────── */
interface VisitModalProps {
  record: any;
  user: any;
  users: any[];
  onClose: () => void;
  onSaved: (updated: any) => void;
}

const VisitScheduleModal = ({ record, user, users, onClose, onSaved }: VisitModalProps) => {
  const [visitDate, setVisitDate] = useState(record.visit_date || '');
  const [visitTime, setVisitTime] = useState(record.visit_time || '09:00');
  const [participants, setParticipants] = useState<any[]>(user ? [{id: user.id || 'system', name: user.name || '알수없음'}] : []);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!visitDate) { alert('방문 날짜를 선택해주세요.'); return; }
    setIsSaving(true);
    try {
      const newLog = [
        ...(record.repair_log || []),
        { date: new Date().toISOString(), note: `[${user?.name || '시스템'}]님이 방문일정 등록: ${visitDate} ${visitTime} — 상태 [방문대기]로 변경` },
      ];
      // 1) as_records 업데이트
      const { error: updateErr } = await supabase.from('as_records').update({
        status: '방문대기',
        visit_date: visitDate,
        visit_time: visitTime,
        repair_log: newLog,
      }).eq('id', record.id);
      if (updateErr) throw updateErr;

      // 2) events 에 자동 등록
      const siteName = record.site_name || record.customer_name || record.project_name || '';
      const calTitle = `[${record.service_type || 'AS'}] ${siteName} 방문`;
      
      const insertData = participants.map(p => ({
        summary: calTitle,
        category: '출장',
        custom_project: siteName,
        start_date: visitDate,
        end_date: visitDate,
        participant_id: p.id,
        participant_name: p.name,
        created_by_id: user?.id || 'system',
        created_by_name: user?.name || '알수없음',
        description: `접수번호: ${record.as_no}\n현장: ${siteName}\n장비: ${record.device_id || '-'}\n요청: ${record.description || '-'}`,
      }));

      if (insertData.length > 0) {
        await supabase.from('events').insert(insertData);
      }

      alert(`${visitDate} ${visitTime} 방문일정이 등록되었습니다.\n일정표에도 자동으로 추가되었습니다.`);
      onSaved({
        ...record,
        status: '방문대기',
        visit_date: visitDate,
        visit_time: visitTime,
        repair_log: newLog,
      });
    } catch (err: any) {
      console.error(err);
      alert('방문일정 저장 실패: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const jsx = (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-black text-gray-800">🚗 방문일정 등록</h3>
        <p className="text-sm text-gray-500">방문 날짜와 시간을 입력하면 일정표(Calendar)에 자동 등록됩니다.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">방문 날짜 *</label>
            <input type="date" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">방문 시간</label>
            <input type="time" className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" value={visitTime} onChange={e => setVisitTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">방문 인원 추가</label>
          <div className="flex gap-2 mb-2">
            <select
              className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white"
              onChange={e => {
                const selectedId = e.target.value;
                if (!selectedId) return;
                const u = users.find((x: any) => x.id === selectedId);
                if (u && !participants.find(p => p.id === u.id)) {
                  setParticipants([...participants, { id: u.id, name: u.name }]);
                }
                e.target.value = '';
              }}
            >
              <option value="">+ 인원 선택...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-bold">
                <span>🚘 {p.name}</span>
                <button
                  onClick={() => setParticipants(participants.filter(x => x.id !== p.id))}
                  className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[10px] hover:bg-blue-300"
                >
                  ✕
                </button>
              </div>
            ))}
            {participants.length === 0 && <span className="text-xs text-red-500">※ 최소 1명의 참석자를 지정해주세요.</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 text-sm">취소</button>
          <button onClick={handleSave} disabled={isSaving || !visitDate || participants.length === 0} className="flex-[2] py-2.5 bg-orange-500 text-white rounded-xl font-black text-sm hover:bg-orange-600 disabled:opacity-40">
            {isSaving ? '저장 중...' : '일정 등록 및 방문대기'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(jsx, document.body);
};

/* ─── Export 모달 ────────────────────────────────────────────── */
interface ExportModalProps {
  record: any;
  onClose: () => void;
}

const ExportModal = ({ record, onClose }: ExportModalProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const siteName = record.site_name || record.customer_name || record.project_name || '';
  const summary = `[${record.service_type || 'AS'}] ${siteName}\n접수번호: ${record.as_no}\n장비: ${record.device_id || '-'}\n상태: ${record.status}\n요청사항: ${record.description || '-'}`;

  const handleSMS = () => { window.open(`sms:?body=${encodeURIComponent(summary)}`, '_self'); };
  const handleKakao = () => {
    // 카카오 공유 API (카카오 SDK 미 로드 시 fallback)
    if (typeof window !== 'undefined' && (window as any).Kakao?.Share) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'text',
        text: summary,
        link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
      });
    } else {
      // fallback: 클립보드 복사
      navigator.clipboard.writeText(summary).then(() => alert('내용이 클립보드에 복사되었습니다.\n카카오톡에 붙여넣기 하세요.'));
    }
  };
  const handleEmail = () => {
    const subject = encodeURIComponent(`[${record.service_type || 'AS'}] ${siteName} 작업 확인서`);
    const body = encodeURIComponent(summary);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  const jsx = (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-black text-gray-800">📤 Export (외부 전송)</h3>
        <p className="text-sm text-gray-500">작업 확인서를 외부에 전송할 방법을 선택하세요.</p>
        <div className="space-y-2.5">
          <button onClick={handleSMS} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 flex items-center justify-center gap-2">
            💬 문자메시지 (SMS)
          </button>
          <button onClick={handleKakao} className="w-full py-3 bg-yellow-400 text-yellow-900 rounded-xl font-bold text-sm hover:bg-yellow-500 flex items-center justify-center gap-2">
            💛 카카오톡 공유
          </button>
          <button onClick={handleEmail} className="w-full py-3 bg-gray-700 text-white rounded-xl font-bold text-sm hover:bg-gray-800 flex items-center justify-center gap-2">
            ✉️ 이메일 전송
          </button>
        </div>
        <button onClick={onClose} className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 mt-2">닫기</button>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(jsx, document.body);
};

/* ─── 메인 ASManager ─────────────────────────────────────────── */
const ASManager = () => {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const isLevel5OrAdmin = user?.level && (parseInt(user.level) >= 5 || user.level.toLowerCase() === 'administrator');

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchType, setSearchType] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('users').select('id, name, username').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setUsers(data); });
  }, []);

  // 조치 전/후 사진 업로드 관련
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);

  const getElapsedDays = (dateString: string, status: string) => {
    if (status === '작업완료' || status === '조치완료(통화)') return '-';
    if (!dateString) return '-';
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? '오늘' : `${diff}일`;
  };

  const getStatusBadge = (status: string) => {
    const info = getStatusInfo(status);
    return info.color;
  };

  useEffect(() => { fetchRecords(); }, []);

  useEffect(() => {
    if (searchParams.get('action') !== 'new') return;
    setView('list');
    setSelectedRecord(null);
    setEditTarget(null);
    setIsModalOpen(true);
  }, [searchParams]);

  const fetchRecords = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('as_records').select('*').order('created_at', { ascending: false });
    setRecords(data || []);
    setIsLoading(false);
  };

  /* ── 상태 변경 (워크플로우 기반) ── */
  const updateStatus = async (newStatus: string, extraFields?: Record<string, any>) => {
    if (!selectedRecord) return;
    const newLog = [
      ...(selectedRecord.repair_log || []),
      { date: new Date().toISOString(), note: `[${user?.name || '시스템'}]님이 상태를 [${newStatus}]로 변경함` },
    ];
    const updateData: any = { status: newStatus, repair_log: newLog, ...extraFields };
    await supabase.from('as_records').update(updateData).eq('id', selectedRecord.id);
    const updated = { ...selectedRecord, ...updateData, repair_log: newLog };
    setSelectedRecord(updated);
    fetchRecords();
  };

  const handleDeleteLog = async (logIndex: number) => {
    if (!isLevel5OrAdmin) return;
    if (!confirm('해당 조치 이력을 삭제하시겠습니까?')) return;
    const newLog = [...selectedRecord.repair_log];
    newLog.splice(logIndex, 1);
    await supabase.from('as_records').update({ repair_log: newLog }).eq('id', selectedRecord.id);
    setSelectedRecord({ ...selectedRecord, repair_log: newLog });
    fetchRecords();
  };

  const handleQuickAddLog = async (record: any, text: string) => {
    if (!text.trim()) return;
    if (!isLevel5OrAdmin) {
      alert('조치 이력을 작성할 권한이 없습니다.');
      return;
    }
    const newLog = [
      ...(record.repair_log || []),
      { date: new Date().toISOString(), note: `[${user?.name || '관리자'}] ${text}` },
    ];
    await supabase.from('as_records').update({ repair_log: newLog }).eq('id', record.id);
    setSelectedRecord({ ...record, repair_log: newLog });
    fetchRecords();
  };

  const handleSymptomToggle = async (symptom: string) => {
    if (!selectedRecord) return;
    const completed = selectedRecord.completed_symptoms || [];
    const newCompleted = completed.includes(symptom)
      ? completed.filter((s: string) => s !== symptom)
      : [...completed, symptom];
    
    // DB에서 completed_symptoms 컬럼 업데이트. 만약 컬럼이 없으면 에러가 날 수 있으나 가이드대로 추가되어있다고 가정.
    const { error: err } = await supabase.from('as_records').update({ completed_symptoms: newCompleted }).eq('id', selectedRecord.id);
    if (err) {
      console.warn('completed_symptoms update warning:', err);
    }
    
    setSelectedRecord({ ...selectedRecord, completed_symptoms: newCompleted });
    fetchRecords();
  };

  const handleRevertStatus = async (prevStatus: string) => {
    if (!selectedRecord) return;
    if (!confirm(`워크플로우 단계를 이전([${prevStatus}]) 상태로 되돌리시겠습니까?\n잘못 기록된 가장 최근 조치 이력이 함께 삭제됩니다.`)) return;

    const newLog = [...(selectedRecord.repair_log || [])];
    if (newLog.length > 0) newLog.pop();

    const updateData: any = { status: prevStatus, repair_log: newLog };
    if (selectedRecord.status === '방문대기') {
      updateData.visit_date = null;
      updateData.visit_time = null;
    }

    await supabase.from('as_records').update(updateData).eq('id', selectedRecord.id);
    const updated = { ...selectedRecord, ...updateData };
    setSelectedRecord(updated);
    fetchRecords();
  };

  /* ── 작업완료 확정 (조치 전/후 사진 포함 전송) ── */
  const handleFinalSubmit = async () => {
    if (!selectedRecord) return;
    if (!confirm('작업완료를 확정하시겠습니까?\nDB에 최종 저장됩니다.')) return;

    const uploadImages = async (imageList: string[], folder: string) => {
      const urls: string[] = [];
      for (let i = 0; i < imageList.length; i++) {
        const fileName = `${folder}_${selectedRecord.as_no}_${Date.now()}_${i}.jpg`;
        const blob = await (await fetch(imageList[i])).blob();
        const { error } = await supabase.storage.from('as-images').upload(`${folder}/${fileName}`, blob);
        if (!error) {
          const { data } = supabase.storage.from('as-images').getPublicUrl(`${folder}/${fileName}`);
          if (data?.publicUrl) urls.push(data.publicUrl);
        }
      }
      return urls;
    };

    const beforeUrls = await uploadImages(beforeImages, 'before');
    const afterUrls = await uploadImages(afterImages, 'after');

    await updateStatus('작업완료', {
      images_before: [...(selectedRecord.images_before || []), ...beforeUrls],
      images_after: [...(selectedRecord.images_after || []), ...afterUrls],
      fixed_at: new Date().toISOString(),
    });
    setBeforeImages([]);
    setAfterImages([]);
    alert('✅ 작업완료가 확정되어 DB에 등록되었습니다.');
  };

  /* ── 사진 업로드 핸들러 (조치 전/후용) ── */
  const handlePhotoCapture = async (type: 'before' | 'after') => {
    const setter = type === 'before' ? setBeforeImages : setAfterImages;
    const ref = type === 'before' ? beforeFileRef : afterFileRef;
    try {
      const { Camera, CameraResultType } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Base64 });
      if (image.base64String) {
        setter(prev => [...prev, `data:image/jpeg;base64,${image.base64String}`].slice(0, 10));
      }
    } catch {
      ref.current?.click();
    }
  };

  const handleBeforeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { setBeforeImages(prev => [...prev, reader.result as string].slice(0, 10)); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAfterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { setAfterImages(prev => [...prev, reader.result as string].slice(0, 10)); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleModalSuccess = useCallback(() => { setIsModalOpen(false); fetchRecords(); }, []);

  const handleVisitSaved = (updated: any) => {
    setSelectedRecord(updated);
    setIsVisitModalOpen(false);
    fetchRecords();
  };

  const filteredRecords = records.filter(r => {
    const matchTerm = !searchTerm ||
      (r.site_name || r.customer_name || '').includes(searchTerm) ||
      (r.as_no || '').includes(searchTerm) ||
      (r.manager_name || '').includes(searchTerm) ||
      (r.requester_name || '').includes(searchTerm) ||
      (r.description || '').includes(searchTerm);
    const matchDate = !searchDate || (r.created_at || '').startsWith(searchDate);
    const matchType = !searchType || r.service_type === searchType;
    return matchTerm && matchDate && matchType;
  });

  const inProgressRecords = filteredRecords.filter(r => ['접수대기', '접수확인', '방문대기', '접수중', '진행중'].includes(r.status));
  const monitoringRecords = filteredRecords.filter(r => r.status === '모니터링중');
  const completedRecords = filteredRecords.filter(r => ['작업완료', '조치완료(통화)', '완료'].includes(r.status));

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const toggleRow = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTableSection = (title: string, data: any[], emptyMessage: string) => {
    // 검색 조건이 없을 때, 데이터가 0건이고 진행중이 아니면 테이블 숨김
    if (!isLoading && data.length === 0 && !searchTerm && !searchDate && !searchType && title !== '진행중 (In Progress)') return null;
    
    return (
      <div className="bg-white rounded-xl shadow border overflow-hidden mb-6">
        <div className="px-4 py-3 bg-slate-100 border-b flex justify-between items-center">
           <h3 className="font-bold text-gray-800 text-sm">{title} <span className="text-blue-600 font-mono ml-1">[{data.length}]</span></h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
            <thead className="bg-[#1e293b] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">접수번호</th>
                <th className="px-4 py-3 font-semibold text-center w-20">구분</th>
                <th className="px-4 py-3 font-semibold w-48">현장명</th>
                <th className="px-4 py-3 font-semibold">고장내용</th>
                <th className="px-4 py-3 font-semibold w-32">접수자</th>
                <th className="px-3 py-3 font-semibold text-center w-24">방문예정</th>
                <th className="px-3 py-3 font-semibold text-center w-16">경과</th>
                <th className="px-2 py-3 font-semibold text-center w-36">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">데이터를 불러오는 중...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">{emptyMessage}</td></tr>
              ) : data.map(r => (
                <React.Fragment key={r.id}>
                  <tr onClick={() => { setSelectedRecord(r); setBeforeImages([]); setAfterImages([]); setView('detail'); }} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">{r.as_no || `${(r.created_at || '').substring(0, 10).replace(/-/g, '')}-${r.id}`}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${r.service_type === 'SS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.service_type || 'AS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">{r.site_name || r.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      <div className="line-clamp-2 max-w-[200px] leading-relaxed">
                        {r.symptoms?.join(', ') || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="block font-medium">{r.requester_name || '-'}</span>
                      {r.requester_phone && <span className="block text-[10px] text-gray-400 mt-0.5">{r.requester_phone}</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {r.visit_date ? <span className="font-semibold text-orange-600">{r.visit_date}</span> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${(r.status === '작업완료' || r.status === '조치완료(통화)' || r.status === '완료') ? 'text-gray-400' : 'text-red-500'}`}>
                        {getElapsedDays(r.created_at, r.status)}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusBadge(r.status || '접수대기')}`}>
                          {r.status || '접수대기'}
                        </span>
                        <button onClick={(e) => toggleRow(e, r.id)} className="px-1.5 py-1 bg-white border border-gray-200 rounded text-[10px] text-gray-500 hover:bg-gray-100 hover:text-gray-800 whitespace-nowrap transition-colors shadow-sm">
                          {expandedRows.has(r.id) ? '▲ 닫기' : '▼ 내용'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(r.id) && (
                    <tr className="bg-[#f8fafc] border-b-2 border-gray-200">
                      <td colSpan={8} className="px-6 py-5 shadow-inner">
                        <div className="flex flex-col gap-3">
                          <div className="bg-white p-4 items-start rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                            <p className="flex items-start"><span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded text-xs w-20 text-center shrink-0 mt-0.5 mr-3">고장내역</span> <span className="text-gray-800 font-bold whitespace-pre-wrap">{r.symptoms?.join('\n') || '-'}</span></p>
                            <p className="flex items-start"><span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-xs w-20 text-center shrink-0 mt-0.5 mr-3">요청사항</span> <span className="text-gray-700 whitespace-pre-wrap leading-relaxed">{r.description || '-'}</span></p>
                          </div>
                          
                          {/* 퀵 로그 작성 폼 */}
                          <div className="flex items-center gap-2">
                            <div className="text-xl pl-1 opacity-50">↳</div>
                            <input 
                              type="text" 
                              placeholder="상황이나 진행 과정을 간단하게 메모하세요..." 
                              className="flex-1 px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 shadow-sm transition-colors"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleQuickAddLog(r, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <button onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                handleQuickAddLog(r, input.value);
                                input.value = '';
                            }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition-colors whitespace-nowrap">
                              이력 작성
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {!isLoading && data.length > 0 && (
            <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400 text-right">총 {data.length}건</div>
          )}
        </div>
      </div>
    );
  };

  const renderMobileSection = (title: string, data: any[], emptyMessage: string) => {
    if (!isLoading && data.length === 0 && !searchTerm && !searchDate && !searchType && title !== '진행중 (In Progress)') return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-3 border-b-2 border-blue-900 pb-1">
          <h3 className="font-bold text-blue-900 text-sm">{title}</h3>
          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 rounded-full">{data.length}</span>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">데이터를 불러오는 중...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">{emptyMessage}</div>
          ) : data.map(r => (
            <div key={r.id} onClick={() => { setSelectedRecord(r); setBeforeImages([]); setAfterImages([]); setView('detail'); }} className="bg-white p-4 rounded-xl border shadow-sm active:bg-blue-50 transition-colors">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.service_type === 'SS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {r.service_type || 'AS'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                    {r.as_no || `${(r.created_at || '').substring(0, 10).replace(/-/g, '')}-${r.id}`}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(r.status || '접수대기')}`}>
                  {r.status || '접수대기'}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1.5 leading-tight">{r.site_name || r.customer_name}</h3>
              {r.symptoms?.length > 0 && <p className="text-[11px] text-gray-500 mb-1">🛠 <span className="font-medium text-gray-700">{r.symptoms.join(', ')}</span></p>}
              {r.visit_date && <p className="text-[11px] text-orange-600 font-semibold mb-1">🚗 방문예정: {r.visit_date}</p>}
              <div className="flex justify-between items-end text-[10px] text-gray-400 mt-2">
                <span>담당: {r.manager_name || r.requester_name || '-'}</span>
                <span>경과: <strong className="text-red-500 ml-0.5">{getElapsedDays(r.created_at, r.status)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ── 현재 상태에서 가능한 전이 버튼 렌더 ── */
  const renderStatusActions = (record: any, isMobile = false) => {
    const currentStatus = record.status || '접수대기';
    const statusInfo = STATUS_FLOW[currentStatus as StatusKey];
    if (!statusInfo) return null;
    const nextStatuses = statusInfo.next;
    const prevStatus = (statusInfo as any).prev;

    const btnClass = isMobile ? 'p-3 rounded-xl font-bold text-sm' : 'px-5 py-2 rounded-lg font-bold text-sm';

    return (
      <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'flex gap-3 flex-wrap'}>
        {prevStatus && (
          <button onClick={() => handleRevertStatus(prevStatus)} className={`${btnClass} bg-gray-500 text-white hover:bg-gray-600 flex items-center justify-center gap-1.5`}>
            ↩ 뒤로가기
          </button>
        )}
        {nextStatuses.map(ns => {
          if (ns === '방문대기') {
            const isReopen = currentStatus === '작업완료' || currentStatus === '완료';
            return <button key={ns} onClick={() => setIsVisitModalOpen(true)} className={`${btnClass} ${isReopen ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
              {isReopen ? '↻ 재발생 (방문일정 등록)' : '🚗 방문일정 등록'}
            </button>;
          }
          if (ns === '조치완료(통화)') {
            return <button key={ns} onClick={() => updateStatus('조치완료(통화)')} className={`${btnClass} bg-sky-500 text-white hover:bg-sky-600`}>📞 통화 조치완료</button>;
          }
          if (ns === '접수확인') {
            return <button key={ns} onClick={() => updateStatus('접수확인')} className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}>✅ 접수 확인</button>;
          }
          if (ns === '작업완료') {
            return <button key={ns} onClick={() => handleFinalSubmit()} className={`${btnClass} bg-green-600 text-white hover:bg-green-700`}>✅ 전송 (DB등록)</button>;
          }
          return null;
        })}
      </div>
    );
  };

  /* ── 상세뷰: 조치 전/후 사진 섹션 (방문대기 상태일 때) ── */
  const renderReportActions = (record: any) => {
    if (record.status !== '방문대기') return null;
    return (
      <div className="border-t pt-4 space-y-4">
        <p className="text-sm font-bold text-gray-600">📷 현장 조치 사진 기록</p>
        
        <div className="grid grid-cols-2 gap-4">
          {/* 조치 전 (Before) */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-500">🔴 조치 전 (Before)</p>
            <button onClick={() => handlePhotoCapture('before')} className="w-full bg-red-50 border-2 border-dashed border-red-200 p-3 rounded-xl text-red-500 text-xs font-bold hover:bg-red-100 transition-colors">
              📸 사진 촬영/업로드
            </button>
            <div className="flex gap-1.5 flex-wrap">
              {beforeImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`전 ${i+1}`} className="w-14 h-14 object-cover rounded-lg border-2 border-red-200" />
                  <button type="button" onClick={() => setBeforeImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* 조치 후 (After) */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-green-600">🟢 조치 후 (After)</p>
            <button onClick={() => handlePhotoCapture('after')} className="w-full bg-green-50 border-2 border-dashed border-green-200 p-3 rounded-xl text-green-600 text-xs font-bold hover:bg-green-100 transition-colors">
              📸 사진 촬영/업로드
            </button>
            <div className="flex gap-1.5 flex-wrap">
              {afterImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`후 ${i+1}`} className="w-14 h-14 object-cover rounded-lg border-2 border-green-200" />
                  <button type="button" onClick={() => setAfterImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setIsExportModalOpen(true)} className="bg-gray-800 text-white p-3 rounded-xl font-bold text-sm hover:bg-gray-900 flex items-center justify-center gap-1.5">
            📤 Export (외부)
          </button>
          <button onClick={handleFinalSubmit} className="bg-green-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-green-700 flex items-center justify-center gap-1.5">
            ✅ 조치 전/후 사진 포함 전송
          </button>
        </div>

        <input ref={beforeFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBeforeFileChange} />
        <input ref={afterFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAfterFileChange} />
      </div>
    );
  };

  return (
    <AuthGuard requiredLevel={1}>
      <div className="w-full min-h-full bg-gray-50 font-sans">

        {isModalOpen && <ReceiptModal editRecord={editTarget} onClose={() => { setIsModalOpen(false); setEditTarget(null); }} onSuccess={handleModalSuccess} />}
        {isVisitModalOpen && selectedRecord && <VisitScheduleModal user={user} users={users} record={selectedRecord} onClose={() => setIsVisitModalOpen(false)} onSaved={handleVisitSaved} />}
        {isExportModalOpen && selectedRecord && <ExportModal record={selectedRecord} onClose={() => setIsExportModalOpen(false)} />}

        {/* ===== PC 뷰 (md 이상) ===== */}
        <div className="hidden md:block">
          {view === 'list' && (
            <div className="space-y-4">
              {/* 툴바 */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex gap-2">
                  <button onClick={() => { setEditTarget(null); setIsModalOpen(true); }} className="bg-blue-900 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-800 shadow-sm transition-all">+ 추가</button>
                  <button className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all"
                    onClick={() => {
                      if (!selectedRecord) return alert('목록에서 항목을 클릭하세요.');
                      if (!isLevel5OrAdmin) return alert('Level 5 이상 관리자 권한이 필요합니다.');
                      setEditTarget(selectedRecord);
                      setIsModalOpen(true);
                    }}>변경</button>
                  <button className="bg-red-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-600 transition-all"
                    onClick={async () => {
                      if (!selectedRecord) return alert('목록에서 항목을 클릭하세요.');
                      if (!isLevel5OrAdmin) return alert('Level 5 이상 권한이 필요합니다.');
                      if (confirm('정말 삭제하시겠습니까? 관련 데이터가 모두 지워집니다.')) {
                        await supabase.from('as_records').delete().eq('id', selectedRecord.id);
                        fetchRecords();
                        setView('list');
                      }
                    }}>삭제</button>
                  <button onClick={fetchRecords} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all">↻ 새로고침</button>
                </div>
                <div className="flex items-center gap-3">
                  <select className="border px-3 py-2 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-gray-700 bg-white"
                    value={searchType} onChange={e => setSearchType(e.target.value)}>
                    <option value="">전체구분</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="OV">OV</option>
                    <option value="YS">YS</option>
                    <option value="Etc">Etc</option>
                  </select>
                  <input type="date" className="border px-3 py-2 rounded-lg outline-none focus:border-blue-500 text-sm"
                    value={searchDate} onChange={e => setSearchDate(e.target.value)} />
                  <input type="text" placeholder="접수번호, 현장명, 담당자 검색..."
                    className="border px-3 py-2 rounded-lg outline-none focus:border-blue-500 w-72 text-sm"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  {(searchTerm || searchDate || searchType) && (
                    <button onClick={() => { setSearchTerm(''); setSearchDate(''); setSearchType(''); }} className="text-gray-400 hover:text-gray-700 text-sm">✕ 초기화</button>
                  )}
                </div>
              </div>

              {/* 테이블 렌더링 (3분할) */}
              {renderTableSection('진행중 (In Progress)', inProgressRecords, searchTerm || searchDate ? '검색 결과가 없습니다.' : '접수된 AS 내역이 없습니다. [+ 추가] 버튼으로 신규 접수하세요.')}
              {renderTableSection('모니터링중 (Monitoring)', monitoringRecords, '모니터링중인 항목이 없습니다.')}
              {renderTableSection('조치완료/작업완료 (Completed)', completedRecords, '완료된 항목이 없습니다.')}
            </div>
          )}

          {/* 상세 뷰 (PC) */}
          {view === 'detail' && selectedRecord && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-600 hover:text-blue-700 font-semibold">← 목록으로</button>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${selectedRecord.service_type === 'SS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{selectedRecord.service_type || 'AS'}</span>
                  <span className="text-sm text-gray-400 font-mono">{selectedRecord.as_no || `${(selectedRecord.created_at || '').substring(0, 10).replace(/-/g, '')}-${selectedRecord.id}`}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedRecord.status || '접수대기')}`}>{selectedRecord.status || '접수대기'}</span>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow border p-6 space-y-4">
                <h2 className="text-xl font-black text-gray-800 border-b pb-3">작업 확인서 (AS/SS)</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-semibold text-gray-500">구분:</span> <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${selectedRecord.service_type === 'SS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{selectedRecord.service_type || 'AS'}</span></div>
                  <div><span className="font-semibold text-gray-500">현장명:</span> <span className="text-gray-800 font-bold ml-2">{selectedRecord.site_name || selectedRecord.customer_name}</span></div>
                  <div><span className="font-semibold text-gray-500">담당자:</span> <span className="text-blue-700 font-bold ml-2">{selectedRecord.manager_name || '-'}</span></div>
                  <div><span className="font-semibold text-gray-500">접수방법:</span> <span className="ml-2">{selectedRecord.receipt_method || '-'}</span></div>
                  <div><span className="font-semibold text-gray-500">접수자:</span> <span className="text-gray-800 font-bold ml-2">{selectedRecord.requester_name || '-'}</span></div>
                  <div><span className="font-semibold text-gray-500">연락처:</span> <span className="ml-2">{selectedRecord.requester_phone || '-'}</span></div>
                  <div><span className="font-semibold text-gray-500">경과일수:</span> <span className="ml-2 font-bold text-red-500">{getElapsedDays(selectedRecord.created_at, selectedRecord.status)}</span></div>
                  {selectedRecord.visit_date && (
                    <div><span className="font-semibold text-gray-500">방문예정:</span> <span className="ml-2 font-bold text-orange-600">{selectedRecord.visit_date} {selectedRecord.visit_time || ''}</span></div>
                  )}
                  <div className="col-span-2"><span className="font-semibold text-gray-500">요청사항:</span> <span className="ml-2 whitespace-pre-wrap">{selectedRecord.description || '-'}</span></div>
                </div>

                {/* 접수 사진 */}
                {selectedRecord.receipt_images && selectedRecord.receipt_images.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-bold text-gray-600 mb-2">📸 접수 시 사진</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedRecord.receipt_images.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`접수사진 ${i+1}`} className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 조치 전 사진 (DB에 저장된 것) */}
                {selectedRecord.images_before && selectedRecord.images_before.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-bold text-red-500 mb-2">🔴 조치 전 (Before) 사진</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedRecord.images_before.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`전 ${i+1}`} className="w-24 h-24 object-cover rounded-lg border-2 border-red-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 조치 후 사진 (DB에 저장된 것) */}
                {selectedRecord.images_after && selectedRecord.images_after.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-bold text-green-600 mb-2">🟢 조치 후 (After) 사진</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedRecord.images_after.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt={`후 ${i+1}`} className="w-24 h-24 object-cover rounded-lg border-2 border-green-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 보고서 액션 (방문대기 상태) */}
                {renderReportActions(selectedRecord)}

                {/* 🚀 핵심: 고장 내역 관리 (각 항목별 텍스트 입력 + 저장) */}
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-bold text-red-600 flex items-center gap-1">🛠 현장 고장 내역 및 조치</p>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 space-y-3">
                    {selectedRecord.symptoms?.map((symptom: string, idx: number) => {
                      const isChecked = selectedRecord.completed_symptoms?.includes(symptom);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isChecked || false}
                            onChange={() => handleSymptomToggle(symptom)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" 
                          />
                          <span className={`text-sm font-bold shrink-0 min-w-[80px] ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {symptom}
                          </span>
                          <input 
                            type="text" 
                            id={`symptom-note-${idx}`}
                            placeholder="조치 내용 입력..."
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                handleQuickAddLog(selectedRecord, `[고장: ${symptom}] ${e.currentTarget.value}`);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <button 
                            className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-900 shrink-0"
                            onClick={() => {
                              const input = document.getElementById(`symptom-note-${idx}`) as HTMLInputElement;
                              if (input?.value.trim()) {
                                handleQuickAddLog(selectedRecord, `[고장: ${symptom}] ${input.value}`);
                                input.value = '';
                              }
                            }}
                          >저장</button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 조치 이력 타임라인 */}
                {selectedRecord.repair_log && selectedRecord.repair_log.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-1">📋 조치 이력 (Timeline)</p>
                    <div className="space-y-3 ml-2 border-l-2 border-gray-200 pl-4 py-1">
                      {selectedRecord.repair_log.map((log: any, i: number) => (
                        <div key={i} className="relative group">
                          <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-white shadow-sm group-hover:bg-blue-600 transition-colors"></div>
                          <p className="text-[10px] text-gray-400 mb-0.5">{log.date ? new Date(log.date).toLocaleString() : '-'}</p>
                          <div className="flex items-start gap-2">
                            <p className="text-sm text-gray-700 font-medium leading-relaxed flex-1">{log.note}</p>
                            {isLevel5OrAdmin && (
                              <button onClick={() => handleDeleteLog(i)} className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0" title="이력 삭제">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* 상태 변경 버튼 (워크플로우 기반) */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-400 mb-2">워크플로우 상태 전이</p>
                  {renderStatusActions(selectedRecord)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== 모바일 뷰 (md 미만) ===== */}
        <div className="block md:hidden">
          <header className="bg-blue-900 text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg">
            <h1 className="text-xl font-black italic">UNECO AS/SS</h1>
            <button
              onClick={() => {
                if (view === 'detail') setView('list');
                else { setEditTarget(null); setIsModalOpen(true); }
              }}
              className="bg-white text-blue-900 px-3 py-1 rounded-md text-sm font-bold"
            >
              {view === 'detail' ? '목록' : '신규접수'}
            </button>
          </header>

          {view === 'list' && (
            <div className="p-4 space-y-8 pb-24">
              {renderMobileSection('진행중 (In Progress)', inProgressRecords, searchTerm || searchDate ? '검색 결과가 없습니다.' : '접수된 AS 내역이 없습니다.')}
              {renderMobileSection('모니터링중 (Monitoring)', monitoringRecords, '모니터링중인 항목이 없습니다.')}
              {renderMobileSection('조치완료/작업완료 (Completed)', completedRecords, '완료된 항목이 없습니다.')}
            </div>
          )}

          {view === 'detail' && selectedRecord && (
            <div className="p-4 space-y-4 pb-24">
              <div className="bg-white p-5 rounded-xl border shadow">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h2 className="text-lg font-black">작업 확인서</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedRecord.status || '접수대기')}`}>{selectedRecord.status || '접수대기'}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><b>구분:</b> <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedRecord.service_type === 'SS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{selectedRecord.service_type || 'AS'}</span></p>
                  <p><b>접수번호:</b> <span className="font-mono">{selectedRecord.as_no || `${(selectedRecord.created_at || '').substring(0, 10).replace(/-/g, '')}-${selectedRecord.id}`}</span></p>
                  <p><b>현장명:</b> {selectedRecord.site_name || selectedRecord.customer_name}</p>
                  <p><b>담당자:</b> <span className="text-blue-700 font-bold">{selectedRecord.manager_name || '-'}</span></p>
                  <p><b>접수방법:</b> {selectedRecord.receipt_method || '-'}</p>
                  <p><b>접수자:</b> {selectedRecord.requester_name || '-'} {selectedRecord.requester_phone && `(${selectedRecord.requester_phone})`}</p>
                  <p><b>요청사항:</b> {selectedRecord.description || '-'}</p>
                  <p><b>경과일수:</b> <span className="text-red-500 font-bold">{getElapsedDays(selectedRecord.created_at, selectedRecord.status)}</span></p>
                  {selectedRecord.visit_date && <p><b>방문예정:</b> <span className="text-orange-600 font-bold">{selectedRecord.visit_date} {selectedRecord.visit_time || ''}</span></p>}
                </div>

                {/* 접수 사진 */}
                {selectedRecord.receipt_images && selectedRecord.receipt_images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t">
                    <p className="w-full text-xs font-bold text-gray-500 mb-1">📸 접수 사진</p>
                    {selectedRecord.receipt_images.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`접수사진 ${i+1}`} className="w-16 h-16 object-cover rounded-lg border" /></a>
                    ))}
                  </div>
                )}
              </div>

              {/* 조치 전/후 사진 (방문대기) */}
              {selectedRecord.status === '방문대기' && (
                <div className="bg-white p-4 rounded-xl border shadow space-y-3">
                  <p className="text-sm font-bold text-gray-700">📷 현장 조치 사진 기록</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-red-500">🔴 조치 전</p>
                      <button onClick={() => handlePhotoCapture('before')} className="w-full bg-red-50 border-2 border-dashed border-red-200 p-2.5 rounded-xl text-red-500 text-xs font-bold">📸 촬영</button>
                      <div className="flex gap-1 flex-wrap">
                        {beforeImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`전 ${i+1}`} className="w-12 h-12 object-cover rounded-lg border-2 border-red-200" />
                            <button type="button" onClick={() => setBeforeImages(prev => prev.filter((_, j) => j !== i))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-green-600">🟢 조치 후</p>
                      <button onClick={() => handlePhotoCapture('after')} className="w-full bg-green-50 border-2 border-dashed border-green-200 p-2.5 rounded-xl text-green-600 text-xs font-bold">📸 촬영</button>
                      <div className="flex gap-1 flex-wrap">
                        {afterImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`후 ${i+1}`} className="w-12 h-12 object-cover rounded-lg border-2 border-green-200" />
                            <button type="button" onClick={() => setAfterImages(prev => prev.filter((_, j) => j !== i))}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setIsExportModalOpen(true)} className="bg-gray-800 text-white p-3 rounded-xl font-bold text-sm">📤 Export</button>
                    <button onClick={handleFinalSubmit} className="bg-green-600 text-white p-3 rounded-xl font-bold text-sm">✅ 전송</button>
                  </div>
                  <input ref={beforeFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBeforeFileChange} />
                  <input ref={afterFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAfterFileChange} />
                </div>
              )}

              {/* 🚀 핵심: 고장 내역 관리 (체크박스 + 추가 입력) - 모바일 */}
              <div className="bg-white p-4 rounded-xl border shadow">
                <p className="text-sm font-bold text-red-600 mb-3 flex items-center gap-1">🛠 현장 고장 내역 및 조치</p>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-3">
                  {selectedRecord.symptoms?.map((symptom: string, idx: number) => {
                    const isChecked = selectedRecord.completed_symptoms?.includes(symptom);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isChecked || false}
                            onChange={() => handleSymptomToggle(symptom)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 shrink-0" 
                          />
                          <span className={`text-sm font-bold ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {symptom}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-7">
                          <input 
                            type="text" 
                            id={`m-symptom-note-${idx}`}
                            placeholder="조치 내용..."
                            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                handleQuickAddLog(selectedRecord, `[고장: ${symptom}] ${e.currentTarget.value}`);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <button 
                            className="bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0"
                            onClick={() => {
                              const input = document.getElementById(`m-symptom-note-${idx}`) as HTMLInputElement;
                              if (input?.value.trim()) {
                                handleQuickAddLog(selectedRecord, `[고장: ${symptom}] ${input.value}`);
                                input.value = '';
                              }
                            }}
                          >저장</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 조치 이력 (모바일 타임라인 스타일) */}
              {selectedRecord.repair_log && selectedRecord.repair_log.length > 0 && (
                <div className="bg-white p-4 rounded-xl border shadow">
                  <p className="text-sm font-bold text-gray-700 mb-3">📋 조치 이력</p>
                  <div className="space-y-2">
                    {selectedRecord.repair_log.map((log: any, i: number) => (
                      <div key={i} className="flex flex-col text-sm border-b pb-2 last:border-0 last:pb-0">
                        <span className="text-gray-400 text-xs mb-1">{log.date ? new Date(log.date).toLocaleString() : '-'}</span>
                        <div className="text-gray-700 flex items-start gap-1.5">
                          <span className="flex-1">{log.note}</span>
                          {isLevel5OrAdmin && (
                            <button onClick={() => handleDeleteLog(i)} className="bg-red-50 text-red-500 rounded-full w-6 h-6 flex items-center justify-center shrink-0">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 변경 */}
              <div className="bg-white p-4 rounded-xl border shadow">
                <p className="text-xs text-gray-400 mb-2">상태 변경</p>
                {renderStatusActions(selectedRecord, true)}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default ASManager;
