<template>
  <div class="fade-in px-6 py-4">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-[#1e3a8a]">Master Student List</h2>
        <p class="text-gray-500">Registrar View: Accessing Records & Race Eligibility</p>
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
          <tr class="cursor-pointer">
            <th @click="toggleSort('studentId')" class="p-4 text-left hover:bg-blue-800 transition">
              ID {{ sortKey === 'studentId' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th @click="toggleSort('fullName')" class="p-4 text-left hover:bg-blue-800 transition">
              Full Name {{ sortKey === 'fullName' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th class="p-4 text-left">Program</th>
            <th @click="toggleSort('currentGrade')" class="p-4 text-left hover:bg-blue-800 transition">
              Grade {{ sortKey === 'currentGrade' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th @click="toggleSort('eligibility')" class="p-4 text-left hover:bg-blue-800 transition">
              Eligibility {{ sortKey === 'eligibility' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th class="p-4 text-left">Grades per Section</th>
          </tr>
        </thead>
        <tbody class="bg-white">
          <tr v-for="student in filteredStudents" :key="student.studentId" class="border-b hover:bg-blue-50 transition">
            <td class="p-4 font-mono text-blue-700 font-bold">{{ student.studentId }}</td>
            <td class="p-4 font-semibold text-gray-800">{{ student.fullName }}</td>
            <td class="p-4">{{ student.courseName }}</td>
            <td class="p-4 font-bold">{{ student.currentGrade.toFixed(2) }}</td>
            <td class="p-4">
              <span 
                class="px-2 py-1 rounded-full text-[10px] font-bold"
                :class="student.eligibility === 'OP Only' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'"
              >
                {{ student.eligibility }}
              </span>
            </td>
            <td class="p-4">
              <div v-for="grade in student.grades" :key="grade.sectionid" class="flex items-center gap-2 mb-1 bg-gray-50 p-1 rounded border border-gray-100">
                <span class="text-[10px] font-bold w-16 truncate text-gray-600">{{ grade.sectionname }}:</span>
                <input type="number" step="0.25" v-model="grade.grade" class="admin-grade-input" />
                <button @click="saveAdminGrade(student.studentId, grade.sectionid, grade.grade)" class="btn-mini">Update</button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredStudents.length === 0 && !loading">
            <td colspan="6" class="p-10 text-center text-gray-400">No records found.</td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="p-10 text-center text-gray-500">Loading master records...</div>
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
const selectedSection = ref('')

/* NEW: Sorting State */
const sortKey = ref('studentId')
const sortOrder = ref('asc')

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const availableSections = computed(() => {
  const sectionSet = new Set()
  students.value.forEach(s => {
    s.grades.forEach(g => { if (g.sectionname) sectionSet.add(g.sectionname) })
  })
  return Array.from(sectionSet).sort()
})

/* MODIFIED: Dual Filtering + NEW Multi-column Sorting logic */
const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const section = selectedSection.value

  let result = students.value.filter(s => {
    const matchesSearch = !query || s.fullName.toLowerCase().includes(query) || s.studentId.toString().includes(query)
    const matchesSection = !section || s.grades.some(g => g.sectionname === section)
    return matchesSearch && matchesSection
  })

  // NEW: Sorting Logic
  result.sort((a, b) => {
    let modifier = sortOrder.value === 'asc' ? 1 : -1
    if (a[sortKey.value] < b[sortKey.value]) return -1 * modifier
    if (a[sortKey.value] > b[sortKey.value]) return 1 * modifier
    return 0
  })

  return result
})

/* NEW: Fetching from the Database View 'student_race_eligibility' */
const fetchAllStudents = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('student_race_eligibility')
      .select(`
        studentid, studentfname, studentlname, yearlevel, programname, current_grade, eligibility,
        GradeRecord (grade, sectionid, Section (sectionname))
      `)
    
    if (error) throw error

    students.value = data.map(s => ({
      studentId: s.studentid,
      fullName: `${s.studentfname} ${s.studentlname}`,
      courseName: s.programname || 'N/A',
      yearLevel: s.yearlevel,
      currentGrade: s.current_grade || 0,
      eligibility: s.eligibility || 'Pending',
      grades: s.GradeRecord ? s.GradeRecord.map(g => ({
        sectionid: g.sectionid,
        sectionname: g.Section?.sectionname || 'Unknown',
        grade: g.grade
      })) : []
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

/* NEW: PDF Export now includes Avg Grade and Race Eligibility */
const exportToPDF = () => {
  try {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('APC Master Student Grade & Race Eligibility Report', 14, 20)
    
    const tableRows = filteredStudents.value.map(s => [
      s.studentId, 
      s.fullName, 
      s.currentGrade.toFixed(2),
      s.eligibility,
      s.grades.map(g => `${g.sectionname}: ${g.grade ?? 'N/A'}`).join(', ')
    ])

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Name', 'Avg Grade', 'Eligibility', 'Grades']],
      body: tableRows,
      styles: { fontSize: 7 },
      columnStyles: { 4: { cellWidth: 50 } }
    })

    doc.save(`Eligibility_Report_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (err) {
    alert("PDF Error: " + err.message)
  }
}

onMounted(fetchAllStudents)
</script>

<style scoped>
.input-wrapper { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.search-input { width: 100%; padding: 10px 10px 10px 40px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; }
.search-input:focus { border-color: #1e3a8a; box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1); }
.admin-grade-input { width: 50px; font-size: 10px; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
.btn-mini { background: #1e3a8a; color: white; font-size: 9px; padding: 3px 6px; border-radius: 4px; border: none; cursor: pointer; }
.btn-primary { background-color: #1e3a8a; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:disabled { background-color: #94a3b8; }
</style>
