"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Student, PaginatedResponse, LookupsResponse } from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { CopyPhone } from "@/components/CopyPhone";
import { SearchableCombobox } from "@/components/SearchableCombobox";
import { StudentExcelImportModal } from "@/components/StudentExcelImportModal";
import { useLanguage } from "@/context/LanguageContext";
import {
  GraduationCap,
  Search,
  AlertOctagon,
  TrendingUp,
  UserPlus,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";

export default function StudentsPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debtorsOnly, setDebtorsOnly] = useState(false);
  const [mostActive, setMostActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookups, setLookups] = useState<LookupsResponse>({
    education_types: [],
    education_forms: [],
    specialties: [],
    courses: [],
    groups: [],
  });

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");

  const [eduTypeId, setEduTypeId] = useState<number | null>(null);
  const [eduTypeCustom, setEduTypeCustom] = useState("");

  const [eduFormId, setEduFormId] = useState<number | null>(null);
  const [eduFormCustom, setEduFormCustom] = useState("");

  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [specialtyCustom, setSpecialtyCustom] = useState("");

  const [courseId, setCourseId] = useState<number | null>(null);
  const [courseCustom, setCourseCustom] = useState("");

  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupCustom, setGroupCustom] = useState("");

  const fetchLookups = async () => {
    try {
      const res = await api.get<LookupsResponse>("/students/lookups");
      setLookups(res.data);
    } catch (err) {
      console.error("Failed to load academic lookups:", err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Student>>("/students", {
        params: {
          page,
          q: searchQuery.trim() || undefined,
          debtors_only: debtorsOnly,
          most_active: mostActive,
        },
      });
      setStudents(res.data.items);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, searchQuery, debtorsOnly, mostActive]);

  const resetAddForm = () => {
    setFullName("");
    setBirthDate("");
    setPhone("");
    setEduTypeId(null);
    setEduTypeCustom("");
    setEduFormId(null);
    setEduFormCustom("");
    setSpecialtyId(null);
    setSpecialtyCustom("");
    setCourseId(null);
    setCourseCustom("");
    setGroupId(null);
    setGroupCustom("");
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post("/students", {
        full_name: fullName.trim(),
        birth_date: birthDate || null,
        phone: phone.trim() || null,
        education_type_id: eduTypeId,
        education_type: eduTypeCustom.trim() || null,
        education_form_id: eduFormId,
        education_form: eduFormCustom.trim() || null,
        specialty_id: specialtyId,
        specialty: specialtyCustom.trim() || null,
        course_id: courseId,
        course: courseCustom.trim() || null,
        group_id: groupId,
        group: groupCustom.trim() || null,
      });

      setShowAddModal(false);
      resetAddForm();
      fetchStudents();
      fetchLookups();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Talaba qo'shishda xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-oak-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-600" />
            {t.studentsTitle}
          </h1>
          <p className="text-xs text-oak-500 mt-1">
            {t.studentsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#FFFFFF] border border-[#EFEAE1] text-[#1C1917] hover:bg-oak-100 transition-colors shadow-paper"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {t.importExcelStudents}
          </button>

          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-oak-950 hover:bg-amber-600 transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            {t.enrollStudent}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="h-4 w-4 text-oak-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-paper-border bg-paper-card py-2 pl-9 pr-3 text-xs text-oak-900 placeholder-oak-400 focus:border-amber-500 focus:outline-none shadow-paper"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setDebtorsOnly(!debtorsOnly);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              debtorsOnly
                ? "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA] shadow-sm"
                : "bg-paper-card text-oak-600 border-paper-border hover:bg-oak-100 shadow-paper"
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
            {t.debtorsOnly}
          </button>

          <button
            onClick={() => {
              setMostActive(!mostActive);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              mostActive
                ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                : "bg-paper-card text-oak-600 border-paper-border hover:bg-oak-100 shadow-paper"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            {t.mostActive}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-paper-border bg-paper-card overflow-hidden shadow-paper">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-bg border-b border-paper-border text-oak-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">{t.borrower}</th>
                <th className="py-3.5 px-4">{t.group}</th>
                <th className="py-3.5 px-4">{t.major}</th>
                <th className="py-3.5 px-4">{t.phone}</th>
                <th className="py-3.5 px-4 text-center">{t.activeLoans}</th>
                <th className="py-3.5 px-4 text-center">{t.totalBorrows}</th>
                <th className="py-3.5 px-4 text-right">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-oak-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-oak-400">
                    Talabalar topilmadi.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-paper-bg transition-colors ${
                      student.has_overdue ? "bg-red-50/40" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-oak-500">#{student.id}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-oak-900">{student.full_name}</div>
                      {student.birth_date && (
                        <div className="text-[11px] text-oak-400 font-mono flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-oak-400" />
                          <span>{student.birth_date}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-oak-100 font-mono text-oak-700">
                        <span className="font-medium">
                          {student.group_name || student.group || "—"}
                        </span>
                        {student.course_name && (
                          <>
                            <span className="text-oak-300">•</span>
                            <span className="text-amber-700 font-semibold">{student.course_name}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-oak-800">
                        {student.specialty_name || student.major || "—"}
                      </div>
                      {(student.education_type_name || student.education_form_name) && (
                        <div className="text-[10px] text-oak-400 mt-0.5">
                          {[student.education_type_name, student.education_form_name]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {student.phone ? (
                        <CopyPhone phone={student.phone} />
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-oak-100 text-oak-400 border border-oak-200/60">
                          {t.phoneNotEntered}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-oak-800">
                      {student.active_borrows_count}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600">
                      {student.borrow_count}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {student.has_overdue ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                          {t.overdueDebtor}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]">
                          {t.goodStanding}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
          loading={loading}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-paper-border bg-white p-6 shadow-card space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-paper-border pb-3">
              <h3 className="text-base font-bold text-oak-900">{t.enrollStudent}</h3>
              <p className="text-xs text-oak-500 mt-0.5">
                Talabaning shaxsiy va akademik ma&apos;lumotlarini kiriting
              </p>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-oak-700 mb-1">
                    {t.fullName} <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="masalan: Alisher Navoiy"
                    className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-oak-700 mb-1">
                    {t.birthDate}
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oak-700 mb-1">
                  {t.phoneOptional}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full rounded-lg border border-paper-border bg-paper-bg py-2 px-3 text-xs text-oak-900 focus:border-amber-500 focus:bg-white focus:outline-none shadow-paper"
                />
              </div>

              <div className="pt-2 border-t border-paper-border space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-oak-500">
                  Akademik ma&apos;lumotlar
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <SearchableCombobox
                    label={t.educationType}
                    options={lookups.education_types}
                    selectedId={eduTypeId}
                    customValue={eduTypeCustom}
                    onChange={(id, customVal) => {
                      setEduTypeId(id);
                      setEduTypeCustom(customVal);
                    }}
                    placeholder={t.selectEducationType}
                  />

                  <SearchableCombobox
                    label={t.educationForm}
                    options={lookups.education_forms}
                    selectedId={eduFormId}
                    customValue={eduFormCustom}
                    onChange={(id, customVal) => {
                      setEduFormId(id);
                      setEduFormCustom(customVal);
                    }}
                    placeholder={t.selectEducationForm}
                  />
                </div>

                <SearchableCombobox
                  label={t.specialty}
                  options={lookups.specialties}
                  selectedId={specialtyId}
                  customValue={specialtyCustom}
                  onChange={(id, customVal) => {
                    setSpecialtyId(id);
                    setSpecialtyCustom(customVal);
                  }}
                  placeholder={t.selectSpecialty}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <SearchableCombobox
                    label={t.course}
                    options={lookups.courses}
                    selectedId={courseId}
                    customValue={courseCustom}
                    onChange={(id, customVal) => {
                      setCourseId(id);
                      setCourseCustom(customVal);
                    }}
                    placeholder={t.selectCourse}
                  />

                  <SearchableCombobox
                    label={t.studyGroup}
                    options={lookups.groups}
                    selectedId={groupId}
                    customValue={groupCustom}
                    onChange={(id, customVal) => {
                      setGroupId(id);
                      setGroupCustom(customVal);
                    }}
                    placeholder={t.selectStudyGroup}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-paper-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-paper-border bg-white text-xs font-bold text-oak-700 hover:bg-oak-100 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-xs font-bold text-oak-950 hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? "Saqlanmoqda..." : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchStudents();
          fetchLookups();
        }}
      />
    </div>
  );
}
