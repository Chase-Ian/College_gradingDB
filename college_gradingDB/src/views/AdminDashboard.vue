<template>
  <div class="fade-in px-6 py-4">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-[#1e3a8a]">Master Student List</h2>
        <p class="text-gray-500">Registrar View: Accessing all student records and grades</p>
      </div>
      <button @click="exportToPDF" :disabled="loading" class="btn-primary">
        {{ loading ? 'Processing...' : 'Export PDF Report' }}
      </button>
    </div>

    <div class="flex flex-wrap gap-4 mb-6">
      <div class="input-wrapper flex-1 min-w-[300px]">
        <Search class="search-icon" :size="18" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by Name or Student ID..."
          class="search-input"
        />
      </div>

    
      <div class="section-filter min-w-[200px]">
        <select v-model="selectedSection" class="search-input !pl-4">
          <option value="">All Sections</option>
          <option v-for="sec in availableSections" :key="sec" :value="sec">
            Section: {{ sec }}
          </option>
        </select>
      </div>
    </div>

    <div class="table-container shadow-md rounded-lg overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[#1e3a8a] text-white">
          <tr>
            <th class="p-4 text-left">Student ID</th>
            <th class="p-4 text-left">Full Name</th>
            <th class="p-4 text-left">Program/Year</th>
            <th class="p-4 text-left">Grades per Section</th>
          </tr>
        </thead>
        <tbody class="bg-white">
          <tr v-for="student in filteredStudents" :key="student.studentId" class="border-b hover:bg-blue-50">
            <td class="p-4 font-mono text-blue-700 font-bold">{{ student.studentId }}</td>
            <td class="p-4 font-semibold text-gray-800">{{ student.fullName }}</td>
            <td class="p-4">{{ student.courseName }} - Yr {{ student.yearLevel }}</td>
            <td class="p-4">
              <div v-for="grade in student.grades" :key="grade.sectionid" class="flex items-center gap-2 mb-1 bg-gray-50 p-1 rounded border border-gray-100">
                <span class="text-[10px] font-bold w-20 truncate text-gray-600">{{ grade.sectionname }}:</span>
                <input 
                  type="number" 
                  step="0.25"
                  v-model="grade.grade" 
                  class="admin-grade-input"
                />
                <button @click="saveAdminGrade(student.studentId, grade.sectionid, grade.grade)" class="btn-mini">
                  Update
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredStudents.length === 0 && !loading">
            <td colspan="4" class="p-10 text-center text-gray-400">
              No records found for the selected criteria.
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="loading" class="p-10 text-center text-gray-500">
        Loading master records...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Search } from 'lucide-vue-next'

const students = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedSection = ref('') /* NEW: State to track selected filter section */

/* NEW: Computed property to extract unique section names from the student list.
  This ensures the dropdown only shows sections that actually have data.
*/
const availableSections = computed(() => {
  const sectionSet = new Set()
  students.value.forEach(s => {
    s.grades.forEach(g => {
      if (g.sectionname) sectionSet.add(g.sectionname)
    })
  })
  return Array.from(sectionSet).sort()
})

/* MODIFIED Filter Logic: 
  Now checks for search query AND section selection simultaneously.
*/
const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const section = selectedSection.value

  return students.value.filter(s => {
    // 1. Check if name or ID matches search bar
    const matchesSearch = !query || s.fullName.toLowerCase().includes(query) || s.studentId.toString().includes(query)
    
    // 2. NEW: Check if student belongs to the selected section filter
    const matchesSection = !section || s.grades.some(g => g.sectionname === section)
    
    return matchesSearch && matchesSection
  })
})

const fetchAllStudents = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('Student')
      .select(`
        studentid, 
        studentfname, 
        studentlname, 
        yearlevel,
        Program (programname),
        GradeRecord (
          grade,
          sectionid,
          Section (sectionname)
        )
      `)
    
    if (error) throw error

    students.value = data.map(s => ({
      studentId: s.studentid,
      fullName: `${s.studentfname} ${s.studentlname}`,
      courseName: s.Program?.programname || 'N/A',
      yearLevel: s.yearlevel,
      grades: s.GradeRecord.map(g => ({
        sectionid: g.sectionid,
        sectionname: g.Section?.sectionname || 'Unknown',
        grade: g.grade
      }))
    }))
  } catch (err) {
    console.error("Admin Fetch Error:", err.message)
  } finally {
    loading.value = false
  }
}

const saveAdminGrade = async (studentId, sectionId, newGrade) => {
  try {
    const { error } = await supabase
      .from('GradeRecord')
      .update({ grade: parseFloat(newGrade) })
      .eq('studentid', studentId)
      .eq('sectionid', sectionId)

    if (error) throw error
    alert('Grade updated successfully')
  } catch (err) {
    alert('Update failed: ' + err.message)
  }
}

const exportToPDF = () => {
  try {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('APC Master Student Grade Report', 14, 20)
    
    /* Note: The PDF now uses 'filteredStudents', so if you filter 
       by section, only that section is printed! 
    */
    const tableRows = filteredStudents.value.map(s => [
      s.studentId || 'N/A', 
      s.fullName || 'Unnamed', 
      s.courseName || 'N/A', 
      s.grades.map(g => `${g.sectionname}: ${g.grade ?? 'N/A'}`).join('\n')
    ])

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Name', 'Program', 'Grades']],
      body: tableRows,
      styles: { fontSize: 8 },
      columnStyles: { 3: { cellWidth: 60 } }
    })

    doc.save(`Master_Report_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (err) {
    alert("PDF Error: " + err.message)
  }
}

onMounted(fetchAllStudents)
</script>

<style scoped>
/* Minor adjustment to keep inputs looking consistent with RAMS portal */
.input-wrapper { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.search-input { width: 100%; padding: 10px 10px 10px 40px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; }
.search-input:focus { border-color: #1e3a8a; box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1); }
.admin-grade-input { width: 60px; font-size: 11px; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
.btn-mini { background: #1e3a8a; color: white; font-size: 10px; padding: 4px 8px; border-radius: 4px; border: none; }
.btn-primary { background-color: #1e3a8a; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:disabled { background-color: #94a3b8; }
</style>
