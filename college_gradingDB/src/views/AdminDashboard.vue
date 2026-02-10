<template>
  <div class="fade-in">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Master Student List</h2>
        <p class="text-gray-500">Registrar View: Accessing all student records and grades</p>
      </div>
      <button @click="exportToPDF" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Processing...' : 'Export PDF Report' }}
      </button>
    </div>

    <div class="search-container mb-6">
      <div class="input-wrapper">
        <Search class="search-icon" :size="18" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search by Name or Student ID..."
          class="search-input"
        />
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Full Name</th>
            <th>Program/Year</th>
            <th>Grades per Section</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filteredStudents" :key="student.studentId">
            <td class="font-mono text-blue-700">{{ student.studentId }}</td>
            <td class="font-semibold">{{ student.fullName }}</td>
            <td>{{ student.courseName }} - Year {{ student.yearLevel }}</td>
            <td>
              <div v-for="grade in student.grades" :key="grade.sectionid" class="flex items-center gap-2 mb-1 bg-gray-50 p-1 rounded">
                <span class="text-xs font-bold w-24 truncate">{{ grade.sectionname }}:</span>
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
            <td colspan="4" class="p-8 text-center text-gray-500">
              No students found matching "{{ searchQuery }}"
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="loading" class="p-8 text-center text-gray-500">
        Loading master records...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' // Import it as a separate function
import { Search } from 'lucide-vue-next'

const students = ref([])
const loading = ref(true)
const searchQuery = ref('')

// Filter Logic: Searches Name and ID
const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return students.value
  
  return students.value.filter(s => 
    s.fullName.toLowerCase().includes(query) || 
    s.studentId.toString().includes(query)
  )
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
    
    const tableRows = []

    filteredStudents.value.forEach(s => {
      // Handle null grades or empty grade arrays safely
      const gradeSummary = s.grades && s.grades.length > 0 
        ? s.grades.map(g => `${g.sectionname}: ${g.grade ?? 'N/A'}`).join('\n')
        : 'No grades recorded'

      tableRows.push([
        s.studentId || 'N/A', 
        s.fullName || 'Unnamed', 
        s.courseName || 'N/A', 
        gradeSummary
      ])
    })

    // Use the imported autoTable function directly
    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Name', 'Program', 'Grades']],
      body: tableRows,
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 3: { cellWidth: 60 } }
    })

    const safeDate = new Date().toISOString().split('T')[0]
    doc.save(`Master_Report_${safeDate}.pdf`)
    
  } catch (err) {
    console.error("PDF Export Error:", err)
    alert("Could not generate PDF: " + err.message)
  }
}

onMounted(fetchAllStudents)
</script>

<style scoped>
.search-container {
  max-width: 400px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #1e3a8a;
  box-shadow: 0 0 0 2px rgba(30, 58, 138, 0.1);
}

.admin-grade-input {
  width: 65px;
  font-size: 12px;
  padding: 4px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  text-align: center;
}

.btn-mini {
  background: #1e3a8a;
  color: white;
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.btn-mini:hover {
  background: #3b82f6;
}

.btn-primary {
  background-color: #1e3a8a;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
}

.btn-primary:disabled {
  background-color: #94a3b8;
}
</style>