<template>
  <div v-if="appLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="logo-box mb-4">RAMS</div>
      <p class="text-gray-500 animate-pulse">Initializing session...</p>
    </div>
  </div>

  <div v-else class="app-container">
    <LoginView v-if="!user" @login-success="fetchUser" />

    <div v-else class="dashboard-layout">
      <AppHeader :profile="profile" @logout="handleLogout" />
      
      <main class="content">
        <AdminDashboard v-if="profile?.role === 'admin'" />
        <FacultyDashboard v-else />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'
import AppHeader from './components/AppHeader.vue'
import LoginView from './views/LoginView.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import FacultyDashboard from './views/FacultyDashboard.vue'

const user = ref(null)
const profile = ref(null)
const appLoading = ref(true)


const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Reset states so the UI switches back to LoginView
    user.value = null
    profile.value = null
  } catch (err) {
    alert('Error logging out: ' + err.message)
  }
}

const fetchUser = async () => {
  appLoading.value = true 
  const { data: authData } = await supabase.auth.getUser()
  
  if (authData?.user) {
    user.value = authData.user
    
    // Use the exact casing from your working SQL query
    const { data: p, error } = await supabase
      .from('Profiles')
      .select('id, email, full_name, role') // Ensure these match your DB columns
      .eq('id', authData.user.id)
      .single();
    
    if (!error) {
      profile.value = p
    } else {
      console.error("Profile fetch error:", error.message)
    }
  }
  appLoading.value = false
}

onMounted(fetchUser)
</script>