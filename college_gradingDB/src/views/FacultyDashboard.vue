<template>
  <div class="fade-in">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Faculty Gradebook</h2>
      <p class="text-gray-500">Managing students assigned to your sections</p>
    </div>

    <div v-if="loading" class="text-center p-10">
      <div class="logo-box mb-2 inline-block animate-pulse">RAMS</div>
      <p class="text-gray-500">Fetching your class list...</p>
    </div>

    <div v-else-if="sections.length > 0">
      <div v-for="section in sections" :key="section.sectionId" class="mb-8">
        <div class="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-900">
          <div>
            <h3 class="text-lg font-bold text-blue-900">{{ section.sectionName }}</h3>
            <p class="text-sm text-gray-500">{{ section.courseId }} | Semester: {{ section.semester }} | AY: {{ section.academicYear }}</p>
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
              <tr v-for="student in section.students" :key="student.studentId">
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
      <p class="text-gray-500 text-lg">No sections assigned to your faculty account.</p>
      <p class="text-sm">Please contact the Registrar if this is an error.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const sections = ref([])
const loading = ref(true)

const fetchFacultyData = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get Faculty using profileid (lowercase)
    const { data: faculty, error: facError } = await supabase
      .from('FacultyMember')
      .select('facultyid') 
      .eq('profileid', user.id)
      .single()

    if (facError) throw facError

    if (faculty) {
      // 2. Get Sections using facultyid (lowercase)
      const { data: sectionData, error: secError } = await supabase
        .from('Section')
        .select('*')
        .eq('facultyid', faculty.facultyid)

      if (secError) throw secError

      // 3. Get Students using lowercase attributes
      const enrichedSections = await Promise.all(
        sectionData.map(async (sec) => {
          const { data: gradeRecords, error: gradeError } = await supabase
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

          if (gradeError) throw gradeError

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
    // 1. Convert to number to match 'numeric' data type in DB
    const gradeValue = parseFloat(newGrade)
  
    const { data, error } = await supabase
      .from('GradeRecord')
      .update({ grade: gradeValue }) 
      .eq('studentid', studentId)
      .eq('sectionid', sectionId)
      .select() // This allows us to verify the change immediately

    if (error) throw error

    // 2. Check if any rows were actually updated
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

onMounted(fetchFacultyData)
</script>

<style scoped>
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