<template>
  <div class="fade-in">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Master Student List</h2>
        <p class="text-gray-500">Registrar View: Accessing all student records</p>
      </div>
      <button @click="exportToPDF" class="btn btn-primary">
        Export PDF Report
      </button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Full Name</th>
            <th>Course/Year</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in students" :key="student.studentId">
            <td class="font-mono text-blue-700">{{ student.studentId }}</td>
            <td class="font-semibold">{{ student.firstName }} {{ student.lastName }}</td>
            <td>{{ student.courseId }} - Year {{ student.yearLevel }}</td>
            <td>
              <span class="badge badge-faculty">Active</span>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="loading" class="p-8 text-center text-gray-500">
        Loading student records...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase.js' // Double check your path!

const students = ref([])
const loading = ref(true)

const fetchAllStudents = async () => {
  loading.value = true
  // Fetching all students from the database
  const { data, error } = await supabase
    .from('Student')
    .select('*')
    .order('lastName', { ascending: true })

  if (error) {
    console.error('Error fetching students:', error.message)
  } else {
    students.value = data
  }
  loading.value = false
}

const exportToPDF = () => {
  alert('PDF Exporting logic will be added here next!')
}

onMounted(fetchAllStudents)
</script>