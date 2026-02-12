<template>
  <div class="fade-in">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Faculty Gradebook</h2>
      <p class="text-gray-500">Managing students assigned to your sections</p>
    </div>

    <!-- 🔹 Global Search Bar -->
    <div class="mb-6">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search students across all sections..." 
        class="search-input"
      />
    </div>

    <div v-if="loading" class="text-center p-10">
      <div class="logo-box mb-2 inline-block animate-pulse">RAMS</div>
      <p class="text-gray-500">Fetching your class list...</p>
    </div>

    <!-- 🔹 Show filtered students globally -->
    <div v-else-if="filteredSections.length > 0">
      <div v-for="section in filteredSections" :key="section.sectionid" class="mb-8">
        <div class="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-900">
          <div>
            <h3 class="text-lg font-bold text-blue-900">{{ section.sectionname }}</h3>
            <p class="text-sm text-gray-500">{{ section.courseid }} | Semester: {{ section.semester }} | AY: {{ section.academicyear }}</p>
          </div>
          <span class="badge badge-faculty">Total Students: {{ section.students.length }}</span>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th class="text-center">Current Grade</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="student in section.students" 
                :key="student.studentId"
              >
                <td class="font-mono text-sm text-blue-800">{{ student.studentId }}</td>
                <td class="font-medium">{{ student.firstName }} {{ student.lastName }}</td>
                <td class="text-center">
                  <input 
                    type="number" 
                    step="0.25" 
                    min="1.00" 
                    max="5.00" 
                    v-model="student.currentGrade"
                    class="grade-input" 
                    placeholder="--" 
                  />
                </td>
                <td class="text-center">
                  <button 
                    class="btn-save"
                    @click="saveGrade(student.studentId, section.sectionid, student.currentGrade)"
                  >
                    Save
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="bg-white p-10 rounded-xl text-center border border-dashed border-gray-300">
      <p class="text-gray-500 text-lg">No students found.</p>
      <p class="text-sm">Try adjusting your search or contact the Registrar if this is an error.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'

const sections = ref([])
const loading = ref(true)
const searchQuery = ref("")

const fetchFacultyData = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: faculty } = await supabase
      .from('FacultyMember')
      .select('facultyid') 
      .eq('profileid', user.id)
      .single()

    if (faculty) {
      const { data: sectionData } = await supabase
        .from('Section')
        .select('*')
        .eq('facultyid', faculty.facultyid)

      const enrichedSections = await Promise.all(
        sectionData.map(async (sec) => {
          const { data: gradeRecords } = await supabase
            .from('GradeRecord')
            .select(`
              grade,
              Student (
                studentid,
                studentfname,
                studentlname
              )
            `)
            .eq('sectionid', sec.sectionid)

          const students = gradeRecords.map(record => ({
            studentId: record.Student.studentid,
            firstName: record.Student.studentfname,
            lastName: record.Student.studentlname,
            currentGrade: record.grade
          }))

          return { ...sec, students }
        })
      )
      sections.value = enrichedSections
    }
  } catch (err) {
    console.error('Fetch Error:', err.message)
  } finally {
    loading.value = false
  }
}

const saveGrade = async (studentId, sectionId, newGrade) => {
  try {
    const gradeValue = parseFloat(newGrade)
    const { data, error } = await supabase
      .from('GradeRecord')
      .update({ grade: gradeValue }) 
      .eq('studentid', studentId)
      .eq('sectionid', sectionId)
      .select()

    if (error) throw error
    if (!data || data.length === 0) {
      alert('Update failed: No record found or permission denied (RLS).')
      return
    }
    
    alert('Grade updated successfully!')
    await fetchFacultyData() 
  } catch (err) {
    console.error('Error updating grade:', err.message)
    alert('Update failed: ' + err.message)
  }
}

// 🔹 Computed property for global filtering
const filteredSections = computed(() => {
  if (!searchQuery.value) return sections.value
  const query = searchQuery.value.toLowerCase()
  return sections.value.map(sec => ({
    ...sec,
    students: sec.students.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query)
    )
  })).filter(sec => sec.students.length > 0)
})

onMounted(fetchFacultyData)
</script>

<style scoped>
.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 10px;
}
.search-input:focus {
  outline: 2px solid #3b82f6;
  border-color: transparent;
}

.grade-input {
  width: 80px;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  color: #1e3a8a;
}

.grade-input:focus {
  outline: 2px solid #3b82f6;
  border-color: transparent;
}

.btn-save {
  background-color: #10b981;
  color: white;
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background 0.2s;
  cursor: pointer;
}

.btn-save:hover {
  background-color: #059669;
}

.text-center {
  text-align: center;
}
</style>
